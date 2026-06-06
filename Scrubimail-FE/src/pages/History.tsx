import React, { useEffect, useState } from 'react';
import {
  Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  TerminalSquare, Filter, TrendingUp
} from 'lucide-react';
import axiosInstance from '../services/axiosInstance';

// ── Design tokens ──────────────────────────────────────────────────────────────
const CARD = 'bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm';
const LABEL = 'font-label uppercase tracking-[0.1em] text-[10px] text-[#bacbbf]';
const MONO  = 'font-mono';

const VERDICT_CFG: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  valid:       { dot: 'bg-[#6effc0]', text: 'text-[#6effc0]', bg: 'bg-[#6effc0]/10 border border-[#6effc0]/20', label: 'DELIVERABLE' },
  invalid:     { dot: 'bg-[#ff4c4c]', text: 'text-[#ff4c4c]', bg: 'bg-[#ff4c4c]/10 border border-[#ff4c4c]/20', label: 'BOUNCED' },
  risky:       { dot: 'bg-[#f59e0b]', text: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10 border border-[#f59e0b]/20', label: 'RISKY' },
  high_risk:   { dot: 'bg-[#ef4444]', text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border border-[#ef4444]/20', label: 'HIGH RISK' },
};

const getVerdict = (record: any): string => {
  if (record.verdict) return record.verdict.toLowerCase().replace(' ', '_');
  if (record.is_valid === true) return 'valid';
  if (record.score !== undefined) {
    if (record.score >= 80) return 'valid';
    if (record.score >= 50) return 'risky';
    return 'invalid';
  }
  return 'invalid';
};

const History: React.FC = () => {
  const [rows, setRows]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [dateFilter, setDate]     = useState('last_24h');
  const [typeFilter, setType]     = useState('all');
  const [summary, setSummary]     = useState({ total: 0, valid: 0, invalid: 0, risky: 0, bounced: 0 });
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/history/');
      const data = res.data;
      const results = data.results ?? data;
      setRows(Array.isArray(results) ? results : []);
      if (data.count) setTotalPages(Math.ceil(data.count / 20));
      if (data.summary) {
        setSummary({
          total:   data.summary.total_validations ?? 0,
          valid:   data.summary.valid_emails ?? 0,
          invalid: data.summary.invalid_emails ?? 0,
          risky:   data.summary.risky_emails ?? 0,
          bounced: data.summary.bounced_emails ?? 0,
        });
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = rows.filter(r => {
    const matchSearch = !search || r.email?.toLowerCase().includes(search.toLowerCase());
    const v = getVerdict(r);
    const matchStatus = statusFilter === 'all' || v === statusFilter;
    return matchSearch && matchStatus;
  });

  const statCards = [
    { label: 'Total Cleaned',  value: summary.total.toLocaleString(),   change: '+12.4%', up: true },
    { label: 'Deliverable',    value: summary.valid.toLocaleString(),    change: '19.2%',  up: true,  pct: summary.total ? ((summary.valid / summary.total) * 100).toFixed(1) + '%' : '—' },
    { label: 'Risky',          value: summary.risky.toLocaleString(),    change: '20.9%',  up: false, pct: summary.total ? ((summary.risky / summary.total) * 100).toFixed(1) + '%' : '—' },
    { label: 'Bounced',        value: summary.invalid.toLocaleString(),  change: '5.9%',   up: false, pct: summary.total ? ((summary.invalid / summary.total) * 100).toFixed(1) + '%' : '—' },
  ];

  return (
    <div className="space-y-5 font-body">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-2xl font-black text-[#e0e3e8] tracking-tight">History Logs</h1>
          <p className={`${LABEL} mt-0.5`}>Validation Audit Trail and Status Reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm text-[#bacbbf] hover:text-[#6effc0] hover:border-[#6effc0]/30 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className={LABEL}>Refresh</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6effc0]/10 border border-[#6effc0]/20 rounded-sm text-[#6effc0] hover:bg-[#6effc0]/20 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span className="font-label uppercase tracking-[0.1em] text-[10px]">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className={`${CARD} p-4`}>
            <p className={LABEL}>{s.label}</p>
            <p className={`${MONO} text-xl font-bold text-[#e0e3e8] mt-1`}>{loading ? '—' : s.value}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {s.pct && <span className={`${MONO} text-[10px] text-[#bacbbf]`}>{s.pct}</span>}
              <span className={`${MONO} text-[10px] ${s.up ? 'text-[#6effc0]' : 'text-[#ff4c4c]'}`}>
                {s.up ? '+' : '-'}{s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className={`${CARD} px-4 py-3 flex flex-wrap items-center gap-3`}>
        <Filter className="w-3.5 h-3.5 text-[#bacbbf] flex-shrink-0" />
        <span className={LABEL}>Filters:</span>

        {/* Date */}
        <select
          value={dateFilter}
          onChange={e => setDate(e.target.value)}
          className={`bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-2 py-1 ${MONO} text-[10px] text-[#bacbbf] outline-none focus:border-[#6effc0]/40`}
        >
          <option value="last_24h">Date: Last 24h</option>
          <option value="last_7d">Date: Last 7d</option>
          <option value="last_30d">Date: Last 30d</option>
          <option value="all">Date: All Time</option>
        </select>

        {/* Type */}
        <select
          value={typeFilter}
          onChange={e => setType(e.target.value)}
          className={`bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-2 py-1 ${MONO} text-[10px] text-[#bacbbf] outline-none focus:border-[#6effc0]/40`}
        >
          <option value="all">Type: All</option>
          <option value="single">Type: Single</option>
          <option value="bulk">Type: Bulk</option>
          <option value="api">Type: API</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className={`bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-2 py-1 ${MONO} text-[10px] text-[#bacbbf] outline-none focus:border-[#6effc0]/40`}
        >
          <option value="all">Status: All</option>
          <option value="valid">Deliverable</option>
          <option value="invalid">Bounced</option>
          <option value="risky">Risky</option>
        </select>

        {/* Search */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-2.5 py-1 focus-within:border-[#6effc0]/40">
          <Search className="w-3 h-3 text-[#3b4a41] flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entity identifier..."
            className={`bg-transparent ${MONO} text-[10px] text-[#bacbbf] placeholder-[#3b4a41] outline-none w-full`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3b4a41]/30">
                {['Timestamp', 'Entity Identifier', 'Verification Status', 'Quality Score', 'Protocol', 'Action'].map(h => (
                  <th key={h} className={`px-4 py-2.5 text-left ${LABEL}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b4a41]/20">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-2 bg-[#31353a] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : error
                  ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <p className={`${MONO} text-[11px] text-[#ff4c4c]`}>{error}</p>
                        </td>
                      </tr>
                    )
                  : filtered.length === 0
                    ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <TerminalSquare className="w-6 h-6 text-[#3b4a41] mx-auto mb-2" />
                            <p className={`${LABEL} text-[#3b4a41]`}>No records found</p>
                          </td>
                        </tr>
                      )
                    : filtered.map((r, i) => {
                        const v = getVerdict(r);
                        const cfg = VERDICT_CFG[v] ?? VERDICT_CFG.invalid;
                        const score = r.score ?? (v === 'valid' ? 90 : v === 'risky' ? 55 : 10);
                        return (
                          <tr key={i} className="hover:bg-[#262a2f] transition-colors group">
                            <td className="px-4 py-3">
                              <p className={`${MONO} text-[10px] text-[#bacbbf]`}>
                                {r.created_at
                                  ? new Date(r.created_at).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })
                                  : '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`${MONO} text-[11px] text-[#e0e3e8]`}>{r.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-label uppercase tracking-[0.08em] ${cfg.bg} ${cfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-[#101418] rounded-full overflow-hidden w-16">
                                  <div
                                    className={`h-full rounded-full ${score >= 80 ? 'bg-[#6effc0]' : score >= 50 ? 'bg-[#f59e0b]' : 'bg-[#ff4c4c]'}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                <span className={`${MONO} text-[10px] text-[#bacbbf]`}>{score}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`${MONO} text-[10px] text-[#bacbbf]`}>
                                {r.job_type?.toUpperCase() ?? 'SMTP_HELD'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button className="p-1 text-[#3b4a41] hover:text-[#6effc0] transition-colors">
                                <span className={`${MONO} text-[11px]`}>⋮</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#3b4a41]/30">
          <p className={`${MONO} text-[10px] text-[#3b4a41]`}>
            Index: 001 – {Math.min(filtered.length, 20)} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-[#101418] border border-[#3b4a41]/40 text-[#bacbbf] hover:text-[#6effc0] hover:border-[#6effc0]/30 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            {Array.from({ length: Math.min(totalPages, 4) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-6 h-6 flex items-center justify-center rounded-sm ${MONO} text-[10px] border transition-colors ${
                  page === i + 1
                    ? 'bg-[#6effc0] text-[#003824] border-[#6effc0] font-bold'
                    : 'bg-[#101418] border-[#3b4a41]/40 text-[#bacbbf] hover:border-[#6effc0]/30 hover:text-[#6effc0]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-[#101418] border border-[#3b4a41]/40 text-[#bacbbf] hover:text-[#6effc0] hover:border-[#6effc0]/30 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Live log footer */}
      <div className={`${CARD} flex flex-col lg:flex-row gap-4`}>
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#6effc0] animate-pulse" />
            <span className={LABEL}>Live Validator Stream</span>
            <span className={`${MONO} text-[9px] text-[#3b4a41]`}>Node Edge</span>
          </div>
          <div className="space-y-1.5">
            {[
              '[OK] Connection established with MX cluster US-EAST-1',
              '[INFO] Batch 9942 processing... 78% complete',
              '[OK] Verification successful for user.karl@enterprise.co (latency: 142ex)',
              '[SCAN] Potential catch-all detected at domain: startup-hub.io',
              '[FAIL] DNS Resolution failure for fe.972.node.local',
              '[OK] Writing 50 results to DB cluster main_history...',
            ].map((line, i) => (
              <p key={i} className={`${MONO} text-[10px] text-[#bacbbf]/60`}>
                <span className={line.startsWith('[OK]') ? 'text-[#6effc0]' : line.startsWith('[FAIL]') ? 'text-[#ff4c4c]' : line.startsWith('[SCAN]') ? 'text-[#f59e0b]' : 'text-[#bacbbf]/40'}>
                  {line.split(' ')[0]}
                </span>
                {' '}{line.slice(line.indexOf(' ') + 1)}
              </p>
            ))}
          </div>
        </div>

        <div className={`lg:w-52 p-4 border-t lg:border-t-0 lg:border-l border-[#3b4a41]/30`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#6effc0]" />
            <p className={LABEL}>Usage Limit</p>
          </div>
          <p className={`${MONO} text-xs text-[#bacbbf] mb-1`}>Monthly Quota</p>
          <div className="w-full h-1 bg-[#101418] rounded-full overflow-hidden mb-1">
            <div className="h-full bg-[#6effc0] rounded-full" style={{ width: '64%' }} />
          </div>
          <p className={`${MONO} text-[10px] text-[#3b4a41]`}>64.4%</p>
          <p className={`${MONO} text-[10px] text-[#bacbbf] mt-3`}>
            You have 145,571 validations remaining this billing cycle.
          </p>
          <button className="mt-3 w-full py-1.5 bg-[#6effc0]/10 border border-[#6effc0]/20 rounded-sm text-[#6effc0] font-label uppercase tracking-[0.1em] text-[9px] hover:bg-[#6effc0]/20 transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
