import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Use default import
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';

// Setup environment variables
const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'cred';
const mspId = process.env.MSP_ID || 'Org1MSP';
const cryptoPath = process.env.CRYPTO_PATH || path.resolve(__dirname, '..', '..', '..', 'blockchain', 'network', 'organizations', 'peerOrganizations', 'org1.example.com');
const keyDirectoryPath = process.env.KEY_DIRECTORY_PATH || path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certDirectoryPath = process.env.CERT_DIRECTORY_PATH || path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
const tlsCertPath = process.env.TLS_CERT_PATH || path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
const peerEndpoint = process.env.PEER_ENDPOINT || 'localhost:7051';
const peerHostAlias = process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com';

const utf8Decoder = new TextDecoder();

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use the imported cors function here

const port = 3001;

// Helper function to connect to the Hyperledger Fabric network
async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

async function newSigner(): Promise<Signer> {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getContract(): Promise<Contract> {
    const client = await newGrpcConnection();
    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
        endorseOptions: () => ({ deadline: Date.now() + 15000 }),
        submitOptions: () => ({ deadline: Date.now() + 5000 }),
        commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
    });

    const network = gateway.getNetwork(channelName);
    return network.getContract(chaincodeName);
}

// API Endpoints

app.post('/api/initLedger', async (req: Request, res: Response) => {
    try {
        const contract = await getContract();
        await contract.submitTransaction('InitLedger');
        res.status(200).send('Ledger initialized successfully.');
    } catch (error) {
        res.status(500).send(`Failed to initialize ledger: ${(error as Error).message}`);
    }
});

app.get('/api/credentials', async (_req: Request, res: Response) => {
    try {
        const contract = await getContract();
        const resultBytes = await contract.evaluateTransaction('GetAllCredentials');
        const resultJson = utf8Decoder.decode(resultBytes);
        res.status(200).json(JSON.parse(resultJson));
    } catch (error) {
        res.status(500).send(`Failed to get credentials: ${(error as Error).message}`);
    }
});

app.post('/api/createCredential', async (req: Request, res: Response) => {
    try {
        const { credentialId, studentId, issuer, degree, dateIssued } = req.body;

        if (!credentialId || !studentId || !issuer || !degree || !dateIssued) {
            return res.status(400).send('All fields are required.');
        }

        const contract = await getContract();
        try {
            await contract.submitTransaction('CreateCredential', credentialId, studentId, issuer, degree, dateIssued);
            res.status(200).send('Credential created successfully.');
        } catch (contractError) {
            const error = contractError as Error; // Type assertion to Error
            console.error(`Contract Error: ${error.message}`);
            res.status(500).send(`Failed to create credential: ${error.message}`);
        }
    } catch (error) {
        const err = error as Error; // Type assertion to Error
        console.error(`Error: ${err.message}`);
        res.status(500).send(`Failed to process request: ${err.message}`);
    }
});


app.get('/api/credential/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contract = await getContract();
        const resultBytes = await contract.evaluateTransaction('ReadCredential', id);
        const resultJson = utf8Decoder.decode(resultBytes);
        res.status(200).json(JSON.parse(resultJson));
    } catch (error) {
        res.status(500).send(`Failed to get credential: ${(error as Error).message}`);
    }
});

app.put('/api/updateCredential/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { studentId, issuer, degree, dateIssued, status } = req.body;
        const contract = await getContract();
        await contract.submitTransaction('UpdateCredential', id, studentId, issuer, degree, dateIssued, status);
        res.status(200).send('Credential updated successfully.');
    } catch (error) {
        res.status(500).send(`Failed to update credential: ${(error as Error).message}`);
    }
});

app.delete('/api/deleteCredential/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contract = await getContract();
        await contract.submitTransaction('DeleteCredential', id);
        res.status(200).send('Credential deleted successfully.');
    } catch (error) {
        res.status(500).send(`Failed to delete credential: ${(error as Error).message}`);
    }
});

// Start server
app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
