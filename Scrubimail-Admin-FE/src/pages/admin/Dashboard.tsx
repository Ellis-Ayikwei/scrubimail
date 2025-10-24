import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    Table, 
    Tag, 
    Button, 
    Space,
    Typography,
    Progress,
    Avatar,
    List,
    Badge,
    Tooltip as AntTooltip
} from 'antd';
import {
    UserOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    RiseOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    MoreOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';

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

const AdminDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        totalRevenue: 0,
        totalValidations: 0,
        activeUsers: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentValidations, setRecentValidations] = useState([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [usersResponse, revenueResponse, validationsResponse] = await Promise.all([
                axiosInstance.get('/admin/users/stats/'),
                axiosInstance.get('/admin/billing/stats/'),
                axiosInstance.get('/admin/validations/stats/')
            ]);

            setDashboardStats({
                totalUsers: usersResponse.data.total || 0,
                totalRevenue: revenueResponse.data.total_revenue || 0,
                totalValidations: validationsResponse.data.total_validations || 0,
                activeUsers: usersResponse.data.active || 0
            });

            setRecentUsers(usersResponse.data.recent_users || []);
            setRecentValidations(validationsResponse.data.recent_validations || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Sample data for charts
    const revenueData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Revenue',
                data: [30000, 35000, 32000, 40000, 45000, 48000, 52000],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const ordersData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Orders',
                data: [120, 150, 180, 140, 200, 170, 190],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
            },
        ],
    };

    const trafficData = {
        labels: ['Direct', 'Social', 'Email', 'Organic', 'Referral'],
        datasets: [
            {
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(250, 204, 21, 0.8)',
                ],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
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

    const statsData = [
        {
            title: 'Total Revenue',
            value: dashboardStats.totalRevenue,
            precision: 0,
            prefix: '$',
            suffix: undefined,
            change: 12.5,
            changeType: 'positive',
            icon: <DollarOutlined style={{ color: '#1890ff' }} />,
        },
        {
            title: 'Total Users',
            value: dashboardStats.totalUsers,
            precision: 0,
            prefix: undefined,
            suffix: undefined,
            change: 8.2,
            changeType: 'positive',
            icon: <UserOutlined style={{ color: '#52c41a' }} />,
        },
        {
            title: 'Total Validations',
            value: dashboardStats.totalValidations,
            precision: 0,
            prefix: undefined,
            suffix: undefined,
            change: -2.4,
            changeType: 'negative',
            icon: <ShoppingCartOutlined style={{ color: '#fa8c16' }} />,
        },
        {
            title: 'Active Users',
            value: dashboardStats.activeUsers,
            precision: 0,
            prefix: undefined,
            suffix: undefined,
            change: 4.3,
            changeType: 'positive',
            icon: <RiseOutlined style={{ color: '#722ed1' }} />,
        },
    ];

    const recentOrders = [
        { id: '#12345', customer: 'John Doe', product: 'Premium Plan', amount: '$99.00', status: 'completed', date: '2 hours ago' },
        { id: '#12346', customer: 'Jane Smith', product: 'Basic Plan', amount: '$29.00', status: 'processing', date: '3 hours ago' },
        { id: '#12347', customer: 'Bob Johnson', product: 'Pro Plan', amount: '$199.00', status: 'completed', date: '5 hours ago' },
        { id: '#12348', customer: 'Alice Brown', product: 'Basic Plan', amount: '$29.00', status: 'pending', date: '6 hours ago' },
        { id: '#12349', customer: 'Charlie Wilson', product: 'Premium Plan', amount: '$99.00', status: 'completed', date: '8 hours ago' },
    ];

    const topProducts = [
        { name: 'Premium Plan', sales: 245, revenue: '$24,255', growth: '+15%' },
        { name: 'Pro Plan', sales: 180, revenue: '$35,820', growth: '+12%' },
        { name: 'Basic Plan', sales: 420, revenue: '$12,180', growth: '+8%' },
        { name: 'Enterprise Plan', sales: 45, revenue: '$22,500', growth: '+20%' },
    ];

    const { Title, Text } = Typography;

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
        },
        {
            title: 'Product',
            dataIndex: 'product',
            key: 'product',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const color = status === 'completed' ? 'green' : status === 'processing' ? 'blue' : 'orange';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
                    <Text type="secondary">Welcome back! Here's what's happening with your business today.</Text>
                </div>
                <Space>
                    <Button icon={<ClockCircleOutlined />}>
                        Last 30 days
                    </Button>
                    <Button type="primary" icon={<EyeOutlined />}>
                        Download Report
                    </Button>
                </Space>
            </div>

            {/* Stats Grid */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {statsData.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                precision={stat.precision}
                                prefix={stat.prefix ? stat.prefix : stat.icon}
                                suffix={stat.suffix}
                                valueStyle={{ color: stat.changeType === 'positive' ? '#3f8600' : '#cf1322' }}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Text type={stat.changeType === 'positive' ? 'success' : 'danger'}>
                                    {stat.changeType === 'positive' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stat.change)}%
                                </Text>
                                <Text type="secondary" style={{ marginLeft: '8px' }}>vs last month</Text>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Revenue Chart */}
                <Col xs={24} lg={16}>
                    <Card 
                        title="Revenue Overview" 
                        extra={<Link to="/admin/revenue">View Details →</Link>}
                        style={{ height: '400px' }}
                    >
                        <div style={{ height: '300px' }}>
                            <Line data={revenueData} options={chartOptions} />
                        </div>
                    </Card>
                </Col>

                {/* Traffic Sources */}
                <Col xs={24} lg={8}>
                    <Card 
                        title="Traffic Sources" 
                        extra={<Link to="/admin/analytics">Analytics →</Link>}
                        style={{ height: '400px' }}
                    >
                        <div style={{ height: '300px' }}>
                            <Doughnut data={trafficData} options={{ ...chartOptions, maintainAspectRatio: true }} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Recent Orders and Top Products */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Recent Orders */}
                <Col xs={24} lg={12}>
                    <Card 
                        title="Recent Orders" 
                        extra={<Link to="/admin/orders">View All →</Link>}
                    >
                        <Table 
                            columns={columns} 
                            dataSource={recentOrders} 
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                {/* Top Products */}
                <Col xs={24} lg={12}>
                    <Card 
                        title="Top Products" 
                        extra={<Link to="/admin/products">View All →</Link>}
                    >
                        <List
                            dataSource={topProducts}
                            renderItem={(item, index) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar style={{ backgroundColor: '#1890ff' }}>
                                                {index + 1}
                                            </Avatar>
                                        }
                                        title={item.name}
                                        description={`${item.sales} sales`}
                                    />
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold' }}>{item.revenue}</div>
                                        <Text type="success">{item.growth}</Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Weekly Orders Chart */}
            <Card 
                title="Weekly Orders"
                extra={
                    <Space>
                        <Badge color="green" text="This Week" />
                        <EyeOutlined />
                    </Space>
                }
            >
                <div style={{ height: '300px' }}>
                    <Bar data={ordersData} options={chartOptions} />
                </div>
            </Card>
        </div>
    );
};

export default AdminDashboard;