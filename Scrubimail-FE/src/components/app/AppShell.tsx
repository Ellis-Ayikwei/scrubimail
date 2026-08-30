import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import {
  LayoutDashboard,
  CheckCircle2,
  FileUp,
  History,
  BarChart3,
  KeyRound,
  CreditCard,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronDown,
  Menu as MenuIcon,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { toggleTheme } from '@/store/themeConfigSlice';
import { IRootState, AppDispatch } from '@/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Validate', to: '/validate', icon: CheckCircle2 },
  { label: 'Bulk Upload', to: '/bulk-upload', icon: FileUp },
  { label: 'History', to: '/history', icon: History },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'API Keys', to: '/apikeys', icon: KeyRound },
  { label: 'Billing', to: '/billing', icon: CreditCard },
];

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title = 'Dashboard' }: AppShellProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const authUser = useAuthUser() as any;
  const user = authUser?.user ?? authUser;
  const name =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Account';
  const email: string | undefined = user?.email;
  const initials = String(name).slice(0, 2).toUpperCase();

  const dispatch = useDispatch<AppDispatch>();
  // Same source of truth as the rest of the app (drives Mantine + the .dark class).
  const isDark = useSelector((s: IRootState) => s.themeConfig.theme) !== 'light';
  const handleToggleTheme = () => dispatch(toggleTheme(isDark ? 'light' : 'dark'));

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const Sidebar = (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-14 items-center gap-2 px-5">
        <img src="/assets/images/scrubi.png" alt="Scrubimail" className="h-7 w-7 rounded-md" />
        <span className="font-semibold tracking-tight">Scrubimail</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <Link
          to="/billing"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Zap className="size-4" />
          Upgrade plan
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {Sidebar}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <MenuIcon />
          </Button>
          <h1 className="text-sm font-semibold">{title}</h1>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleToggleTheme} aria-label="Toggle theme">
              {isDark ? <Sun /> : <Moon />}
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 pl-1.5"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-40 mt-1 w-52 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                    <div className="px-2 py-1.5">
                      <p className="truncate text-sm font-medium">{name}</p>
                      {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
                    </div>
                    <Separator className="my-1" />
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <User className="size-4" />
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Not <main> on purpose: the legacy stylesheet force-shrinks all text
            inside <main>, which would fight the new type scale. */}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;
