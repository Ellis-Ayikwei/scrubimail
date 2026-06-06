import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, FileText, Key, History, Activity, RefreshCw,
  ArrowUpRight, Zap, TerminalSquare, Globe, TrendingUp, TrendingDown
} from 'lucide-react';
import { validationService, ValidationHistory } from '../services/validationService';
import { billingService, BillingProfile, UsageStats } from '../services/billingService';
import { userService } from '../services/userService';
import dayjs from 'dayjs';

// ── Design tokens (mobile-first light + dark:) ───────────────────────────────
const CARD =
  'bg-white/95 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm shadow-sm dark:shadow-none';
const CARD_HEADER_BORDER = 'border-b border-gray-200 dark:border-[#3b4a41]/30';
const CARD_FOOTER_BORDER = 'border-t border-gray-200 dark:border-[#3b4a41]/30';
const LABEL = 'font-label uppercase tracking-[0.1em] text-[10px] text-gray-500 dark:text-[#bacbbf]';
const MONO = 'font-mono';
const SUBTLE_ROW = 'text-gray-500 dark:text-[#3b4a41]';
const BODY_TEXT = 'text-gray-700 dark:text-[#bacbbf]';
const INSET = 'bg-gray-50 border border-gray-100 dark:bg-[#101418] dark:border-transparent';

const STATUS_DOT: Record<string, string> = {
  valid: 'bg-emerald-500 dark:bg-[#6effc0]',
  invalid: 'bg-red-500 dark:bg-[#ff4c4c]',
  risky: 'bg-amber-500 dark:bg-[#f59e0b]',
};
const STATUS_TEXT: Record<string, string> = {
  valid: 'text-emerald-600 dark:text-[#6effc0]',
  invalid: 'text-red-600 dark:text-[#ff4c4c]',
  risky: 'text-amber-600 dark:text-[#f59e0b]',
};

