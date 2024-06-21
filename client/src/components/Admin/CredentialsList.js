// client/src/components/Admin/CredentialsList.js
import React, { useEffect, useState } from 'react';
import { getAllCredentials, deleteCredential } from '../../api';
import '../../styles/List.css';

function CredentialsList() {
    const [credentials, setCredentials] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState(null);

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = async () => {
        try {
            const response = await getAllCredentials();
            setCredentials(response.data);
        } catch (error) {
            console.error('Failed to load credentials:', error);
        }
    };

    const handleDeleteClick = (id) => {
        setCredentialToDelete(id);
        setShowConfirmDialog(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (credentialToDelete) {
                await deleteCredential(credentialToDelete);
                loadCredentials();
                setCredentialToDelete(null);
                setShowConfirmDialog(false);
            }
        } catch (error) {
            console.error('Failed to delete credential:', error);
        }
    };

    const handleDeleteCancel = () => {
        setCredentialToDelete(null);
        setShowConfirmDialog(false);
    };

    return (
        <div>
            <h1>Credentials</h1>
            <ul className="credential-list">
                {credentials.map((cred) => (
                    <li key={cred.credentialID} className="credential-item">
                        <span>{cred.degree} - {cred.studentID} - {cred.issuer}</span>
                        <button onClick={() => handleDeleteClick(cred.credentialID)}>Delete</button>
                    </li>
                ))}
            </ul>

            {showConfirmDialog && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete this credential?</p>
                        <div className="modal-actions">
                            <button onClick={handleDeleteConfirm} className="confirm">Yes</button>
                            <button onClick={handleDeleteCancel} className="cancel">No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CredentialsList;
