import React, { useState } from 'react';
import { Mail, Calendar, Clock, Shield, CheckCircle, XCircle, Save, X, Edit2 } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import type { AdminUser } from './index';
import { UCARD, ULABEL, UINPUT, UHEADER, UBORDER_B, UPANEL, UMONO, UMINT, UERR } from './userTheme';

interface Props {
  user: AdminUser;
  onRefresh: () => void;
}

const Field: React.FC<{ label: string; icon?: React.ReactNode; value: React.ReactNode }> = ({ label, icon, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-200 dark:border-[#3b4a41]/20 last:border-0">
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-gray-400 dark:text-[#3b4a41]">{icon}</span>}
      <span className={ULABEL}>{label}</span>
    </div>
    <div className={UMONO}>{value}</div>
  </div>
);

const UserOverviewTab: React.FC<Props> = ({ user, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email,
    username: user.username ?? '',
    user_type: user.user_type ?? 'customer',
    is_active: user.is_active,
    is_staff: user.is_staff,
    is_superuser: user.is_superuser,
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await axiosInstance.patch(`/admin/users/${user.id}/`, form);
      setEditing(false);
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Never';

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className={UCARD}>
          <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Profile</p>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 font-mono text-[9px] text-gray-400 hover:text-emerald-600 dark:text-[#bacbbf]/40 dark:hover:text-[#6effc0] transition-colors uppercase tracking-[0.1em]"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                  className="flex items-center gap-1 font-mono text-[9px] text-gray-400 hover:text-red-600 dark:text-[#bacbbf]/40 dark:hover:text-[#ff4c4c] transition-colors uppercase tracking-[0.1em]"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-1 font-mono text-[9px] ${UMINT} hover:brightness-110 transition-colors uppercase tracking-[0.1em] disabled:opacity-40`}
                >
                  <Save className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            {error && <div className={`mb-4 rounded-sm p-3 font-mono text-[10px] ${UERR}`}>{error}</div>}

            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`${ULABEL} block mb-1`}>First Name</label>
                    <input
                      value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                      className={UINPUT}
                    />
                  </div>
                  <div>
                    <label className={`${ULABEL} block mb-1`}>Last Name</label>
                    <input
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      className={UINPUT}
                    />
                  </div>
                </div>
                <div>
                  <label className={`${ULABEL} block mb-1`}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={UINPUT}
                  />
                </div>
                <div>
                  <label className={`${ULABEL} block mb-1`}>Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    className={UINPUT}
                  />
                </div>
                <div>
                  <label className={`${ULABEL} block mb-1`}>User Type</label>
                  <select
                    value={form.user_type}
                    onChange={(e) => setForm((f) => ({ ...f, user_type: e.target.value }))}
                    className={UINPUT}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="mt-1 pt-3 border-t border-gray-200 dark:border-[#3b4a41]/20">
                  <p className={`${ULABEL} mb-3`}>Permissions & Role</p>
                  <div className="space-y-2.5">
                    {(
                      [
                        { key: 'is_active' as const, label: 'Active', desc: 'User can log in and use the platform', color: '#6effc0' },
                        { key: 'is_staff' as const, label: 'Staff', desc: 'Access to admin panel', color: '#f59e0b' },
                        { key: 'is_superuser' as const, label: 'Superuser', desc: 'Full permissions — bypasses all checks', color: '#ff4c4c' },
                      ] as const
                    ).map(({ key, label, desc, color }) => (
                      <label
                        key={key}
                        className={`flex items-center justify-between py-2 px-3 ${UPANEL} rounded-sm cursor-pointer group`}
                      >
                        <div>
                          <span className="font-mono text-[10px] text-gray-900 group-hover:text-gray-950 dark:text-[#e0e3e8] dark:group-hover:text-white transition-colors">
                            {label}
                          </span>
                          <p className="font-mono text-[8px] text-gray-500 dark:text-[#3b4a41] mt-0.5">{desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                            form[key] ? '' : 'bg-gray-200 dark:bg-[#3b4a41]'
                          }`}
                          style={form[key] ? { backgroundColor: `${color}30` } : undefined}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${
                              form[key] ? '' : 'bg-gray-100 dark:bg-[#bacbbf]'
                            }`}
                            style={{
                              backgroundColor: form[key] ? color : undefined,
                              transform: form[key] ? 'translateX(16px)' : 'translateX(0)',
                            }}
                          />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${UPANEL} rounded-sm px-4 py-1`}>
                <Field label="Email" icon={<Mail className="w-3 h-3" />} value={user.email} />
                <Field label="Username" icon={<Shield className="w-3 h-3" />} value={user.username ?? '—'} />
                <Field
                  label="Name"
                  icon={<Shield className="w-3 h-3" />}
                  value={`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '—'}
                />
                <Field
                  label="User Type"
                  value={
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:border-[#6effc0]/20 rounded-sm uppercase tracking-[0.08em]">
                      {user.user_type ?? 'customer'}
                    </span>
                  }
                />
                <Field
                  label="Permissions"
                  value={
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm border ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-[#ff4c4c]/10 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.is_staff && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 dark:bg-[#f59e0b]/10 dark:text-[#f59e0b] dark:border-[#f59e0b]/20 rounded-sm">
                          Staff
                        </span>
                      )}
                      {user.is_superuser && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 dark:bg-[#ff4c4c]/10 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20 rounded-sm">
                          Superuser
                        </span>
                      )}
                      {!user.is_staff && !user.is_superuser && (
                        <span className="font-mono text-[9px] text-gray-400 dark:text-[#bacbbf]/50">User</span>
                      )}
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className={UCARD}>
          <div className={`px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Account Status</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={ULABEL}>Status</span>
              <div className="flex items-center gap-1.5">
                {user.is_active ? (
                  <CheckCircle className={`w-3.5 h-3.5 ${UMINT}`} />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-[#ff4c4c]" />
                )}
                <span
                  className={`font-mono text-[10px] ${user.is_active ? UMINT : 'text-red-600 dark:text-[#ff4c4c]'}`}
                >
                  {user.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>

            <div className={`${UPANEL} rounded-sm px-3 py-2`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`${ULABEL} flex items-center gap-1`}>
                  <Calendar className="w-3 h-3" /> Joined
                </span>
                <span className="font-mono text-[9px] text-gray-600 dark:text-[#bacbbf]">{fmt(user.date_joined)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${ULABEL} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" /> Last Login
                </span>
                <span className="font-mono text-[9px] text-gray-600 dark:text-[#bacbbf]">{fmt(user.last_login)}</span>
              </div>
            </div>
          </div>
        </div>

        {user.billing && (
          <div className={UCARD}>
            <div className={`px-4 py-3 ${UBORDER_B}`}>
              <p className={UHEADER}>Billing Snapshot</p>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className={ULABEL}>Plan</span>
                <span className={`font-mono text-[10px] ${UMINT}`}>{user.billing.current_plan?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={ULABEL}>Credits Left</span>
                <span className="font-mono text-[11px] font-bold text-gray-900 dark:text-[#e0e3e8]">
                  {(user.billing.credits_remaining ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={ULABEL}>Used This Month</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]">
                  {(user.billing.credits_used_this_month ?? 0).toLocaleString()}
                </span>
              </div>
              {user.billing.credits_remaining !== undefined && user.billing.current_plan && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-[#101418] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 dark:bg-[#6effc0] rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (user.billing.credits_remaining / (user.billing.current_plan.credits_per_month || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOverviewTab;
