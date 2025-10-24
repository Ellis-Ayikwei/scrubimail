import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import IconMenu from '../Icon/IconMenu';
import IconBell from '../Icon/IconBell';

interface AdminHeaderProps {
    onToggleMobileMenu: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileMenu }) => {
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <button
                    onClick={onToggleMobileMenu}
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
                            localStorage.setItem('theme', newTheme);
                            window.location.reload();
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        {themeConfig.theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
