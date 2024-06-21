// client/src/pages/UserPage.js
import React, { useState } from 'react';
import { readCredentialById } from '../api';
import '../styles/UserPage.css';

function UserPage() {
    const [credentialId, setCredentialId] = useState('');
    const [credential, setCredential] = useState(null);
    const [error, setError] = useState('');

    const handleCheckCredential = async () => {
        try {
            const response = await readCredentialById(credentialId);
            setCredential(response.data);
            setError('');
        } catch (err) {
            setError('Credential not found.');
            setCredential(null);
        }
    };

    return (
        <div className="user-page">
            <h2>Check Credential Legitimacy</h2>
            <div className="input-container">
                <input
                    className="input-bar"
                    type="text"
                    placeholder="Enter Credential ID"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                />
                <button className="check-button" onClick={handleCheckCredential}>Check</button>
            </div>
            {error && <p className="error">{error}</p>}
            {credential && (
                <div className="credential-details">
                    <h3>Credential Details</h3>
                    <p>Student ID: {credential.studentID}</p>
                    <p>Issuer: {credential.issuer}</p>
                    <p>Degree: {credential.degree}</p>
                    <p>Date Issued: {credential.dateIssued}</p>
                </div>
            )}
        </div>
    );
}

export default UserPage;
