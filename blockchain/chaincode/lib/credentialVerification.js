'use strict';

const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class CredentialVerification extends Contract {

    async InitLedger(ctx) {
        const credentials = [
            {
                credentialID: 'cred001',
                studentID: 'stu1001',
                issuer: 'PUP',
                degree: 'BS in Computer Engineering',
                dateIssued: '2024-06-19',
                status: 'active'
            },
            {
                credentialID: 'cred002',
                studentID: 'stu1002',
                issuer: 'University B',
                degree: 'pup',
                dateIssued: '2024-06-19',
                status: 'active'
            },
        ];

        for (const credential of credentials) {
            credential.docType = 'credential';
            await ctx.stub.putState(credential.credentialID, Buffer.from(stringify(sortKeysRecursive(credential))));
        }
    }

    async CreateCredential(ctx, credentialID, studentID, issuer, degree, dateIssued) {
        console.log(`CreateCredential called with credentialID: ${credentialID}, studentID: ${studentID}, issuer: ${issuer}, degree: ${degree}, dateIssued: ${dateIssued}`);
        
        const exists = await this.CredentialExists(ctx, credentialID);
        if (exists) {
            console.log(`The credential ${credentialID} already exists.`);
            throw new Error(`The credential ${credentialID} already exists`);
        }
    
        const credential = {
            credentialID,
            studentID,
            issuer,
            degree,
            dateIssued,
            status: 'active'
        };
    
        try {
            await ctx.stub.putState(credentialID, Buffer.from(JSON.stringify(credential)));
            console.log(`Credential ${credentialID} created successfully.`);
            return JSON.stringify(credential);
        } catch (error) {
            console.error(`Failed to putState: ${error.message}`);
            throw new Error(`Failed to create credential: ${error.message}`);
        }
    }    

    async ReadCredential(ctx, credentialID) {
        const credentialJSON = await ctx.stub.getState(credentialID);
        if (!credentialJSON || credentialJSON.length === 0) {
            throw new Error(`The credential ${credentialID} does not exist`);
        }
        return credentialJSON.toString();
    }

    async UpdateCredential(ctx, credentialID, studentID, issuer, degree, dateIssued, status) {
        const exists = await this.CredentialExists(ctx, credentialID);
        if (!exists) {
            throw new Error(`The credential ${credentialID} does not exist`);
        }

        const updatedCredential = {
            credentialID,
            studentID,
            issuer,
            degree,
            dateIssued,
            status
        };
        await ctx.stub.putState(credentialID, Buffer.from(stringify(sortKeysRecursive(updatedCredential))));
        return JSON.stringify(updatedCredential);
    }

    async DeleteCredential(ctx, credentialID) {
        const exists = await this.CredentialExists(ctx, credentialID);
        if (!exists) {
            throw new Error(`The credential ${credentialID} does not exist`);
        }
        return ctx.stub.deleteState(credentialID);
    }

    async CredentialExists(ctx, credentialID) {
        const credentialJSON = await ctx.stub.getState(credentialID);
        return credentialJSON && credentialJSON.length > 0;
    }

    async GetAllCredentials(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.docType === 'credential') {
                
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = CredentialVerification;
