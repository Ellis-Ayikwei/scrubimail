import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Key, Code, CreditCard } from 'lucide-react';
import { LogoutUser } from '../store/authSlice';
import { RootState } from '../store';

const UserMenu = () => {
  const dispatch = useDispatch();
  const signOut = useSignOut();
  const authUser = useAuthUser() as { email?: string } | null;
  const user = useSelector((state: RootState) => state.auth.user) as { email?: string } | null;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const logoutResponse = await dispatch(LogoutUser({ signOut }) as any);

      if (logoutResponse.meta?.requestStatus === 'fulfilled' || logoutResponse.type?.endsWith('/fulfilled')) {
          // Clear all local storage
          localStorage.clear();
          sessionStorage.clear();

          // Navigate to login page
          navigate('/login', { replace: true });

          // Show success message (optional)
          console.log('Logout successful');
      } else {
          // Handle logout failure
          console.error('Logout failed:', logoutResponse.error || 'Unknown error');

          // Force logout on client side even if server call fails
          signOut();
          localStorage.clear();
          sessionStorage.clear();
          navigate('/login', { replace: true });
      }

    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout
      signOut();
      navigate('/login', { replace: true });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 bg-[#2ED8A3] rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {(user?.email || authUser?.email || 'U')[0].toUpperCase()}
        </div>
        <span className="text-[#333333] dark:text-white font-medium text-sm hidden sm:block">
          {user?.email || authUser?.email || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#333333] dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-[#333333] dark:text-white">
              {user?.email || authUser?.email || 'User'}
            </p>
            <p className="text-xs text-[#333333]/70 dark:text-gray-400">
              Professional Plan
            </p>
          </div>
          
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-700 hover:text-[#2ED8A3] transition-colors"
            >
              <User className="w-4 h-4 mr-3" />
              Profile Settings
            </Link>
            
            <Link
              to="/apikeys"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-700 hover:text-[#2ED8A3] transition-colors"
            >
              <Key className="w-4 h-4 mr-3" />
              API Keys
            </Link>
            
            <Link
              to="/integrations"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-700 hover:text-[#2ED8A3] transition-colors"
            >
              <Code className="w-4 h-4 mr-3" />
              Integrations
            </Link>
            
            <Link
              to="/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-[#333333] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-700 hover:text-[#2ED8A3] transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-3" />
              Billing
            </Link>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-[#FF4C4C] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 