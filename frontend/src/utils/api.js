import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const cleanedApiUrl = rawApiUrl.replace(/\/+$/, '');
const apiBaseUrl = cleanedApiUrl.endsWith('/api') ? cleanedApiUrl : `${cleanedApiUrl}/api`;

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
