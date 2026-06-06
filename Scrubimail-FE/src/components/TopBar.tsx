import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, Search, Bell, ChevronDown, User, LogOut, Settings, Zap, Sun, Moon } from 'lucide-react';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { toggleSidebar, toggleTheme } from '../store/themeConfigSlice';
import { RootState } from '../store';
import { LogoutUser } from '../store/authSlice';
import { useSelector as useReduxSelector } from 'react-redux';

const TopBar: React.FC = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  const authUser = useAuthUser() as { email?: string; name?: string } | null;
  const user = useReduxSelector((s: RootState) => s.auth.user) as { email?: string; name?: string } | null;
  const dispatch = useDispatch();
  const themeConfig = useSelector((s: RootState) => s.themeConfig);
  const isDark = themeConfig.theme === 'dark';
  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    dispatch(toggleTheme(newTheme));
  };
  const signOut = useSignOut();
  const navigate = useNavigate();

  const displayEmail = user?.email || authUser?.email || 'User';
  const initial = displayEmail[0].toUpperCase();

  const handleLogout = async () => {
    try {
      const res = await dispatch(LogoutUser({ signOut }) as any);
      if (!res.meta?.requestStatus?.endsWith('fulfilled') && !res.type?.endsWith('/fulfilled')) {
        signOut();
      }
    } catch {
      signOut();
    } finally {
      // localStorage.clear();
      sessionStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  // ── Authenticated top bar ──────────────────────────────────────────────────
  if (isAuthenticated) {
    return (
      <header
        className="sticky top-0 z-40 border-b border-[#3b4a41]/30 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(8,12,16,0.92)' }}
      >
        <div className="flex items-center justify-between h-12 px-4 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 rounded-sm text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm px-3 py-1.5 w-56 group focus-within:border-[#6effc0]/40">
              <Search className="w-3.5 h-3.5 text-[#3b4a41] group-focus-within:text-[#6effc0] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search validations..."
                className="bg-transparent text-[#bacbbf] placeholder-[#3b4a41] text-xs font-mono outline-none w-full"
              />
              <span className="text-[#3b4a41] text-[9px] font-mono ml-auto">⌘K</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
           

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

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-sm hover:bg-[#1c2024] transition-colors"
              >
                <div className="w-6 h-6 bg-[#00e5a0] rounded-sm flex items-center justify-center text-[#003824] font-headline font-black text-xs">
                  {initial}
                </div>
                <span className="hidden sm:block font-label text-[11px] uppercase tracking-[0.08em] text-[#bacbbf] max-w-[120px] truncate">
                  {displayEmail}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#3b4a41] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-52 border border-[#3b4a41]/40 rounded-sm shadow-xl z-50 py-1"
                  style={{ backgroundColor: '#0a0f13' }}
                >
                  <div className="px-3 py-2 border-b border-[#3b4a41]/30 mb-1">
                    <p className="font-mono text-[11px] text-[#6effc0] truncate">{displayEmail}</p>
                    <p className="font-label uppercase tracking-[0.1em] text-[9px] text-[#3b4a41] mt-0.5">Session Active</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="font-label uppercase tracking-[0.1em] text-[10px]">Profile</span>
                  </Link>
                  <Link
                    to="/billing"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="font-label uppercase tracking-[0.1em] text-[10px]">Billing</span>
                  </Link>
                  <div className="border-t border-[#3b4a41]/30 mt-1 pt-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-[#ff4c4c]/70 hover:text-[#ff4c4c] hover:bg-[#1c2024] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="font-label uppercase tracking-[0.1em] text-[10px]">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ── Public top bar ─────────────────────────────────────────────────────────
  return (
    <header
      className="sticky top-0 z-50 border-b border-[#3b4a41]/20"
      style={{ backgroundColor: 'rgba(8,12,16,0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00e5a0] flex items-center justify-center rounded-sm">
              <Zap className="w-4 h-4 text-[#003824]" strokeWidth={2.5} />
            </div>
            <span className="text-[#6effc0] font-headline font-black tracking-tighter text-lg">Scrubi</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-8">
            {[['API Docs', '/api-docs'], ['Pricing', '/pricing'], ['About', '/about'], ['Changelog', '/changelog']].map(([label, path]) => (
              <Link
                key={path}
                to={path}
                className="font-label uppercase tracking-[0.1em] text-[11px] text-[#bacbbf] hover:text-[#6effc0] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className="hidden sm:block p-1.5 rounded-sm text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/login"
              className="hidden sm:block font-label uppercase tracking-[0.1em] text-[11px] text-[#bacbbf] hover:text-[#6effc0] transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="font-label uppercase tracking-[0.1em] text-[11px] bg-[#6effc0] text-[#003824] font-bold px-4 py-1.5 rounded-sm hover:bg-[#47ffb8] transition-colors"
            >
              Get Started
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#bacbbf] hover:text-[#6effc0]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#3b4a41]/30 py-3 space-y-1">
            {[['API Docs', '/api-docs'], ['Pricing', '/pricing'], ['About', '/about'], ['Sign In', '/login']].map(([label, path]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex px-3 py-2 font-label uppercase tracking-[0.1em] text-[11px] text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] rounded-sm transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
