import { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthRedirect from '../components/AuthRedirect';

// Lazy load pages for better performance
const Homepage = lazy(() => import('../pages/Homepage'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Validation = lazy(() => import('../pages/Validation/index'));
const History = lazy(() => import('../pages/History'));
const ApiKeys = lazy(() => import('../pages/APIKeys'));
const Billing = lazy(() => import('../pages/Billing'));
const BillingPaymentOutcome = lazy(() => import('../pages/BillingPaymentOutcome'));
const Profile = lazy(() => import('../pages/Profile'));
const ApiDocs = lazy(() => import('../pages/ApiDocs'));
const Integrations = lazy(() => import('../pages/Integrations'));
const About = lazy(() => import('../pages/About'));
const Blog = lazy(() => import('../pages/Blog'));
const Contact = lazy(() => import('../pages/Contact'));
const Help = lazy(() => import('../pages/Help'));
const Pricing = lazy(() => import('../pages/Pricing'));
const Features = lazy(() => import('../pages/Features'));
const Analytics = lazy(() => import('../pages/Analytics'));
const BulkUpload = lazy(() => import('../pages/BulkUpload'));
const Notifications = lazy(() => import('../pages/Notifications'));
const NotFound = lazy(() => import('../pages/404'));
const ServerError = lazy(() => import('../pages/500'));
const Login = lazy(() => import('../pages/auth/MultiStepLogin'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const OAuthCallback = lazy(() => import('../pages/auth/OAuthCallback'));
const SSO = lazy(() => import('../pages/auth/SSO'));

const MultiStepLogin = lazy(() => import('../pages/auth/MultiStepLogin'));
const Changelog = lazy(() => import('../pages/Changelog'));
const TOTPSetup = lazy(() => import('../pages/Security/TOTPSetup'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/legal/TermsOfService'));


const routes = [
    // Public routes (no authentication required)
    {
        path: '/',
        element: <Homepage />,
        layout: 'blank',
    },
    {
        path: '/integrations',
        element: <Integrations />,
        layout: 'flexible',
    },
    {
        path: '/about',
        element: <About />,
        layout: 'flexible',
    },
    {
        path: '/blog',
        element: <Blog />,
        layout: 'flexible',
    },
    {
        path: '/changelog',
        element: <Changelog />,
        layout: 'flexible',
    },
    {
        path: '/contact',
        element: <Contact />,
        layout: 'flexible',
    },
    {
        path: '/help',
        element: <Help />,
        layout: 'flexible',
    },
    {
        path: '/pricing',
        element: <Pricing />,
        layout: 'flexible',
    },
    {
        path: '/features',
        element: <Features />,
        layout: 'flexible',
    },
    {
        path: '/login',
        element: (
            <AuthRedirect>
                <Login />
            </AuthRedirect>
        ),
        layout: 'blank',
    },
    {
        path: '/register',
        element: (
            <AuthRedirect>
                <Register />
            </AuthRedirect>
        ),
        layout: 'blank',
    },
    {
        path: '/forgot-password',
        element: (
            <AuthRedirect>
                <ForgotPassword />
            </AuthRedirect>
        ),
        layout: 'blank',
    },
    {
        path: '/reset-password',
        element: (
            <AuthRedirect>
                <ResetPassword />
            </AuthRedirect>
        ),
        layout: 'blank',
    },
    {
        path: '/oauth/callback',
        element: <OAuthCallback />,
        layout: 'blank',
    },
    {
        path: '/sso',
        element: <SSO />,
        layout: 'blank',
    },
    
    {
        path: '/multi-login',
        element: (
            <AuthRedirect>
                <MultiStepLogin />
            </AuthRedirect>
        ),
        layout: 'blank',
    },
    {
        path: '/privacy',
        element: <PrivacyPolicy />,
        layout: 'blank',
    },
    {
        path: '/terms',
        element: <TermsOfService />,
        layout: 'blank',
    },

    // Protected routes for authenticated users
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/validate',
        element: (
            <ProtectedRoute>
                <Validation />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/history',
        element: (
            <ProtectedRoute>
                <History />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/apikeys',
        element: (
            <ProtectedRoute>
                <ApiKeys />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/billing',
        element: (
            <ProtectedRoute>
                <Billing />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/billing/payment/:outcome',
        element: (
            <ProtectedRoute>
                <BillingPaymentOutcome />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/profile',
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/security',
        element: (
            <ProtectedRoute>
                <TOTPSetup />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/api-docs',
        element: <ApiDocs />,
        layout: 'flexible',
    },
    {
        path: '/analytics',
        element: (
            <ProtectedRoute>
                <Analytics />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/bulk-upload',
        element: (
            <ProtectedRoute>
                <BulkUpload />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/notifications',
        element: (
            <ProtectedRoute>
                <Notifications />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Error pages
    {
        path: '/500',
        element: <ServerError />,
        layout: 'blank',
    },
    {
        path: '*',
        element: <NotFound />,
        layout: 'blank',
    },
];

export { routes };
