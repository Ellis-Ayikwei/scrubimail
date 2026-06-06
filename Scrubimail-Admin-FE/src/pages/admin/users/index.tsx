import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, User, CreditCard, BarChart3,
  Key, AlertTriangle, Zap, Shield, UserCog,
} from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import UserOverviewTab from './UserOverviewTab';
import UserCreditsTab from './UserCreditsTab';
import UserPlanTab from './UserPlanTab';
import UserValidationsTab from './UserValidationsTab';
import UserApiKeysTab from './UserApiKeysTab';
import UserActionsTab from './UserActionsTab';
import UserSecurityTab from './UserSecurityTab';
import UserPermissionsTab from './UserPermissionsTab';
import { UCARD } from './userTheme';

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  user_type?: string;
  billing?: {
    current_plan?: { id: number; name: string; price: string; credits_per_month: number };
    credits_remaining?: number;
    credits_used_this_month?: number;
    credits_reset_date?: string;
    plan_start_date?: string;
  };
}

const TABS = [
  { id: 'overview',    label: 'Overview',    Icon: User },
  { id: 'credits',     label: 'Credits',     Icon: CreditCard },
  { id: 'plan',        label: 'Plan',        Icon: Zap },
  { id: 'validations', label: 'Validations', Icon: BarChart3 },
  { id: 'apikeys',     label: 'API Keys',    Icon: Key },
  { id: 'security',    label: 'Security',    Icon: Shield },
  { id: 'permissions', label: 'Permissions', Icon: UserCog },
  { id: 'actions',     label: 'Actions',     Icon: AlertTriangle },
];

const LABEL =
  "font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-emerald-600 dark:text-[#6effc0]";

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/admin/users/${id}/`);
      setUser(res.data);
      console.log("res.data", res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const displayName = user
    ? (user.first_name || user.last_name)
      ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
      : user.username ?? user.email
    : '—';

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            type="button"
            className="p-1.5 border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm text-gray-600 dark:text-[#bacbbf] hover:text-emerald-600 dark:hover:text-[#6effc0] hover:border-emerald-500/40 dark:hover:border-[#6effc0]/30 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <p className={`${LABEL} mb-0.5`}>User Management</p>
            <h1 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-xl tracking-tight">
              {loading ? '—' : displayName}
            </h1>
            {user && (
              <p className="font-mono text-[10px] text-gray-500 dark:text-[#bacbbf]/50 mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] rounded-sm border ${
              user.is_active
                ? 'bg-[#6effc0]/10 text-[#6effc0] border-[#6effc0]/20'
                : 'bg-[#ff4c4c]/10 text-[#ff4c4c] border-[#ff4c4c]/20'
            }`}>
              {user.is_active ? 'Active' : 'Suspended'}
            </span>
          )}
          <button
            type="button"
            onClick={fetchUser}
            disabled={loading}
            className="p-1.5 border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm text-gray-600 dark:text-[#bacbbf] hover:text-emerald-600 dark:hover:text-[#6effc0] hover:border-emerald-500/40 dark:hover:border-[#6effc0]/30 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/30 rounded-sm p-3 font-mono text-xs text-red-700 dark:text-[#ff4c4c]">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-px bg-gray-100 dark:bg-[#101418] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm p-0.5 flex-wrap">
        {TABS.map(({ id: tid, label, Icon }) => (
          <button
            key={tid}
            type="button"
            onClick={() => setActiveTab(tid)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-sm font-mono uppercase tracking-[0.1em] text-[10px] transition-all ${
              activeTab === tid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                : 'text-gray-500 hover:text-gray-800 dark:text-[#bacbbf]/50 dark:hover:text-[#bacbbf]'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading && !user ? (
        <div className={`${UCARD} p-8 text-center`}>
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-[#6effc0] animate-spin mx-auto mb-2" />
          <p className="font-mono text-xs text-gray-500 dark:text-[#bacbbf]/40">Loading user…</p>
        </div>
      ) : user ? (
        <>
          {activeTab === 'overview'    && <UserOverviewTab    user={user} onRefresh={fetchUser} />}
          {activeTab === 'credits'     && <UserCreditsTab     userId={id!} user={user} onRefresh={fetchUser} />}
          {activeTab === 'plan'        && <UserPlanTab        userId={id!} user={user} onRefresh={fetchUser} />}
          {activeTab === 'validations' && <UserValidationsTab userId={id!} />}
          {activeTab === 'apikeys'     && <UserApiKeysTab     userId={id!} />}
          {activeTab === 'security'    && <UserSecurityTab    userId={id!} />}
          {activeTab === 'permissions' && <UserPermissionsTab userId={id!} />}
          {activeTab === 'actions'     && <UserActionsTab     user={user} onRefresh={fetchUser} />}
        </>
      ) : null}
    </div>
  );
};

export default UserDetailPage;
