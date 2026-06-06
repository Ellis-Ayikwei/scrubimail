import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleTheme } from '../../store/themeConfigSlice';
import IconMenu from '../Icon/IconMenu';
import { Bell, Sun, Moon } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

interface AdminHeaderProps {
    onToggleMobileMenu: () => void;
}

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/admin/dashboard': 'Dashboard',
    '/admin/analytics': 'Analytics',
    '/admin/reports': 'Reports',
    '/admin/users': 'Users',
    '/admin/manage/users': 'Manage Users',
    '/admin/manage/api-keys': 'API Keys',
    '/admin/manage/payments': 'Payments',
    '/admin/manage/validations': 'Validations',
    '/admin/billing': 'Billing Overview',
    '/admin/billing/credit-packages': 'Credit Packages',
    '/admin/billing/promo-codes': 'Promo Codes',
    '/admin/billing/invoices': 'Invoices',
    '/admin/billing/usage-alerts': 'Usage Alerts',
    '/admin/validations': 'Validations',
    '/admin/plans': 'Plans',
    '/admin/changelog': 'Changelog',
    '/admin/settings': 'Settings',
    '/admin/activity': 'Activity',
    '/admin/revenue': 'Revenue',
    '/admin/transactions': 'Transactions',
    '/admin/invoices': 'Invoices',
    '/admin/messages': 'Messages',
    '/admin/notifications': 'Notifications',
    '/admin/support': 'Support',
    '/admin/help': 'Help',
};

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileMenu }) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const authUser = useAuthUser() as any;
    const user = authUser?.user || authUser;

    const isDark = themeConfig.theme === 'dark';

    const handleThemeToggle = () => {
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        dispatch(toggleTheme(newTheme));
    };

    const pageTitle = PAGE_TITLES[location.pathname] || 'Admin Panel';
    const userName = user?.name || user?.first_name || user?.email?.split('@')[0] || 'Admin';
    const initial = userName[0]?.toUpperCase() || 'A';

    return (
        <header
            className="sticky top-0 z-40 border-b border-[#3b4a41]/30"
            style={{ backgroundColor: 'rgba(8,12,16,0.92)', backdropFilter: 'blur(12px)' }}
        >
            <div className="flex items-center justify-between h-12 px-4 sm:px-6">
                {/* Left */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleMobileMenu}
                        className="lg:hidden p-1.5 text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] rounded-sm transition-colors"
                    >
                        <IconMenu />
                    </button>
                    <div className="flex items-center gap-2">
                        <span
                            className="text-[#3b4a41] text-[10px]"
                            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                        >
                            Admin
                        </span>
                        <span className="text-[#3b4a41]">/</span>
                        <h1
                            className="text-[#e0e3e8] text-[12px] font-semibold"
                            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                        >
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative p-1.5 rounded-sm text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] transition-colors">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#6effc0] rounded-full" />
                    </button>

                    {/* Theme toggle */}
                    <button
                        onClick={handleThemeToggle}
                        className="p-1.5 rounded-sm text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] transition-colors"
                        title={isDark ? 'Light mode' : 'Dark mode'}
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* User badge */}
                    <div className="flex items-center gap-2 pl-3 border-l border-[#3b4a41]/40 ml-1">
                        <div className="w-6 h-6 bg-[#00e5a0] rounded-sm flex items-center justify-center text-[#003824] font-black text-xs flex-shrink-0" style={{ fontFamily: 'Epilogue, sans-serif' }}>
                            {initial}
                        </div>
                        <span
                            className="hidden md:block text-[#bacbbf] text-[11px] max-w-[120px] truncate"
                            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.06em' }}
                        >
                            {userName}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
