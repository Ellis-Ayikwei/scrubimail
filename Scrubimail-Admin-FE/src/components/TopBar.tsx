import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, FileText } from 'lucide-react';
import { useDispatch } from 'react-redux';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { toggleSidebar } from '../store/themeConfigSlice';
import UserMenu from './UserMenu';
import DarkModeToggle from './DarkModeToggle';

const TopBar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  const dispatch = useDispatch();

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/assets/images/scrubi mail full.png"
                  alt="Scrubimail Logo"
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
            </div>

            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                to="/api-docs"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                API Docs
              </Link>
              <Link
                to="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                About
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <DarkModeToggle />

              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0b0f]">
              <div className="px-4 py-3 space-y-1">
                <Link
                  to="/api-docs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 items-center space-x-3 text-gray-600 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <FileText className="w-5 h-5" />
                  <span>API Docs</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b0b0f]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-md text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/admin/dashboard" className="flex items-center">
              <img
                src="/assets/images/scrubi mail full.png"
                alt="Scrubimail Logo"
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;