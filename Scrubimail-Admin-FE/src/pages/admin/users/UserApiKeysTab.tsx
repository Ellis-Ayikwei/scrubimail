import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import {
  UCARD,
  ULABEL,
  UINPUT,
  UHEADER,
  UBORDER_B,
  UPANEL,
  UDIVIDE,
  UROW_HOVER,
  USKELETON,
  UICON_BTN,
  UMINT,
  UERR,
} from './userTheme';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  key?: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

interface Props {
  userId: string;
}

const UserApiKeysTab: React.FC<Props> = ({ userId }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/api-keys/', { params: { user_id: userId } });
      setKeys(Array.isArray(res.data) ? res.data : res.data?.results ?? []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/admin/api-keys/', { user_id: userId, name: keyName.trim() });
      setNewKey(res.data?.key ?? null);
      setKeyName('');
      setShowCreate(false);
      fetchKeys();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    setError(null);
    try {
      await axiosInstance.delete(`/admin/api-keys/${keyId}/`);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to revoke API key');
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';

  return (
    <div className="space-y-4">
      {error && <div className={`rounded-sm p-3 font-mono text-xs ${UERR}`}>{error}</div>}

      {newKey && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-[#6effc0]/5 dark:border-[#6effc0]/30 rounded-sm p-4">
          <p className={`font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] ${UMINT} mb-2`}>
            New API Key — copy now, it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className={`flex-1 font-mono text-xs ${UMINT} ${UPANEL} px-3 py-2 rounded-sm break-all`}>{newKey}</code>
            <button
              type="button"
              onClick={() => copyToClipboard(newKey)}
              className={`p-2 border border-emerald-300 dark:border-[#6effc0]/30 rounded-sm ${UMINT} hover:brightness-110 transition-colors shrink-0`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewKey(null)}
            className="mt-3 font-mono text-[9px] text-gray-400 hover:text-gray-700 dark:text-[#bacbbf]/40 dark:hover:text-[#bacbbf] uppercase tracking-[0.1em]"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className={UCARD}>
        <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
          <p className={UHEADER}>API Keys</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchKeys} disabled={loading} className={UICON_BTN}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 ${UMINT} rounded-sm font-mono text-[9px] uppercase tracking-[0.1em] hover:bg-emerald-100 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:hover:bg-[#6effc0]/20 transition-all`}
            >
              <Plus className="w-3 h-3" /> New Key
            </button>
          </div>
        </div>

        {showCreate && (
          <div className={`px-4 py-3 ${UBORDER_B} ${UPANEL}`}>
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <div className="flex-1">
                <label className={`${ULABEL} block mb-1.5`}>Key Name</label>
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production, CI/CD"
                  className={UINPUT}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={creating || !keyName.trim()}
                className="px-4 py-2 bg-emerald-500 text-white dark:bg-[#6effc0] dark:text-[#003824] font-mono text-[9px] uppercase tracking-[0.15em] font-bold rounded-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setKeyName('');
                }}
                className="px-3 py-2 border border-gray-300 text-gray-500 dark:border-[#3b4a41]/40 dark:text-[#bacbbf]/40 font-mono text-[9px] uppercase tracking-[0.1em] rounded-sm hover:text-red-600 dark:hover:text-[#ff4c4c] transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-12 ${USKELETON} rounded animate-pulse`} />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">No API keys found</p>
          </div>
        ) : (
          <div className={UDIVIDE}>
            <div className={`grid grid-cols-[1fr_120px_120px_80px_50px] gap-3 px-4 py-2 ${UPANEL}`}>
              {['Name / Prefix', 'Created', 'Last Used', 'Status', ''].map((h) => (
                <span key={h || 'x'} className={ULABEL}>
                  {h}
                </span>
              ))}
            </div>
            {keys.map((k) => (
              <div
                key={k.id}
                className={`grid grid-cols-[1fr_120px_120px_80px_50px] gap-3 px-4 py-3 ${UROW_HOVER} transition-colors items-center`}
              >
                <div>
                  <p className="font-mono text-[10px] text-gray-900 dark:text-[#e0e3e8]">{k.name}</p>
                  <p className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41] mt-0.5">{k.prefix}••••••••</p>
                </div>
                <span className="font-mono text-[9px] text-gray-400 dark:text-[#bacbbf]/50">{fmt(k.created_at)}</span>
                <span className="font-mono text-[9px] text-gray-400 dark:text-[#bacbbf]/50">{fmt(k.last_used_at)}</span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.06em] ${
                    k.is_active ? UMINT : 'text-red-600 dark:text-[#ff4c4c]'
                  }`}
                >
                  {k.is_active ? 'Active' : 'Revoked'}
                </span>
                {k.is_active && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(k.id)}
                    disabled={revoking === k.id}
                    className="p-1.5 text-gray-300 hover:text-red-600 dark:text-[#bacbbf]/30 dark:hover:text-[#ff4c4c] transition-colors disabled:opacity-40"
                    title="Revoke key"
                  >
                    {revoking === k.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserApiKeysTab;
