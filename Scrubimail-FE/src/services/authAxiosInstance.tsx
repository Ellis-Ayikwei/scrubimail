import axios from 'axios';
import { apiUrl } from './axiosInstance';

export const authApiUrl = import.meta.env.VITE_API_URL + 'auth';

export const getCookie = (name: string): string | undefined => {
    try {
        const value = `; ${document.cookie}`;
        // console.log("Checking all cookies:", document.cookie); // Debug all cookies
        
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop()?.split(';').shift();
            // console.log(`Found cookie ${name}:`, cookieValue);
            return cookieValue ? decodeURIComponent(cookieValue) : undefined;
        }
        // console.log(`Cookie ${name} not found`);
        return undefined;
    } catch (error) {
        console.error("Error getting cookie:", error);
        return undefined;
    }
};

// Function to ensure cookies are properly set before trying to access them
// export const waitForCookie = async (name: string, maxWaitTime = 2000, checkInterval = 100): Promise<string | undefined> => {
//     return new Promise((resolve) => {
//         const startTime = Date.now();
        
//         const checkCookie = () => {
//             const cookie = getCookie(name);
//             if (cookie) {
//                 resolve(cookie);
//                 return;
//             }
            
//             const elapsed = Date.now() - startTime;
//             if (elapsed >= maxWaitTime) {
//                 console.warn(`Timeout waiting for cookie: ${name}`);
//                 resolve(undefined);
//                 return;
//             }
            
//             setTimeout(checkCookie, checkInterval);
//         };
        
//         checkCookie();
//     });
// };

const authAxiosInstance = axios.create({
    baseURL: authApiUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Enhanced interceptor with better error handling
authAxiosInstance.interceptors.request.use(
    (config) => {
        console.log("intercepting request");
        const token = getCookie('_auth');
        if (token) {
            console.log("adding refresh token");
            config.headers.Authorization = token;
        }
        const refreshToken = getCookie('_auth_refresh');
        if (refreshToken) {
            config.headers['X-Refresh-Token'] = refreshToken;
        }

        // Add user ID to request data if it exists
        if (!config.data) {
            config.data = {};
        }
        
        const userId = localStorage.getItem('userId');
        if (userId) {
            config.data.user_id = userId;
        }
        
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to log cookies
authAxiosInstance.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.status);
        
        // Log all headers (helps with debugging)
        console.log('Response headers:', response.headers);
        
        // Check for Set-Cookie header
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            console.log('Set-Cookie header found:', setCookieHeader);
        }
        
        // Log all cookies after response
        console.log('Cookies after response:', document.cookie);
        
        return response;
    },
    (error) => {
        console.error('Response interceptor error:', error);
        return Promise.reject(error);
    }
);

// Named export for compatibility with imports
export { authAxiosInstance };

export default authAxiosInstance;
