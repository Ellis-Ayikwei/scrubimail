import React, { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldOff, Smartphone, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import { UCARD, ULABEL, UHEADER, UBORDER_B, UPANEL, UDIVIDE, UROW_HOVER, UICON_BTN, UMINT, UERR, UOK } from './userTheme';

interface TrustedDevice {
  id: string;
  device_name: string;
  created_at: string;
  last_used?: string;
}

interface SecurityData {
  totp: {
    enabled: boolean;
    backup_codes_remaining: number;
  };
  trusted_devices: TrustedDevice[];
}

interface Props {
  userId: string;
}

const UserSecurityTab: React.FC<Props> = ({ userId }) => {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string | null>>({});

  const setMsg = (key: string, msg: string | null) => setMessages((prev) => ({ ...prev, [key]: msg }));

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/users/${userId}/security/`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const runAction = async (key: string, url: string) => {
    setActionPending(key);
    setMsg(key, null);
    try {
      const res = await axiosInstance.post(url);
      setMsg(key, res.data?.detail ?? 'Done');
      fetch();
    } catch (e: any) {
      setMsg(key, `Error: ${e?.response?.data?.detail ?? 'Request failed'}`);
    } finally {
      setActionPending(null);
      setConfirmAction(null);
    }
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-28 bg-gray-100 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totp = data?.totp;
  const devices = data?.trusted_devices ?? [];

  return (
    <div className="space-y-4 max-w-2xl">
      <div className={UCARD}>
        <div className={`px-4 py-3 ${UBORDER_B} flex items-center justify-between`}>
          <p className={UHEADER}>Two-Factor Authentication (TOTP)</p>
          <button type="button" onClick={fetch} disabled={loading} className={UICON_BTN}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-sm border ${
                  totp?.enabled
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/30'
                    : 'bg-gray-100 border-gray-200 dark:bg-[#3b4a41]/10 dark:border-[#3b4a41]/30'
                }`}
              >
                {totp?.enabled ? (
                  <Shield className={`w-5 h-5 ${UMINT}`} />
                ) : (
                  <ShieldOff className="w-5 h-5 text-gray-400 dark:text-[#3b4a41]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {totp?.enabled ? (
                    <CheckCircle className={`w-3.5 h-3.5 ${UMINT}`} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-gray-300 dark:text-[#bacbbf]/30" />
                  )}
                  <span
                    className={`font-mono text-sm font-bold ${
                      totp?.enabled ? UMINT : 'text-gray-500 dark:text-[#bacbbf]/50'
                    }`}
                  >
                    {totp?.enabled ? '2FA Enabled' : '2FA Not Enabled'}
                  </span>
                </div>
                {totp?.enabled && (
                  <p className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]/60">
                    {totp.backup_codes_remaining} backup code{totp.backup_codes_remaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
                {messages['disable_2fa'] && (
                  <p
                    className={`font-mono text-[10px] mt-2 ${
                      messages['disable_2fa'].startsWith('Error')
                        ? 'text-red-600 dark:text-[#ff4c4c]'
                        : UMINT
                    }`}
                  >
                    {messages['disable_2fa']}
                  </p>
                )}
              </div>
            </div>

            {totp?.enabled && (
              <div className="shrink-0">
                {confirmAction !== 'disable_2fa' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('disable_2fa')}
                    className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c] dark:bg-[#ff4c4c]/08 dark:hover:bg-[#ff4c4c]/15 rounded-sm transition-all"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-2.5 py-1.5 font-mono text-[9px] uppercase text-gray-400 border border-gray-300 dark:text-[#bacbbf]/40 dark:border-[#3b4a41]/40 rounded-sm hover:text-gray-700 dark:hover:text-[#bacbbf] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction('disable_2fa', `/admin/users/${userId}/disable-2fa/`)}
                      disabled={actionPending === 'disable_2fa'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white dark:bg-[#ff4c4c] font-mono text-[9px] uppercase tracking-[0.1em] font-bold rounded-sm disabled:opacity-40 transition-all"
                    >
                      {actionPending === 'disable_2fa' ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Working…
                        </>
                      ) : (
                        'Confirm Disable'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={UCARD}>
        <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
          <div className="flex items-center gap-2">
            <p className={UHEADER}>Trusted Devices</p>
            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-gray-200 text-gray-600 dark:bg-[#3b4a41]/30 dark:text-[#bacbbf]/60 rounded-sm">
              {devices.length}
            </span>
          </div>
          {devices.length > 0 && (
            <div className="shrink-0">
              {confirmAction !== 'revoke_devices' ? (
                <button
                  type="button"
                  onClick={() => setConfirmAction('revoke_devices')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c] dark:bg-[#ff4c4c]/08 dark:hover:bg-[#ff4c4c]/15 rounded-sm transition-all"
                >
                  <Trash2 className="w-3 h-3" /> Revoke All
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-2.5 py-1.5 font-mono text-[9px] uppercase text-gray-400 border border-gray-300 dark:text-[#bacbbf]/40 dark:border-[#3b4a41]/40 rounded-sm hover:text-gray-700 dark:hover:text-[#bacbbf] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction('revoke_devices', `/admin/users/${userId}/revoke-trusted-devices/`)}
                    disabled={actionPending === 'revoke_devices'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white dark:bg-[#ff4c4c] font-mono text-[9px] uppercase tracking-[0.1em] font-bold rounded-sm disabled:opacity-40 transition-all"
                  >
                    {actionPending === 'revoke_devices' ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Working…
                      </>
                    ) : (
                      'Confirm Revoke'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {messages['revoke_devices'] && (
          <div
            className={`mx-4 mt-3 p-2.5 rounded-sm font-mono text-[10px] border ${
              messages['revoke_devices'].startsWith('Error') ? UERR : UOK
            }`}
          >
            {messages['revoke_devices']}
          </div>
        )}

        {devices.length === 0 ? (
          <div className="p-8 text-center">
            <Smartphone className="w-6 h-6 text-gray-400 dark:text-[#3b4a41] mx-auto mb-2" />
            <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">No trusted devices</p>
          </div>
        ) : (
          <div className={UDIVIDE}>
            <div className={`grid grid-cols-[1fr_120px_120px] gap-3 px-4 py-2 ${UPANEL}`}>
              {['Device', 'Added', 'Last Used'].map((h) => (
                <span key={h} className={ULABEL}>
                  {h}
                </span>
              ))}
            </div>
            {devices.map((d) => (
              <div
                key={d.id}
                className={`grid grid-cols-[1fr_120px_120px] gap-3 px-4 py-3 ${UROW_HOVER} transition-colors items-center`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41] shrink-0" />
                  <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf] truncate">
                    {d.device_name || 'Unknown device'}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-gray-400 dark:text-[#bacbbf]/50">{fmt(d.created_at)}</span>
                <span className="font-mono text-[9px] text-gray-400 dark:text-[#bacbbf]/50">{fmt(d.last_used)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSecurityTab;
