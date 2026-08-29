import React, { Suspense } from 'react';
import createRefresh from 'react-auth-kit/createRefresh';
import ReactDOM from 'react-dom/client';

// Tailwind + shadcn design tokens
import './index.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';
import App from './App';

// Redux
import AuthProvider from 'react-auth-kit';
import createStore from 'react-auth-kit/createStore';
import { Provider } from 'react-redux';
import store from './store/index';
import IconLoader from './components/Icon/IconLoader';
import authAxiosInstance from './services/authAxiosInstance';



// Dynamic imports for non-critical paths
const i18n = import('./i18n');

// Memoized auth configuration
// const refresh = createRefresh({
//   interval: 60,
//   refreshApiCallback: async (param) => {
//     try {
//       const response = await authAxiosInstance('/refresh_token/', param);
//       return {
//         isSuccess: true,
//         newAuthToken: response.data.token,
//         newAuthTokenExpireIn: 60,
//         newRefreshTokenExpiresIn: 3600,
//       };
//     } catch (error) {
//       console.error(error);
//       return { isSuccess: false, newAuthToken: '' };
//     }
//   },
// });

const authStore = createStore({
    authType: 'cookie',
    authName: '_auth',
    cookieDomain: window.location.hostname,
    cookieSecure: window.location.protocol === 'https:',
    debug: true,
    refresh: createRefresh({
        interval: 15,
        refreshApiCallback: async () => {
            try {
                const response = await authAxiosInstance.post('/refresh_token/', {
                    withCredentials: true,
                    // Automatically sends refresh cookie
                });
                return {
                    isSuccess: true,
                    newAuthToken: response.headers.authorization,
                    newAuthTokenExpireIn: 1900,
                };
            } catch (error) {
                console.log('Error refreshing token:', error);
                return {
                    isSuccess: false,
                    newAuthToken: '', // Ensure newAuthToken is always a string
                    newAuthTokenExpireIn: undefined,
                };
            }
        },
    }),
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><IconLoader /></div>}>
            <Provider store={store}>
                <AuthProvider store={authStore}>
                    <App>
                        <RouterProvider router={router} />
                    </App>
                </AuthProvider>
            </Provider>
        </Suspense>
    </React.StrictMode>
);
