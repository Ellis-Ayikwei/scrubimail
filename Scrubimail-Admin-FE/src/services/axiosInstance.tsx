import axios from 'axios';
import { getCookie } from './authAxiosInstance';

// Base API URL with safe fallback and normalized trailing slash
const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
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
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
        }
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
