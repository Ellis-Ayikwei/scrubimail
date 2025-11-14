import React from 'react';
import { Link } from 'react-router-dom';

const AuthFooter: React.FC = () => {
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 mt-auto">
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 text-xs text-[#333333]/60 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>&copy; {getCurrentYear()} ScrubiMail</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/privacy" 
              className="hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link 
              to="/terms" 
              className="hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <Link 
              to="/help" 
              className="hover:text-primary transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;

