import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle, 
  History, 
  Menu, 
  X,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import UserMenu from './UserMenu';
import DarkModeToggle from './DarkModeToggle';

const TopBar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/validate', label: 'Validate', icon: CheckCircle },
    { to: '/history', label: 'History', icon: History },
    { to: '/api-docs', label: 'API Docs', icon: FileText },
  ];

  // If not authenticated, show minimal header with just logo and auth buttons
  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#2ED8A3] to-[#00C48C] rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-medium text-gray-900 dark:text-white">
                  ScrubiMail
                </span>
              </Link>
            </div>

            {/* Navigation Links for unauthenticated users */}
            <nav className="hidden md:flex items-center space-x-8">
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
              <div className="flex items-center space-x-3">
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
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <img src='assets/images/scrubiLogo.png' alt="Logo" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] bg-clip-text text-transparent">
                Scrubimail
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                    location.pathname === link.to
                      ? 'bg-[#2ED8A3]/10 text-[#004E8A] dark:text-[#2ED8A3]'
                      : 'text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-[#004E8A] dark:hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex px-3 py-2 rounded-md text-base font-medium transition-all duration-200 items-center space-x-2 ${
                      location.pathname === link.to
                        ? 'bg-[#2ED8A3]/10 text-[#004E8A] dark:text-[#2ED8A3]'
                        : 'text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 hover:text-[#004E8A] dark:hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              {/* Mobile credits display */}
              <div className="px-3 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00C48C] rounded-full"></div>
                <span className="text-sm font-medium text-[#00C48C]">
                  1,250 credits
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar; 