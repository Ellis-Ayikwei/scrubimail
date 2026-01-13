import React, { useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, IRootState } from '../store';
import { toggleSidebar } from '../store/themeConfigSlice';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Key,
  CreditCard,
  ShieldCheck,
  Activity,
  TicketPercent,
  Receipt,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const isAuthenticated = useIsAuthenticated();
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);

  const navItems: NavItem[] = useMemo(
    () => [
      { path: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
      { path: '/admin/analytics', label: 'Analytics', icon: <Activity className="w-5 h-5" /> },
      { path: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
      { path: '/admin/manage/api-keys', label: 'API Keys', icon: <Key className="w-5 h-5" /> },
      { path: '/admin/manage/validations', label: 'Validations', icon: <ShieldCheck className="w-5 h-5" /> },
      { path: '/admin/billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
      { path: '/admin/invoices', label: 'Invoices', icon: <Receipt className="w-5 h-5" /> },
      { path: '/admin/products', label: 'Products', icon: <Package className="w-5 h-5" /> },
      { path: '/admin/manage/payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
      { path: '/admin/promocodes', label: 'Promo Codes', icon: <TicketPercent className="w-5 h-5" /> },
      { path: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ],
    []
  );

  useEffect(() => {
    if (window.innerWidth < 1024 && themeConfig.sidebar) {
      dispatch(toggleSidebar());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    signOut();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={semidark ? 'dark' : ''}>
      <nav
        className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[220px] z-50 transition-all duration-300 ${
          themeConfig.sidebar ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-[220px] rtl:-right-[220px]'
        }`}
      >
        <div className="h-full bg-[#0b0b0f] text-white border-r border-white/10">
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
            <NavLink to="/admin/dashboard" className="flex items-center gap-2">
              <img
                className="h-9 w-auto"
                src="/assets/images/scrubi mail icon.png"
                alt="Scrubimail"
              />
              <span className="font-semibold tracking-wide">Admin</span>
            </NavLink>
          </div>

          <div className="px-2 py-3">
            <div className="text-xs uppercase tracking-wider text-white/50 px-2 mb-2">
              Navigation
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/5 hover:text-white',
                      ].join(' ')
                    }
                  >
                    <span className="text-white">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
