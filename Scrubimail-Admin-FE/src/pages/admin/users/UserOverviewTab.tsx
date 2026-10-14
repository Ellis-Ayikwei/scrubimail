import React, { useEffect, useState } from 'react';
import { Copy, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { StatCard, StatCardGrid } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { apiError } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import { OUTCOMES, type Outcome } from '@/lib/validation';
import {
    useCurrentAdminId,
    useCurrentAdminIsSuperuser,
    type AdminUser,
    type AdminUserSummary,
    type UserTabProps,
} from './types';

const USER_TYPES: Record<string, string> = { customer: 'Customer', admin: 'Admin' };

function profileForm(user: AdminUser) {
    return {
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email,
        phone_number: user.phone_number ?? '',
        user_type: user.user_type ?? 'customer',
    };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 text-sm">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="min-w-0 truncate text-right">{children}</span>
        </div>
    );
}

const UserOverviewTab: React.FC<UserTabProps & { summary: AdminUserSummary | null }> = ({ user, summary, onChanged }) => {
    const currentAdminId = useCurrentAdminId();
    const actorIsSuperuser = useCurrentAdminIsSuperuser();
    const isSelf = user.id === currentAdminId;

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(() => profileForm(user));
    const [roleSaving, setRoleSaving] = useState<string | null>(null);

    useEffect(() => {
        if (!editing) setForm(profileForm(user));
    }, [user, editing]);

    const set = (key: keyof ReturnType<typeof profileForm>) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axiosInstance.patch(`/admin/users/${user.id}/`, {
                ...form,
                email: form.email.trim(),
                phone_number: form.phone_number.trim() || null,
            });
            toast.success('Profile saved');
            setEditing(false);
            onChanged();
        } catch (err) {
            toast.error(apiError(err, 'Could not save the profile'));
        } finally {
            setSaving(false);
        }
    };

    const setRole = async (field: 'is_staff' | 'is_superuser', value: boolean) => {
        setRoleSaving(field);
        try {
            await axiosInstance.patch(`/admin/users/${user.id}/`, { [field]: value });
            toast.success(`${field === 'is_staff' ? 'Staff access' : 'Superuser'} ${value ? 'granted' : 'removed'}`);
            onChanged();
        } catch (err) {
            toast.error(apiError(err, 'Could not change the role'));
        } finally {
            setRoleSaving(null);
        }
    };

    const copyId = () => {
        void navigator.clipboard.writeText(user.id).then(() => toast.success('User ID copied'));
    };

    const billing = user.billing;
    const planCredits = billing?.current_plan?.credits_per_month ?? 0;
    const used = billing?.credits_used_this_month ?? 0;
    const outcomes = summary?.validations.by_outcome ?? {};
    const outcomeTotal = Object.values(outcomes).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            <StatCardGrid>
                <StatCard
                    label="Credits left"
                    value={formatNumber(billing?.credits_remaining ?? 0)}
                    hint={billing?.current_plan ? `${billing.current_plan.name} plan` : 'No plan assigned'}
                />
                <StatCard
                    label="Validations"
                    loading={!summary}
                    value={formatNumber(summary?.validations.total ?? 0)}
                    hint={`${formatNumber(summary?.validations.last_30_days ?? 0)} in the last 30 days`}
                />
                <StatCard
                    label="API keys"
                    loading={!summary}
                    value={`${summary?.api_keys.active ?? 0} active`}
                    hint={`${formatNumber(summary?.api_keys.requests ?? 0)} requests total`}
                />
                <StatCard
                    label="Total paid"
                    loading={!summary}
                    value={formatCurrency(summary?.payments.total_paid ?? 0)}
                    hint={`${summary?.payments.completed ?? 0} payments${
                        summary?.payments.failed ? ` · ${summary.payments.failed} failed` : ''
                    }`}
                />
            </StatCardGrid>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Name, contact details and account type.</CardDescription>
                            {!editing && (
                                <CardAction>
                                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                        <Pencil />
                                        Edit
                                    </Button>
                                </CardAction>
                            )}
                        </CardHeader>
                        <CardContent>
                            {editing ? (
                                <form onSubmit={save}>
                                    <FieldGroup>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field>
                                                <FieldLabel htmlFor="first_name">First name</FieldLabel>
                                                <Input id="first_name" value={form.first_name} onChange={set('first_name')} />
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="last_name">Last name</FieldLabel>
                                                <Input id="last_name" value={form.last_name} onChange={set('last_name')} />
                                            </Field>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field>
                                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                                <Input id="email" type="email" required value={form.email} onChange={set('email')} />
                                                <FieldDescription>Also their sign-in name.</FieldDescription>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                                <Input id="phone" value={form.phone_number} onChange={set('phone_number')} />
                                            </Field>
                                        </div>
                                        <Field>
                                            <FieldLabel>Account type</FieldLabel>
                                            <Select
                                                items={USER_TYPES}
                                                value={form.user_type}
                                                onValueChange={(v) => setForm((f) => ({ ...f, user_type: String(v) }))}
                                            >
                                                <SelectTrigger className="w-full sm:w-56">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(USER_TYPES).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FieldDescription>
                                                Labels the account only. Admin-panel access is the Staff role below.
                                            </FieldDescription>
                                        </Field>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setEditing(false)}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={saving}>
                                                {saving ? 'Saving…' : 'Save changes'}
                                            </Button>
                                        </div>
                                    </FieldGroup>
                                </form>
                            ) : (
                                <div className="divide-y">
                                    <Row label="Name">
                                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                                    </Row>
                                    <Row label="Email">{user.email}</Row>
                                    <Row label="Phone">{user.phone_number || '—'}</Row>
                                    <Row label="Account type">{USER_TYPES[user.user_type ?? ''] ?? user.user_type ?? '—'}</Row>
                                    <Row label="Groups">
                                        {user.groups?.length ? user.groups.map((g) => g.name).join(', ') : '—'}
                                    </Row>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Roles</CardTitle>
                            <CardDescription>
                                Changes take effect on the user's next request.
                                {isSelf && ' You cannot remove your own roles.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center justify-between gap-4">
                                <span>
                                    <span className="block text-sm font-medium">Staff</span>
                                    <span className="text-muted-foreground block text-sm">
                                        Can sign in to this admin panel and use every admin endpoint.
                                    </span>
                                </span>
                                <Switch
                                    checked={user.is_staff}
                                    disabled={roleSaving !== null || (isSelf && user.is_staff)}
                                    onCheckedChange={(v) => void setRole('is_staff', v)}
                                />
                            </label>
                            <Separator />
                            <label className="flex items-center justify-between gap-4">
                                <span>
                                    <span className="block text-sm font-medium">Superuser</span>
                                    <span className="text-muted-foreground block text-sm">
                                        Bypasses every permission check.
                                        {!actorIsSuperuser && ' Only a superuser can change this.'}
                                    </span>
                                </span>
                                <Switch
                                    checked={user.is_superuser}
                                    disabled={roleSaving !== null || !actorIsSuperuser || (isSelf && user.is_superuser)}
                                    onCheckedChange={(v) => void setRole('is_superuser', v)}
                                />
                            </label>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            <Row label="Status">{user.is_active ? 'Active' : 'Suspended'}</Row>
                            <Row label="Joined">{formatDate(user.date_joined)}</Row>
                            <Row label="Last sign-in">
                                <span title={formatDateTime(user.last_login)}>{formatRelative(user.last_login)}</span>
                            </Row>
                            <Row label="Last active">
                                <span title={formatDateTime(user.last_active)}>{formatRelative(user.last_active)}</span>
                            </Row>
                            <Row label="2FA">{summary ? (summary.security.two_factor_enabled ? 'Enabled' : 'Off') : '—'}</Row>
                            <Row label="Password">
                                {summary ? (summary.security.has_usable_password ? 'Set' : 'Not set (invite pending)') : '—'}
                            </Row>
                            <Row label="User ID">
                                <button
                                    type="button"
                                    onClick={copyId}
                                    className="hover:text-foreground text-muted-foreground inline-flex items-center gap-1 font-mono text-xs"
                                >
                                    {user.id.slice(0, 8)}…
                                    <Copy className="size-3" />
                                </button>
                            </Row>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>This cycle</CardTitle>
                            <CardDescription>
                                {billing?.credits_reset_date
                                    ? `Cycle started ${formatDate(billing.credits_reset_date)}`
                                    : 'No billing profile'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Used</span>
                                <span className="tabular-nums">
                                    {formatNumber(used)}
                                    {planCredits ? ` / ${formatNumber(planCredits)}` : ''}
                                </span>
                            </div>
                            {planCredits > 0 && <Progress value={Math.min(100, (used / planCredits) * 100)} />}
                        </CardContent>
                    </Card>

                    {summary && outcomeTotal > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Validation outcomes</CardTitle>
                                <CardDescription>
                                    Last run {formatRelative(summary.validations.last_at)}
                                    {summary.validations.bulk_jobs ? ` · ${summary.validations.bulk_jobs} bulk jobs` : ''}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="bg-muted flex h-2 overflow-hidden rounded-full">
                                    {Object.entries(outcomes)
                                        .filter(([, n]) => n > 0)
                                        .map(([key, n]) => (
                                            <div
                                                key={key}
                                                style={{
                                                    width: `${(n / outcomeTotal) * 100}%`,
                                                    background: OUTCOMES[key as Outcome]?.color,
                                                }}
                                            />
                                        ))}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    {Object.entries(outcomes)
                                        .filter(([, n]) => n > 0)
                                        .map(([key, n]) => (
                                            <div key={key} className="flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-1.5">
                                                    <span
                                                        className="size-2 rounded-full"
                                                        style={{ background: OUTCOMES[key as Outcome]?.color }}
                                                    />
                                                    {OUTCOMES[key as Outcome]?.label ?? key}
                                                </span>
                                                <span className="text-muted-foreground tabular-nums">{formatNumber(n)}</span>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserOverviewTab;
