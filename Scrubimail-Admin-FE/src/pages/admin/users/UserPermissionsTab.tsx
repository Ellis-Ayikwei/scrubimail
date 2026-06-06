import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Save, Users, Lock, Check, Search } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import { UCARD, UHEADER, UBORDER_B, UPANEL, UINPUT, UMINT, UERR, UOK, UROW_HOVER } from './userTheme';

interface GroupItem {
  id: number;
  name: string;
  user_count?: number;
  permissions?: PermItem[];
}
interface PermItem {
  id: number;
  name: string;
  codename: string;
  content_type?: number;
}

interface Props {
  userId: string;
}

const UserPermissionsTab: React.FC<Props> = ({ userId }) => {
  const [allGroups, setAllGroups] = useState<GroupItem[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<Set<number>>(new Set());

  const [groupPerms, setGroupPerms] = useState<PermItem[]>([]);
  const [allPerms, setAllPerms] = useState<PermItem[]>([]);
  const [userPermIds, setUserPermIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'groups' | 'perms' | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [permSearch, setPermSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, userGrpRes, permRes, userPermRes] = await Promise.all([
        axiosInstance.get('/admin/groups/'),
        axiosInstance.get(`/admin/users/${userId}/groups/`),
        axiosInstance.get('/admin/permissions/'),
        axiosInstance.get(`/admin/users/${userId}/permissions/`),
      ]);
      setAllGroups(Array.isArray(grpRes.data) ? grpRes.data : []);
      setUserGroupIds(new Set((userGrpRes.data as GroupItem[]).map((g) => g.id)));
      setAllPerms(Array.isArray(permRes.data) ? permRes.data : []);
      setGroupPerms(userPermRes.data?.from_groups ?? []);
      setUserPermIds(new Set((userPermRes.data?.direct ?? []).map((p: PermItem) => p.id)));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const saveGroups = async () => {
    setSaving('groups');
    setMsg(null);
    try {
      await axiosInstance.put(`/admin/users/${userId}/groups/`, { group_ids: [...userGroupIds] });
      setMsg({ type: 'ok', text: 'Groups updated.' });
      fetch();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.detail ?? 'Failed to update groups' });
    } finally {
      setSaving(null);
    }
  };

  const savePerms = async () => {
    setSaving('perms');
    setMsg(null);
    try {
      await axiosInstance.put(`/admin/users/${userId}/permissions/`, { permission_ids: [...userPermIds] });
      setMsg({ type: 'ok', text: 'Permissions updated.' });
      fetch();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.detail ?? 'Failed to update permissions' });
    } finally {
      setSaving(null);
    }
  };

  const toggleGroup = (id: number) => {
    setUserGroupIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePerm = (id: number) => {
    setUserPermIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const groupPermIds = new Set(groupPerms.map((p) => p.id));

  const filteredPerms = permSearch
    ? allPerms.filter(
        (p) =>
          p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
          p.codename.toLowerCase().includes(permSearch.toLowerCase())
      )
    : allPerms;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div
          className={`rounded-sm p-3 font-mono text-xs border ${
            msg.type === 'ok' ? UOK : UERR
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className={UCARD}>
        <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
          <div className="flex items-center gap-2">
            <Users className={`w-3.5 h-3.5 ${UMINT}`} />
            <p className={UHEADER}>Groups</p>
          </div>
          <button
            type="button"
            onClick={saveGroups}
            disabled={saving === 'groups'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0] rounded-sm font-mono text-[9px] uppercase tracking-[0.1em] hover:bg-emerald-100 dark:hover:bg-[#6effc0]/20 transition-all disabled:opacity-40"
          >
            {saving === 'groups' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Groups
          </button>
        </div>

        {allGroups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">No groups defined yet</p>
          </div>
        ) : (
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allGroups.map((g) => {
              const active = userGroupIds.has(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border text-left transition-all ${
                    active
                      ? 'border-emerald-300 bg-emerald-50 dark:border-[#6effc0]/40 dark:bg-[#6effc0]/8'
                      : 'border-gray-200 bg-white dark:border-[#3b4a41]/30 dark:bg-[#101418] hover:border-gray-300 dark:hover:border-[#3b4a41]/60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? 'bg-emerald-500 border-emerald-500 dark:bg-[#6effc0] dark:border-[#6effc0]'
                        : 'border-gray-300 dark:border-[#3b4a41]'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-white dark:text-[#003824]" />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`font-mono text-[10px] truncate ${
                        active ? UMINT : 'text-gray-700 dark:text-[#bacbbf]'
                      }`}
                    >
                      {g.name}
                    </p>
                    {g.permissions && g.permissions.length > 0 && (
                      <p className="font-mono text-[8px] text-gray-400 dark:text-[#3b4a41] mt-0.5">
                        {g.permissions.length} permissions
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={UCARD}>
        <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <p className={UHEADER}>Direct Permissions</p>
            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-gray-200 text-gray-600 dark:bg-[#3b4a41]/30 dark:text-[#bacbbf]/60 rounded-sm">
              {userPermIds.size} assigned
            </span>
          </div>
          <button
            type="button"
            onClick={savePerms}
            disabled={saving === 'perms'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0] rounded-sm font-mono text-[9px] uppercase tracking-[0.1em] hover:bg-emerald-100 dark:hover:bg-[#6effc0]/20 transition-all disabled:opacity-40"
          >
            {saving === 'perms' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Permissions
          </button>
        </div>

        <div className={`px-4 py-3 ${UBORDER_B} ${UPANEL}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
            <input
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="Filter permissions…"
              className={`${UINPUT} pl-9`}
            />
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-200 dark:divide-[#3b4a41]/15">
          {filteredPerms.map((p) => {
            const isDirect = userPermIds.has(p.id);
            const isFromGroup = groupPermIds.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${UROW_HOVER} transition-colors cursor-pointer`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    togglePerm(p.id);
                  }}
                  aria-pressed={isDirect}
                  aria-label={isDirect ? 'Remove direct permission' : 'Add direct permission'}
                  className={`p-0 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                    isDirect
                      ? 'bg-amber-500 border-amber-500 dark:bg-amber-500 dark:border-amber-500'
                      : isFromGroup
                        ? 'bg-emerald-200 border-emerald-300 dark:bg-[#6effc0]/30 dark:border-[#6effc0]/40'
                        : 'border-gray-300 dark:border-[#3b4a41] hover:border-gray-400 dark:hover:border-[#bacbbf]/40'
                  }`}
                >
                  {(isDirect || isFromGroup) && <Check className="w-3 h-3 text-white dark:text-[#003824]" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-mono text-[10px] ${
                      isDirect
                        ? 'text-amber-700 dark:text-amber-400'
                        : isFromGroup
                          ? 'text-emerald-700 dark:text-[#6effc0]/70'
                          : 'text-gray-700 dark:text-[#bacbbf]'
                    }`}
                  >
                    {p.codename}
                  </p>
                  <p className="font-mono text-[8px] text-gray-400 dark:text-[#3b4a41] truncate">{p.name}</p>
                </div>
                {isFromGroup && !isDirect && (
                  <span className="font-mono text-[7px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-[#6effc0]/10 dark:text-[#6effc0]/80 dark:border-[#6effc0]/15 rounded-sm shrink-0">
                    via group
                  </span>
                )}
              </label>
            );
          })}
          {filteredPerms.length === 0 && (
            <div className="p-6 text-center">
              <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">
                {permSearch ? 'No matching permissions' : 'No permissions available'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsTab;
