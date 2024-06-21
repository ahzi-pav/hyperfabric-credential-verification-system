'use strict';

const credentialVerification = require('./lib/credentialVerification');

module.exports.CredentialVerification = credentialVerification;
module.exports.contracts = [credentialVerification];