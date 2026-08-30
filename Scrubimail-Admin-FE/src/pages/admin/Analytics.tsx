import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, CreditCard, DollarSign, Download, Mail, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';

import axiosInstance from '@/services/axiosInstance';
import { PageHeader, StatCard, StatCardGrid } from '@/components/admin';
import { EmptyState } from '@/components/admin/states';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCompact, formatCurrency, formatNumber, formatPercent } from '@/lib/format';

type TimeRange = '7d' | '30d' | '90d';

interface StatusSlice {
    key: string;
    label: string;
    count: number;
    color: string;
}

interface AnalyticsData {
    users: { total: number; active: number; new: number };
    validations: { total: number };
    revenue: {
        total: number;
        this_month: number;
        avg_transaction: number;
        pending_payments: number;
        failed_payments: number;
    };
    status_breakdown: StatusSlice[];
}

/** EmailValidation.status values, mapped onto the shared chart palette. */
const VALIDATION_STATUS_META: Record<string, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'var(--color-chart-2)' },
    processing: { label: 'Processing', color: 'var(--color-chart-1)' },
    pending: { label: 'Pending', color: 'var(--color-chart-4)' },
    failed: { label: 'Failed', color: 'var(--color-destructive)' },
};

const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

const trendConfig: ChartConfig = {
    validations: { label: 'Validations', color: 'var(--color-chart-1)' },
    revenue: { label: 'Revenue', color: 'var(--color-chart-2)' },
};

const statusConfig: ChartConfig = { count: { label: 'Validations' } };

/**
 * The backend has no time-series endpoint, so the two "over time" charts use
 * illustrative data, labelled "Sample" in the UI.
 *
 * The series is derived from the day index rather than Math.random() so it stays
 * stable across renders — the previous version reshuffled itself on every
 * refresh, which read as real movement.
 */
function buildSampleSeries(range: TimeRange) {
    const days = RANGE_DAYS[range];
    return Array.from({ length: days }, (_, i) => {
        const date = dayjs().subtract(days - 1 - i, 'day');
        const wave = Math.sin(i / 3) + Math.cos(i / 7);
        return {
            date: date.format('YYYY-MM-DD'),
            label: date.format('MMM D'),
            validations: Math.round(750 + wave * 220),
            revenue: Math.round(300 + wave * 130),
        };
    });
}

const AdminAnalytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [data, setData] = useState<AnalyticsData | null>(null);

    const series = useMemo(() => buildSampleSeries(timeRange), [timeRange]);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, validationsRes, paymentsRes] = await Promise.all([
                axiosInstance.get('/admin/users/stats/'),
                axiosInstance.get('/admin/validations/stats/'),
                axiosInstance.get('/admin/payments/stats/'),
            ]);

            // Status breakdown is derived from the recent validations list.
            const recent: Array<{ status: string }> = validationsRes.data.recent_validations || [];
            const counts = recent.reduce<Record<string, number>>((acc, v) => {
                const key = v.status || 'unknown';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            setData({
                users: {
                    total: usersRes.data.total || 0,
                    active: usersRes.data.active || 0,
                    new: usersRes.data.new || 0,
                },
                validations: { total: validationsRes.data.total_validations || 0 },
                revenue: {
                    total: paymentsRes.data.total_revenue || 0,
                    this_month: paymentsRes.data.monthly_revenue || 0,
                    avg_transaction: paymentsRes.data.average_transaction || 0,
                    pending_payments: paymentsRes.data.pending_payments || 0,
                    failed_payments: paymentsRes.data.failed_payments || 0,
                },
                status_breakdown: Object.keys(counts).map((key) => ({
                    key,
                    label: VALIDATION_STATUS_META[key]?.label || key,
                    count: counts[key],
                    color: VALIDATION_STATUS_META[key]?.color || 'var(--color-muted-foreground)',
                })),
            });
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.message || 'Failed to load analytics data';
            setError(detail);
            toast.error(detail);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    /** Exports the real metrics only — the sample series is deliberately excluded. */
    const handleExport = () => {
        if (!data) return;
        const rows: Array<[string, string | number]> = [
            ['Metric', 'Value'],
            ['Total users', data.users.total],
            ['Active users', data.users.active],
            ['New users (30d)', data.users.new],
            ['Total validations', data.validations.total],
            ['Total revenue', data.revenue.total],
            ['Revenue this month', data.revenue.this_month],
            ['Average transaction', data.revenue.avg_transaction],
            ['Pending payments', data.revenue.pending_payments],
            ['Failed payments', data.revenue.failed_payments],
            ...data.status_breakdown.map(
                (slice) => [`Recent validations — ${slice.label}`, slice.count] as [string, number]
            ),
        ];

        const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `scrubimail-analytics-${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Analytics exported');
    };

    const activePct = data && data.users.total > 0 ? (data.users.active / data.users.total) * 100 : 0;
    const monthPct = data && data.revenue.total > 0 ? (data.revenue.this_month / data.revenue.total) * 100 : 0;
    const recentTotal = data?.status_breakdown.reduce((sum, s) => sum + s.count, 0) ?? 0;

    const actions = (
        <>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
                <RefreshCw className={loading ? 'animate-spin' : undefined} />
                Refresh
            </Button>
            <Button onClick={handleExport} disabled={!data || loading}>
                <Download />
                Export
            </Button>
        </>
    );

    return (
        <>
            <PageHeader
                title="Analytics"
                description="Insights into your email validation service."
                actions={actions}
            />

            {/* Degrade gracefully: a failed fetch must not blank the whole page. */}
            {error && !loading && (
                <Alert variant="destructive">
                    <AlertTriangle />
                    <AlertTitle>Couldn’t refresh analytics</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    <AlertAction>
                        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                            Retry
                        </Button>
                    </AlertAction>
                </Alert>
            )}

            <StatCardGrid>
                <StatCard
                    label="Total Validations"
                    value={formatCompact(data?.validations.total ?? 0)}
                    icon={Mail}
                    hint="All time"
                    loading={loading}
                />
                <StatCard
                    label="Total Users"
                    value={formatNumber(data?.users.total ?? 0)}
                    icon={Users}
                    hint={`${formatNumber(data?.users.new ?? 0)} new in the last 30 days`}
                    loading={loading}
                />
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(data?.revenue.total ?? 0)}
                    icon={DollarSign}
                    hint={`${formatCurrency(data?.revenue.this_month ?? 0)} this month`}
                    loading={loading}
                />
                <StatCard
                    label="Active Users"
                    value={formatNumber(data?.users.active ?? 0)}
                    icon={Activity}
                    hint={`${formatPercent(activePct)} of total`}
                    loading={loading}
                />
            </StatCardGrid>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Validations Over Time
                            <Badge variant="secondary">Sample</Badge>
                        </CardTitle>
                        <CardDescription>Placeholder series — no time-series endpoint yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={trendConfig} className="h-[300px] w-full">
                            <AreaChart data={series} margin={{ left: 4, right: 4, top: 4 }}>
                                <defs>
                                    <linearGradient id="fillValidations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-validations)" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="var(--color-validations)" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={24}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    width={44}
                                    tickFormatter={(v) => formatCompact(v as number)}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    dataKey="validations"
                                    type="natural"
                                    stroke="var(--color-validations)"
                                    fill="url(#fillValidations)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Validation Status</CardTitle>
                        <CardDescription>Breakdown of the most recent validations.</CardDescription>
                        <CardAction>
                            <Badge variant="outline">Recent</Badge>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        {!loading && data && data.status_breakdown.length === 0 ? (
                            <EmptyState title="No recent validations" icon={Mail} />
                        ) : (
                            <>
                                <ChartContainer config={statusConfig} className="h-[200px] w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                                        <Pie
                                            data={data?.status_breakdown ?? []}
                                            dataKey="count"
                                            nameKey="label"
                                            innerRadius={44}
                                        >
                                            {(data?.status_breakdown ?? []).map((slice) => (
                                                <Cell key={slice.key} fill={slice.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>

                                <ul className="mt-4 space-y-2.5">
                                    {(data?.status_breakdown ?? []).map((slice) => (
                                        <li key={slice.key} className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex min-w-0 items-center gap-2">
                                                <span
                                                    className="size-2.5 shrink-0 rounded-full"
                                                    style={{ background: slice.color }}
                                                />
                                                <span className="truncate">{slice.label}</span>
                                            </span>
                                            <span className="shrink-0 text-right">
                                                <span className="font-medium tabular-nums">
                                                    {formatNumber(slice.count)}
                                                </span>
                                                <span className="text-muted-foreground ml-2 text-xs tabular-nums">
                                                    {formatPercent(recentTotal > 0 ? (slice.count / recentTotal) * 100 : 0)}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Revenue Over Time
                        <Badge variant="secondary">Sample</Badge>
                    </CardTitle>
                    <CardDescription>Placeholder series — no time-series endpoint yet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={trendConfig} className="h-[240px] w-full">
                        <AreaChart data={series} margin={{ left: 4, right: 4, top: 4 }}>
                            <defs>
                                <linearGradient id="fillRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={52}
                                tickFormatter={(v) => formatCompact(v as number)}
                            />
                            <ChartTooltip
                                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                            />
                            <Area
                                dataKey="revenue"
                                type="natural"
                                stroke="var(--color-revenue)"
                                fill="url(#fillRevenueTrend)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-4" />
                            User Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <MetricRow label="Total users" value={formatNumber(data?.users.total ?? 0)} />
                        <MetricRow label="Active users" value={formatNumber(data?.users.active ?? 0)} />
                        <MetricRow label="New (last 30 days)" value={formatNumber(data?.users.new ?? 0)} />
                        <div className="space-y-1.5 pt-1">
                            <div className="text-muted-foreground flex justify-between text-xs">
                                <span>Active share</span>
                                <span className="tabular-nums">{formatPercent(activePct)}</span>
                            </div>
                            <Progress value={activePct} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="size-4" />
                            Billing Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <MetricRow label="Total revenue" value={formatCurrency(data?.revenue.total ?? 0)} />
                        <MetricRow label="This month" value={formatCurrency(data?.revenue.this_month ?? 0)} />
                        <MetricRow label="Average transaction" value={formatCurrency(data?.revenue.avg_transaction ?? 0)} />
                        <MetricRow
                            label="Pending / failed payments"
                            value={`${formatNumber(data?.revenue.pending_payments ?? 0)} / ${formatNumber(
                                data?.revenue.failed_payments ?? 0
                            )}`}
                        />
                        <div className="space-y-1.5 pt-1">
                            <div className="text-muted-foreground flex justify-between text-xs">
                                <span>This month vs. all time</span>
                                <span className="tabular-nums">{formatPercent(monthPct)}</span>
                            </div>
                            <Progress value={monthPct} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{value}</span>
        </div>
    );
}

export default AdminAnalytics;
