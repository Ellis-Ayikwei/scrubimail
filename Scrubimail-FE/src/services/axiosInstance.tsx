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
        // Extract the actual server error message so callers get readable errors
        const serverData = error.response?.data;
        const message =
            serverData?.detail ||
            serverData?.message ||
            serverData?.error ||
            (typeof serverData === 'string' ? serverData : null) ||
            error.message ||
            'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

export default axiosInstance;
