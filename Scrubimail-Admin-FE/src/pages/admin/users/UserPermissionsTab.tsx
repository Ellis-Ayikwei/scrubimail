import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { ErrorState } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiError, asList } from '@/lib/api';
import type { UserTabProps } from './types';

interface GroupItem {
    id: number;
    name: string;
    user_count?: number;
    permission_count?: number;
    permissions?: PermItem[];
}

interface PermItem {
    id: number;
    name: string;
    codename: string;
}

const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x));

const UserPermissionsTab: React.FC<UserTabProps> = ({ user, onChanged }) => {
    const [allGroups, setAllGroups] = useState<GroupItem[]>([]);
    const [allPerms, setAllPerms] = useState<PermItem[]>([]);
    const [savedGroups, setSavedGroups] = useState<Set<number>>(new Set());
    const [groupIds, setGroupIds] = useState<Set<number>>(new Set());
    const [savedPerms, setSavedPerms] = useState<Set<number>>(new Set());
    const [permIds, setPermIds] = useState<Set<number>>(new Set());
    const [inherited, setInherited] = useState<Set<number>>(new Set());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<'groups' | 'perms' | null>(null);
    const [search, setSearch] = useState('');
    const [onlyGranted, setOnlyGranted] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [groups, userGroups, perms, userPerms] = await Promise.all([
                axiosInstance.get('/admin/groups/'),
                axiosInstance.get(`/admin/users/${user.id}/groups/`),
                axiosInstance.get('/admin/permissions/'),
                axiosInstance.get(`/admin/users/${user.id}/permissions/`),
            ]);
            setAllGroups(asList<GroupItem>(groups.data));
            setAllPerms(asList<PermItem>(perms.data));
            const g = new Set(asList<GroupItem>(userGroups.data).map((x) => x.id));
            const p = new Set<number>((userPerms.data?.direct ?? []).map((x: PermItem) => x.id));
            setSavedGroups(g);
            setGroupIds(new Set(g));
            setSavedPerms(p);
            setPermIds(new Set(p));
            setInherited(new Set((userPerms.data?.from_groups ?? []).map((x: PermItem) => x.id)));
        } catch (e) {
            setError(apiError(e, 'Could not load groups and permissions'));
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        void load();
    }, [load]);

    const toggle = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) =>
        setter((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const save = async (kind: 'groups' | 'perms') => {
        setSaving(kind);
        try {
            if (kind === 'groups') {
                await axiosInstance.put(`/admin/users/${user.id}/groups/`, { group_ids: [...groupIds] });
                toast.success('Groups updated');
            } else {
                await axiosInstance.put(`/admin/users/${user.id}/permissions/`, { permission_ids: [...permIds] });
                toast.success('Permissions updated');
            }
            await load();
            onChanged();
        } catch (e) {
            toast.error(apiError(e, 'Could not save'));
        } finally {
            setSaving(null);
        }
    };

    const visiblePerms = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allPerms.filter((p) => {
            if (onlyGranted && !permIds.has(p.id) && !inherited.has(p.id)) return false;
            return !q || p.name.toLowerCase().includes(q) || p.codename.toLowerCase().includes(q);
        });
    }, [allPerms, search, onlyGranted, permIds, inherited]);

    if (error) return <ErrorState description={error} onRetry={() => void load()} />;
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-80" />
            </div>
        );
    }

    const groupsDirty = !sameSet(groupIds, savedGroups);
    const permsDirty = !sameSet(permIds, savedPerms);

    return (
        <div className="space-y-4">
            {user.is_superuser && (
                <p className="text-muted-foreground rounded-xl border px-4 py-3 text-sm">
                    This user is a superuser and passes every permission check regardless of the settings below.
                </p>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Groups</CardTitle>
                    <CardDescription>Users inherit every permission of their groups.</CardDescription>
                    <CardAction className="flex gap-2">
                        {groupsDirty && (
                            <Button variant="ghost" size="sm" onClick={() => setGroupIds(new Set(savedGroups))}>
                                Discard
                            </Button>
                        )}
                        <Button size="sm" onClick={() => void save('groups')} disabled={!groupsDirty || saving !== null}>
                            {saving === 'groups' ? 'Saving…' : 'Save groups'}
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    {allGroups.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No groups yet. Create them under Groups & Permissions.</p>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {allGroups.map((g) => (
                                <label
                                    key={g.id}
                                    className="hover:bg-muted/50 has-data-checked:border-primary/40 has-data-checked:bg-primary/5 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5"
                                >
                                    <Checkbox checked={groupIds.has(g.id)} onCheckedChange={() => toggle(setGroupIds, g.id)} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">{g.name}</span>
                                        <span className="text-muted-foreground block text-xs">
                                            {g.permission_count ?? g.permissions?.length ?? 0} permissions
                                            {g.user_count != null ? ` · ${g.user_count} users` : ''}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Direct permissions</CardTitle>
                    <CardDescription>
                        {permIds.size} granted directly · {inherited.size} inherited from groups (saved state)
                    </CardDescription>
                    <CardAction className="flex gap-2">
                        {permsDirty && (
                            <Button variant="ghost" size="sm" onClick={() => setPermIds(new Set(savedPerms))}>
                                Discard
                            </Button>
                        )}
                        <Button size="sm" onClick={() => void save('perms')} disabled={!permsDirty || saving !== null}>
                            {saving === 'perms' ? 'Saving…' : 'Save permissions'}
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-0 flex-1 sm:max-w-xs">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter permissions…"
                                className="pl-8"
                                aria-label="Filter permissions"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={onlyGranted} onCheckedChange={(v) => setOnlyGranted(Boolean(v))} />
                            Only granted
                        </label>
                    </div>

                    <div className="max-h-[440px] divide-y overflow-y-auto rounded-xl border">
                        {visiblePerms.length === 0 && (
                            <p className="text-muted-foreground p-6 text-center text-sm">No matching permissions.</p>
                        )}
                        {visiblePerms.map((p) => {
                            const direct = permIds.has(p.id);
                            const viaGroup = inherited.has(p.id);
                            return (
                                <label key={p.id} className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-3 py-2">
                                    <Checkbox checked={direct} onCheckedChange={() => toggle(setPermIds, p.id)} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-mono text-xs">{p.codename}</span>
                                        <span className="text-muted-foreground block truncate text-xs">{p.name}</span>
                                    </span>
                                    {viaGroup && (
                                        <Badge variant="secondary" className="shrink-0">
                                            via group
                                        </Badge>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserPermissionsTab;
