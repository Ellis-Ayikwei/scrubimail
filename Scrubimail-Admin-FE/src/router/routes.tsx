import { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

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

// Admin Management pages
const ManageAPIKeys = lazy(() => import('../pages/admin/ManageAPIKeys'));
const ManageUsers = lazy(() => import('../pages/admin/ManageUsers'));
const ManagePayments = lazy(() => import('../pages/admin/ManagePayments'));
const ManageValidations = lazy(() => import('../pages/admin/ManageValidations'));
const BillingManagement = lazy(() => import('../pages/admin/BillingManagement'));
const ValidationsManagement = lazy(() => import('../pages/admin/ValidationsManagement'));
const PlansManagement = lazy(() => import('../pages/admin/PlansManagement'));
const UserDetail = lazy(() => import('../pages/admin/users/index'));

// New Billing Management pages
const CreditPackagesManagement = lazy(() => import('../pages/admin/CreditPackagesManagement'));
const PromoCodesManagement = lazy(() => import('../pages/admin/promo-codes/PromoCodesManagement'));
const InvoicesManagement = lazy(() => import('../pages/admin/InvoicesManagement'));
const UsageAlertsDashboard = lazy(() => import('../pages/admin/UsageAlertsDashboard'));

const ChangelogManagement = lazy(() => import('../pages/admin/ChangelogManagement'));
const GroupsPermissionsManagement = lazy(() => import('../pages/admin/GroupsPermissionsManagement'));

// Auth pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const OAuthCallback = lazy(() => import('../pages/auth/OAuthCallback'));

// Error pages
const NotFound = lazy(() => import('../pages/404'));
const ServerError = lazy(() => import('../pages/500'));

const routes = [
    // Auth routes
    {
        path: '/login',
        element: <Login />,
        layout: 'blank',
    },
    {
        path: '/register',
        element: <Register />,
        layout: 'blank',
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />,
        layout: 'blank',
    },
    {
        path: '/reset-password/:uidb64/:token',
        element: <ResetPassword />,
        layout: 'blank',
    },
    {
        path: '/reset-password',
        element: <ResetPassword />,
        layout: 'blank',
    },
    {
        path: '/oauth/callback',
        element: <OAuthCallback />,
        layout: 'blank',
    },

    // Admin routes (protected with admin layout)
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AdminDashboard />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <AdminDashboard />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
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
        path: '/admin/users/:id',
        element: (
            <ProtectedRoute>
                <UserDetail />
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
                <InvoicesManagement />
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

    // Admin Management routes
    {
        path: '/admin/manage/api-keys',
        element: (
            <ProtectedRoute>
                <ManageAPIKeys />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/manage/users',
        element: (
            <ProtectedRoute>
                <ManageUsers />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/manage/payments',
        element: (
            <ProtectedRoute>
                <ManagePayments />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/manage/validations',
        element: (
            <ProtectedRoute>
                <ManageValidations />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/billing',
        element: (
            <ProtectedRoute>
                <BillingManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/validations',
        element: (
            <ProtectedRoute>
                <ValidationsManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/plans',
        element: (
            <ProtectedRoute>
                <PlansManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/billing/credit-packages',
        element: (
            <ProtectedRoute>
                <CreditPackagesManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/billing/promo-codes',
        element: (
            <ProtectedRoute>
                <PromoCodesManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/billing/invoices',
        element: (
            <ProtectedRoute>
                <InvoicesManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/billing/usage-alerts',
        element: (
            <ProtectedRoute>
                <UsageAlertsDashboard />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },

    {
        path: '/admin/changelog',
        element: (
            <ProtectedRoute>
                <ChangelogManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/groups-permissions',
        element: (
            <ProtectedRoute>
                <GroupsPermissionsManagement />
            </ProtectedRoute>
        ),
        layout: 'admin',
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
    }
];

export { routes };
