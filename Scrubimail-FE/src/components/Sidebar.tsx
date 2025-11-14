import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { AppDispatch, IRootState } from '../store';
import { toggleSidebar } from '../store/themeConfigSlice';
import { 
  BarChart3, 
  CheckCircle, 
  History, 
  FileText,
  ChevronDown,
  LogOut,
  Activity,
  ArrowRight,
  Key,
  Code,
  CreditCard
} from 'lucide-react';
import IconCaretsDown from './Icon/IconCaretsDown';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { LogoutUser } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { billingService, BillingProfile, UsageStats } from '../services/billingService';

const Sidebar = () => {
  const [currentMenu, setCurrentMenu] = useState<string>('');
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
  const location = useLocation();
  const signOut = useSignOut();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(true);

  const toggleMenu = (value: string) => {
    setCurrentMenu((oldValue) => {
      return oldValue === value ? '' : value;
    });
  };

  useEffect(() => {
    const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
    if (selector) {
      selector.classList.add('active');
      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
        if (ele.length) {
          ele = ele[0];
          setTimeout(() => {
            ele.click();
          });
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const logoutResponse = await dispatch(LogoutUser({ signOut }) as any);
      
      if (logoutResponse.meta?.requestStatus === 'fulfilled' || logoutResponse.type?.endsWith('/fulfilled')) {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login', { replace: true });
      } else {
        signOut();
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      signOut();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth < 1024 && themeConfig.sidebar) {
      dispatch(toggleSidebar());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Fetch billing and usage data
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUsageData = async () => {
        try {
          setLoadingUsage(true);
          const [billingData, usageData] = await Promise.all([
            billingService.getBillingProfile().catch(() => null),
            billingService.getUsageStats().catch(() => null)
          ]);
          if (billingData) setBillingProfile(billingData);
          if (usageData) setUsageStats(usageData);
        } catch (error) {
          console.error('Error fetching usage data:', error);
        } finally {
          setLoadingUsage(false);
        }
      };
      fetchUsageData();
    }
  }, [isAuthenticated]);

  // Navigation items from TopBar
  const navItems = [
    {
      name: 'dashboard',
      path: '/dashboard',
      icon: <BarChart3 className="!w-5 !h-5 !text-white" />,
      label: 'Dashboard',
      children: null,
    },
    {
      name: 'api-usage',
      path: '/analytics',
      icon: <Activity className="!w-5 !h-5 !text-white" />,
      label: 'API Usage',
      children: null,
    },
    {
      name: 'validate',
      path: '/validate',
      icon: <CheckCircle className="!w-5 !h-5 !text-white" />,
      label: 'Validate',
      children: null,
    },
    {
      name: 'history',
      path: '/history',
      icon: <History className="!w-5 !h-5 !text-white" />,
      label: 'History',
      children: null,
    },
    {
      name: 'api-keys',
      path: '/apikeys',
      icon: <Key className="!w-5 !h-5 !text-white" />,
      label: 'API Keys',
      children: null,
    },
    {
      name: 'integrations',
      path: '/integrations',
      icon: <Code className="!w-5 !h-5 !text-white" />,
      label: 'Integrations',
      children: null,
    },
    {
      name: 'billing',
      path: '/billing',
      icon: <CreditCard className="!w-5 !h-5 !text-white" />,
      label: 'Billing',
      children: null,
    },
    {
      name: 'api-docs',
      path: '/api-docs',
      icon: <FileText className="!w-5 !h-5 !text-white" />,
      label: 'API Docs',
      children: null,
    },
  ];

  // Render a menu item with potential children
  const renderMenuItem = (item: any) => {
    if (!item.children) {
      return (
        <li key={item.path} className="menu nav-item border-primary-dark dark:border-primary-dark last:border-b-0">
          <NavLink 
            to={item.path} 
            className={`group hover:bg-[#2ED8A3]/10 dark:hover:bg-[#2ED8A3]/20 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-[#2ED8A3]/10 text-[#2ED8A3]'
                : 'text-white dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between w-full py-1.5 px-2">
              <div className="flex items-center">
                {item.icon}
                <span className="ltr:pl-2 rtl:pr-2 text-sm text-white dark:text-white">{item.label}</span>
              </div>
            </div>
          </NavLink>
        </li>
      );
    }

    return (
      <li key={item.name} className="menu nav-item border-primary-dark dark:border-primary-dark last:border-b-0">
        <button
          type="button"
          className={`nav-link group w-full hover:bg-[#2ED8A3]/10 dark:hover:bg-[#2ED8A3]/20 rounded-lg transition-colors ${
            currentMenu === item.name ? 'active' : ''
          }`}
          onClick={() => toggleMenu(item.name)}
        >
          <div className="flex items-center justify-between w-full py-1.5 px-2">
            <div className="flex items-center">
              {item.icon}
              <span className="ltr:pl-2 rtl:pr-2 text-sm text-white dark:text-white">{item.label}</span>
            </div>
            <div className={`rtl:rotate-180 ${currentMenu === item.name ? 'rotate-90' : ''}`}>
              <IconCaretsDown className="!w-4 !h-4 !text-white" />
            </div>
          </div>
        </button>

        {currentMenu === item.name && (
          <ul className="sub-menu">
            {item.children.map((child: any) => (
              <li key={child.path} className="border-b border-primary-dark dark:border-primary-dark last:border-b-0 py-1">
                <NavLink to={child.path} className="group hover:bg-[#2ED8A3]/10 dark:hover:bg-[#2ED8A3]/20 rounded-lg transition-colors">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center">
                      {child.icon}
                      <span className="ltr:pl-2 rtl:pr-2 text-sm text-white dark:text-white">{child.label}</span>
                    </div>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Don't show sidebar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={semidark ? 'dark' : ''}>
      <nav
        className={`sidebar fixed min-h-screen h-full !rounded-r-xl top-0 bottom-0 w-[220px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${
          semidark ? 'text-white-dark' : ''
        } ${themeConfig.sidebar ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-[220px] rtl:-right-[220px]'}`}
      >
        <div className="bg-gradient-to-b from-[#004E8A] to-[#2ED8A3] dark:from-[#004E8A] dark:to-[#2ED8A3] h-full">
          <div className="flex justify-between items-center px-3 py-2.5 border-b border-white/20">
            <NavLink to="/dashboard" className="main-logo flex items-center shrink-0">
              <img 
                className="h-10 w-auto ml-[5px] flex-none brightness-0 invert" 
                src="/assets/images/scrubi mail icon.png" 
                alt="Scrubimail Logo" 
              />
            </NavLink>

            <button
              type="button"
              className="collapse-icon w-7 h-7 rounded-full flex items-center hover:bg-white/20 dark:hover:bg-white/20 dark:text-white-light transition duration-300 rtl:rotate-180"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconCaretsDown className="m-auto rotate-90 w-4 h-4 text-white" />
            </button>
          </div>

          <PerfectScrollbar className="h-[calc(100vh-280px)] relative">
            <ul className="relative font-medium space-y-0.5 p-3 py-2">
              <li className="nav-item">
                <ul>{navItems.map((item) => renderMenuItem(item))}</ul>
              </li>
            </ul>
          </PerfectScrollbar>

          {/* API Usage Gradient Box */}
          <div className="absolute bottom-[60px] left-0 right-0 px-3 pb-3">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <h3 className="text-sm font-semibold text-white mb-2">API Usage</h3>
              
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/80">This month</span>
                  <span className="text-xs font-medium text-white">
                    {usageStats?.this_month?.validations?.toLocaleString() || '0'} validations
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mb-1">
                  <div 
                    className="bg-white h-1.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ 
                      width: billingProfile ? `${Math.min(((billingProfile.credits_used_this_month || 0) / ((billingProfile.credits_remaining || 0) + (billingProfile.credits_used_this_month || 0) || 1)) * 100, 100)}%` : '0%' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>0</span>
                  <span>{billingProfile ? ((billingProfile.credits_remaining || 0) + (billingProfile.credits_used_this_month || 0)).toLocaleString() : '100'}</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-md p-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/90">Credits Remaining</span>
                  <span className="text-sm font-bold text-white">
                    {billingProfile?.credits_remaining?.toLocaleString() || '100'}
                  </span>
                </div>
              </div>

              <Link
                to="/billing"
                className="flex items-center justify-center text-xs font-medium text-white hover:text-white/80 transition-colors"
              >
                Manage billing
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>

          <div className="absolute bottom-0 w-full p-3 border-t border-white/20 dark:border-white/20 bg-transparent">
            <button
              onClick={() => handleLogout()}
              className="flex items-center w-full px-2 py-2 text-white hover:bg-white/20 dark:hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 !text-white" />
              <span className="ml-2 text-sm font-medium">{loggingOut ? 'Logging Out....' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;

