import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { AppDispatch, IRootState } from '../store';
import { toggleSidebar } from '../store/themeConfigSlice';
import Logo from './Logo';
import {
  BarChart3,
  CheckCircle,
  History,
  FileText,
  LogOut,
  Activity,
  Key,
  Code,
  CreditCard,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { LogoutUser } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { billingService, BillingProfile, UsageStats } from '../services/billingService';

const NAV_ITEMS = [
  { name: 'dashboard',    path: '/dashboard',    icon: BarChart3,    label: 'Dashboard' },
  { name: 'api-usage',    path: '/analytics',    icon: Activity,     label: 'API Usage' },
  { name: 'validate',     path: '/validate',     icon: CheckCircle,  label: 'Validate' },
  { name: 'history',      path: '/history',      icon: History,      label: 'History' },
  { name: 'api-keys',     path: '/apikeys',      icon: Key,          label: 'API Keys' },
  { name: 'integrations', path: '/integrations', icon: Code,         label: 'Integrations' },
  { name: 'billing',      path: '/billing',      icon: CreditCard,   label: 'Billing' },
  { name: 'api-docs',     path: '/api-docs',     icon: FileText,     label: 'API Docs' },
];

const Sidebar = () => {
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const location = useLocation();
  const signOut = useSignOut();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await dispatch(LogoutUser({ signOut }) as any);
      if (res.meta?.requestStatus === 'fulfilled' || res.type?.endsWith('/fulfilled')) {
        localStorage.clear();
        sessionStorage.clear();
      } else {
        signOut();
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {
      signOut();
    } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    if (window.innerWidth < 1024 && themeConfig.sidebar) dispatch(toggleSidebar());
  }, [location]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      billingService.getBillingProfile().catch(() => null),
      billingService.getUsageStats().catch(() => null),
    ]).then(([b, u]) => {
      if (b) setBillingProfile(b);
      if (u) setUsageStats(u);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const creditsUsed = billingProfile?.credits_used_this_month ?? 0;
  const creditsTotal = (billingProfile?.credits_remaining ?? 0) + creditsUsed;
  const usedPct = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0;

  return (
    <nav
      className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[220px] z-50 transition-all duration-300 flex flex-col border-r border-gray-200 bg-white shadow-sm dark:border-[#3b4a41]/30 dark:bg-[#080c10] dark:shadow-none
        ${themeConfig.sidebar ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-[220px] rtl:-right-[220px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-[#3b4a41]/30">
        <NavLink to="/dashboard" className="flex items-center" aria-label="ScrubiMail dashboard">
          <Logo tone="auto" className="h-7 w-auto" />
        </NavLink>
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-emerald-700 hover:bg-gray-100 dark:text-[#bacbbf] dark:hover:text-[#6effc0] dark:hover:bg-[#1c2024] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Version tag */}
      <div className="px-4 pt-2 pb-1">
        <span className="font-label uppercase tracking-[0.12em] text-[9px] text-gray-400 dark:text-[#3b4a41]">
          v2.4.0-stable
        </span>
      </div>

      {/* Nav items */}
      <PerfectScrollbar className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ name, path, icon: Icon, label }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <li key={name}>
                <NavLink
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all group
                    ${active
                      ? 'bg-emerald-50 text-emerald-800 border-r-2 border-emerald-600 dark:bg-[#181c20] dark:text-[#6effc0] dark:border-[#6effc0]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-700 dark:text-[#bacbbf] dark:hover:bg-[#181c20] dark:hover:text-[#6effc0]'
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-label uppercase tracking-[0.1em] text-[11px]">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </PerfectScrollbar>

      {/* Usage widget */}
      <div className="px-3 pb-2">
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-3 dark:bg-[#1c2024] dark:border-[#3b4a41]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-[#bacbbf]">
              API Health
            </span>
            <span className="text-[9px] font-mono text-emerald-600 dark:text-[#6effc0]">LIVE</span>
          </div>

          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="font-mono text-[10px] text-gray-700 dark:text-[#bacbbf]">
                {(billingProfile?.credits_remaining ?? 0).toLocaleString()}
                <span className="text-gray-400 dark:text-[#3b4a41]"> / {creditsTotal.toLocaleString()}</span>
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden dark:bg-[#31353a]">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700 dark:bg-[#6effc0]"
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="font-label uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-[#bacbbf]">
              Monthly
            </span>
            <span className="font-mono text-[10px] text-gray-900 dark:text-[#e0e3e8]">
              {billingProfile?.current_plan?.credits_per_month?.toLocaleString() ?? '0'}
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-sm px-2 py-1.5 mb-3 dark:bg-[#101418] dark:border-transparent">
            <div className="flex justify-between items-center">
              <span className="font-label uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-[#bacbbf]">
                Current Plan
              </span>
              <span className="font-label uppercase tracking-[0.08em] text-[9px] text-emerald-700 font-bold dark:text-[#6effc0]">
                {billingProfile?.current_plan?.name ?? 'Free'}
              </span>
            </div>
          </div>

          <Link
            to="/billing"
            className="flex items-center justify-center w-full py-1.5 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 font-label uppercase tracking-[0.1em] text-[9px] hover:bg-emerald-100 transition-colors dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0] dark:hover:bg-[#6effc0]/20"
          >
            Refill Credits
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-gray-200 dark:border-[#3b4a41]/30 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-sm transition-colors dark:text-[#bacbbf] dark:hover:text-[#ff4c4c] dark:hover:bg-[#1c2024]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="font-label uppercase tracking-[0.1em] text-[11px]">
            {loggingOut ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