// ── Component ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<ValidationHistory | null>(null);
  const [billing, setBilling] = useState<BillingProfile | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      try {
        const profile = await userService.getComprehensiveProfile();
        if (profile.billing) {
          const p = profile.billing.current_plan;
          setBilling({
            id: 1,
            current_plan: {
              id: 0,
              name: p.name,
              price: p.price,
              credits_per_month: p.credits,
            },
            credits_remaining: profile.billing.credits_remaining,
            credits_used_this_month: profile.billing.credits_used_this_month,
            billing_status: 'active',
            total_credits_purchased: profile.billing.credits_remaining + profile.billing.credits_used_this_month,
            total_amount_spent: 0,
            last_credit_purchase: null,
            plan_start_date: new Date().toISOString(),
            plan_end_date: null,
            auto_renew: false,
            usage_percentage: 0,
            is_trial: false,
            trial_end_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        if (profile.usage) {
          const u = profile.usage;
          setUsage({
            total_validations: u.total_validations,
            valid_emails: u.valid_emails,
            invalid_emails: u.invalid_emails,
            success_rate: u.success_rate,
            this_month: {
              validations: u.total_validations,
              credits_used: u.credits_used,
              cost: u.total_validations > 0 ? u.cost_per_validation * u.total_validations : 0,
            },
            daily_usage: u.daily_usage.map((d) => ({
              date: d.date,
              validations: d.validations,
              credits_used: 0,
            })),
          });
        }
        const h = await validationService.getValidationHistory({ page_size: 5 }).catch(() => null);
        if (h) setHistory(h);
      } catch {
        const [h, b, u] = await Promise.all([
          validationService.getValidationHistory({ page_size: 5 }).catch(() => null),
          billingService.getBillingProfile().catch(() => null),
          billingService.getUsageStats().catch(() => null),
        ]);
        if (h) setHistory(h);
        if (b) setBilling(b);
        if (u) setUsage(u);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const creditsUsed = billing?.credits_used_this_month ?? 0;
  const creditsTotal = (billing?.credits_remaining ?? 0) + creditsUsed;
  const usedPct = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0;

  const stats = [
    { label: 'Total Validations', value: usage?.total_validations?.toLocaleString() ?? '0', change: '+12%', up: true },
    { label: 'Valid Emails',       value: usage?.valid_emails?.toLocaleString() ?? '0',       change: '+8%',  up: true },
    { label: 'Invalid Emails',     value: usage?.invalid_emails?.toLocaleString() ?? '0',     change: '-3%',  up: false },
    { label: 'Success Rate',       value: `${usage?.success_rate?.toFixed(1) ?? '0'}%`,        change: '',     up: true },
  ];

  const sysOps = [
    { title: 'Single Email Validation', desc: 'Real-time check for individual records.', icon: CheckCircle, link: '/validate' },
    { title: 'Bulk Validation',          desc: 'Upload .csv or .json for massive processing.', icon: FileText,   link: '/validate' },
    { title: 'API Integration',          desc: 'Connect directly into your infrastructure.', icon: Key,         link: '/apikeys' },
    { title: 'View History',             desc: 'Review and download past scrubbing reports.', icon: History,     link: '/history' },
  ];

  const recent = history?.results.slice(0, 5).map(r => ({
    id: `#${String(r.id).padStart(4, '0')}`,
    email: r.email,
    status: r.is_valid ? 'valid' : 'invalid',
    ts: dayjs((r as any).created_at).format('HH:mm:ss'),
    latency: Math.floor(Math.random() * 200) + 50,
  })) ?? [];

  let liveLogRows: React.ReactNode;
  if (loading) {
    liveLogRows = [0, 1, 2, 3].map((row) => (
      <div
        key={`log-skeleton-${row}`}
        className="px-4 py-3 grid grid-cols-[60px_1fr_80px_80px_50px] gap-3 items-center"
      >
        <div className="h-2 bg-gray-200 rounded animate-pulse dark:bg-[#31353a]" />
        <div className="h-2 bg-gray-200 rounded animate-pulse dark:bg-[#31353a]" />
        <div className="h-2 bg-gray-200 rounded animate-pulse dark:bg-[#31353a]" />
        <div className="h-2 bg-gray-200 rounded animate-pulse dark:bg-[#31353a]" />
        <div className="h-2 bg-gray-200 rounded animate-pulse dark:bg-[#31353a]" />
      </div>
    ));
  } else if (recent.length > 0) {
    liveLogRows = recent.map((r) => (
      <div
        key={`${r.id}-${r.email}`}
        className="px-4 py-2.5 grid grid-cols-[60px_1fr_90px_70px_40px] gap-3 items-center hover:bg-gray-50 transition-colors dark:hover:bg-[#262a2f]"
      >
        <span className={`${MONO} text-[10px] ${SUBTLE_ROW}`}>{r.id}</span>
        <span className={`${MONO} text-[11px] ${BODY_TEXT} truncate`}>{r.email}</span>
        <span className={`${MONO} text-[10px] ${SUBTLE_ROW}`}>{r.ts}</span>
        <span className={`inline-flex items-center gap-1 ${STATUS_TEXT[r.status] ?? STATUS_TEXT.valid}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? STATUS_DOT.valid}`} />
          <span className="font-label uppercase tracking-[0.08em] text-[9px]">{r.status}</span>
        </span>
        <span className={`${MONO} text-[9px] ${SUBTLE_ROW} text-right`}>{r.latency}ms</span>
      </div>
    ));
  } else {
    liveLogRows = (
      <div className="px-4 py-6 text-center">
        <p className={`${LABEL} text-gray-400 dark:text-[#3b4a41]`}>No validations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-body">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`${MONO} text-[10px] text-emerald-600 dark:text-[#6effc0]`}>v2.4.0-stable</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-[#6effc0] rounded-full animate-pulse" />
          </div>
          <h1 className="font-headline text-2xl font-black text-gray-900 dark:text-[#e0e3e8] tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-gray-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors disabled:opacity-40 dark:bg-[#1c2024] dark:border-[#3b4a41]/40 dark:text-[#bacbbf] dark:hover:text-[#6effc0] dark:hover:border-[#6effc0]/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className={LABEL}>Refresh</span>
          </button>
          <Link
            to="/validate"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 rounded-sm text-white font-label uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-emerald-600 transition-colors dark:bg-[#6effc0] dark:text-[#003824] dark:hover:bg-[#47ffb8]"
          >
            <Zap className="w-3.5 h-3.5" />
            New Validation
          </Link>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${CARD} p-4`}>
            <p className={LABEL}>{s.label}</p>
            <p className={`${MONO} text-2xl font-bold text-gray-900 dark:text-[#e0e3e8] mt-1`}>
              {loading ? '—' : s.value}
            </p>
            {s.change && (
              <div className="flex items-center gap-1 mt-1">
                {s.up ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-[#6effc0]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 dark:text-[#ff4c4c]" />
                )}
                <span
                  className={`${MONO} text-[10px] ${s.up ? 'text-emerald-600 dark:text-[#6effc0]' : 'text-red-600 dark:text-[#ff4c4c]'}`}
                >
                  {s.change}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* System operations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-[#6effc0] rounded-full" />
            <p className={LABEL}>System Operations</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sysOps.map((op) => {
              const Icon = op.icon;
              return (
                <Link
                  key={op.title}
                  to={op.link}
                  className={`${CARD} p-4 group hover:border-emerald-300 hover:bg-gray-50 transition-all relative overflow-hidden dark:hover:border-[#6effc0]/40 dark:hover:bg-[#262a2f]`}
                >
                  <ArrowUpRight className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors dark:text-[#3b4a41] dark:group-hover:text-[#6effc0]" />
                  <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center mb-3 group-hover:border-emerald-300 transition-colors dark:bg-[#101418] dark:border-[#3b4a41]/40 dark:group-hover:border-[#6effc0]/30">
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-[#6effc0]" />
                  </div>
                  <p className="font-label uppercase tracking-[0.08em] text-[11px] text-gray-900 dark:text-[#e0e3e8] font-semibold mb-1">
                    {op.title}
                  </p>
                  <p className="text-[10px] text-gray-600 dark:text-[#bacbbf] leading-relaxed">{op.desc}</p>
                </Link>
              );
            })}
          </div>

          {/* Live log stream */}
          <div className={CARD}>
            <div className={`flex items-center justify-between px-4 py-2.5 ${CARD_HEADER_BORDER}`}>
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0]" />
                <p className={LABEL}>Live Log Stream</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-[#6effc0] rounded-full animate-pulse" />
                <span className={`${MONO} text-[9px] text-emerald-600 dark:text-[#6effc0]`}>LIVE_FEED_READY</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3b4a41]/20">{liveLogRows}</div>
            <div className={`px-4 py-2 ${CARD_FOOTER_BORDER}`}>
              <Link
                to="/history"
                className={`${MONO} text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors dark:text-[#6effc0] dark:hover:text-[#47ffb8]`}
              >
                View All Activity →
              </Link>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* API Health */}
          <div className={CARD}>
            <div className={`flex items-center justify-between px-4 py-2.5 ${CARD_HEADER_BORDER}`}>
              <p className={LABEL}>API Health</p>
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0]" />
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <p className={`${LABEL}`}>Credits Remaining</p>
                  <p className={`${MONO} text-base font-bold text-gray-900 dark:text-[#e0e3e8]`}>
                    {(billing?.credits_remaining ?? 0).toLocaleString()}
                    <span className="text-gray-400 text-xs dark:text-[#3b4a41]"> / {creditsTotal.toLocaleString()}</span>
                  </p>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-[#101418]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 dark:bg-[#6effc0]"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className={`${INSET} rounded-sm p-2.5`}>
                  <p className={LABEL}>Monthly Fee</p>
                  <p className={`${MONO} text-sm font-bold text-gray-900 dark:text-[#e0e3e8] mt-0.5`}>
                    ${billing?.current_plan?.price ?? '0'}
                  </p>
                </div>
                <div className={`${INSET} rounded-sm p-2.5`}>
                  <p className={LABEL}>Avg Latency</p>
                  <p className={`${MONO} text-sm font-bold text-gray-900 dark:text-[#e0e3e8] mt-0.5`}>14ms</p>
                </div>
              </div>

              <div className={`${INSET} rounded-sm px-3 py-2 flex items-center justify-between`}>
                <p className={LABEL}>Current Plan</p>
                <span className="font-label uppercase tracking-[0.08em] text-[10px] text-emerald-700 font-bold dark:text-[#6effc0]">
                  {billing?.current_plan?.name ?? 'Free'}
                </span>
              </div>

              <Link
                to="/billing"
                className="flex items-center justify-center w-full py-2 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 font-label uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-emerald-100 transition-colors dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0] dark:hover:bg-[#6effc0]/20"
              >
                Refill Credits
              </Link>
            </div>
          </div>

          {/* Infrastructure status */}
          <div className={CARD}>
            <div className={`flex items-center justify-between px-4 py-2.5 ${CARD_HEADER_BORDER}`}>
              <p className={LABEL}>Infrastructure Status</p>
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0]" />
            </div>
            <div className="p-4 space-y-2">
              {[
                { name: 'Node Alpha', load: '82%', status: 'ok' as const },
                { name: 'Node Beta', load: '45%', status: 'ok' as const },
                { name: 'Proxy Cluster', load: '97%', status: 'critical' as const },
              ].map((node) => (
                <div key={node.name} className="flex items-center justify-between py-1.5">
                  <p className={`${MONO} text-[11px] text-gray-700 dark:text-[#bacbbf]`}>{node.name}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`${MONO} text-[10px] ${
                        node.status === 'critical'
                          ? 'text-red-600 dark:text-[#ff4c4c]'
                          : 'text-gray-500 dark:text-[#bacbbf]'
                      }`}
                    >
                      {node.load} Load
                    </span>
                    <span
                      className={`font-label uppercase tracking-[0.08em] text-[9px] px-1.5 py-0.5 rounded-sm border ${
                        node.status === 'critical'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-[#ff4c4c]/10 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
