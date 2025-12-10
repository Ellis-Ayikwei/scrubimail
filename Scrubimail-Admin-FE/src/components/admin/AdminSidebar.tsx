import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Users,
  Key,
  Package,
  Ticket,
  FileText,
  Bell,
  Settings,
  User,
  LogOut,
  FileCheck,
  CreditCard
} from 'lucide-react';

interface AdminSidebarProps {
    isMobileMenuOpen: boolean;
    onCloseMobileMenu: () => void;
    onSignOut: () => void;
    user: {
        id: string;
        email: string;
        name?: string;
        avatar?: string;
    } | null;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
    isMobileMenuOpen, 
    onCloseMobileMenu, 
    onSignOut, 
    user 
}) => {
    const location = useLocation();

    const menuItems = [
        {
            title: 'Dashboard',
            items: [
                { icon: <Home className="w-5 h-5" />, label: 'Overview', path: '/admin/dashboard' },
                { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/admin/analytics' },
            ]
        },
        {
            title: 'User Management',
            items: [
                { icon: <Users className="w-5 h-5" />, label: 'Users', path: '/admin/users' },
                { icon: <Key className="w-5 h-5" />, label: 'API Keys', path: '/admin/manage/api-keys' },
            ]
        },
        {
            title: 'Billing Management',
            items: [
                { icon: <CreditCard className="w-5 h-5" />, label: 'Billing Overview', path: '/admin/billing' },
                { icon: <Package className="w-5 h-5" />, label: 'Credit Packages', path: '/admin/billing/credit-packages' },
                { icon: <Ticket className="w-5 h-5" />, label: 'Promo Codes', path: '/admin/billing/promo-codes' },
                { icon: <FileText className="w-5 h-5" />, label: 'Invoices', path: '/admin/billing/invoices' },
                { icon: <Bell className="w-5 h-5" />, label: 'Usage Alerts', path: '/admin/billing/usage-alerts' },
            ]
        },
        {
            title: 'Business Management',
            items: [
                { icon: <FileCheck className="w-5 h-5" />, label: 'Validations', path: '/admin/validations' },
                { icon: <Package className="w-5 h-5" />, label: 'Plans', path: '/admin/plans' },
            ]
        },
        {
            title: 'System',
            items: [
                { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/admin/settings' },
            ]
        },
    ];

    const isActive = (path: string) => {
        // Exact match for specific paths
        if (path === '/admin/billing') {
            return location.pathname === path;
        }
        // For nested paths, check if current path starts with the menu path
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onCloseMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 flex-shrink-0 flex flex-col`}>
                <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700 flex-shrink-0">
                    <Link to="/admin/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</span>
                    </Link>
                    <button
                        onClick={onCloseMobileMenu}
                        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                                        onClick={onCloseMobileMenu}
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

                <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                            ) : (
                                <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user?.name || 'Admin User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.email || 'admin@example.com'}
                            </p>
                        </div>
                        <button
                            onClick={onSignOut}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Sign out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
