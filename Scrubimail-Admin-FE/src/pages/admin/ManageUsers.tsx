import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Ban,
    CircleCheck,
    Download,
    ExternalLink,
    MoreHorizontal,
    RefreshCw,
    Send,
    UserPlus,
    UserRoundCheck,
    UserRoundX,
    Users,
    UserPlus2 as UserNew,
} from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import {
    DataTable,
    type DataTableColumn,
    PageHeader,
    StatCard,
    StatCardGrid,
    StatusBadge,
    useConfirm,
} from '@/components/admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiError, asList, downloadCsv } from '@/lib/api';
import { displayName, formatDate, formatNumber, formatRelative, initialsOf } from '@/lib/format';
import { useCurrentAdminId, type AdminUser } from './users/types';

interface UserStats {
    total: number;
    active: number;
    new: number;
    suspended: number;
}

const STATUS_ITEMS: Record<string, string> = { all: 'All statuses', active: 'Active', suspended: 'Suspended' };
const ROLE_ITEMS: Record<string, string> = { all: 'All roles', staff: 'Staff', superuser: 'Superusers', customer: 'Customers' };

// send_invite only applies when a password is given; without one the invite is always sent.
const EMPTY_FORM = { email: '', first_name: '', last_name: '', password: '', is_staff: false, send_invite: false };

