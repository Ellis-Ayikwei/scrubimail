import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { 
    Card, 
    Row, 
    Col, 
    Statistic, 
    Select, 
    Space, 
    Typography, 
    Progress, 
    Table, 
    Tag,
    Button,
    DatePicker,
    message,
    Spin
} from 'antd';
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Mail,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    RefreshCw,
    Activity,
    CreditCard,
    FileText,
    Calendar
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import dayjs from 'dayjs';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AnalyticsData {
    users: {
        total: number;
        active: number;
        new_today: number;
        growth: number;
    };
    validations: {
        total: number;
        today: number;
        valid: number;
        invalid: number;
        risky: number;
        growth: number;
    };
    revenue: {
        total: number;
        this_month: number;
        last_month: number;
        growth: number;
    };
    billing: {
        total_subscriptions: number;
        active_subscriptions: number;
        total_invoices: number;
        pending_invoices: number;
    };
    daily_stats: Array<{
        date: string;
        validations: number;
        revenue: number;
        users: number;
    }>;
    validation_status: {
        valid: number;
        invalid: number;
        risky: number;
    };
}

const AdminAnalytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [usersRes, validationsRes, billingRes, billingStatsRes] = await Promise.all([
                axiosInstance.get('/admin/users/stats/'),
                axiosInstance.get('/admin/validations/stats/'),
                axiosInstance.get('/admin/billing/'),
                axiosInstance.get('/admin/billing/stats/')
            ]);

            // Calculate daily stats (mock for now, should come from backend)
            const dailyStats = generateDailyStats(timeRange);

            const data: AnalyticsData = {
                users: {
                    total: usersRes.data.total || 0,
                    active: usersRes.data.active || 0,
                    new_today: usersRes.data.new_today || 0,
                    growth: calculateGrowth(usersRes.data.total, usersRes.data.previous_total || 0)
                },
                validations: {
                    total: validationsRes.data.total_validations || 0,
                    today: validationsRes.data.today_validations || 0,
                    valid: validationsRes.data.valid_count || 0,
                    invalid: validationsRes.data.invalid_count || 0,
                    risky: validationsRes.data.risky_count || 0,
                    growth: calculateGrowth(
                        validationsRes.data.total_validations || 0,
                        validationsRes.data.previous_total || 0
                    )
                },
                revenue: {
                    total: billingStatsRes.data.total_revenue || 0,
                    this_month: billingStatsRes.data.monthly_revenue || 0,
                    last_month: billingStatsRes.data.previous_month_revenue || 0,
                    growth: calculateGrowth(
                        billingStatsRes.data.monthly_revenue || 0,
                        billingStatsRes.data.previous_month_revenue || 0
                    )
                },
                billing: {
                    total_subscriptions: 0, // TODO: Get from backend
                    active_subscriptions: 0, // TODO: Get from backend
                    total_invoices: 0, // TODO: Get from backend
                    pending_invoices: 0 // TODO: Get from backend
                },
                daily_stats: dailyStats,
                validation_status: {
                    valid: validationsRes.data.valid_count || 0,
                    invalid: validationsRes.data.invalid_count || 0,
                    risky: validationsRes.data.risky_count || 0
                }
            };

            setAnalyticsData(data);
        } catch (error: any) {
            console.error('Error fetching analytics:', error);
            message.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const generateDailyStats = (range: string) => {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const stats = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = dayjs().subtract(i, 'days');
            stats.push({
                date: date.format('YYYY-MM-DD'),
                validations: Math.floor(Math.random() * 1000) + 500,
                revenue: Math.floor(Math.random() * 500) + 100,
                users: Math.floor(Math.random() * 50) + 10
            });
        }
        return stats;
    };

    const calculateGrowth = (current: number, previous: number): number => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!analyticsData) {
        return <div>No data available</div>;
    }

    // Chart data
    const validationsChartData = {
        labels: analyticsData.daily_stats.map(s => dayjs(s.date).format('MMM DD')),
        datasets: [
            {
                label: 'Validations',
                data: analyticsData.daily_stats.map(s => s.validations),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const revenueChartData = {
        labels: analyticsData.daily_stats.map(s => dayjs(s.date).format('MMM DD')),
        datasets: [
            {
                label: 'Revenue ($)',
                data: analyticsData.daily_stats.map(s => s.revenue),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const validationStatusData = {
        labels: ['Valid', 'Invalid', 'Risky'],
        datasets: [
            {
                data: [
                    analyticsData.validation_status.valid,
                    analyticsData.validation_status.invalid,
                    analyticsData.validation_status.risky
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                ],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    const metrics = [
        {
            title: 'Total Validations',
            value: analyticsData.validations.total,
            change: analyticsData.validations.growth,
            changeType: analyticsData.validations.growth >= 0 ? 'positive' : 'negative',
            icon: <Mail className="w-5 h-5" style={{ color: '#1890ff' }} />,
            color: '#1890ff'
        },
        {
            title: 'Total Users',
            value: analyticsData.users.total,
            change: analyticsData.users.growth,
            changeType: analyticsData.users.growth >= 0 ? 'positive' : 'negative',
            icon: <Users className="w-5 h-5" style={{ color: '#52c41a' }} />,
            color: '#52c41a'
        },
        {
            title: 'Total Revenue',
            value: analyticsData.revenue.total,
            change: analyticsData.revenue.growth,
            changeType: analyticsData.revenue.growth >= 0 ? 'positive' : 'negative',
            icon: <DollarSign className="w-5 h-5" style={{ color: '#fa8c16' }} />,
            color: '#fa8c16',
            prefix: '$',
            precision: 2
        },
        {
            title: 'Active Users',
            value: analyticsData.users.active,
            change: 0,
            changeType: 'positive',
            icon: <Activity className="w-5 h-5" style={{ color: '#722ed1' }} />,
            color: '#722ed1'
        },
    ];

    const validationBreakdown = [
        {
            status: 'Valid',
            count: analyticsData.validation_status.valid,
            percentage: analyticsData.validations.total > 0 
                ? (analyticsData.validation_status.valid / analyticsData.validations.total) * 100 
                : 0,
            color: '#52c41a',
            icon: <CheckCircle className="w-4 h-4" />
        },
        {
            status: 'Invalid',
            count: analyticsData.validation_status.invalid,
            percentage: analyticsData.validations.total > 0 
                ? (analyticsData.validation_status.invalid / analyticsData.validations.total) * 100 
                : 0,
            color: '#ff4d4f',
            icon: <XCircle className="w-4 h-4" />
        },
        {
            status: 'Risky',
            count: analyticsData.validation_status.risky,
            percentage: analyticsData.validations.total > 0 
                ? (analyticsData.validation_status.risky / analyticsData.validations.total) * 100 
                : 0,
            color: '#fa8c16',
            icon: <AlertCircle className="w-4 h-4" />
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ marginBottom: '8px', margin: 0 }}>
                        <BarChart3 style={{ width: '24px', height: '24px', display: 'inline-block', marginRight: '8px' }} />
                        Analytics Dashboard
                    </Title>
                    <Text type="secondary">Comprehensive insights into your email validation service</Text>
                </div>
                <Space>
                    <Select
                        value={timeRange}
                        onChange={setTimeRange}
                        style={{ width: 150 }}
                    >
                        <Select.Option value="7d">Last 7 days</Select.Option>
                        <Select.Option value="30d">Last 30 days</Select.Option>
                        <Select.Option value="90d">Last 90 days</Select.Option>
                    </Select>
                    <Button 
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={fetchAnalytics}
                    >
                        Refresh
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<Download className="w-4 h-4" />}
                    >
                        Export Report
                    </Button>
                </Space>
            </div>

            {/* Metrics Grid */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {metrics.map((metric, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card>
                            <Statistic
                                title={metric.title}
                                value={metric.value}
                                prefix={metric.prefix}
                                precision={metric.precision}
                                valueStyle={{ color: metric.color }}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Text type={metric.changeType === 'positive' ? 'success' : 'danger'}>
                                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                                </Text>
                                <Text type="secondary" style={{ marginLeft: '8px' }}>vs previous period</Text>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Main Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Validations Over Time */}
                <Col xs={24} lg={16}>
                    <Card 
                        title={
                            <Space>
                                <Mail className="w-5 h-5" />
                                <span>Validations Over Time</span>
                            </Space>
                        }
                        style={{ height: '400px' }}
                    >
                        <div style={{ height: '300px' }}>
                            <Line data={validationsChartData} options={chartOptions} />
                        </div>
                    </Card>
                </Col>

                {/* Validation Status Breakdown */}
                <Col xs={24} lg={8}>
                    <Card 
                        title={
                            <Space>
                                <Activity className="w-5 h-5" />
                                <span>Validation Status</span>
                            </Space>
                        }
                        style={{ height: '400px' }}
                    >
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Doughnut 
                                data={validationStatusData} 
                                options={{ ...chartOptions, maintainAspectRatio: true }} 
                            />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            {validationBreakdown.map((item, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <Space>
                                        <span style={{ color: item.color }}>{item.icon}</span>
                                        <Text>{item.status}</Text>
                                    </Space>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text strong>{item.count.toLocaleString()}</Text>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {item.percentage.toFixed(1)}%
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Revenue Chart */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24}>
                    <Card 
                        title={
                            <Space>
                                <DollarSign className="w-5 h-5" />
                                <span>Revenue Over Time</span>
                            </Space>
                        }
                        style={{ height: '350px' }}
                    >
                        <div style={{ height: '250px' }}>
                            <Line data={revenueChartData} options={chartOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Additional Stats */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card 
                        title={
                            <Space>
                                <Users className="w-5 h-5" />
                                <span>User Statistics</span>
                            </Space>
                        }
                    >
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text>Total Users</Text>
                                <Text strong>{analyticsData.users.total.toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text>Active Users</Text>
                                <Text strong style={{ color: '#52c41a' }}>
                                    {analyticsData.users.active.toLocaleString()}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text>New Today</Text>
                                <Text strong style={{ color: '#1890ff' }}>
                                    {analyticsData.users.new_today.toLocaleString()}
                                </Text>
                            </div>
                            <Progress 
                                percent={(analyticsData.users.active / analyticsData.users.total) * 100} 
                                strokeColor="#52c41a"
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card 
                        title={
                            <Space>
                                <CreditCard className="w-5 h-5" />
                                <span>Billing Overview</span>
                            </Space>
                        }
                    >
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text>Total Revenue</Text>
                                <Text strong>${analyticsData.revenue.total.toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text>This Month</Text>
                                <Text strong style={{ color: '#52c41a' }}>
                                    ${analyticsData.revenue.this_month.toLocaleString()}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text>Last Month</Text>
                                <Text type="secondary">
                                    ${analyticsData.revenue.last_month.toLocaleString()}
                                </Text>
                            </div>
                            <Progress 
                                percent={analyticsData.revenue.last_month > 0 
                                    ? (analyticsData.revenue.this_month / analyticsData.revenue.last_month) * 100 
                                    : 0} 
                                strokeColor="#1890ff"
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminAnalytics;
