import React, { useEffect, useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    Clock,
    XCircle,
    RefreshCw,
    BarChart3,
    AlertTriangle
} from 'lucide-react';
import { paymentService, AdminPaymentStats } from '../../services/paymentService';

const AdminRevenue: React.FC = () => {
    const [stats, setStats] = useState<AdminPaymentStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentService.getAdminPaymentStats();
            setStats(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to load revenue statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatCurrency = (amount: number) =>
        `₦${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const cards = [
        { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue ?? 0), icon: DollarSign, color: 'green' },
        { label: 'Monthly Revenue', value: formatCurrency(stats?.monthly_revenue ?? 0), icon: TrendingUp, color: 'blue' },
        { label: 'Average Transaction', value: formatCurrency(stats?.average_transaction ?? 0), icon: BarChart3, color: 'purple' },
        { label: 'Pending Payments', value: String(stats?.pending_payments ?? 0), icon: Clock, color: 'yellow' },
        { label: 'Failed Payments', value: String(stats?.failed_payments ?? 0), icon: XCircle, color: 'red' },
    ];

    const colorMap: Record<string, string> = {
        green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
        blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
        red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue</h1>
                    <p className="text-gray-500 dark:text-gray-300 mt-1">Revenue and payment performance overview</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <p className="ml-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${colorMap[card.color]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{card.label}</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Top Plans */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Plans</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subscriptions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {(stats?.top_plans?.length ?? 0) === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-300">
                                        No plan revenue data available.
                                    </td>
                                </tr>
                            ) : (
                                stats!.top_plans.map((plan, idx) => (
                                    <tr key={`${plan.plan_name}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {plan.plan_name || 'Unnamed plan'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {plan.count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {formatCurrency(plan.revenue || 0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminRevenue;