const ManageUsers: React.FC = () => {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const currentAdminId = useCurrentAdminId();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('all');
    const [role, setRole] = useState('all');

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        const [usersRes, statsRes] = await Promise.allSettled([
            axiosInstance.get('/admin/users/'),
            axiosInstance.get('/admin/users/stats/'),
        ]);
        if (usersRes.status === 'fulfilled') setUsers(asList<AdminUser>(usersRes.value.data));
        else setError(apiError(usersRes.reason, 'Could not load users'));
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        setLoading(false);
    }, []);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    const filtered = useMemo(
        () =>
            users.filter((u) => {
                if (status === 'active' && !u.is_active) return false;
                if (status === 'suspended' && u.is_active) return false;
                if (role === 'staff' && !u.is_staff) return false;
                if (role === 'superuser' && !u.is_superuser) return false;
                if (role === 'customer' && (u.is_staff || u.is_superuser)) return false;
                return true;
            }),
        [users, status, role]
    );

    const patchUser = (u: AdminUser, changes: Partial<AdminUser>) =>
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...changes } : x)));

    const toggleActive = (u: AdminUser) => {
        const suspending = u.is_active;
        confirm.ask({
            title: suspending ? `Suspend ${u.email}?` : `Reactivate ${u.email}?`,
            description: suspending
                ? 'Sign-in and API access stop immediately. Nothing is deleted.'
                : 'Sign-in and API access are restored.',
            confirmLabel: suspending ? 'Suspend' : 'Reactivate',
            destructive: suspending,
            onConfirm: async () => {
                try {
                    await axiosInstance.patch(`/admin/users/${u.id}/`, { is_active: !u.is_active });
                    patchUser(u, { is_active: !u.is_active });
                    toast.success(suspending ? 'User suspended' : 'User reactivated');
                } catch (e) {
                    toast.error(apiError(e, 'Could not update the user'));
                    throw e;
                }
            },
        });
    };

    const sendReset = async (u: AdminUser) => {
        try {
            const res = await axiosInstance.post(`/admin/users/${u.id}/reset-password/`);
            if (res.data?.email_sent) toast.success(`Reset link emailed to ${u.email}`);
            else toast.warning("Email failed to send — open the user's Security tab to copy the link.");
        } catch (e) {
            toast.error(apiError(e, 'Could not send the reset link'));
        }
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const invite = !form.password || form.send_invite;
        setCreating(true);
        try {
            const res = await axiosInstance.post('/admin/users/create/', {
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                is_staff: form.is_staff,
                password: form.password || undefined,
                send_reset_link: invite,
            });
            const created = res.data as AdminUser & { reset_link_sent?: boolean };
            toast.success(
                invite
                    ? created.reset_link_sent
                        ? `Created ${created.email} and emailed a set-password link`
                        : `Created ${created.email}, but the invite email failed — send a reset link from their page`
                    : `Created ${created.email}`
            );
            setCreateOpen(false);
            setForm(EMPTY_FORM);
            navigate(`/admin/users/${created.id}`);
        } catch (err) {
            toast.error(apiError(err, 'Could not create the user'));
        } finally {
            setCreating(false);
        }
    };

    const exportCsv = () =>
        downloadCsv(
            `users-${new Date().toISOString().slice(0, 10)}.csv`,
            ['email', 'first_name', 'last_name', 'status', 'staff', 'superuser', 'plan', 'credits', 'joined', 'last_login'],
            filtered.map((u) => [
                u.email,
                u.first_name ?? '',
                u.last_name ?? '',
                u.is_active ? 'active' : 'suspended',
                u.is_staff,
                u.is_superuser,
                u.billing?.current_plan?.name ?? '',
                u.billing?.credits_remaining ?? '',
                u.date_joined,
                u.last_login ?? '',
            ])
        );

    const columns = useMemo<DataTableColumn<AdminUser>[]>(
        () => [
            {
                id: 'user',
                header: 'User',
                sortValue: (u) => displayName(u).toLowerCase(),
                cell: (u) => {
                    const name = displayName(u);
                    return (
                        <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="size-8">
                                {u.profile_picture && <AvatarImage src={u.profile_picture} alt="" />}
                                <AvatarFallback className="text-xs">{initialsOf(name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {name}
                                    {u.id === currentAdminId && <span className="text-muted-foreground font-normal"> (you)</span>}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                header: 'Status',
                sortValue: (u) => (u.is_active ? 1 : 0),
                cell: (u) => <StatusBadge status={u.is_active ? 'active' : 'suspended'} />,
            },
            {
                id: 'role',
                header: 'Role',
                sortValue: (u) => (u.is_superuser ? 2 : u.is_staff ? 1 : 0),
                cell: (u) =>
                    u.is_superuser ? (
                        <Badge variant="destructive">Superuser</Badge>
                    ) : u.is_staff ? (
                        <Badge variant="secondary">Staff</Badge>
                    ) : (
                        <span className="text-muted-foreground">Customer</span>
                    ),
            },
            {
                id: 'plan',
                header: 'Plan',
                sortValue: (u) => u.billing?.current_plan?.name ?? '',
                cell: (u) => u.billing?.current_plan?.name ?? <span className="text-muted-foreground">—</span>,
            },
            {
                id: 'credits',
                header: 'Credits',
                sortValue: (u) => u.billing?.credits_remaining ?? -1,
                className: 'tabular-nums',
                cell: (u) => (u.billing ? formatNumber(u.billing.credits_remaining ?? 0) : '—'),
            },
            {
                id: 'last_login',
                header: 'Last sign-in',
                sortValue: (u) => u.last_login ?? '',
                cell: (u) => <span className="text-muted-foreground whitespace-nowrap">{formatRelative(u.last_login)}</span>,
            },
            {
                id: 'joined',
                header: 'Joined',
                sortValue: (u) => u.date_joined,
                cell: (u) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(u.date_joined)}</span>,
            },
            {
                id: 'actions',
                header: <span className="sr-only">Actions</span>,
                className: 'text-right',
                cell: (u) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="User actions" />}>
                                <MoreHorizontal />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                                    <ExternalLink />
                                    Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}?tab=credits`)}>
                                    Adjust credits
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void sendReset(u)}>
                                    <Send />
                                    Email password reset
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant={u.is_active ? 'destructive' : 'default'}
                                    disabled={u.id === currentAdminId}
                                    onClick={() => toggleActive(u)}
                                >
                                    {u.is_active ? <Ban /> : <CircleCheck />}
                                    {u.is_active ? 'Suspend' : 'Reactivate'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentAdminId]
    );

    const staffCount = users.filter((u) => u.is_staff || u.is_superuser).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users"
                description="Every account on ScrubiMail. Open a user to manage their credits, plan, keys, security and access."
                actions={
                    <>
                        <Button variant="outline" size="icon" onClick={() => void fetchAll()} disabled={loading} aria-label="Refresh">
                            <RefreshCw className={loading ? 'animate-spin' : undefined} />
                        </Button>
                        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
                            <Download />
                            Export
                        </Button>
                        <Button onClick={() => setCreateOpen(true)}>
                            <UserPlus />
                            New user
                        </Button>
                    </>
                }
            />

            <StatCardGrid>
                <StatCard label="Total users" icon={Users} loading={loading && !stats} value={formatNumber(stats?.total ?? users.length)} />
                <StatCard
                    label="Active"
                    icon={UserRoundCheck}
                    loading={loading && !stats}
                    value={formatNumber(stats?.active ?? users.filter((u) => u.is_active).length)}
                />
                <StatCard
                    label="Suspended"
                    icon={UserRoundX}
                    loading={loading && !stats}
                    value={formatNumber(stats?.suspended ?? users.filter((u) => !u.is_active).length)}
                />
                <StatCard
                    label="New (30 days)"
                    icon={UserNew}
                    loading={loading && !stats}
                    value={formatNumber(stats?.new ?? 0)}
                    hint={`${staffCount} staff accounts`}
                />
            </StatCardGrid>

            <DataTable
                data={filtered}
                columns={columns}
                rowKey={(u) => u.id}
                loading={loading && users.length === 0}
                error={error}
                onRetry={() => void fetchAll()}
                onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
                searchFilter={(u, q) =>
                    u.email.toLowerCase().includes(q) ||
                    displayName(u).toLowerCase().includes(q) ||
                    (u.phone_number ?? '').includes(q) ||
                    u.id.startsWith(q)
                }
                searchPlaceholder="Search name, email, phone or ID…"
                emptyTitle="No users"
                emptyDescription="No accounts match these filters."
                toolbar={
                    <>
                        <Select items={STATUS_ITEMS} value={status} onValueChange={(v) => setStatus(String(v))}>
                            <SelectTrigger className="w-35">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select items={ROLE_ITEMS} value={role} onValueChange={(v) => setRole(String(v))}>
                            <SelectTrigger className="w-35">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(ROLE_ITEMS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                }
            />

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={createUser} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>New user</DialogTitle>
                            <DialogDescription>
                                They get the free plan and a billing profile automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="new-email">Email</FieldLabel>
                                <Input
                                    id="new-email"
                                    type="email"
                                    required
                                    autoComplete="off"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="new-first">First name</FieldLabel>
                                    <Input
                                        id="new-first"
                                        value={form.first_name}
                                        onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="new-last">Last name</FieldLabel>
                                    <Input
                                        id="new-last"
                                        value={form.last_name}
                                        onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                                    />
                                </Field>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="new-password">Password (optional)</FieldLabel>
                                <Input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                />
                                <FieldDescription>
                                    Leave empty to email them a link to choose their own (recommended).
                                </FieldDescription>
                            </Field>
                            <label className="flex items-center justify-between gap-4 text-sm">
                                Email a set-password link
                                <Switch
                                    checked={!form.password || form.send_invite}
                                    disabled={!form.password}
                                    onCheckedChange={(v) => setForm((f) => ({ ...f, send_invite: v }))}
                                />
                            </label>
                            <label className="flex items-center justify-between gap-4 text-sm">
                                <span>
                                    Staff access
                                    <span className="text-muted-foreground block">Can sign in to this admin panel.</span>
                                </span>
                                <Switch
                                    checked={form.is_staff}
                                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_staff: v }))}
                                />
                            </label>
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating || !form.email.trim()}>
                                {creating ? 'Creating…' : 'Create user'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {confirm.dialog}
        </div>
    );
};

export default ManageUsers;
