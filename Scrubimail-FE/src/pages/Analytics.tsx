import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { validationService, ValidationAnalytics } from '../services/validationService';
import { billingService, UsageStats } from '../services/billingService';
import axiosInstance from '../services/axiosInstance';

const CARD = 'bg-card border border-border/40 rounded-sm';
const LABEL = "font-label uppercase tracking-[0.1em] text-[10px] text-muted-foreground";
const MONO = "font-mono";

const DAYS_MAP: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

const scoreStatus = (score: number) =>
  score >= 80 ? 'DELIVERABLE' : score >= 50 ? 'RISKY' : 'BOUNCED';

const statusStyle = (s: string) =>
  s === 'DELIVERABLE'
    ? 'bg-primary/10 text-primary border-primary/20'
    : s === 'BOUNCED'
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : 'bg-warning/10 text-warning border-warning/20';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-muted rounded animate-pulse ${className}`} />
);

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState<ValidationAnalytics | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const days = DAYS_MAP[dateRange] ?? 30;
    try {
      const [a, u, h] = await Promise.all([
        validationService.getValidationAnalytics({ start_date: undefined, end_date: undefined }).catch(() => null),
        billingService.getUsageStats().catch(() => null),
        axiosInstance.get('/history/', { params: { page_size: 10 } }).then(r => r.data?.results ?? []).catch(() => []),
      ]);
      // Re-fetch analytics with the selected days param
      const aWithDays = await axiosInstance
        .get('/analytics/', { params: { days } })
        .then(r => r.data)
        .catch(() => a);
      if (aWithDays) setAnalytics(aWithDays);
      else if (a) setAnalytics(a);
      if (u) setUsage(u);
      setRecentHistory(h);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const overview = analytics?.overview;
  const daily = analytics?.daily_stats ?? [];
  const topDomains = (analytics as any)?.top_domains ?? [];

  const totalV  = overview?.total_validations ?? 0;
  const validV  = daily.reduce((s, d) => s + (d.valid_count ?? 0), 0);
  const invalidV = daily.reduce((s, d) => s + (d.invalid_count ?? 0), 0);
  const riskyV  = Math.max(0, totalV - validV - invalidV);
  const successRate = overview?.success_rate ?? 0;
  const avgScore = overview?.avg_score ?? 0;

  const statCards = [
    { label: 'Total Validations', value: totalV.toLocaleString(),         color: 'text-foreground' },
    { label: 'Deliverable',       value: validV.toLocaleString(),          color: 'text-primary' },
    { label: 'Invalid / Bounce',  value: invalidV.toLocaleString(),        color: 'text-destructive' },
    { label: 'Success Rate',      value: `${successRate.toFixed(1)}%`,     color: 'text-primary' },
    { label: 'Avg Score',         value: Math.round(avgScore).toString(),  color: 'text-muted-foreground' },
  ];

  // Normalise chart — use daily_stats, fallback to usage.daily_usage
  const chartRows = daily.length > 0
    ? daily.map(d => ({
        date: d.date,
        valid: d.valid_count ?? 0,
        invalid: d.invalid_count ?? 0,
        risky: Math.max(0, (d as any).total - (d.valid_count ?? 0) - (d.invalid_count ?? 0)),
      }))
    : (usage?.daily_usage ?? []).map(d => ({
        date: d.date,
        valid: d.validations,
        invalid: 0,
        risky: 0,
      }));

  const maxBar = Math.max(...chartRows.map(d => d.valid + d.invalid + d.risky), 1);

  const exportCSV = () => {
    const rows = [
      ['email', 'status', 'score', 'date'],
      ...recentHistory.map(r => [
        r.email,
        scoreStatus(r.score ?? 0),
        r.score ?? '',
        r.created_at ?? '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytics-${dateRange}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className={`${LABEL} text-primary mb-0.5`} style={{ letterSpacing: '0.2em', fontSize: 9 }}>API Usage</p>
          <h1 className="font-headline font-black text-foreground text-2xl tracking-tight">Analytics</h1>
          <p className={`${LABEL} mt-0.5`}>Track email validation performance and usage patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="bg-card border border-border/40 rounded-sm px-3 py-2 text-muted-foreground font-mono text-xs focus:border-primary/50 focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2 border border-border/40 rounded-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-3 font-mono text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className={`${CARD} p-4`}>
            <p className={LABEL}>{label}</p>
            {loading
              ? <Skeleton className="h-7 w-20 mt-1" />
              : <p className={`${MONO} text-2xl font-bold mt-1 ${color}`}>{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Bar chart — real daily_stats */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
          <p className={LABEL}>Validation Volume</p>
          <div className="flex items-center gap-4">
            {[['Valid', 'var(--primary)'], ['Invalid', 'var(--destructive)'], ['Risky', 'var(--warning)']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-[0.1em]">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` } as any} />
              ))}
            </div>
          ) : chartRows.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground/70 text-center py-10">No data for this period</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {chartRows.map((d, i) => {
                const total = d.valid + d.invalid + d.risky || 1;
                const h = (total / maxBar) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col gap-0.5 items-stretch" style={{ height: '100%' }}>
                    <div className="flex flex-col justify-end flex-1 gap-px">
                      {d.risky > 0  && <div className="w-full rounded-sm" style={{ height: `${(d.risky  / total) * h}%`, minHeight: 2, backgroundColor: 'var(--warning)', opacity: 0.8 }} />}
                      {d.invalid > 0 && <div className="w-full rounded-sm" style={{ height: `${(d.invalid / total) * h}%`, minHeight: 2, backgroundColor: 'var(--destructive)', opacity: 0.8 }} />}
                      {d.valid > 0  && <div className="w-full rounded-sm" style={{ height: `${(d.valid  / total) * h}%`, minHeight: 2, backgroundColor: 'var(--primary)', opacity: 0.8 }} />}
                    </div>
                    <p className="font-mono text-[7px] text-muted-foreground/70 text-center mt-1">
                      {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Email status breakdown */}
        <div className={CARD}>
          <div className="px-4 py-3 border-b border-border/30">
            <p className={LABEL}>Email Status Breakdown</p>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Deliverable',        count: validV,   color: 'var(--primary)' },
              { label: 'Invalid / Bounce',   count: invalidV, color: 'var(--destructive)' },
              { label: 'Risky / Catch-All',  count: riskyV,   color: 'var(--warning)' },
            ].map(({ label, count, color }) => {
              const pct = totalV > 0 ? Math.round((count / totalV) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                    {loading
                      ? <Skeleton className="h-3 w-10" />
                      : <span className="font-mono text-[10px]" style={{ color }}>{pct}% · {count.toLocaleString()}</span>
                    }
                  </div>
                  <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: loading ? '0%' : `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top domains */}
        <div className={CARD}>
          <div className="px-4 py-3 border-b border-border/30">
            <p className={LABEL}>Top Domains</p>
          </div>
          <div className="p-4 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : topDomains.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground/70 py-4 text-center">No domain data</p>
            ) : (
              topDomains.slice(0, 8).map((d: any) => (
                <div key={d.domain} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground truncate">{d.domain}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[10px] text-muted-foreground/70">{d.count.toLocaleString()}</span>
                    <span className="font-mono text-[10px] text-primary">{Math.round(d.avg_score)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Credits usage strip */}
      {(usage || loading) && (
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <p className={LABEL}>Credit Usage — This Month</p>
            {!loading && usage && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {usage.this_month?.credits_used?.toLocaleString() ?? 0} credits used
              </span>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-2 w-full" />
          ) : usage ? (
            (() => {
              const used = usage.this_month?.credits_used ?? 0;
              const total = (usage.total_validations ?? 0) > 0 ? usage.total_validations : used || 1;
              const pct = Math.min((used / total) * 100, 100);
              return (
                <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })()
          ) : null}
        </div>
      )}

      {/* Recent validations table */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <p className={LABEL}>Recent Validations</p>
          <button
            onClick={exportCSV}
            disabled={loading || recentHistory.length === 0}
            className="flex items-center gap-1 font-mono text-[9px] text-primary hover:underline disabled:opacity-40 uppercase tracking-[0.1em]"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          ) : recentHistory.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground/70 text-center py-8">No recent validations</p>
          ) : (
            recentHistory.map((r, i) => {
              const status = scoreStatus(r.score ?? 0);
              const ts = r.created_at
                ? new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-xs font-mono">
                  <span className="flex-1 text-foreground truncate">{r.email}</span>
                  <span className={`px-2 py-0.5 rounded-sm uppercase tracking-[0.08em] text-[9px] border flex-shrink-0 ${statusStyle(status)}`}>
                    {status}
                  </span>
                  <span className="text-muted-foreground w-8 text-center flex-shrink-0">{r.score ?? '—'}</span>
                  <span className="text-muted-foreground/70 w-28 text-right flex-shrink-0 hidden sm:block">{ts}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
