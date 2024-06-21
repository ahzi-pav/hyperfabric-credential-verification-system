// client/src/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

export const getAllCredentials = () => api.get('/credentials');
export const createCredential = (credential) => api.post('/createCredential', credential);
export const readCredentialById = (id) => api.get(`/credential/${id}`);
export const updateCredential = (id, credential) => api.put(`/updateCredential/${id}`, credential);
export const deleteCredential = (id) => api.delete(`/deleteCredential/${id}`);
