// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import './styles/App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <h1>Credential Verification System</h1>
                <nav>
                    <Link to="/">User</Link> | <Link to="/admin">Admin</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<UserPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
