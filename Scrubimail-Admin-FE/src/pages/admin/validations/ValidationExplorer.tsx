import * as React from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, Download, Gauge, MailCheck, RefreshCw, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { DataTable, type DataTableColumn, StatCard, StatCardGrid, StatusBadge } from '@/components/admin';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiError, downloadCsv } from '@/lib/api';
import { formatDate, formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import {
    OUTCOME_FILTER_ITEMS,
    outcomeMeta,
    scoreClass,
    type AdminValidation,
    type AdminValidationPage,
} from '@/lib/validation';
import { ValidationDetailSheet } from './ValidationDetailSheet';

interface ValidationStats {
    total_validations?: number;
    completed?: number;
    valid_emails?: number;
    invalid_emails?: number;
    catch_all_emails?: number;
    unknown_emails?: number;
    do_not_mail_emails?: number;
    pending?: number;
    failed?: number;
    success_rate?: number;
    average_score?: number;
    processing_time_avg_ms?: number | null;
    users_validating?: number;
    top_domains?: Array<{ domain: string; count: number; valid_rate: number }>;
    daily_stats?: Array<{ date: string; validations: number; valid_count: number; invalid_count: number }>;
}

const RANGE_ITEMS: Record<string, string> = {
    all: 'All time',
    '1': 'Last 24 hours',
    '7': 'Last 7 days',
    '30': 'Last 30 days',
    '90': 'Last 90 days',
};

const JOB_TYPE_ITEMS: Record<string, string> = {
    all: 'All sources',
    single: 'Single',
    bulk: 'Bulk',
    api: 'API',
};

const PAGE = 500;

const dailyChartConfig: ChartConfig = {
    valid_count: { label: 'Valid', color: 'var(--color-success)' },
    invalid_count: { label: 'Invalid', color: 'var(--color-destructive)' },
    other: { label: 'Other', color: 'var(--color-muted-foreground)' },
};

function useDebounced<T>(value: T, delay = 350) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export interface ValidationExplorerProps {
    /** Pin the explorer to one user (the user-detail tab). Hides the user column. */
    userId?: string;
    /** Hide the domain / daily-volume cards. */
    compact?: boolean;
}

/**
 * Server-filtered validation browser shared by the Validation Explorer page and
 * the user-detail Validations tab. Filters go to the API (the table can hold
 * hundreds of thousands of rows); the table then sorts/paginates the loaded page.
 */
export function ValidationExplorer({ userId, compact }: ValidationExplorerProps) {
    const [outcome, setOutcome] = React.useState('all');
    const [range, setRange] = React.useState('all');
    const [jobType, setJobType] = React.useState('all');
    const [search, setSearch] = React.useState('');
    const debouncedSearch = useDebounced(search.trim());
    const [limit, setLimit] = React.useState(PAGE);

    const [rows, setRows] = React.useState<AdminValidation[]>([]);
    const [count, setCount] = React.useState(0);
    const [stats, setStats] = React.useState<ValidationStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selected, setSelected] = React.useState<AdminValidation | null>(null);

    const params = React.useMemo(() => {
        const p: Record<string, string | number> = {};
        if (userId) p.user_id = userId;
        if (outcome !== 'all') p.status = outcome;
        if (range !== 'all') p.days = range;
        if (jobType !== 'all') p.job_type = jobType;
        if (debouncedSearch) p.search = debouncedSearch;
        return p;
    }, [userId, outcome, range, jobType, debouncedSearch]);

    // Reset paging whenever the filter set changes.
    React.useEffect(() => setLimit(PAGE), [params]);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        const [listRes, statsRes] = await Promise.allSettled([
            axiosInstance.get<AdminValidationPage>('/admin/validations/', { params: { ...params, limit } }),
            axiosInstance.get<ValidationStats>('/admin/validations/stats/', { params }),
        ]);
        if (listRes.status === 'fulfilled') {
            setRows(Array.isArray(listRes.value.data?.results) ? listRes.value.data.results : []);
            setCount(listRes.value.data?.count ?? 0);
        } else {
            setRows([]);
            setCount(0);
            setError(apiError(listRes.reason, 'Could not load validations.'));
        }
        if (statsRes.status === 'fulfilled') {
            setStats(statsRes.value.data ?? null);
        } else {
            setStats(null);
            if (listRes.status === 'fulfilled') setError(apiError(statsRes.reason, 'Could not load statistics.'));
        }
        setLoading(false);
    }, [params, limit]);

    React.useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const exportCsv = React.useCallback(() => {
        if (!rows.length) {
            toast.info('Nothing to export for the current filters.');
            return;
        }
        downloadCsv(
            `validations-${new Date().toISOString().slice(0, 10)}.csv`,
            ['email', 'outcome', 'sub_status', 'score', 'source', 'user', 'processing_ms', 'created_at'],
            rows.map((r) => [
                r.email,
                r.status,
                r.sub_status ?? '',
                r.score ?? '',
                r.job_type,
                r.user?.email ?? '',
                r.processing_ms ?? '',
                r.created_at,
            ])
        );
        if (count > rows.length) toast.info(`Exported the ${rows.length} loaded rows of ${count}.`);
    }, [rows, count]);

    const columns = React.useMemo<DataTableColumn<AdminValidation>[]>(() => {
        const cols: DataTableColumn<AdminValidation>[] = [
            {
                id: 'email',
                header: 'Email',
                sortValue: (r) => r.email,
                cell: (r) => (
                    <div className="max-w-[280px] min-w-0">
                        <p className="truncate font-medium">{r.email}</p>
                        {r.sub_status && <p className="text-muted-foreground truncate font-mono text-xs">{r.sub_status}</p>}
                    </div>
                ),
            },
            {
                id: 'status',
                header: 'Outcome',
                sortValue: (r) => r.status,
                cell: (r) => {
                    const m = outcomeMeta(r.status);
                    return <StatusBadge status={r.status} label={m.label} tone={m.tone} />;
                },
            },
            {
                id: 'score',
                header: 'Score',
                sortValue: (r) => r.score,
                cell: (r) => (
                    <div className="flex items-center gap-2">
                        <span className={`w-7 text-right font-medium tabular-nums ${scoreClass(r.score)}`}>
                            {r.score ?? '—'}
                        </span>
                        <div className="bg-muted hidden h-1.5 w-14 overflow-hidden rounded-full sm:block">
                            <div
                                className="h-full rounded-full bg-current"
                                style={{ width: `${Math.max(0, Math.min(100, r.score ?? 0))}%`, color: outcomeMeta(r.status).color }}
                            />
                        </div>
                    </div>
                ),
            },
        ];
        if (!userId) {
            cols.push({
                id: 'user',
                header: 'User',
                sortValue: (r) => r.user?.email,
                cell: (r) =>
                    r.user ? (
                        <Link
                            to={`/admin/users/${r.user.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary block max-w-[200px] truncate hover:underline"
                        >
                            {r.user.name || r.user.email}
                        </Link>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            });
        }
        cols.push(
            {
                id: 'source',
                header: 'Source',
                sortValue: (r) => r.job_type,
                cell: (r) => <span className="text-muted-foreground capitalize">{r.job_type}</span>,
            },
            {
                id: 'time',
                header: 'Time',
                sortValue: (r) => r.processing_ms,
                className: 'tabular-nums',
                cell: (r) => (r.processing_ms != null ? `${formatNumber(r.processing_ms)}ms` : '—'),
            },
            {
                id: 'created',
                header: 'Date',
                sortValue: (r) => r.created_at,
                cell: (r) => (
                    <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(r.created_at)}>
                        {formatDate(r.created_at)}
                    </span>
                ),
            }
        );
        return cols;
    }, [userId]);

    const completed = stats?.completed ?? 0;
    const share = (n?: number) => (completed ? `${formatPercent(((n ?? 0) / completed) * 100)} of completed` : undefined);
    const daily = (stats?.daily_stats ?? []).map((d) => ({
        ...d,
        label: formatDate(d.date).replace(/, \d{4}$/, ''),
        other: Math.max(0, d.validations - d.valid_count - d.invalid_count),
    }));

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Some data failed to load</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    <AlertAction>
                        <Button size="sm" variant="outline" onClick={() => void fetchData()}>
                            Retry
                        </Button>
                    </AlertAction>
                </Alert>
            )}

            <StatCardGrid className={compact ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}>
                <StatCard
                    label="Validations"
                    icon={MailCheck}
                    loading={loading && !stats}
                    value={formatNumber(stats?.total_validations ?? 0)}
                    hint={
                        stats?.pending || stats?.failed
                            ? `${formatNumber(stats?.pending ?? 0)} in flight · ${formatNumber(stats?.failed ?? 0)} failed`
                            : 'Matching the filters'
                    }
                />
                <StatCard
                    label="Valid"
                    icon={CheckCircle2}
                    loading={loading && !stats}
                    value={formatNumber(stats?.valid_emails ?? 0)}
                    hint={share(stats?.valid_emails)}
                />
                <StatCard
                    label="Invalid"
                    icon={XCircle}
                    loading={loading && !stats}
                    value={formatNumber(stats?.invalid_emails ?? 0)}
                    hint={share(stats?.invalid_emails)}
                />
                <StatCard
                    label="Average score"
                    icon={Gauge}
                    loading={loading && !stats}
                    value={(stats?.average_score ?? 0).toFixed(1)}
                    hint={`Catch-all ${formatNumber(stats?.catch_all_emails ?? 0)} · Unknown ${formatNumber(stats?.unknown_emails ?? 0)}`}
                />
                {!compact && (
                    <StatCard
                        label="Avg. processing"
                        icon={Clock}
                        loading={loading && !stats}
                        value={stats?.processing_time_avg_ms != null ? `${formatNumber(stats.processing_time_avg_ms)}ms` : '—'}
                        hint={`${formatNumber(stats?.users_validating ?? 0)} users validating`}
                    />
                )}
            </StatCardGrid>

            {!compact && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Daily volume</CardTitle>
                            <CardDescription>Last 30 days, by outcome</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {daily.length ? (
                                <ChartContainer config={dailyChartConfig} className="h-[220px] w-full">
                                    <BarChart data={daily}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                                        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="valid_count" stackId="a" fill="var(--color-valid_count)" />
                                        <Bar dataKey="invalid_count" stackId="a" fill="var(--color-invalid_count)" />
                                        <Bar dataKey="other" stackId="a" fill="var(--color-other)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <p className="text-muted-foreground py-16 text-center text-sm">
                                    {loading ? 'Loading…' : 'No validations in the last 30 days.'}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Top domains</CardTitle>
                            <CardDescription>By volume, with valid rate</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {(stats?.top_domains ?? []).length === 0 && (
                                <p className="text-muted-foreground py-12 text-center text-sm">
                                    {loading ? 'Loading…' : 'No data.'}
                                </p>
                            )}
                            {(stats?.top_domains ?? []).slice(0, 8).map((d) => (
                                <button
                                    type="button"
                                    key={d.domain}
                                    onClick={() => setSearch(`@${d.domain}`)}
                                    className="hover:bg-muted/60 -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm"
                                    title={`Filter to @${d.domain}`}
                                >
                                    <span className="truncate">{d.domain || '—'}</span>
                                    <span className="text-muted-foreground shrink-0 tabular-nums">
                                        {formatNumber(d.count)} · {formatPercent(d.valid_rate)}
                                    </span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            <DataTable
                data={rows}
                columns={columns}
                rowKey={(r) => r.id}
                loading={loading && rows.length === 0}
                error={rows.length === 0 ? error : null}
                onRetry={() => void fetchData()}
                onRowClick={setSelected}
                emptyTitle="No validations"
                emptyDescription="Nothing matches the current filters."
                toolbar={
                    <>
                        <div className="relative w-full sm:w-64">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={userId ? 'Search email…' : 'Search email or user…'}
                                className="pl-8"
                                aria-label="Search validations"
                            />
                        </div>
                        <Select items={OUTCOME_FILTER_ITEMS} value={outcome} onValueChange={(v) => setOutcome(String(v))}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(OUTCOME_FILTER_ITEMS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select items={RANGE_ITEMS} value={range} onValueChange={(v) => setRange(String(v))}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(RANGE_ITEMS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select items={JOB_TYPE_ITEMS} value={jobType} onValueChange={(v) => setJobType(String(v))}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(JOB_TYPE_ITEMS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => void fetchData()} disabled={loading} aria-label="Refresh">
                            <RefreshCw className={loading ? 'animate-spin' : undefined} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={exportCsv} aria-label="Export CSV">
                            <Download />
                        </Button>
                    </>
                }
            />

            {count > rows.length && (
                <div className="flex items-center justify-center gap-3">
                    <p className="text-muted-foreground text-sm">
                        Showing the latest {formatNumber(rows.length)} of {formatNumber(count)}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)} disabled={loading}>
                        Load {formatNumber(Math.min(PAGE, count - rows.length))} more
                    </Button>
                </div>
            )}

            <ValidationDetailSheet validation={selected} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    );
}
