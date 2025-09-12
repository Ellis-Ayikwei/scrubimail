import { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthRedirect from '../components/AuthRedirect';

// Lazy load pages for better performance
const Homepage = lazy(() => import('../pages/Homepage'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Validation = lazy(() => import('../pages/Validation'));
const History = lazy(() => import('../pages/History'));
const ApiKeys = lazy(() => import('../pages/APIKeys'));
const Billing = lazy(() => import('../pages/Billing'));
const Profile = lazy(() => import('../pages/Profile'));
const ApiDocs = lazy(() => import('../pages/ApiDocs'));
const Integrations = lazy(() => import('../pages/Integrations'));
const About = lazy(() => import('../pages/About'));
const Blog = lazy(() => import('../pages/Blog'));
const Contact = lazy(() => import('../pages/Contact'));
const Help = lazy(() => import('../pages/Help'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const OAuthCallback = lazy(() => import('../pages/auth/OAuthCallback'));
const SSO = lazy(() => import('../pages/auth/SSO'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/legal/TermsOfService'));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminAnalytics = lazy(() => import('../pages/admin/Analytics'));
const AdminReports = lazy(() => import('../pages/admin/Reports'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminProducts = lazy(() => import('../pages/admin/Products'));
const AdminOrders = lazy(() => import('../pages/admin/Orders'));
const AdminCategories = lazy(() => import('../pages/admin/Categories'));
const AdminRevenue = lazy(() => import('../pages/admin/Revenue'));
const AdminTransactions = lazy(() => import('../pages/admin/Transactions'));
const AdminInvoices = lazy(() => import('../pages/admin/Invoices'));
const AdminMessages = lazy(() => import('../pages/admin/Messages'));
const AdminNotifications = lazy(() => import('../pages/admin/Notifications'));
const AdminSupport = lazy(() => import('../pages/admin/Support'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminActivity = lazy(() => import('../pages/admin/Activity'));
const AdminHelp = lazy(() => import('../pages/admin/Help'));

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
        layout: 'default',
    },
    {
        path: '/about',
        element: <About />,
        layout: 'default',
    },
    {
        path: '/blog',
        element: <Blog />,
        layout: 'default',
    },
    {
        path: '/contact',
        element: <Contact />,
        layout: 'default',
    },
    {
        path: '/help',
        element: <Help />,
        layout: 'default',
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
        path: '/profile',
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/api-docs',
        element: <ApiDocs />,
        layout: 'default',
    },

    // Admin routes (protected with admin layout)
    {
        path: '/admin/dashboard',
        element: (
            <ProtectedRoute>
                <AdminDashboard />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/analytics',
        element: (
            <ProtectedRoute>
                <AdminAnalytics />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/reports',
        element: (
            <ProtectedRoute>
                <AdminReports />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/users',
        element: (
            <ProtectedRoute>
                <AdminUsers />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/products',
        element: (
            <ProtectedRoute>
                <AdminProducts />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/orders',
        element: (
            <ProtectedRoute>
                <AdminOrders />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/categories',
        element: (
            <ProtectedRoute>
                <AdminCategories />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/revenue',
        element: (
            <ProtectedRoute>
                <AdminRevenue />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/transactions',
        element: (
            <ProtectedRoute>
                <AdminTransactions />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/invoices',
        element: (
            <ProtectedRoute>
                <AdminInvoices />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/messages',
        element: (
            <ProtectedRoute>
                <AdminMessages />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/notifications',
        element: (
            <ProtectedRoute>
                <AdminNotifications />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/support',
        element: (
            <ProtectedRoute>
                <AdminSupport />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/settings',
        element: (
            <ProtectedRoute>
                <AdminSettings />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/activity',
        element: (
            <ProtectedRoute>
                <AdminActivity />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/help',
        element: (
            <ProtectedRoute>
                <AdminHelp />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
];

export { routes };
