import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { LogOut, Moon, Sun, User } from 'lucide-react';

import { IRootState } from '@/store';
import { toggleTheme } from '@/store/themeConfigSlice';
import { NAV_LOOKUP } from '@/config/nav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Resolves the current path to `[section, page]` using the nav config, so page
 * titles are never duplicated between the sidebar and the header.
 */
function useBreadcrumb(): { section: string; label: string } {
    const { pathname } = useLocation();

    const exact = NAV_LOOKUP[pathname];
    if (exact) return exact;

    // Detail routes (/admin/manage/users/:id) inherit their parent's crumb.
    const parent = Object.keys(NAV_LOOKUP)
        .filter((p) => pathname.startsWith(p + '/'))
        .sort((a, b) => b.length - a.length)[0];

    return parent ? NAV_LOOKUP[parent] : { section: 'Admin', label: 'Overview' };
}

export function AdminHeader() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const signOut = useSignOut();
    const theme = useSelector((state: IRootState) => state.themeConfig.theme);
    const { section, label } = useBreadcrumb();

    const authUser = useAuthUser() as any;
    const user = authUser?.user ?? authUser;
    const name = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Admin';
    const initials = name.slice(0, 2).toUpperCase();

    const handleLogout = () => {
        signOut();
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login', { replace: true });
    };

    return (
        <header className="bg-background/80 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur">
            <div className="flex w-full items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 !h-4" />

                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink render={<Link to="/admin/dashboard" />}>{section}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{label}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="ml-auto flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => dispatch(toggleTheme(theme === 'dark' ? 'light' : 'dark'))}
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? <Sun /> : <Moon />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="ghost" size="sm" className="gap-2 px-2">
                                    <Avatar className="size-6">
                                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden max-w-[140px] truncate md:inline">{name}</span>
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="font-normal">
                                <div className="grid gap-0.5">
                                    <span className="truncate text-sm font-medium">{name}</span>
                                    {user?.email && (
                                        <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem render={<Link to="/admin/settings" />}>
                                <User />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                                <LogOut />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
