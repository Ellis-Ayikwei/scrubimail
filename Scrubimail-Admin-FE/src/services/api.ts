import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/scrubimail/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
    (config) => {
        // First check for API key (for API usage)
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) {
            config.headers.Authorization = `Bearer ${apiKey}`;
            return config;
        }

        // Then check for JWT token (for web app usage)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('apiKey');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
