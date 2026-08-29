import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ArrowRight, DollarSign, MailCheck, RefreshCw, TrendingUp, Users } from 'lucide-react';

import axiosInstance from '@/services/axiosInstance';
import {
    DataTable,
    type DataTableColumn,
    ErrorState,
    PageHeader,
    StatCard,
    StatCardGrid,
    StatusBadge,
} from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { EmptyState } from '@/components/admin/states';
import { displayName, formatCompact, formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';

interface RecentUser {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    user_type?: string;
    account_status?: string;
    date_joined?: string;
    is_active?: boolean;
}

interface RecentValidation {
    id: string;
    email: string;
    status: string;
    score?: number;
    created_at?: string;
}

interface TopPlan {
    plan_name: string;
    count: number;
    revenue: number;
}

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalValidations: number;
    totalPlans: number;
    activePlans: number;
}

const EMPTY_STATS: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalValidations: 0,
    totalPlans: 0,
    activePlans: 0,
};

/** EmailValidation.status values, mapped onto the shared chart palette. */
const VALIDATION_STATUS_META: Record<string, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'var(--color-chart-2)' },
    processing: { label: 'Processing', color: 'var(--color-chart-1)' },
    pending: { label: 'Pending', color: 'var(--color-chart-4)' },
    failed: { label: 'Failed', color: 'var(--color-destructive)' },
};

const statusChartConfig: ChartConfig = {
    count: { label: 'Validations' },
};

const trendChartConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: 'var(--color-chart-2)' },
    activity: { label: 'Validations', color: 'var(--color-chart-1)' },
};

/**
 * The backend exposes no time-series endpoint yet, so these two series are
 * placeholders and are labelled "Sample" in the UI. Replace them — do not
 * un-label them — once a real endpoint exists.
 */
const SAMPLE_REVENUE = [
    { month: 'Jan', revenue: 30000 },
    { month: 'Feb', revenue: 35000 },
    { month: 'Mar', revenue: 32000 },
    { month: 'Apr', revenue: 40000 },
    { month: 'May', revenue: 45000 },
    { month: 'Jun', revenue: 48000 },
    { month: 'Jul', revenue: 52000 },
];

const SAMPLE_ACTIVITY = [
    { day: 'Mon', activity: 120 },
    { day: 'Tue', activity: 150 },
    { day: 'Wed', activity: 180 },
    { day: 'Thu', activity: 140 },
    { day: 'Fri', activity: 200 },
    { day: 'Sat', activity: 170 },
    { day: 'Sun', activity: 190 },
];

const AdminDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [recentValidations, setRecentValidations] = useState<RecentValidation[]>([]);
    const [topPlans, setTopPlans] = useState<TopPlan[]>([]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, billingRes, validationsRes, plansRes, paymentsRes] = await Promise.all([
                axiosInstance.get('/admin/users/stats/'),
                axiosInstance.get('/admin/billing/stats/'),
                axiosInstance.get('/admin/validations/stats/'),
                axiosInstance.get('/admin/plans/stats/'),
                axiosInstance.get('/admin/payments/stats/'),
            ]);

            setStats({
                totalUsers: usersRes.data.total || 0,
                activeUsers: usersRes.data.active || 0,
                newUsers: usersRes.data.new || 0,
                // payments/stats gives the more complete revenue figure; fall back to billing/stats
                totalRevenue: paymentsRes.data.total_revenue ?? billingRes.data.total_revenue ?? 0,
                monthlyRevenue: paymentsRes.data.monthly_revenue || 0,
                totalValidations: validationsRes.data.total_validations || 0,
                totalPlans: plansRes.data.total_plans || 0,
                activePlans: plansRes.data.active_plans || 0,
            });

            setRecentUsers(usersRes.data.recent_users || []);
            setRecentValidations(validationsRes.data.recent_validations || []);
            setTopPlans(paymentsRes.data.top_plans || []);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err?.response?.data?.detail || err?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const activePct = stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;

    // Real data: the last batch of validations grouped by status.
    const statusData = Object.entries(
        recentValidations.reduce<Record<string, number>>((acc, v) => {
            const key = v.status || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {})
    ).map(([status, count]) => ({
        status,
        count,
        label: VALIDATION_STATUS_META[status]?.label ?? status,
        fill: VALIDATION_STATUS_META[status]?.color ?? 'var(--color-muted-foreground)',
    }));

    const userColumns: DataTableColumn<RecentUser>[] = [
        {
            id: 'user',
            header: 'User',
            cell: (user) => (
                <div className="min-w-0">
                    <div className="truncate font-medium">{displayName(user)}</div>
                    <div className="text-muted-foreground truncate text-xs">{user.email}</div>
                </div>
            ),
            sortValue: (user) => displayName(user),
        },
        {
            id: 'type',
            header: 'Type',
            cell: (user) =>
                user.user_type ? (
                    <Badge variant="outline">{user.user_type}</Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (user) => <StatusBadge status={user.account_status || (user.is_active ? 'active' : 'inactive')} />,
        },
        {
            id: 'joined',
            header: 'Joined',
            cell: (user) => <span className="text-muted-foreground">{formatDate(user.date_joined)}</span>,
            sortValue: (user) => user.date_joined ?? null,
            className: 'whitespace-nowrap',
        },
    ];

    if (error && !loading) {
        return (
            <>
                <PageHeader title="Dashboard" description="Overview of users, revenue and validation activity." />
                <ErrorState title="Failed to load dashboard data" description={error} onRetry={fetchDashboardData} />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Overview of users, revenue and validation activity."
                actions={
                    <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
                        <RefreshCw className={loading ? 'animate-spin' : undefined} />
                        Refresh
                    </Button>
                }
            />

            <StatCardGrid>
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={DollarSign}
                    hint={`${formatCurrency(stats.monthlyRevenue)} this month`}
                    loading={loading}
                />
                <StatCard
                    label="Total Users"
                    value={formatNumber(stats.totalUsers)}
                    icon={Users}
                    hint={`${formatNumber(stats.newUsers)} new in the last 30 days`}
                    loading={loading}
                />
                <StatCard
                    label="Total Validations"
                    value={formatCompact(stats.totalValidations)}
                    icon={MailCheck}
                    hint="All time"
                    loading={loading}
                />
                <StatCard
                    label="Active Users"
                    value={formatNumber(stats.activeUsers)}
                    icon={TrendingUp}
                    hint={`${formatPercent(activePct)} of total`}
                    loading={loading}
                />
            </StatCardGrid>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Revenue Overview
                            <Badge variant="secondary">Sample</Badge>
                        </CardTitle>
                        <CardDescription>Placeholder series — no time-series endpoint yet.</CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" render={<Link to="/admin/revenue" />}>
                                Details
                                <ArrowRight />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
                            <AreaChart data={SAMPLE_REVENUE} margin={{ left: 4, right: 4, top: 4 }}>
                                <defs>
                                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    width={48}
                                    tickFormatter={(v) => formatCompact(v as number)}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value) => formatCurrency(value as number)}
                                        />
                                    }
                                />
                                <Area
                                    dataKey="revenue"
                                    type="natural"
                                    stroke="var(--color-revenue)"
                                    fill="url(#fillRevenue)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Validation Status</CardTitle>
                        <CardDescription>Breakdown of the latest validations.</CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" render={<Link to="/admin/validations" />}>
                                All
                                <ArrowRight />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex min-h-[280px] items-center justify-center">
                        {loading ? (
                            <Skeleton className="size-40 rounded-full" />
                        ) : statusData.length > 0 ? (
                            <ChartContainer config={statusChartConfig} className="h-[240px] w-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                                    <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={48}>
                                        {statusData.map((entry) => (
                                            <Cell key={entry.status} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <EmptyState title="No recent validations" icon={MailCheck} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                        <CardDescription>Newest accounts on the platform.</CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" render={<Link to="/admin/manage/users" />}>
                                All users
                                <ArrowRight />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={recentUsers}
                            columns={userColumns}
                            rowKey={(user) => user.id}
                            loading={loading}
                            pageSize={5}
                            emptyTitle="No recent signups"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Plans</CardTitle>
                        <CardDescription>Ranked by revenue contribution.</CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" render={<Link to="/admin/plans" />}>
                                All plans
                                <ArrowRight />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : topPlans.length > 0 ? (
                            <ul className="divide-y">
                                {topPlans.map((plan, index) => (
                                    <li
                                        key={`${plan.plan_name}-${index}`}
                                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">
                                                    {plan.plan_name || 'Unnamed plan'}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {formatNumber(plan.count)} subscriptions
                                                </div>
                                            </div>
                                        </div>
                                        <span className="shrink-0 font-medium tabular-nums">
                                            {formatCurrency(plan.revenue)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState title="No plan data" />
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Weekly Activity
                        <Badge variant="secondary">Sample</Badge>
                    </CardTitle>
                    <CardDescription>Placeholder series — no time-series endpoint yet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={trendChartConfig} className="h-[260px] w-full">
                        <BarChart data={SAMPLE_ACTIVITY} margin={{ left: 4, right: 4, top: 4 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="activity" fill="var(--color-activity)" radius={6} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </>
    );
};

export default AdminDashboard;
