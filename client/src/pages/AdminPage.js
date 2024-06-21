// client/src/pages/AdminPage.js
import React from 'react';
import CreateCredentialForm from '../components/Admin/CreateCredentialForm';
import CredentialsList from '../components/Admin/CredentialsList';
import '../styles/App.css';

function AdminPage() {
    return (
        <div>
            <h2>Admin Dashboard</h2>
            <CreateCredentialForm />
            <CredentialsList />
        </div>
    );
}

export default AdminPage;
