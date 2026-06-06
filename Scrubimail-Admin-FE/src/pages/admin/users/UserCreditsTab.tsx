import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, RefreshCw, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import type { AdminUser } from './index';
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
  UBTN_GHOST,
  UMINT,
  UERR,
  UOK,
} from './userTheme';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  created_at: string;
  balance_after?: number;
}

interface Props {
  userId: string;
  user: AdminUser;
  onRefresh: () => void;
}

const txColor = (t: Transaction) =>
  ['auto_reset', 'manual_reset'].includes(t.transaction_type)
    ? 'text-amber-600 dark:text-[#f59e0b]'
    : t.amount > 0
      ? UMINT
      : t.transaction_type === 'usage'
        ? 'text-gray-500 dark:text-[#bacbbf]/50'
        : 'text-red-600 dark:text-[#ff4c4c]';

const UserCreditsTab: React.FC<Props> = ({ userId, user, onRefresh }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/billing/', { params: { user_id: userId } });
      const all: Transaction[] = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setTransactions(all.filter((t: any) => String(t.user_id ?? t.billing_profile?.user ?? '') === String(userId)));
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(amount, 10);
    if (!n || n <= 0) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await axiosInstance.post('/admin/billing/adjust/', {
        user_id: userId,
        amount: mode === 'add' ? n : -n,
        reason: reason || (mode === 'add' ? 'Admin credit grant' : 'Admin credit deduction'),
      });
      setSuccess(`${mode === 'add' ? 'Added' : 'Deducted'} ${n} credits successfully`);
      setAmount('');
      setReason('');
      fetchTransactions();
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? `Failed to ${mode} credits`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCycle = async () => {
    setResetting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await axiosInstance.post(`/admin/users/${userId}/reset-billing/`);
      setSuccess(res.data?.detail ?? 'Billing cycle reset successfully');
      setConfirmReset(false);
      fetchTransactions();
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to reset billing cycle');
    } finally {
      setResetting(false);
    }
  };

  const credits = user.billing?.credits_remaining ?? 0;
  const usedThisMonth = user.billing?.credits_used_this_month ?? 0;
  const planCredits = user.billing?.current_plan?.credits_per_month ?? 0;
  const usedPct = planCredits > 0 ? Math.min((usedThisMonth / planCredits) * 100, 100) : 0;

  const txLabel = (t: Transaction) =>
    (
      {
        usage: 'Usage',
        purchase: 'Purchase',
        grant: 'Grant',
        deduction: 'Deduction',
        refund: 'Refund',
        bonus: 'Bonus',
        expired: 'Expired',
        plan_credits: 'Plan Credits',
        auto_reset: 'Auto Reset',
        manual_reset: 'Manual Reset',
      } as Record<string, string>
    )[t.transaction_type] ?? t.transaction_type;

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="space-y-4">
        <div className={UCARD}>
          <div className={`px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Credit Balance</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-center">
              <p className="font-['JetBrains_Mono',monospace] text-4xl font-bold text-emerald-600 dark:text-[#6effc0]">
                {credits.toLocaleString()}
              </p>
              <p className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41] uppercase tracking-[0.15em] mt-1">
                Credits Remaining
              </p>
            </div>

            <div className={`${UPANEL} rounded-sm p-3 space-y-2`}>
              <div className="flex justify-between">
                <span className={ULABEL}>Used This Month</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]">{usedThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={ULABEL}>Plan Allocation</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]">{planCredits.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-[#080C10] rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${usedPct > 80 ? 'bg-red-500 dark:bg-[#ff4c4c]' : 'bg-emerald-500 dark:bg-[#6effc0]'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="font-mono text-[8px] text-gray-500 dark:text-[#3b4a41] text-right">{usedPct.toFixed(1)}% used</p>
            </div>
          </div>
        </div>

        <div className={UCARD}>
          <div className={`px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Billing Cycle</p>
          </div>
          <div className="p-4 space-y-3">
            <div className={`${UPANEL} rounded-sm p-3 space-y-2`}>
              <div className="flex justify-between">
                <span className={ULABEL}>Cycle Started</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]">
                  {user.billing?.plan_start_date
                    ? new Date(user.billing.plan_start_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={ULABEL}>Last Reset</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]">
                  {user.billing?.credits_reset_date
                    ? new Date(user.billing.credits_reset_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                disabled={!user.billing?.current_plan}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.12em] border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:border-[#f59e0b]/30 dark:text-[#f59e0b] dark:bg-[#f59e0b]/08 dark:hover:bg-[#f59e0b]/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3 h-3" /> Reset Billing Cycle
              </button>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-[9px] text-gray-600 dark:text-[#bacbbf]/60 leading-relaxed">
                  This will reset credits to{' '}
                  <strong className="text-gray-900 dark:text-[#e0e3e8]">{planCredits.toLocaleString()}</strong> (plan
                  allocation), clear usage, and set the cycle start to now.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className={`flex-1 py-2 font-mono text-[9px] uppercase tracking-[0.1em] rounded-sm transition-colors ${UBTN_GHOST}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCycle}
                    disabled={resetting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500 text-white dark:bg-[#f59e0b] dark:text-[#1c2024] font-mono text-[9px] uppercase tracking-[0.12em] font-bold rounded-sm hover:brightness-105 disabled:opacity-40 transition-all"
                  >
                    {resetting ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Resetting…
                      </>
                    ) : (
                      'Confirm Reset'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={UCARD}>
          <div className={`px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Adjust Credits</p>
          </div>
          <div className="p-4">
            {error && <div className={`mb-3 rounded-sm p-2.5 font-mono text-[10px] ${UERR}`}>{error}</div>}
            {success && <div className={`mb-3 rounded-sm p-2.5 font-mono text-[10px] ${UOK}`}>{success}</div>}

            <div className={`flex ${UPANEL} border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm p-0.5 mb-4`}>
              {(['add', 'deduct'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-all ${
                    mode === m
                      ? m === 'add'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-[#ff4c4c]/15 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20'
                      : 'text-gray-400 hover:text-gray-700 dark:text-[#bacbbf]/40 dark:hover:text-[#bacbbf]'
                  }`}
                >
                  {m === 'add' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {m === 'add' ? 'Add' : 'Deduct'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className={`${ULABEL} block mb-1.5`}>Amount</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className={UINPUT}
                  required
                />
              </div>
              <div>
                <label className={`${ULABEL} block mb-1.5`}>Reason (optional)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Admin grant, refund, etc."
                  className={UINPUT}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !amount}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.15em] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === 'add'
                    ? 'bg-emerald-500 text-white dark:bg-[#6effc0] dark:text-[#003824] hover:brightness-105 shadow-sm dark:shadow-[0_0_15px_rgba(110,255,192,0.15)]'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-[#ff4c4c]/20 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/30 dark:hover:bg-[#ff4c4c]/30'
                }`}
              >
                {submitting ? 'Processing…' : mode === 'add' ? `Add ${amount || '—'} Credits` : `Deduct ${amount || '—'} Credits`}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className={`${UCARD} overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Transaction History</p>
            <button type="button" onClick={fetchTransactions} disabled={loading} className={UICON_BTN}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-10 ${USKELETON} rounded animate-pulse`} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">No transactions found</p>
            </div>
          ) : (
            <div className={UDIVIDE}>
              <div className={`grid grid-cols-[1fr_100px_80px_130px] gap-3 px-4 py-2 ${UPANEL}`}>
                {['Description', 'Type', 'Amount', 'Date'].map((h) => (
                  <span key={h} className={ULABEL}>
                    {h}
                  </span>
                ))}
              </div>
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className={`grid grid-cols-[1fr_100px_80px_130px] gap-3 px-4 py-3 ${UROW_HOVER} transition-colors items-center`}
                >
                  <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf] truncate">
                    {t.description ?? '—'}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-400 dark:text-[#bacbbf]/50">
                    {txLabel(t)}
                  </span>
                  <span className={`font-mono text-[11px] font-bold flex items-center gap-1 ${txColor(t)}`}>
                    {t.amount > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {t.amount > 0 ? '+' : ''}
                    {t.amount.toLocaleString()}
                  </span>
                  <span className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41]">
                    {new Date(t.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCreditsTab;
