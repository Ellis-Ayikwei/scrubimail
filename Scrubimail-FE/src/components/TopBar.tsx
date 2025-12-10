import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  CheckCircle, 
  Menu, 
  X,
  FileText
} from 'lucide-react';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { toggleSidebar } from '../store/themeConfigSlice';
import UserMenu from './UserMenu';
import DarkModeToggle from './DarkModeToggle';

const TopBar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  const dispatch = useDispatch();

  // If not authenticated, show minimal header with just logo and auth buttons
  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/assets/images/scrubi mail full.png" 
                  alt="Scrubimail Logo" 
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
            </div>

            {/* Navigation Links for unauthenticated users */}
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

            {/* Right side actions for non-authenticated users */}
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <DarkModeToggle />

              {/* Auth buttons */}
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-[#2ED8A3] text-white rounded-full hover:bg-[#00C48C] transition-colors duration-200 shadow-sm"
                >
                  Get started
                </Link>
              </div>

              {/* Mobile menu button for unauthenticated users */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation for unauthenticated users */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="px-4 py-3 space-y-1">
                <Link
                  to="/api-docs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 items-center space-x-3 text-gray-600 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <FileText className="w-5 h-5" />
                  <span>API Docs</span>
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 items-center space-x-3 text-gray-600 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Pricing</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 items-center space-x-3 text-gray-600 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>About</span>
                </Link>
                
                {/* Mobile auth buttons */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 items-center justify-center bg-[#2ED8A3] text-white hover:bg-[#00C48C]"
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Sidebar toggle button + Logo */}
          <div className="flex items-center space-x-3">
            {/* Sidebar toggle button - show when authenticated */}
            {isAuthenticated && (
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="p-2 rounded-md text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {/* Logo and Brand */}
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
              <img 
                src="/assets/images/scrubi mail full.png" 
                alt="Scrubimail Logo" 
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation - removed, now in sidebar */}

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Credits display */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#00C48C]/10 rounded-full">
              <div className="w-2 h-2 bg-[#00C48C] rounded-full"></div>
              <span className="text-sm font-medium text-[#00C48C]">
                1,250 credits
              </span>
            </div>

            {/* Dark mode toggle */}
            <DarkModeToggle />

            {/* User menu */}
            <UserMenu />
          </div>
        </div>

        {/* Mobile Navigation - removed, now in sidebar */}
      </div>
    </header>
  );
};

export default TopBar; 