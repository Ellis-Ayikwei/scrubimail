import React from 'react';
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
import IconTrendingUp from '../../components/Icon/IconTrendingUp';
import IconUsersGroup from '../../components/Icon/IconUsersGroup';
import IconShoppingCart from '../../components/Icon/IconShoppingCart';
import IconDollarSign from '../../components/Icon/IconDollarSign';
import IconEye from '../../components/Icon/IconEye';
import IconClock from '../../components/Icon/IconClock';

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

    const stats = [
        {
            title: 'Total Revenue',
            value: '$52,000',
            change: '+12.5%',
            changeType: 'positive',
            icon: <IconDollarSign className="w-6 h-6" />,
            bgColor: 'bg-blue-500',
        },
        {
            title: 'Total Users',
            value: '8,549',
            change: '+8.2%',
            changeType: 'positive',
            icon: <IconUsersGroup className="w-6 h-6" />,
            bgColor: 'bg-green-500',
        },
        {
            title: 'Total Orders',
            value: '1,120',
            change: '-2.4%',
            changeType: 'negative',
            icon: <IconShoppingCart className="w-6 h-6" />,
            bgColor: 'bg-orange-500',
        },
        {
            title: 'Conversion Rate',
            value: '3.48%',
            change: '+4.3%',
            changeType: 'positive',
            icon: <IconTrendingUp className="w-6 h-6" />,
            bgColor: 'bg-purple-500',
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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your business today.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <IconClock className="w-4 h-4 inline mr-2" />
                        Last 30 days
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
                        Download Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm font-medium ${
                                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
                                </div>
                            </div>
                            <div className={`${stat.bgColor} bg-opacity-10 p-3 rounded-lg`}>
                                <div className={`${stat.bgColor} text-white p-2 rounded`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
                        <Link to="/admin/revenue" className="text-sm text-primary hover:underline">
                            View Details →
                        </Link>
                    </div>
                    <div className="h-80">
                        <Line data={revenueData} options={chartOptions} />
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Sources</h2>
                        <Link to="/admin/analytics" className="text-sm text-primary hover:underline">
                            Analytics →
                        </Link>
                    </div>
                    <div className="h-80">
                        <Doughnut data={trafficData} options={{ ...chartOptions, maintainAspectRatio: true }} />
                    </div>
                </div>
            </div>

            {/* Recent Orders and Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                            <Link to="/admin/orders" className="text-sm text-primary hover:underline">
                                View All →
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-3">Order ID</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {order.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {order.customer}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {order.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                order.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                    : order.status === 'processing'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h2>
                            <Link to="/admin/products" className="text-sm text-primary hover:underline">
                                View All →
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.sales} sales
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {product.revenue}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            {product.growth}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Orders Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Orders</h2>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                        </div>
                        <IconEye className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="h-64">
                    <Bar data={ordersData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;