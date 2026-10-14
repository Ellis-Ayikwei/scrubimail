import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Ban,
    CircleCheck,
    CreditCard,
    KeyRound,
    MailCheck,
    MoreHorizontal,
    Package,
    RefreshCw,
    Send,
    ShieldCheck,
    TriangleAlert,
    User,
    UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { ErrorState, StatusBadge, useConfirm } from '@/components/admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiError } from '@/lib/api';
import { displayName, initialsOf } from '@/lib/format';
import UserOverviewTab from './UserOverviewTab';
import UserCreditsTab from './UserCreditsTab';
import UserPlanTab from './UserPlanTab';
import UserValidationsTab from './UserValidationsTab';
import UserApiKeysTab from './UserApiKeysTab';
import UserSecurityTab from './UserSecurityTab';
import UserPermissionsTab from './UserPermissionsTab';
import UserActionsTab from './UserActionsTab';
import { useCurrentAdminId, type AdminUser, type AdminUserSummary } from './types';

export type { AdminUser } from './types';

const TABS = [
    { id: 'overview', label: 'Overview', Icon: User },
    { id: 'credits', label: 'Credits', Icon: CreditCard },
    { id: 'plan', label: 'Plan', Icon: Package },
    { id: 'validations', label: 'Validations', Icon: MailCheck },
    { id: 'api-keys', label: 'API keys', Icon: KeyRound },
    { id: 'security', label: 'Security', Icon: ShieldCheck },
    { id: 'permissions', label: 'Permissions', Icon: UserCog },
    { id: 'account', label: 'Account', Icon: TriangleAlert },
] as const;

type TabId = (typeof TABS)[number]['id'];

const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const confirm = useConfirm();
    const currentAdminId = useCurrentAdminId();

    const [user, setUser] = useState<AdminUser | null>(null);
    const [summary, setSummary] = useState<AdminUserSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tabParam = searchParams.get('tab') as TabId | null;
    const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'overview';
    const setTab = (tab: string) =>
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tab === 'overview') next.delete('tab');
            else next.set('tab', tab);
            return next;
        }, { replace: true });

    const fetchUser = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        const [userRes, summaryRes] = await Promise.allSettled([
            axiosInstance.get<AdminUser>(`/admin/users/${id}/`),
            axiosInstance.get<AdminUserSummary>(`/admin/users/${id}/summary/`),
        ]);
        if (userRes.status === 'fulfilled') setUser(userRes.value.data);
        else setError(apiError(userRes.reason, 'Failed to load user'));
        setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value.data : null);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        void fetchUser();
    }, [fetchUser]);

    if (error && !user) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" render={<Link to="/admin/manage/users" />}>
                    <ArrowLeft />
                    All users
                </Button>
                <ErrorState title="Couldn't load this user" description={error} onRetry={() => void fetchUser()} />
            </div>
        );
    }

    const isSelf = Boolean(user && currentAdminId && user.id === currentAdminId);
    const name = user ? displayName(user) : '';

    const toggleActive = () => {
        if (!user) return;
        const suspending = user.is_active;
        confirm.ask({
            title: suspending ? `Suspend ${name}?` : `Reactivate ${name}?`,
            description: suspending
                ? 'They are signed out of the app and their API keys stop working immediately. Nothing is deleted.'
                : 'They can sign in and use their API keys again.',
            confirmLabel: suspending ? 'Suspend' : 'Reactivate',
            destructive: suspending,
            onConfirm: async () => {
                try {
                    await axiosInstance.patch(`/admin/users/${user.id}/`, { is_active: !user.is_active });
                    toast.success(suspending ? 'User suspended' : 'User reactivated');
                    void fetchUser();
                } catch (e) {
                    toast.error(apiError(e, 'Could not update the account'));
                    throw e;
                }
            },
        });
    };

    const sendReset = async () => {
        if (!user) return;
        try {
            const res = await axiosInstance.post(`/admin/users/${user.id}/reset-password/`);
            if (res.data?.email_sent) toast.success(`Reset link emailed to ${user.email}`);
            else toast.warning('Email failed to send — copy the link from the Security tab instead.');
        } catch (e) {
            toast.error(apiError(e, 'Could not send the reset link'));
        }
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/admin/manage/users')}>
                <ArrowLeft />
                All users
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    {user ? (
                        <Avatar className="size-14">
                            {user.profile_picture && <AvatarImage src={user.profile_picture} alt="" />}
                            <AvatarFallback className="text-base">{initialsOf(name)}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <Skeleton className="size-14 rounded-full" />
                    )}
                    <div className="min-w-0 space-y-1">
                        {user ? (
                            <>
                                <h1 className="truncate text-2xl font-semibold tracking-tight">
                                    {name}
                                    {isSelf && <span className="text-muted-foreground ml-2 text-base font-normal">(you)</span>}
                                </h1>
                                <p className="text-muted-foreground truncate text-sm">{user.email}</p>
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <StatusBadge status={user.is_active ? 'active' : 'suspended'} />
                                    {user.is_superuser && <Badge variant="destructive">Superuser</Badge>}
                                    {user.is_staff && !user.is_superuser && <Badge variant="secondary">Staff</Badge>}
                                    {user.billing?.current_plan && (
                                        <Badge variant="outline">{user.billing.current_plan.name}</Badge>
                                    )}
                                    {summary?.security.two_factor_enabled && <Badge variant="outline">2FA</Badge>}
                                </div>
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-7 w-48" />
                                <Skeleton className="h-4 w-56" />
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => void fetchUser()} disabled={loading} aria-label="Refresh">
                        <RefreshCw className={loading ? 'animate-spin' : undefined} />
                    </Button>
                    {user && (
                        <>
                            <Button variant={user.is_active ? 'outline' : 'default'} onClick={toggleActive} disabled={isSelf}>
                                {user.is_active ? <Ban /> : <CircleCheck />}
                                {user.is_active ? 'Suspend' : 'Reactivate'}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="More actions" />}>
                                    <MoreHorizontal />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem onClick={() => void sendReset()}>
                                        <Send />
                                        Email password reset
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTab('credits')}>
                                        <CreditCard />
                                        Adjust credits
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTab('plan')}>
                                        <Package />
                                        Change plan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTab('api-keys')}>
                                        <KeyRound />
                                        Manage API keys
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setTab('account')}
                                    >
                                        <TriangleAlert />
                                        Delete account…
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setTab(String(v))}>
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                    <TabsList>
                        {TABS.map(({ id: tid, label, Icon }) => (
                            <TabsTrigger key={tid} value={tid}>
                                <Icon />
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {!user ? (
                    <div className="grid gap-4 pt-2 lg:grid-cols-3">
                        <Skeleton className="h-64 lg:col-span-2" />
                        <Skeleton className="h-64" />
                    </div>
                ) : (
                    <div className="pt-2">
                        <TabsContent value="overview">
                            <UserOverviewTab user={user} summary={summary} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="credits">
                            <UserCreditsTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="plan">
                            <UserPlanTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="validations">
                            <UserValidationsTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="api-keys">
                            <UserApiKeysTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="security">
                            <UserSecurityTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="permissions">
                            <UserPermissionsTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                        <TabsContent value="account">
                            <UserActionsTab user={user} onChanged={fetchUser} />
                        </TabsContent>
                    </div>
                )}
            </Tabs>

            {confirm.dialog}
        </div>
    );
};

export default UserDetailPage;
