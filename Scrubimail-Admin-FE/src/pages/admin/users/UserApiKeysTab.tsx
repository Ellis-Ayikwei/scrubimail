import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Plus } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { DataTable, type DataTableColumn, StatusBadge, useConfirm } from '@/components/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { apiError, asList } from '@/lib/api';
import { formatDate, formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import type { UserTabProps } from './types';

interface ApiKey {
    id: string;
    name?: string | null;
    prefix?: string;
    masked_key?: string;
    is_active: boolean;
    is_expired?: boolean;
    usage_count?: number;
    rate_limit_per_hour?: number;
    expires_at?: string | null;
    created_at: string;
    last_used_at?: string | null;
    last_used_ip?: string | null;
}

const keyStatus = (k: ApiKey) => (!k.is_active ? 'revoked' : k.is_expired ? 'expired' : 'active');

const UserApiKeysTab: React.FC<UserTabProps> = ({ user, onChanged }) => {
    const confirm = useConfirm();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [rateLimit, setRateLimit] = useState('1000');
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get('/admin/api-keys/', { params: { user_id: user.id } });
            setKeys(asList<ApiKey>(res.data));
        } catch (e) {
            setKeys([]);
            setError(apiError(e, 'Could not load API keys'));
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        void fetchKeys();
    }, [fetchKeys]);

    const activeCount = keys.filter((k) => k.is_active).length;

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await axiosInstance.post('/admin/api-keys/', {
                user_id: user.id,
                name: name.trim() || 'Admin-issued key',
                rate_limit_per_hour: Number.parseInt(rateLimit, 10) || 1000,
            });
            setNewKey(res.data?.key ?? null);
            setName('');
            void fetchKeys();
            onChanged();
        } catch (err) {
            toast.error(apiError(err, 'Could not create the key'));
        } finally {
            setCreating(false);
        }
    };

    const closeCreate = (open: boolean) => {
        if (open) return setCreateOpen(true);
        setCreateOpen(false);
        setNewKey(null);
        setCopied(false);
    };

    const copyKey = () => {
        if (!newKey) return;
        void navigator.clipboard.writeText(newKey).then(() => {
            setCopied(true);
            toast.success('Key copied');
        });
    };

    const revoke = (key: ApiKey) =>
        confirm.ask({
            title: `Revoke “${key.name || key.prefix || 'this key'}”?`,
            description: 'Requests using this key start failing immediately. Usage history is kept. This cannot be undone.',
            confirmLabel: 'Revoke key',
            destructive: true,
            onConfirm: async () => {
                try {
                    await axiosInstance.delete(`/admin/api-keys/${key.id}/`);
                    toast.success('Key revoked');
                    void fetchKeys();
                    onChanged();
                } catch (e) {
                    toast.error(apiError(e, 'Could not revoke the key'));
                    throw e;
                }
            },
        });

    const columns = useMemo<DataTableColumn<ApiKey>[]>(
        () => [
            {
                id: 'name',
                header: 'Key',
                sortValue: (k) => k.name ?? '',
                cell: (k) => (
                    <div className="min-w-0">
                        <p className="truncate font-medium">{k.name || 'Untitled key'}</p>
                        <p className="text-muted-foreground font-mono text-xs">{k.masked_key || `${k.prefix ?? ''}…`}</p>
                    </div>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                sortValue: keyStatus,
                cell: (k) => <StatusBadge status={keyStatus(k)} />,
            },
            {
                id: 'usage',
                header: 'Requests',
                sortValue: (k) => k.usage_count ?? 0,
                className: 'tabular-nums',
                cell: (k) => (
                    <span>
                        {formatNumber(k.usage_count ?? 0)}
                        {k.rate_limit_per_hour ? (
                            <span className="text-muted-foreground"> · {formatNumber(k.rate_limit_per_hour)}/h</span>
                        ) : null}
                    </span>
                ),
            },
            {
                id: 'last_used',
                header: 'Last used',
                sortValue: (k) => k.last_used_at ?? '',
                cell: (k) => (
                    <div className="text-muted-foreground" title={formatDateTime(k.last_used_at)}>
                        {k.last_used_at ? formatRelative(k.last_used_at) : 'Never'}
                        {k.last_used_ip && <p className="font-mono text-xs">{k.last_used_ip}</p>}
                    </div>
                ),
            },
            {
                id: 'created',
                header: 'Created',
                sortValue: (k) => k.created_at,
                cell: (k) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(k.created_at)}</span>,
            },
            {
                id: 'actions',
                header: <span className="sr-only">Actions</span>,
                className: 'text-right',
                cell: (k) =>
                    k.is_active ? (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revoke(k)}>
                            Revoke
                        </Button>
                    ) : null,
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                    {activeCount} active of {keys.length} keys. Keys are shown masked; the full secret is only visible
                    when issued.
                </p>
                <Button onClick={() => setCreateOpen(true)} disabled={!user.is_active}>
                    <Plus />
                    Issue key
                </Button>
            </div>

            <DataTable
                data={keys}
                columns={columns}
                rowKey={(k) => k.id}
                loading={loading}
                error={error}
                onRetry={() => void fetchKeys()}
                pageSize={15}
                emptyTitle="No API keys"
                emptyDescription="This user hasn't created any keys."
            />

            <Dialog open={createOpen} onOpenChange={closeCreate}>
                <DialogContent className="sm:max-w-lg">
                    {newKey ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Key issued</DialogTitle>
                                <DialogDescription>
                                    Copy it now and hand it to the user over a secure channel. It won't be shown again.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted min-w-0 flex-1 rounded-lg px-3 py-2 font-mono text-xs break-all">
                                    {newKey}
                                </code>
                                <Button variant="outline" size="icon" onClick={copyKey} aria-label="Copy key">
                                    {copied ? <Check /> : <Copy />}
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => closeCreate(false)}>Done</Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <form onSubmit={create} className="grid gap-6">
                            <DialogHeader>
                                <DialogTitle>Issue an API key</DialogTitle>
                                <DialogDescription>For {user.email}.</DialogDescription>
                            </DialogHeader>
                            {activeCount > 0 && (
                                <Alert>
                                    <KeyRound />
                                    <AlertTitle>This rotates their key</AlertTitle>
                                    <AlertDescription>
                                        Users have one active key. Issuing a new one deactivates the current key, so
                                        their integrations break until they switch.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="key-name">Name</FieldLabel>
                                    <Input
                                        id="key-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Production"
                                        maxLength={100}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="key-rate">Rate limit (requests / hour)</FieldLabel>
                                    <Input
                                        id="key-rate"
                                        type="number"
                                        min={1}
                                        value={rateLimit}
                                        onChange={(e) => setRateLimit(e.target.value)}
                                    />
                                    <FieldDescription>Plan limits still apply on top of this.</FieldDescription>
                                </Field>
                            </FieldGroup>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => closeCreate(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    {creating ? 'Issuing…' : 'Issue key'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {confirm.dialog}
        </div>
    );
};

export default UserApiKeysTab;
