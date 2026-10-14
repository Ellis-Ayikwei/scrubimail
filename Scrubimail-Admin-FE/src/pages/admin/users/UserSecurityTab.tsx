import React, { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, LogOut, Send, ShieldOff, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { ErrorState, StatusBadge, useConfirm } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { apiError } from '@/lib/api';
import { formatDate, formatRelative } from '@/lib/format';
import { useCurrentAdminIsSuperuser, type UserTabProps } from './types';

interface SecurityData {
    totp: { enabled: boolean; backup_codes_remaining: number };
    trusted_devices: Array<{ id: string; device_name: string; created_at: string; last_used?: string | null }>;
}

const UserSecurityTab: React.FC<UserTabProps> = ({ user, onChanged }) => {
    const confirm = useConfirm();
    const actorIsSuperuser = useCurrentAdminIsSuperuser();
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [resetUrl, setResetUrl] = useState<string | null>(null);
    const [sendingReset, setSendingReset] = useState(false);

    const [pwOpen, setPwOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [signOut, setSignOut] = useState(true);
    const [settingPw, setSettingPw] = useState(false);

    const fetchSecurity = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get<SecurityData>(`/admin/users/${user.id}/security/`);
            setData(res.data);
        } catch (e) {
            setError(apiError(e, 'Could not load security settings'));
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        void fetchSecurity();
    }, [fetchSecurity]);

    const post = (url: string, success: string) => async () => {
        try {
            const res = await axiosInstance.post(url);
            toast.success(res.data?.detail ?? success);
            void fetchSecurity();
            onChanged();
        } catch (e) {
            toast.error(apiError(e));
            throw e;
        }
    };

    const disable2fa = () =>
        confirm.ask({
            title: 'Turn off two-factor authentication?',
            description:
                'Use this when the user has lost their authenticator and backup codes. Their backup codes are deleted and they can sign in with just their password until they set 2FA up again.',
            confirmLabel: 'Turn off 2FA',
            destructive: true,
            onConfirm: post(`/admin/users/${user.id}/disable-2fa/`, '2FA disabled'),
        });

    const revokeDevices = () =>
        confirm.ask({
            title: 'Forget all trusted devices?',
            description: 'Every device will be asked for a 2FA code at next sign-in.',
            confirmLabel: 'Forget devices',
            destructive: true,
            onConfirm: post(`/admin/users/${user.id}/revoke-trusted-devices/`, 'Trusted devices revoked'),
        });

    const revokeSessions = () =>
        confirm.ask({
            title: 'Sign this user out everywhere?',
            description:
                'Their refresh tokens are revoked and trusted devices forgotten, so every session must sign in again once its current access token expires (within two hours).',
            confirmLabel: 'Sign out everywhere',
            destructive: true,
            onConfirm: post(`/admin/users/${user.id}/revoke-sessions/`, 'Sessions revoked'),
        });

    const sendReset = async () => {
        setSendingReset(true);
        try {
            const res = await axiosInstance.post(`/admin/users/${user.id}/reset-password/`);
            setResetUrl(res.data?.reset_url ?? null);
            if (res.data?.email_sent) toast.success(`Reset link emailed to ${user.email}`);
            else toast.warning('Email failed to send. Share the link below with the user directly.');
        } catch (e) {
            toast.error(apiError(e, 'Could not create a reset link'));
        } finally {
            setSendingReset(false);
        }
    };

    const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

    const setNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mismatch || !password) return;
        setSettingPw(true);
        try {
            const res = await axiosInstance.post(`/admin/users/${user.id}/set-password/`, {
                password,
                revoke_sessions: signOut,
            });
            toast.success(
                res.data?.sessions_revoked ? `Password set · ${res.data.sessions_revoked} session(s) signed out` : 'Password set'
            );
            setPwOpen(false);
            setPassword('');
            setConfirmPassword('');
            onChanged();
        } catch (err) {
            toast.error(apiError(err, 'Could not set the password'));
        } finally {
            setSettingPw(false);
        }
    };

    if (error && !data) return <ErrorState description={error} onRetry={() => void fetchSecurity()} />;

    const blockedPw = user.is_superuser && !actorIsSuperuser;

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        Prefer the reset link — the user chooses their own password and you never see it.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void sendReset()} disabled={sendingReset}>
                            <Send />
                            {sendingReset ? 'Sending…' : 'Email reset link'}
                        </Button>
                        <Button variant="outline" onClick={() => setPwOpen(true)} disabled={blockedPw}>
                            <KeyRound />
                            Set password
                        </Button>
                    </div>
                    {blockedPw && (
                        <p className="text-muted-foreground text-sm">Only a superuser can set a superuser's password.</p>
                    )}
                    {resetUrl && (
                        <div className="space-y-1.5">
                            <p className="text-muted-foreground text-xs">Reset link (valid until the password changes):</p>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted min-w-0 flex-1 truncate rounded-lg px-3 py-2 font-mono text-xs">
                                    {resetUrl}
                                </code>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Copy reset link"
                                    onClick={() =>
                                        void navigator.clipboard.writeText(resetUrl).then(() => toast.success('Link copied'))
                                    }
                                >
                                    <Copy />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sessions</CardTitle>
                    <CardDescription>
                        Force a sign-out after a suspected compromise or a password change.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={revokeSessions}>
                        <LogOut />
                        Sign out everywhere
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Two-factor authentication</CardTitle>
                    <CardDescription>
                        {loading ? (
                            <Skeleton className="h-4 w-40" />
                        ) : data?.totp.enabled ? (
                            `Enabled · ${data.totp.backup_codes_remaining} backup codes left`
                        ) : (
                            'Not set up. Only the user can enable it.'
                        )}
                    </CardDescription>
                    <CardAction>
                        {!loading && <StatusBadge status={data?.totp.enabled ? 'enabled' : 'inactive'} label={data?.totp.enabled ? 'On' : 'Off'} />}
                    </CardAction>
                </CardHeader>
                {data?.totp.enabled && (
                    <CardContent>
                        <Button variant="destructive" onClick={disable2fa}>
                            <ShieldOff />
                            Turn off 2FA
                        </Button>
                    </CardContent>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Trusted devices</CardTitle>
                    <CardDescription>Devices that skip the 2FA prompt.</CardDescription>
                    {(data?.trusted_devices.length ?? 0) > 0 && (
                        <CardAction>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={revokeDevices}>
                                Forget all
                            </Button>
                        </CardAction>
                    )}
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-12" />
                    ) : !data?.trusted_devices.length ? (
                        <p className="text-muted-foreground text-sm">No trusted devices.</p>
                    ) : (
                        <ul className="divide-y">
                            {data.trusted_devices.map((d) => (
                                <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
                                    <Smartphone className="text-muted-foreground size-4 shrink-0" />
                                    <span className="min-w-0 flex-1 truncate">{d.device_name || 'Unnamed device'}</span>
                                    <span className="text-muted-foreground shrink-0 text-xs">
                                        added {formatDate(d.created_at)}
                                        {d.last_used ? ` · used ${formatRelative(d.last_used)}` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={pwOpen} onOpenChange={setPwOpen}>
                <DialogContent>
                    <form onSubmit={setNewPassword} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Set a new password</DialogTitle>
                            <DialogDescription>
                                For {user.email}. Tell them through a channel other than email, and ask them to change it.
                            </DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                                <Input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <FieldDescription>At least 8 characters, not common or all-numeric.</FieldDescription>
                            </Field>
                            <Field data-invalid={mismatch || undefined}>
                                <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    aria-invalid={mismatch || undefined}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {mismatch && <FieldDescription>Passwords don't match.</FieldDescription>}
                            </Field>
                            <label className="flex items-center justify-between gap-4 text-sm">
                                Sign them out of existing sessions
                                <Switch checked={signOut} onCheckedChange={setSignOut} />
                            </label>
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setPwOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={settingPw || mismatch || !password}>
                                {settingPw ? 'Saving…' : 'Set password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {confirm.dialog}
        </div>
    );
};

export default UserSecurityTab;
