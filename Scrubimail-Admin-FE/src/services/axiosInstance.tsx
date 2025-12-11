import axios from 'axios';
import { getCookie } from './authAxiosInstance';

// Base API URL with safe fallback and normalized trailing slash
const defaultApiUrl = 'import.meta.env.VITE_API_URL';
const rawBaseUrl: string = (import.meta as any)?.env?.VITE_API_URL || defaultApiUrl;
const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

export const apiUrl = normalizedBaseUrl;

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
        if (token) {
            const hasBearerPrefix = /^Bearer\s+/i.test(token);
            config.headers.Authorization = hasBearerPrefix ? token : `Bearer ${token}`;
        }
        config.headers['X-Refresh-Token'] = getCookie('_auth_refresh') ?? '';

        if (!config.data) {
            config.data = {
                user_id: localStorage.getItem('userId') ?? 'default_user_id',
            };
        }

        return config;
    },
    (error) => {
        return Promise.reject(new Error(error.message));
    }
);


axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.log('intercepting response');
        if (error.response.status === 401) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
