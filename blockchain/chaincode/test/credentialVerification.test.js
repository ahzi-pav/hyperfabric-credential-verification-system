'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const CredentialVerification = require('../lib/credentialVerification.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Credential Verification Basic Tests', () => {
    let transactionContext, chaincodeStub, credential;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        credential = {
            credentialID: 'cred001',
            studentID: 'stu1001',
            issuer: 'University A',
            degree: 'BSc Computer Science',
            dateIssued: '2021-06-15',
            status: 'active'
        };
    });

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let credentialVerification = new CredentialVerification();
            try {
                await credentialVerification.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState('cred001')).toString());
            expect(ret).to.eql(Object.assign({docType: 'credential'}, credential));
        });
    });

    describe('Test CreateCredential', () => {
        it('should return error on CreateCredential', async () => {
            chaincodeStub.putState.rejects('failed inserting key');

            let credentialVerification = new CredentialVerification();
            try {
                await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);
                assert.fail('CreateCredential should have failed');
            } catch(err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on CreateCredential', async () => {
            let credentialVerification = new CredentialVerification();

            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            let ret = JSON.parse((await chaincodeStub.getState(credential.credentialID)).toString());
            expect(ret).to.eql(credential);
        });
    });

    describe('Test ReadCredential', () => {
        it('should return error on ReadCredential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            try {
                await credentialVerification.ReadCredential(transactionContext, 'cred002');
                assert.fail('ReadCredential should have failed');
            } catch (err) {
                expect(err.message).to.equal('The credential cred002 does not exist');
            }
        });

        it('should return success on ReadCredential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            let ret = JSON.parse(await chaincodeStub.getState(credential.credentialID));
            expect(ret).to.eql(credential);
        });
    });

    describe('Test UpdateCredential', () => {
        it('should return error on UpdateCredential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            try {
                await credentialVerification.UpdateCredential(transactionContext, 'cred002', 'stu1002', 'University B', 'MA English Literature', '2022-01-20', 'revoked');
                assert.fail('UpdateCredential should have failed');
            } catch (err) {
                expect(err.message).to.equal('The credential cred002 does not exist');
            }
        });

        it('should return success on UpdateCredential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            await credentialVerification.UpdateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued, 'revoked');
            let ret = JSON.parse(await chaincodeStub.getState(credential.credentialID));
            let expected = Object.assign({}, credential, {status: 'revoked'});
            expect(ret).to.eql(expected);
        });
    });

    describe('Test DeleteCredential', () => {
        it('should return error on DeleteCredential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            try {
                await credentialVerification.DeleteCredential(transactionContext, 'cred002');
                assert.fail('DeleteCredential should have failed');
            } catch (err) {
                expect(err.message).to.equal('The credential cred002 does not exist');
            }
        });

        it('should return success on DeleteCredential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);

            await credentialVerification.DeleteCredential(transactionContext, credential.credentialID);
            let ret = await chaincodeStub.getState(credential.credentialID);
            expect(ret).to.equal(undefined);
        });
    });

    describe('Test CredentialExists', () => {
        it('should return false for a non-existent credential', async () => {
            let credentialVerification = new CredentialVerification();
            const exists = await credentialVerification.CredentialExists(transactionContext, 'cred999');
            expect(exists).to.be.false;
        });
    
        it('should return true for an existing credential', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, credential.credentialID, credential.studentID, credential.issuer, credential.degree, credential.dateIssued);
            const exists = await credentialVerification.CredentialExists(transactionContext, credential.credentialID);
            expect(exists).to.be.true;
        });
    });
    
    describe('Test GetAllCredentials', () => {
        it('should return all credentials', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, 'cred001', 'stu1001', 'University A', 'BSc Computer Science', '2021-06-15');
            await credentialVerification.CreateCredential(transactionContext, 'cred002', 'stu1002', 'University B', 'MA English Literature', '2022-01-20');
    
            let ret = await credentialVerification.GetAllCredentials(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(2);
            expect(ret).to.deep.include.members([
                {credentialID: 'cred001', studentID: 'stu1001', issuer: 'University A', degree: 'BSc Computer Science', dateIssued: '2021-06-15', status: 'active', docType: 'credential'},
                {credentialID: 'cred002', studentID: 'stu1002', issuer: 'University B', degree: 'MA English Literature', dateIssued: '2022-01-20', status: 'active', docType: 'credential'}
            ]);
        });
    
        it('should handle non-JSON values gracefully', async () => {
            let credentialVerification = new CredentialVerification();
            chaincodeStub.putState.callsFake((key, value) => {
                if (!chaincodeStub.states) {
                    chaincodeStub.states = {};
                }
                chaincodeStub.states[key] = Buffer.from(value);
            });
    
            await credentialVerification.CreateCredential(transactionContext, 'cred003', 'stu1003', 'University C', 'PhD Physics', '2023-02-11');
            // Inserting a non-JSON value manually
            chaincodeStub.states['invalid'] = 'non-json-value';
    
            let ret = await credentialVerification.GetAllCredentials(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(1);  // Only valid JSON entries are processed
            expect(ret).to.deep.include.members([
                {credentialID: 'cred003', studentID: 'stu1003', issuer: 'University C', degree: 'PhD Physics', dateIssued: '2023-02-11', status: 'active', docType: 'credential'}
            ]);
        });
    });
    describe('Test FindCredentialsByStudentID', () => {
        it('should return all credentials for a given student ID', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, 'cred001', 'stu1001', 'University A', 'BSc Computer Science', '2021-06-15');
            await credentialVerification.CreateCredential(transactionContext, 'cred004', 'stu1001', 'University D', 'MSc Data Science', '2023-03-20');
    
            let ret = await credentialVerification.FindCredentialsByStudentID(transactionContext, 'stu1001');
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(2);
            expect(ret).to.deep.include.members([
                {credentialID: 'cred001', studentID: 'stu1001', issuer: 'University A', degree: 'BSc Computer Science', dateIssued: '2021-06-15', status: 'active', docType: 'credential'},
                {credentialID: 'cred004', studentID: 'stu1001', issuer: 'University D', degree: 'MSc Data Science', dateIssued: '2023-03-20', status: 'active', docType: 'credential'}
            ]);
        });
    });
    
    describe('Test FindCredentialsByIssuer', () => {
        it('should return all credentials issued by a specific issuer', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, 'cred002', 'stu1002', 'University B', 'MA English Literature', '2022-01-20');
            await credentialVerification.CreateCredential(transactionContext, 'cred005', 'stu1005', 'University B', 'MBA', '2024-01-01');
    
            let ret = await credentialVerification.FindCredentialsByIssuer(transactionContext, 'University B');
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(2);
            expect(ret).to.deep.include.members([
                {credentialID: 'cred002', studentID: 'stu1002', issuer: 'University B', degree: 'MA English Literature', dateIssued: '2022-01-20', status: 'active', docType: 'credential'},
                {credentialID: 'cred005', studentID: 'stu1005', issuer: 'University B', degree: 'MBA', dateIssued: '2024-01-01', status: 'active', docType: 'credential'}
            ]);
        });
    });
    describe('Test RevokeCredential', () => {
        it('should properly revoke a credential and update its status', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, 'cred003', 'stu1003', 'University C', 'PhD Physics', '2023-02-11');
    
            await credentialVerification.UpdateCredential(transactionContext, 'cred003', 'stu1003', 'University C', 'PhD Physics', '2023-02-11', 'revoked');
            let ret = JSON.parse(await chaincodeStub.getState('cred003'));
            expect(ret.status).to.equal('revoked');
        });
    });
    
    describe('Test VerifyCredential', () => {
        it('should confirm a credential is valid if not revoked', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, 'cred006', 'stu1006', 'University E', 'B.A. Philosophy', '2022-05-01');
    
            let ret = await credentialVerification.VerifyCredential(transactionContext, 'cred006');
            expect(ret).to.equal('Credential is valid');
        });
    
        it('should confirm a credential is revoked if status is revoked', async () => {
            let credentialVerification = new CredentialVerification();
            await credentialVerification.CreateCredential(transactionContext, 'cred007', 'stu1007', 'University F', 'BSc Biology', '2021-04-15');
            await credentialVerification.UpdateCredential(transactionContext, 'cred007', 'stu1007', 'University F', 'BSc Biology', '2021-04-15', 'revoked');
    
            let ret = await credentialVerification.VerifyCredential(transactionContext, 'cred007');
            expect(ret).to.equal('Credential is revoked');
        });
    });
    
});
