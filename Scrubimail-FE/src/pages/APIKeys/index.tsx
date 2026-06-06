import React, { useState } from 'react';
import { Plus, RefreshCw, Copy, Trash2, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useApiKeys } from './hooks/useApiKeys';
import { CreateApiKeyModal } from './components/CreateApiKeyModal';
import { EditApiKeyModal } from './components/EditApiKeyModal';
import { APIKey } from '../../services/apiKeyService';

// ── Design tokens ──────────────────────────────────────────────────────────────
const CARD  = 'bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm';
const LABEL = 'font-label uppercase tracking-[0.1em] text-[10px] text-[#bacbbf]';
const MONO  = 'font-mono';

interface ApiKeyWithUsage extends APIKey {
  name?: string;
  lastUsed?: string;
  usageCount?: number;
  permissions?: string[];
  description?: string;
}

const RBAC = [
  { role: 'Read',  perms: 'Direct read-only. Cannot access historical logs and validation history.', color: 'text-[#6effc0]' },
  { role: 'Write', perms: 'Permissions include new validation requests, bulk validation, and status updates.', color: 'text-[#60a5fa]' },
  { role: 'Admin', perms: 'Full control including data management, team management, and credential resets.', color: 'text-[#f59e0b]' },
];

const ApiKeys: React.FC = () => {
  const { apiKeys, loading, usageStats, loadApiKeys, handleCreateKey, handleDeactivateKey, handleEditKey, handleUpdateKey } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyWithUsage | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleVisible = (id: string) =>
    setVisibleKeys(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const copyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const totalCalls = usageStats?.total_calls ?? apiKeys.reduce((a, k) => a + (k.usage_count ?? 0), 0);

  return (
    <div className="space-y-5 font-body">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className={`${LABEL} text-[#6effc0] mb-0.5`}>Authentication Protocol</p>
          <h1 className="font-headline text-2xl font-black text-[#e0e3e8] tracking-tight">API Keys</h1>
          <p className={`${LABEL} mt-0.5`}>Manage your secure access tokens. Keys are restricted to the environments they were provisioned for.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6effc0] rounded-sm text-[#003824] font-label uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Key
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`${CARD} p-4`}>
          <p className={LABEL}>Total API Calls (2mo)</p>
          <p className={`${MONO} text-3xl font-bold text-[#e0e3e8] mt-1`}>
            {loading ? '—' : `${(totalCalls / 1000).toFixed(1)}k`}
          </p>
          <p className={`${MONO} text-[10px] text-[#6effc0] mt-1`}>+12.4k</p>
        </div>
        <div className={`${CARD} p-4`}>
          <p className={LABEL}>Security Status</p>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="w-4 h-4 text-[#6effc0]" />
            <p className="font-label uppercase tracking-[0.1em] text-[12px] text-[#6effc0] font-bold">Optimal</p>
          </div>
          <p className={`${MONO} text-[10px] text-[#bacbbf] mt-1`}>All keys healthy</p>
        </div>
      </div>

      {/* Keys + RBAC grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Active tokens */}
        <div className="lg:col-span-2">
          <div className={`${CARD}`}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3b4a41]/30">
              <p className={LABEL}>Active Access Tokens</p>
              <button
                onClick={loadApiKeys}
                className="p-1 text-[#bacbbf] hover:text-[#6effc0] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-[#3b4a41]/20">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-4 py-4 space-y-2">
                      <div className="h-2 bg-[#31353a] rounded animate-pulse w-1/3" />
                      <div className="h-2 bg-[#31353a] rounded animate-pulse w-2/3" />
                    </div>
                  ))
                : apiKeys.length === 0
                  ? (
                      <div className="px-4 py-10 text-center">
                        <p className={`${LABEL} text-[#3b4a41]`}>No API keys yet</p>
                      </div>
                    )
                  : apiKeys.map(key => {
                      const isVisible = visibleKeys.has(key.id);
                      const masked = key.key ? `${key.key.slice(0, 8)}${'•'.repeat(12)}${key.key.slice(-4)}` : '•••••••••••••••••••••';
                      const displayKey = isVisible ? key.key : masked;
                      const isCopied = copiedId === key.id;
                      return (
                        <div key={key.id} className="px-4 py-4 hover:bg-[#262a2f] transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="font-label uppercase tracking-[0.08em] text-[11px] text-[#e0e3e8] font-semibold">
                                  {(key as any).name ?? `Key ${key.id?.slice(0, 8)}`}
                                </p>
                                <span className={`px-1.5 py-0.5 rounded-sm font-label uppercase tracking-[0.08em] text-[9px] border ${
                                  key.is_active
                                    ? 'bg-[#6effc0]/10 text-[#6effc0] border-[#6effc0]/20'
                                    : 'bg-[#ff4c4c]/10 text-[#ff4c4c] border-[#ff4c4c]/20'
                                }`}>
                                  {key.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-[#101418] rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-[#bacbbf] w-full max-w-sm">
                                <span className="flex-1 truncate">{displayKey ?? '•••••••••••••••'}</span>
                              </div>
                              <div className="flex gap-3 mt-2">
                                {key.last_used && (
                                  <p className={`${MONO} text-[9px] text-[#3b4a41]`}>
                                    Last used: {new Date(key.last_used).toLocaleDateString()}
                                  </p>
                                )}
                                {key.usage_count !== undefined && (
                                  <p className={`${MONO} text-[9px] text-[#3b4a41]`}>
                                    {key.usage_count.toLocaleString()} calls
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleVisible(key.id)}
                                className="p-1.5 text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] rounded-sm transition-colors"
                                title={isVisible ? 'Hide key' : 'Reveal key'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => key.key && copyKey(key.key, key.id)}
                                className="p-1.5 text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] rounded-sm transition-colors"
                                title="Copy key"
                              >
                                {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-[#6effc0]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => { setEditingKey(key as any); setShowEdit(true); }}
                                className="px-2 py-1 text-[#bacbbf] hover:text-[#6effc0] hover:bg-[#1c2024] rounded-sm transition-colors font-label uppercase tracking-[0.08em] text-[9px]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeactivateKey(key.id)}
                                className="p-1.5 text-[#bacbbf] hover:text-[#ff4c4c] hover:bg-[#1c2024] rounded-sm transition-colors"
                                title="Revoke key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
            </div>
          </div>
        </div>

        {/* RBAC panel */}
        <div className="space-y-4">
          <div className={CARD}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3b4a41]/30">
              <p className={LABEL}>RBAC Permissions Matrix</p>
              <Shield className="w-3.5 h-3.5 text-[#6effc0]" />
            </div>
            <div className="divide-y divide-[#3b4a41]/20">
              {RBAC.map(({ role, perms, color }) => (
                <div key={role} className="px-4 py-4">
                  <p className={`font-label uppercase tracking-[0.1em] text-[11px] font-bold mb-1 ${color}`}>{role}</p>
                  <p className={`${MONO} text-[10px] text-[#bacbbf] leading-relaxed`}>{perms}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[#3b4a41]/30">
              <p className={`${LABEL} text-[#bacbbf] mb-2`}>Need custom scopes?</p>
              <button className="w-full py-1.5 bg-[#6effc0]/10 border border-[#6effc0]/20 rounded-sm text-[#6effc0] font-label uppercase tracking-[0.1em] text-[9px] hover:bg-[#6effc0]/20 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateApiKeyModal
          onClose={() => setShowCreate(false)}
          onCreate={async (data) => { await handleCreateKey(data); setShowCreate(false); }}
        />
      )}
      {showEdit && editingKey && (
        <EditApiKeyModal
          apiKey={editingKey as any}
          onClose={() => { setShowEdit(false); setEditingKey(null); }}
          onUpdate={(updated) => { handleUpdateKey(updated as any); setShowEdit(false); setEditingKey(null); }}
        />
      )}
    </div>
  );
};

export default ApiKeys;
