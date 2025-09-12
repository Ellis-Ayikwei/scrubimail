import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IRootState } from '../store';
import { toggleSidebar } from '../store/themeConfigSlice';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import IconMenu from './Icon/IconMenu';
import IconX from './Icon/IconX';
import IconHome from './Icon/IconHome';
import IconUsersGroup from './Icon/IconUsersGroup';
import IconBox from './Icon/IconBox';
import IconDollarSign from './Icon/IconDollarSign';
import IconTrendingUp from './Icon/IconTrendingUp';
import IconSettings from './Icon/IconSettings';
import IconFile from './Icon/IconFile';
import IconBell from './Icon/IconBell';
import IconUser from './Icon/IconUser';
import IconLogout from './Icon/IconLogout';
import IconChartSquare from './Icon/IconChartSquare';
import IconMail from './Icon/IconMail';
import IconCalendar from './Icon/IconCalendar';
import IconShoppingBag from './Icon/IconShoppingBag';
import IconCreditCard from './Icon/IconCreditCard';
import IconTag from './Icon/IconTag';
import IconHelpCircle from './Icon/IconHelpCircle';
import IconMessageSquare from './Icon/IconMessageSquare';

interface AdminLayoutProps {
    children: React.ReactNode;
}

interface AuthUser {
    user: {
        id: string;
        email: string;
        name?: string;
        avatar?: string;
    };
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const signOut = useSignOut();
    const authUser = useAuthUser();
    const user = authUser as AuthUser | null;
    
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    const menuItems = [
        {
            title: 'Dashboard',
            items: [
                { icon: <IconHome />, label: 'Overview', path: '/admin/dashboard' },
                { icon: <IconChartSquare />, label: 'Analytics', path: '/admin/analytics' },
                { icon: <IconTrendingUp />, label: 'Reports', path: '/admin/reports' },
            ]
        },
        {
            title: 'Management',
            items: [
                { icon: <IconUsersGroup />, label: 'Users', path: '/admin/users' },
                { icon: <IconBox />, label: 'Products', path: '/admin/products' },
                { icon: <IconShoppingBag />, label: 'Orders', path: '/admin/orders' },
                { icon: <IconTag />, label: 'Categories', path: '/admin/categories' },
            ]
        },
        {
            title: 'Financial',
            items: [
                { icon: <IconDollarSign />, label: 'Revenue', path: '/admin/revenue' },
                { icon: <IconCreditCard />, label: 'Transactions', path: '/admin/transactions' },
                { icon: <IconFile />, label: 'Invoices', path: '/admin/invoices' },
            ]
        },
        {
            title: 'Communication',
            items: [
                { icon: <IconMail />, label: 'Messages', path: '/admin/messages' },
                { icon: <IconBell />, label: 'Notifications', path: '/admin/notifications' },
                { icon: <IconMessageSquare />, label: 'Support Tickets', path: '/admin/support' },
            ]
        },
        {
            title: 'System',
            items: [
                { icon: <IconSettings />, label: 'Settings', path: '/admin/settings' },
                { icon: <IconCalendar />, label: 'Activity Log', path: '/admin/activity' },
                { icon: <IconHelpCircle />, label: 'Help Center', path: '/admin/help' },
            ]
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:static lg:inset-0`}>
                <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700">
                    <Link to="/admin/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</span>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <IconX />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((section, index) => (
                        <div key={index} className="mb-6">
                            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item, itemIndex) => (
                                    <Link
                                        key={itemIndex}
                                        to={item.path}
                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive(item.path)
                                                ? 'bg-primary text-white'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className="w-5 h-5 mr-3">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            {user?.user?.avatar ? (
                                <img src={user.user.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                            ) : (
                                <IconUser className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user?.user?.name || 'Admin User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.user?.email || 'admin@example.com'}
                            </p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Sign out"
                        >
                            <IconLogout className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <IconMenu />
                        </button>

                        <div className="flex items-center space-x-4 ml-auto">
                            {/* Notifications */}
                            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <IconBell className="w-6 h-6" />
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={() => {
                                    const newTheme = themeConfig.theme === 'dark' ? 'light' : 'dark';
                                    dispatch(toggleTheme(newTheme));
                                    localStorage.setItem('theme', newTheme);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {themeConfig.theme === 'dark' ? '🌞' : '🌙'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;