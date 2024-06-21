// client/src/components/Admin/CreateCredentialForm.js
import React, { useState } from 'react';
import { createCredential } from '../../api';
import '../../styles/Form.css';

function CreateCredentialForm() {
    const [credentialId, setCredentialId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [issuer, setIssuer] = useState('');
    const [degree, setDegree] = useState('');
    const [dateIssued, setDateIssued] = useState('');

    const validateInput = () => {
        const idRegex = /^[a-zA-Z0-9-_]+$/;
        if (!idRegex.test(credentialId)) {
            alert('Credential ID should contain only letters, numbers, hyphens, and underscores.');
            return false;
        }
        if (!idRegex.test(studentId)) {
            alert('Student ID should contain only letters, numbers, hyphens, and underscores.');
            return false;
        }
        if (!issuer) {
            alert('Issuer is required.');
            return false;
        }
        if (!degree) {
            alert('Degree is required.');
            return false;
        }
        if (!dateIssued) {
            alert('Date Issued is required.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateInput()) {
            return;
        }

        const newCredential = { credentialId, studentId, issuer, degree, dateIssued };

        try {
            await createCredential(newCredential);
            alert('Credential created successfully.');
            setCredentialId('');
            setStudentId('');
            setIssuer('');
            setDegree('');
            setDateIssued('');
        } catch (error) {
            alert(`Failed to create credential: ${error.response ? error.response.data : error.message}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <h2>Create New Credential</h2>
            <input
                type="text"
                placeholder="Credential ID"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
            />
            <input
                type="text"
                placeholder="Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
            />
            <input
                type="text"
                placeholder="Issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
            />
            <input
                type="text"
                placeholder="Degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
            />
            <input
                type="date"
                value={dateIssued}
                onChange={(e) => setDateIssued(e.target.value)}
            />
            <button type="submit">Create</button>
        </form>
    );
}

export default CreateCredentialForm;
