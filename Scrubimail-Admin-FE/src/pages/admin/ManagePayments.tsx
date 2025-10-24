import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  DollarSign, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Receipt,
  Banknote
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

interface Payment {
  id: number;
  user: {
    id: number;
    email: string;
    name?: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  plan?: string;
  billing_cycle?: string;
}

interface PaymentStats {
  total_revenue: number;
  monthly_revenue: number;
  pending_payments: number;
  failed_payments: number;
  average_transaction: number;
  top_plans: Array<{
    plan: string;
    count: number;
    revenue: number;
  }>;
}

const ManagePayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        axiosInstance.get('/admin/payments/'),
        axiosInstance.get('/admin/payments/stats/')
      ]);
      setPayments(paymentsRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError('Failed to fetch payments data');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdatePaymentStatus = async (paymentId: number, newStatus: string) => {
    try {
      await axiosInstance.patch(`/admin/payments/${paymentId}/`, {
        status: newStatus
      });
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, status: newStatus as any } : payment
      ));
    } catch (err: any) {
      setError('Failed to update payment status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      completed: { text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      failed: { text: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      refunded: { text: 'Refunded', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Receipt }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    const matchesDate = filterDateRange === 'all' || (() => {
      const paymentDate = new Date(payment.created_at);
      const now = new Date();
      switch (filterDateRange) {
        case 'today':
          return paymentDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return paymentDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return paymentDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#2ED8A3] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage all payment transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPayments}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 bg-[#2ED8A3] text-white px-4 py-2 rounded-lg hover:bg-[#00C48C]">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${stats.total_revenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${stats.monthly_revenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.pending_payments}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.failed_payments}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.map((payment) => {
                const statusBadge = getStatusBadge(payment.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          #{payment.id}
                        </div>
                        {payment.transaction_id && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.transaction_id}
                          </div>
                        )}
                        {payment.description && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {payment.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${payment.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.currency.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>{payment.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPaymentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                              className="text-green-600 hover:text-green-700"
                              title="Mark as completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdatePaymentStatus(payment.id, 'failed')}
                              className="text-red-600 hover:text-red-700"
                              title="Mark as failed"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'refunded')}
                            className="text-orange-600 hover:text-orange-700"
                            title="Process refund"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Details
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transaction Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Transaction ID:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.transaction_id || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Amount:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      ${selectedPayment.amount.toLocaleString()} {selectedPayment.currency.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedPayment.status).color}`}>
                      {getStatusBadge(selectedPayment.status).text}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.payment_method}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">User Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.user.name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.user.email}
                    </span>
                  </div>
                  {selectedPayment.plan && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Plan:</span>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {selectedPayment.plan}
                      </span>
                    </div>
                  )}
                  {selectedPayment.billing_cycle && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Billing Cycle:</span>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {selectedPayment.billing_cycle}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Updated:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedPayment.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePayments;

