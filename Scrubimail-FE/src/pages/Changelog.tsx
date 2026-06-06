import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Wrench, Shield, Bug, AlertTriangle, Archive, ChevronDown, ChevronUp, Search } from 'lucide-react';
import axiosInstance from '../services/axiosInstance';

interface ChangelogEntry {
    id: number;
    version: string;
    title: string;
    summary: string;
    body: string;
    entry_type: string;
    entry_type_display: string;
    published_at: string | null;
}

/** Light + dark classes per entry type (mobile-first: unprefixed = light). */
const TYPE_CONFIG: Record<
    string,
    { label: string; icon: React.ReactNode; active: string; inactive: string }
> = {
    feature: {
        label: 'Feature',
        icon: <Zap className="w-3 h-3" />,
        active:
            'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20',
        inactive: 'text-gray-500 hover:text-emerald-700 dark:text-[#3b4a41] dark:hover:text-[#bacbbf]',
    },
    improvement: {
        label: 'Improvement',
        icon: <Wrench className="w-3 h-3" />,
        active:
            'bg-blue-100 text-blue-800 border-blue-300 dark:bg-[#60a5fa]/10 dark:text-[#60a5fa] dark:border-[#60a5fa]/20',
        inactive: 'text-gray-500 hover:text-blue-700 dark:text-[#3b4a41] dark:hover:text-[#bacbbf]',
    },
    fix: {
        label: 'Bug Fix',
        icon: <Bug className="w-3 h-3" />,
        active:
            'bg-amber-100 text-amber-900 border-amber-300 dark:bg-[#f59e0b]/10 dark:text-[#f59e0b] dark:border-[#f59e0b]/20',
        inactive: 'text-gray-500 hover:text-amber-800 dark:text-[#3b4a41] dark:hover:text-[#bacbbf]',
    },
    security: {
        label: 'Security',
        icon: <Shield className="w-3 h-3" />,
        active:
            'bg-red-100 text-red-800 border-red-300 dark:bg-[#ff4c4c]/10 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20',
        inactive: 'text-gray-500 hover:text-red-700 dark:text-[#3b4a41] dark:hover:text-[#bacbbf]',
    },
    breaking: {
        label: 'Breaking',
        icon: <AlertTriangle className="w-3 h-3" />,
        active:
            'bg-red-100 text-red-800 border-red-300 dark:bg-[#ff4c4c]/10 dark:text-[#ff4c4c] dark:border-[#ff4c4c]/20',
        inactive: 'text-gray-500 hover:text-red-700 dark:text-[#3b4a41] dark:hover:text-[#bacbbf]',
    },
    deprecation: {
        label: 'Deprecated',
        icon: <Archive className="w-3 h-3" />,
        active:
            'bg-gray-200 text-gray-800 border-gray-400 dark:bg-[#3b4a41]/30 dark:text-[#bacbbf] dark:border-[#3b4a41]/40',
        inactive: 'text-gray-500 hover:text-gray-800 dark:text-[#3b4a41] dark:hover:text-[#bacbbf]',
    },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.feature;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono uppercase tracking-[0.08em] text-[9px] border ${cfg.active}`}
        >
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

const ChangelogPage: React.FC = () => {
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState<string>('all');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    useEffect(() => {
        axiosInstance
            .get('/changelog/')
            .then((res) => setEntries(Array.isArray(res.data) ? res.data : res.data.results ?? []))
            .catch((err) => setError(err.message || 'Failed to load changelog'))
            .finally(() => setLoading(false));
    }, []);

    const toggle = (id: number) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const filtered = entries.filter((e) => {
        const matchesType = activeType === 'all' || e.entry_type === activeType;
        const matchesSearch =
            !search ||
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.summary.toLowerCase().includes(search.toLowerCase()) ||
            e.version.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    const filterBtnBase =
        'px-3 py-1 rounded-sm font-mono uppercase tracking-[0.08em] text-[9px] border transition-colors';

    return (
        <div className="space-y-0 bg-white dark:bg-transparent" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Hero */}
            <div className="py-16 px-4 sm:px-6 border-b border-gray-200 dark:border-[#3b4a41]/20 relative overflow-hidden">
                <div
                    className="absolute inset-0 pointer-events-none dark:hidden"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 60%)',
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none hidden dark:block"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(110,255,192,0.06) 0%, transparent 60%)',
                    }}
                />
                <div className="max-w-3xl mx-auto relative">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#6effc0] animate-pulse" />
                        <span className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-700 dark:text-[#6effc0]">
                            System Log
                        </span>
                    </div>
                    <h1
                        className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] mb-3"
                        style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
                    >
                        Changelog
                    </h1>
                    <p className="font-mono text-sm text-gray-600 dark:text-[#bacbbf]/60 mb-8">
                        Every improvement, fix, and new feature — all in one place.
                    </p>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search releases…"
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1c2024] border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm text-gray-900 dark:text-[#e0e3e8] font-mono text-sm focus:border-emerald-500/60 dark:focus:border-[#6effc0]/50 focus:outline-none placeholder-gray-400 dark:placeholder-[#3b4a41]"
                        />
                    </div>
                </div>
            </div>

            {/* Filter strip */}
            <div
                className="sticky top-12 z-10 border-b border-gray-200 dark:border-[#3b4a41]/20 py-2 px-4 sm:px-6 bg-white/95 dark:bg-[#080c10]/95 backdrop-blur-md"
            >
                <div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setActiveType('all')}
                        className={`${filterBtnBase} ${
                            activeType === 'all'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                                : 'text-gray-500 hover:text-gray-900 border-transparent dark:text-[#3b4a41] dark:hover:text-[#bacbbf]'
                        }`}
                    >
                        All
                    </button>
                    {ALL_TYPES.map((type) => {
                        const cfg = TYPE_CONFIG[type];
                        const isOn = activeType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setActiveType(type === activeType ? 'all' : type)}
                                className={`${filterBtnBase} inline-flex items-center gap-1 border-transparent ${
                                    isOn ? cfg.active : cfg.inactive
                                } ${isOn ? '' : 'border-transparent'}`}
                            >
                                {cfg.icon}
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Entries */}
            <div className="py-10 px-4 sm:px-6 bg-gray-50/50 dark:bg-transparent">
                <div className="max-w-3xl mx-auto">
                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-20 bg-gray-200 dark:bg-[#1c2024] rounded-sm animate-pulse"
                                />
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <p className="font-mono text-xs text-red-600 dark:text-[#ff4c4c]">{error}</p>
                        </div>
                    )}

                    {!loading && !error && filtered.length === 0 && (
                        <div className="text-center py-12">
                            <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41] uppercase tracking-[0.2em]">
                                No entries found.
                            </p>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="relative">
                            {/* Timeline line */}
                            <div
                                className="absolute left-[5.5rem] top-0 bottom-0 w-px hidden sm:block bg-gradient-to-b from-emerald-400 via-gray-300 to-gray-200 dark:from-[#6effc0] dark:via-[#3b4a41] dark:to-[#3b4a41]"
                            />

                            <div className="space-y-4">
                                {filtered.map((entry) => {
                                    const isOpen = expanded.has(entry.id);
                                    return (
                                        <div key={entry.id} className="sm:flex gap-6">
                                            <div className="hidden sm:flex flex-col items-end w-20 flex-shrink-0 pt-4">
                                                {entry.published_at && (
                                                    <span className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41] text-right leading-tight uppercase tracking-[0.05em]">
                                                        {new Date(entry.published_at).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="hidden sm:flex flex-col items-center w-4 flex-shrink-0 pt-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-[#6effc0] border-2 border-white dark:border-[#080c10] z-10 shadow-[0_0_8px_rgba(16,185,129,0.35)] dark:shadow-[0_0_8px_rgba(110,255,192,0.5)]" />
                                            </div>
                                            <div className="flex-1 bg-white dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm overflow-hidden hover:border-gray-300 dark:hover:border-[#3b4a41]/70 transition-colors shadow-sm dark:shadow-none">
                                                <button
                                                    type="button"
                                                    className="w-full text-left p-5"
                                                    onClick={() => toggle(entry.id)}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                <span className="font-mono text-[9px] px-2 py-0.5 bg-gray-100 dark:bg-[#101418] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm text-gray-700 dark:text-[#bacbbf] uppercase tracking-[0.08em]">
                                                                    {entry.version}
                                                                </span>
                                                                <TypeBadge type={entry.entry_type} />
                                                                {entry.published_at && (
                                                                    <span className="sm:hidden font-mono text-[9px] text-gray-500 dark:text-[#3b4a41] uppercase tracking-[0.05em]">
                                                                        {new Date(entry.published_at).toLocaleDateString(
                                                                            'en-GB',
                                                                            {
                                                                                day: 'numeric',
                                                                                month: 'short',
                                                                                year: 'numeric',
                                                                            }
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-[#e0e3e8] text-sm mb-1 tracking-tight">
                                                                {entry.title}
                                                            </h3>
                                                            <p className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]/60 line-clamp-2">
                                                                {entry.summary}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0 text-gray-400 dark:text-[#3b4a41] mt-1">
                                                            {isOpen ? (
                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                                {isOpen && (
                                                    <div className="px-5 pb-5 border-t border-gray-200 dark:border-[#3b4a41]/30 pt-4">
                                                        <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-[#bacbbf]/80 leading-relaxed">
                                                            {entry.body}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CTA */}
            <div className="py-16 px-4 sm:px-6 border-t border-gray-200 dark:border-[#3b4a41]/20 text-center bg-gray-50 dark:bg-[#080c10] [background-image:radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08)_0%,transparent_60%)] dark:[background-image:radial-gradient(circle_at_50%_50%,rgba(110,255,192,0.05)_0%,transparent_60%)]">
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-700 dark:text-[#6effc0] mb-3">
                    Stay In The Loop
                </p>
                <h2 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight mb-3">
                    All updates ship here.
                </h2>
                <p className="font-mono text-xs text-gray-500 dark:text-[#bacbbf]/50 mb-6">
                    Bookmark this page or check back anytime.
                </p>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold px-6 py-3 rounded-sm hover:brightness-105 transition-all"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default ChangelogPage;
