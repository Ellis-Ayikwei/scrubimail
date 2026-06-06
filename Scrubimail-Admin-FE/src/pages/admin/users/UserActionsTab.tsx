import React, { useState } from 'react';
import { AlertTriangle, Power, PowerOff, KeyRound, Trash2, RefreshCw } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import type { AdminUser } from './index';
import { UCARD, ULABEL, UMINT } from './userTheme';

interface Props {
  user: AdminUser;
  onRefresh: () => void;
}

type ActionKey = 'toggle_active' | 'reset_password' | 'delete';

const UserActionsTab: React.FC<Props> = ({ user, onRefresh }) => {
  const [pending, setPending] = useState<ActionKey | null>(null);
  const [confirm, setConfirm] = useState<ActionKey | null>(null);
  const [messages, setMessages] = useState<Record<ActionKey, string | null>>({
    toggle_active: null,
    reset_password: null,
    delete: null,
  });

  const setMsg = (key: ActionKey, msg: string | null) => setMessages((prev) => ({ ...prev, [key]: msg }));

  const run = async (key: ActionKey) => {
    setPending(key);
    setMsg(key, null);
    try {
      if (key === 'toggle_active') {
        await axiosInstance.patch(`/admin/users/${user.id}/`, { is_active: !user.is_active });
        setMsg(key, user.is_active ? 'User suspended.' : 'User activated.');
        onRefresh();
      } else if (key === 'reset_password') {
        await axiosInstance.post(`/admin/users/${user.id}/reset_password/`);
        setMsg(key, 'Password reset email sent.');
      } else if (key === 'delete') {
        await axiosInstance.delete(`/admin/users/${user.id}/`);
        setMsg(key, 'User deleted. Redirecting…');
        setTimeout(() => window.history.back(), 1500);
      }
    } catch (e: any) {
      setMsg(key, `Error: ${e?.response?.data?.detail ?? 'Request failed'}`);
    } finally {
      setPending(null);
      setConfirm(null);
    }
  };

  const actions = [
    {
      key: 'toggle_active' as ActionKey,
      Icon: user.is_active ? PowerOff : Power,
      label: user.is_active ? 'Suspend Account' : 'Activate Account',
      description: user.is_active
        ? 'Immediately blocks the user from logging in or making API calls.'
        : 'Re-enables the account, restoring full access.',
      confirmLabel: user.is_active ? 'Confirm Suspend' : 'Confirm Activate',
      iconWrap:
        user.is_active
          ? 'bg-red-50 border-red-200 text-red-600 dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c]'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/30 dark:text-[#6effc0]',
      triggerBtn:
        user.is_active
          ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-[#ff4c4c]/40 dark:text-[#ff4c4c] dark:bg-[#ff4c4c]/08 dark:hover:bg-[#ff4c4c]/15'
          : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:border-[#6effc0]/40 dark:text-[#6effc0] dark:bg-[#6effc0]/10 dark:hover:bg-[#6effc0]/20',
      confirmBtn:
        user.is_active
          ? 'bg-red-600 text-white dark:bg-[#ff4c4c] border border-red-700 dark:border-[#ff4c4c]'
          : 'bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] border border-emerald-700 dark:border-[#6effc0]',
    },
    {
      key: 'reset_password' as ActionKey,
      Icon: KeyRound,
      label: 'Send Password Reset',
      description: "Sends a password reset email to the user's registered email address.",
      confirmLabel: 'Send Reset Email',
      iconWrap:
        'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400',
      triggerBtn:
        'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20',
      confirmBtn:
        'bg-amber-600 text-white dark:bg-amber-500 dark:text-[#1a1408] border border-amber-700 dark:border-amber-400',
    },
    {
      key: 'delete' as ActionKey,
      Icon: Trash2,
      label: 'Delete Account',
      description: 'Permanently deletes the user account and all associated data. This cannot be undone.',
      confirmLabel: 'Permanently Delete',
      iconWrap: 'bg-red-50 border-red-200 text-red-600 dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c]',
      triggerBtn:
        'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-[#ff4c4c]/40 dark:text-[#ff4c4c] dark:bg-[#ff4c4c]/08 dark:hover:bg-[#ff4c4c]/15',
      confirmBtn: 'bg-red-600 text-white dark:bg-[#ff4c4c] border border-red-700 dark:border-[#ff4c4c]',
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 dark:bg-[#ff4c4c]/5 dark:border-[#ff4c4c]/20 rounded-sm p-4">
        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-[#ff4c4c] mt-0.5 shrink-0" />
        <div>
          <p className="font-['Space_Grotesk',sans-serif] text-[9px] uppercase tracking-[0.15em] text-red-700 dark:text-[#ff4c4c] mb-1">
            Admin Actions
          </p>
          <p className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]/70">
            These actions affect the user&apos;s account directly. Some cannot be undone. Proceed with caution.
          </p>
        </div>
      </div>

      {actions.map(({ key, Icon, label, description, confirmLabel, iconWrap, triggerBtn, confirmBtn }) => {
        const msg = messages[key];
        const isError = msg?.startsWith('Error:');
        return (
          <div key={key} className={UCARD}>
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-sm border shrink-0 ${iconWrap}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-['Space_Grotesk',sans-serif] font-semibold text-[11px] text-gray-900 dark:text-[#e0e3e8] mb-1">
                    {label}
                  </p>
                  <p className="font-mono text-[9px] text-gray-600 dark:text-[#bacbbf]/60 leading-relaxed max-w-sm">{description}</p>
                  {msg && (
                    <p
                      className={`font-mono text-[10px] mt-2 ${
                        isError ? 'text-red-600 dark:text-[#ff4c4c]' : UMINT
                      }`}
                    >
                      {msg}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {confirm !== key ? (
                  <button
                    type="button"
                    onClick={() => setConfirm(key)}
                    disabled={pending !== null}
                    className={`px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] rounded-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${triggerBtn}`}
                  >
                    {label}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirm(null)}
                      className="px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400 border border-gray-300 dark:text-[#bacbbf]/40 dark:border-[#3b4a41]/40 rounded-sm hover:text-gray-700 dark:hover:text-[#bacbbf] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => run(key)}
                      disabled={pending === key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] font-bold rounded-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${confirmBtn}`}
                    >
                      {pending === key ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Processing…
                        </>
                      ) : (
                        confirmLabel
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="rounded-sm border border-gray-200 dark:border-[#3b4a41]/40 bg-gray-50 dark:bg-[#101418] px-4 py-3 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className={`${ULABEL} mb-0.5`}>Acting on</p>
            <p className="font-mono text-[10px] text-gray-900 dark:text-[#e0e3e8]">{user.email}</p>
          </div>
          <div>
            <p className={`${ULABEL} mb-0.5`}>User ID</p>
            <p className="font-mono text-[10px] text-gray-500 dark:text-[#bacbbf]/50">{user.id}</p>
          </div>
          <div>
            <p className={`${ULABEL} mb-0.5`}>Current Status</p>
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm border ${
                user.is_active
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-[#ff4c4c]/10 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20'
              }`}
            >
              {user.is_active ? 'Active' : 'Suspended'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActionsTab;
