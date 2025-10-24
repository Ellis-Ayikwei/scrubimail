import React, { useState } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
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
    DatePicker, 
    Space, 
    Typography, 
    Progress, 
    Table, 
    Tag,
    Button,
    Tooltip as AntTooltip,
    Badge
} from 'antd';
import {
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    DownloadOutlined,
    ReloadOutlined,
    RiseOutlined,
    TrendingDownOutlined,
    UserOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    GlobalOutlined,
    DesktopOutlined,
    MobileOutlined,
    TabletOutlined,
    LinkOutlined
} from '@ant-design/icons';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminAnalytics: React.FC = () => {
    const [timeRange, setTimeRange] = useState('7d');

    // Sample data for charts
    const pageViewsData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Page Views',
                data: [12000, 15000, 13000, 17000, 16000, 19000, 21000],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Unique Visitors',
                data: [8000, 9500, 8500, 11000, 10500, 12000, 13500],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const deviceData = {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [
            {
                data: [58, 35, 7],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                ],
            },
        ],
    };

    const topPagesData = {
        labels: ['Home', 'Products', 'About', 'Contact', 'Blog'],
        datasets: [
            {
                label: 'Page Views',
                data: [8500, 6200, 4800, 3500, 2900],
                backgroundColor: 'rgba(147, 51, 234, 0.8)',
            },
        ],
    };

    const userBehaviorData = {
        labels: ['Bounce Rate', 'Pages/Session', 'Avg Duration', 'New Users', 'Return Rate'],
        datasets: [
            {
                label: 'Current Period',
                data: [35, 4.2, 3.5, 65, 35],
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
            },
            {
                label: 'Previous Period',
                data: [42, 3.8, 3.1, 58, 42],
                borderColor: 'rgba(156, 163, 175, 1)',
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
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

    const { Title, Text } = Typography;

    const metrics = [
        {
            title: 'Total Page Views',
            value: 108900,
            change: 12.5,
            changeType: 'positive',
            icon: <EyeOutlined style={{ color: '#1890ff' }} />,
        },
        {
            title: 'Unique Visitors',
            value: 68540,
            change: 8.2,
            changeType: 'positive',
            icon: <UserOutlined style={{ color: '#52c41a' }} />,
        },
        {
            title: 'Bounce Rate',
            value: 35.2,
            suffix: '%',
            change: -5.4,
            changeType: 'positive',
            icon: <TrendingDownOutlined style={{ color: '#fa8c16' }} />,
        },
        {
            title: 'Avg. Session Duration',
            value: '3m 24s',
            change: 18.3,
            changeType: 'positive',
            icon: <ClockCircleOutlined style={{ color: '#722ed1' }} />,
        },
    ];

    const topCountries = [
        { country: 'United States', visitors: '24,580', percentage: 35.8 },
        { country: 'United Kingdom', visitors: '15,240', percentage: 22.2 },
        { country: 'Canada', visitors: '9,850', percentage: 14.4 },
        { country: 'Australia', visitors: '7,320', percentage: 10.7 },
        { country: 'Germany', visitors: '5,180', percentage: 7.6 },
    ];

    const topReferrers = [
        { source: 'Google', visitors: '35,420', percentage: 45.2 },
        { source: 'Direct', visitors: '28,150', percentage: 35.9 },
        { source: 'Facebook', visitors: '8,920', percentage: 11.4 },
        { source: 'Twitter', visitors: '3,850', percentage: 4.9 },
        { source: 'LinkedIn', visitors: '2,040', percentage: 2.6 },
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Analytics Overview</Title>
                    <Text type="secondary">Track and analyze your website performance</Text>
                </div>
                <Space>
                    <Select
                        value={timeRange}
                        onChange={setTimeRange}
                        style={{ width: 150 }}
                    >
                        <Select.Option value="24h">Last 24 hours</Select.Option>
                        <Select.Option value="7d">Last 7 days</Select.Option>
                        <Select.Option value="30d">Last 30 days</Select.Option>
                        <Select.Option value="90d">Last 90 days</Select.Option>
                    </Select>
                    <Button type="primary" icon={<DownloadOutlined />}>
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
                                suffix={metric.suffix}
                                prefix={metric.icon}
                                valueStyle={{ 
                                    color: metric.changeType === 'positive' ? '#3f8600' : '#cf1322' 
                                }}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Text type={metric.changeType === 'positive' ? 'success' : 'danger'}>
                                    {metric.change > 0 ? '+' : ''}{metric.change}%
                                </Text>
                                <Text type="secondary" style={{ marginLeft: '8px' }}>vs last period</Text>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Main Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Traffic Overview */}
                <Col xs={24} lg={16}>
                    <Card title="Traffic Overview" style={{ height: '400px' }}>
                        <div style={{ height: '300px' }}>
                            <Line data={pageViewsData} options={chartOptions} />
                        </div>
                    </Card>
                </Col>

                {/* Device Breakdown */}
                <Col xs={24} lg={8}>
                    <Card title="Device Breakdown" style={{ height: '400px' }}>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Doughnut data={deviceData} options={{ ...chartOptions, maintainAspectRatio: true }} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Space>
                                    <DesktopOutlined style={{ color: '#1890ff' }} />
                                    <Text>Desktop</Text>
                                </Space>
                                <Text strong>58%</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Space>
                                    <MobileOutlined style={{ color: '#52c41a' }} />
                                    <Text>Mobile</Text>
                                </Space>
                                <Text strong>35%</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Space>
                                    <TabletOutlined style={{ color: '#fa8c16' }} />
                                    <Text>Tablet</Text>
                                </Space>
                                <Text strong>7%</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Secondary Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Top Pages */}
                <Col xs={24} lg={12}>
                    <Card title="Top Pages" style={{ height: '350px' }}>
                        <div style={{ height: '250px' }}>
                            <Bar data={topPagesData} options={{ ...chartOptions, indexAxis: 'y' }} />
                        </div>
                    </Card>
                </Col>

                {/* User Behavior */}
                <Col xs={24} lg={12}>
                    <Card title="User Behavior" style={{ height: '350px' }}>
                        <div style={{ height: '250px' }}>
                            <Radar data={userBehaviorData} options={chartOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Tables Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Top Countries */}
                <Col xs={24} lg={12}>
                    <Card 
                        title="Top Countries" 
                        extra={<GlobalOutlined />}
                    >
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {topCountries.map((country, index) => (
                                <div key={index} style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <Text strong>{index + 1}. {country.country}</Text>
                                        <Text type="secondary">{country.visitors} visitors</Text>
                                    </div>
                                    <Progress 
                                        percent={country.percentage} 
                                        showInfo={false}
                                        strokeColor="#1890ff"
                                    />
                                    <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                        <Text strong>{country.percentage}%</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* Top Referrers */}
                <Col xs={24} lg={12}>
                    <Card 
                        title="Top Referrers" 
                        extra={<LinkOutlined />}
                    >
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {topReferrers.map((referrer, index) => (
                                <div key={index} style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <Text strong>{index + 1}. {referrer.source}</Text>
                                        <Text type="secondary">{referrer.visitors} visitors</Text>
                                    </div>
                                    <Progress 
                                        percent={referrer.percentage} 
                                        showInfo={false}
                                        strokeColor="#52c41a"
                                    />
                                    <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                        <Text strong>{referrer.percentage}%</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Real-time Stats */}
            <Card 
                style={{ 
                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                    color: 'white'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={3} style={{ color: 'white', margin: 0 }}>Real-time Analytics</Title>
                    <Space>
                        <Badge status="processing" text="Live" />
                    </Space>
                </div>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Active Users</Text>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>284</div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Page Views/min</Text>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>42</div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Avg. Time on Page</Text>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>2:34</div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Conversion Rate</Text>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>3.8%</div>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default AdminAnalytics;
