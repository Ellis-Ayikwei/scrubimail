import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { LogOut } from 'lucide-react';

import { NAV_SECTIONS } from '@/config/nav';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';

/**
 * Matches the way NavLink resolves `active`, but computed here so the state can
 * be handed to SidebarMenuButton rather than to the link's own className.
 */
const isPathActive = (pathname: string, path: string, end?: boolean) =>
    end ? pathname === path : pathname === path || pathname.startsWith(path + '/');

export function AdminSidebar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const signOut = useSignOut();

    const handleLogout = () => {
        signOut();
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login', { replace: true });
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip="ScrubiMail Admin"
                            render={<NavLink to="/admin/dashboard" />}
                        >
                            <img
                                src="/assets/images/scrubi mail icon.png"
                                alt=""
                                className="size-7 shrink-0 rounded-md object-contain"
                            />
                            <div className="grid flex-1 text-left leading-tight">
                                <span className="truncate font-semibold">ScrubiMail</span>
                                <span className="text-muted-foreground truncate text-xs">Admin</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {NAV_SECTIONS.map((section) => (
                    <SidebarGroup key={section.title}>
                        <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            isActive={isPathActive(pathname, item.path, item.end)}
                                            tooltip={item.label}
                                            render={<NavLink to={item.path} end={item.end} />}
                                        >
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Sign out">
                            <LogOut />
                            <span>Sign out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
