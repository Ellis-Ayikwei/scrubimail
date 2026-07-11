import axios from 'axios';
import { getCookie } from './authAxiosInstance';

export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/scrubimail/api/v1';
//const apiUrl = 'http://172.20.10.4:5004/alumni/api/v1';
export const imgApiUrl = import.meta.env.VITE_IMG_API_URL || 'http://localhost:8000/images/';


console.log('API URL:', apiUrl);
const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getCookie('_auth');
        console.log('Token found:', !!token);
        console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'No token');
        if (token) {
            config.headers.Authorization = `${token}`;
        }
        config.headers['X-Refresh-Token'] = getCookie('_auth_refresh') ?? '';

        if (!config.data) {
            config.data = {
                user_id: localStorage.getItem('userId') ?? 'default_user_id',
            };
        }

        console.log('Request headers:', config.headers);
        return config;
    },
    (error) => {
        return Promise.reject(new Error(error.message));
    }
);


axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
        }
        // Unified error envelope (backend Issue 8):
        //   { success: false, error: { code, message, details: [{field, issue}] } }
        // Fall back to legacy shapes for any endpoint not yet migrated.
        const serverData = error.response?.data;
        const envelope = serverData?.error;
        const message =
            (envelope && typeof envelope === 'object' ? envelope.message : null) ||
            serverData?.detail ||
            serverData?.message ||
            (typeof envelope === 'string' ? envelope : null) ||
            (typeof serverData === 'string' ? serverData : null) ||
            error.message ||
            'An unexpected error occurred';
        const normalized: any = new Error(message);
        // Expose the stable machine-readable code + field details to callers.
        if (envelope && typeof envelope === 'object') {
            normalized.code = envelope.code;
            normalized.details = envelope.details;
        }
        normalized.status = error.response?.status;
        return Promise.reject(normalized);
    }
);

export default axiosInstance;
