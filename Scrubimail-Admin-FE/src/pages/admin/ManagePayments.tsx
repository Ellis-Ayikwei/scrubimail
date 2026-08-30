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
  Receipt,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { paymentService, AdminPayment, AdminPaymentStats } from '../../services/paymentService';

// Contract shapes live in paymentService; alias for readability in this file.
type Payment = AdminPayment;
type PaymentStats = AdminPaymentStats;

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // Per-row "sync from Paystack" state + a transient success banner.
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: {
        page: number;
        page_size: number;
        search?: string;
        status?: string;
        date_from?: string;
      } = { page, page_size: 50 };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;

      if (filterDateRange !== 'all') {
        const now = new Date();
        let from: Date | null = null;
        if (filterDateRange === 'today') {
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (filterDateRange === 'week') {
          from = new Date(now.getTime() - 7 * 86400000);
        } else if (filterDateRange === 'month') {
          from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
        if (from) params.date_from = from.toISOString().slice(0, 10);
      }

      const [paymentsRes, statsRes] = await Promise.all([
        paymentService.getAdminPayments(params),
        paymentService.getAdminPaymentStats()
      ]);

      setPayments(paymentsRes.results || []);
      setTotalPages(paymentsRes.total_pages || 1);
      setTotalCount(paymentsRes.count || 0);
      setStats(statsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch payments data');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, filterStatus, filterDateRange]);

  const handleSearch = () => {
    setPage(1);
    fetchPayments();
  };

  // Re-fetch a payment's status live from Paystack and reconcile it server-side
  // (completes/fails the purchase). Use when a webhook was missed and a payment
  // is stuck "pending" despite the customer having paid. Only credit-package
  // payments have a reconcilable local record.
  const handleSync = async (payment: Payment) => {
    setSyncingId(payment.id);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await paymentService.syncAdminPayment(payment.id);
      const { changed, gateway_status, current_status } = res;
      setSyncMessage(
        changed
          ? `Payment ${payment.transaction_id || payment.id} synced: now ${current_status} (Paystack: ${gateway_status}).`
          : `No change — Paystack reports "${gateway_status}", payment is ${current_status}.`
      );
      await fetchPayments();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Failed to sync payment with Paystack'
      );
    } finally {
      setSyncingId(null);
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

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#2ED8A3] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading payments...</p>
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
          <p className="text-gray-500 dark:text-gray-300 mt-1">
            Monitor and manage all payment transactions ({totalCount} total)
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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

      {syncMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <p className="ml-3 text-sm text-green-700 dark:text-green-300">{syncMessage}</p>
            </div>
            <button
              onClick={() => setSyncMessage(null)}
              className="text-green-600 hover:text-green-800 dark:text-green-400"
              title="Dismiss"
            >
              <XCircle className="w-4 h-4" />
            </button>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(stats.total_revenue)}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(stats.monthly_revenue)}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Failed</p>
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
                placeholder="Search by user, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
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
              onChange={(e) => { setFilterDateRange(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C]"
            >
              <Filter className="w-4 h-4" />
              <span>Apply</span>
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
                  Type
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
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-300">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const statusBadge = getStatusBadge(payment.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                            {payment.transaction_id || payment.id}
                          </div>
                          {payment.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-400 truncate max-w-[180px]">
                              {payment.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payment.user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                              {payment.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          {payment.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {payment.type?.replace(/_/g, ' ') || payment.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Sync only applies to credit-package purchases —
                              the only payments with a reconcilable local record. */}
                          {payment.type === 'credit_package' && (
                            <button
                              onClick={() => handleSync(payment)}
                              disabled={syncingId === payment.id}
                              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                              title="Sync status from Paystack"
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${syncingId === payment.id ? 'animate-spin' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Page {page} of {totalPages} ({totalCount} results)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transaction Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-300">Reference:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white break-all">
                      {selectedPayment.transaction_id || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-300">Amount:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-300">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedPayment.status).color}`}>
                      {getStatusBadge(selectedPayment.status).text}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-300">Type:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.type?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-300">Payment Method:</span>
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
                    <span className="text-sm text-gray-500 dark:text-gray-300">Name:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.user.name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-300">Email:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedPayment.user.email}
                    </span>
                  </div>
                  {selectedPayment.plan && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-300">Plan:</span>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {selectedPayment.plan}
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
                  <span className="text-sm text-gray-500 dark:text-gray-300">Created:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedPayment.updated_at && selectedPayment.updated_at !== selectedPayment.created_at && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-300">Updated:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedPayment.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePayments;
