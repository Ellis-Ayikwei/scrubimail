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
import IconTrendingUp from '../../components/Icon/IconTrendingUp';
import IconTrendingDown from '../../components/Icon/IconTrendingDown';
import IconEye from '../../components/Icon/IconEye';
import IconClock from '../../components/Icon/IconClock';
import IconGlobe from '../../components/Icon/IconGlobe';
import IconDeviceDesktop from '../../components/Icon/IconDeviceDesktop';
import IconDeviceMobile from '../../components/Icon/IconDeviceMobile';
import IconDeviceTablet from '../../components/Icon/IconDeviceTablet';
import IconUsersGroup from '../../components/Icon/IconUsersGroup';
import IconLink from '../../components/Icon/IconLink';

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

    const metrics = [
        {
            title: 'Total Page Views',
            value: '108,900',
            change: '+12.5%',
            changeType: 'positive',
            icon: <IconEye className="w-6 h-6" />,
            bgColor: 'bg-blue-500',
            description: 'vs last period',
        },
        {
            title: 'Unique Visitors',
            value: '68,540',
            change: '+8.2%',
            changeType: 'positive',
            icon: <IconUsersGroup className="w-6 h-6" />,
            bgColor: 'bg-green-500',
            description: 'vs last period',
        },
        {
            title: 'Bounce Rate',
            value: '35.2%',
            change: '-5.4%',
            changeType: 'positive',
            icon: <IconTrendingDown className="w-6 h-6" />,
            bgColor: 'bg-orange-500',
            description: 'vs last period',
        },
        {
            title: 'Avg. Session Duration',
            value: '3m 24s',
            change: '+18.3%',
            changeType: 'positive',
            icon: <IconClock className="w-6 h-6" />,
            bgColor: 'bg-purple-500',
            description: 'vs last period',
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track and analyze your website performance</p>
                </div>
                <div className="flex space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metric.value}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm font-medium ${
                                        metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {metric.change}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{metric.description}</span>
                                </div>
                            </div>
                            <div className={`${metric.bgColor} bg-opacity-10 p-3 rounded-lg`}>
                                <div className={`${metric.bgColor} text-white p-2 rounded`}>
                                    {metric.icon}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Overview */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Overview</h2>
                    <div className="h-80">
                        <Line data={pageViewsData} options={chartOptions} />
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Breakdown</h2>
                    <div className="h-80 flex items-center justify-center">
                        <Doughnut data={deviceData} options={{ ...chartOptions, maintainAspectRatio: true }} />
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <IconDeviceDesktop className="w-5 h-5 text-blue-500 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Desktop</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">58%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <IconDeviceMobile className="w-5 h-5 text-green-500 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Mobile</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">35%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <IconDeviceTablet className="w-5 h-5 text-orange-500 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Tablet</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">7%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Pages</h2>
                    <div className="h-64">
                        <Bar data={topPagesData} options={{ ...chartOptions, indexAxis: 'y' }} />
                    </div>
                </div>

                {/* User Behavior */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Behavior</h2>
                    <div className="h-64">
                        <Radar data={userBehaviorData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Countries */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Countries</h2>
                            <IconGlobe className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topCountries.map((country, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {index + 1}. {country.country}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {country.visitors} visitors
                                        </span>
                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${country.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                            {country.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Referrers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Referrers</h2>
                            <IconLink className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topReferrers.map((referrer, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {index + 1}. {referrer.source}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {referrer.visitors} visitors
                                        </span>
                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${referrer.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                            {referrer.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Real-time Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Real-time Analytics</h2>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Live</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm opacity-80">Active Users</p>
                        <p className="text-3xl font-bold mt-1">284</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-80">Page Views/min</p>
                        <p className="text-3xl font-bold mt-1">42</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-80">Avg. Time on Page</p>
                        <p className="text-3xl font-bold mt-1">2:34</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-80">Conversion Rate</p>
                        <p className="text-3xl font-bold mt-1">3.8%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
