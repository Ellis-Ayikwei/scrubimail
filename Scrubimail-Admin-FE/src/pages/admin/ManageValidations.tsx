import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Mail, 
  Calendar, 
  User, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

interface Validation {
  id: number;
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  score: number;
  verdict: string;
  is_valid: boolean;
  user: {
    id: number;
    email: string;
    name?: string;
  };
  created_at: string;
  processing_time: number;
  breakdown: {
    syntax: { valid: boolean };
    dns: { valid: boolean; score: number };
    smtp: { valid: boolean; catch_all: boolean };
    reputation: { reputation_score: number };
    role_based: { is_role_based: boolean };
  };
  suggestions: string[];
  warnings: string[];
}

interface ValidationStats {
  total_validations: number;
  valid_emails: number;
  invalid_emails: number;
  risky_emails: number;
  success_rate: number;
  average_score: number;
  processing_time_avg: number;
  top_domains: Array<{
    domain: string;
    count: number;
    valid_rate: number;
  }>;
  daily_stats: Array<{
    date: string;
    validations: number;
    valid_count: number;
    invalid_count: number;
    avg_score: number;
  }>;
}

const ManageValidations: React.FC = () => {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [selectedValidation, setSelectedValidation] = useState<Validation | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const fetchValidations = async () => {
    setLoading(true);
    setError(null);
    try {
      const [validationsRes, statsRes] = await Promise.all([
        axiosInstance.get('/admin/validations/'),
        axiosInstance.get('/admin/validations/stats/')
      ]);
      setValidations(validationsRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError('Failed to fetch validations data');
      console.error('Error fetching validations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidations();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      valid: { text: 'Valid', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      invalid: { text: 'Invalid', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      risky: { text: 'Risky', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle },
      unknown: { text: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Clock }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredValidations = validations.filter(validation => {
    const matchesSearch = validation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || validation.status === filterStatus;
    
    const matchesDate = filterDateRange === 'all' || (() => {
      const validationDate = new Date(validation.created_at);
      const now = new Date();
      switch (filterDateRange) {
        case 'today':
          return validationDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return validationDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return validationDate >= monthAgo;
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
          <p className="text-gray-600 dark:text-gray-400">Loading validations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validations Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and analyze email validation activities</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchValidations}
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Validations</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.total_validations.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid Emails</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.valid_emails.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((stats.valid_emails / stats.total_validations) * 100).toFixed(1)}% of total
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Invalid Emails</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.invalid_emails.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((stats.invalid_emails / stats.total_validations) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.success_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg score: {stats.average_score.toFixed(1)}
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
                placeholder="Search by email, user..."
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
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
              <option value="risky">Risky</option>
              <option value="unknown">Unknown</option>
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

      {/* Validations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Processing Time
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
              {filteredValidations.map((validation) => {
                const statusBadge = getStatusBadge(validation.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <tr key={validation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {validation.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {validation.verdict}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-medium ${getScoreColor(validation.score)}`}>
                          {validation.score.toFixed(1)}
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              validation.score >= 80 ? 'bg-green-500' : 
                              validation.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${validation.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {validation.user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {validation.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{validation.processing_time}ms</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(validation.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedValidation(validation);
                          setShowValidationModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Details Modal */}
      {showValidationModal && selectedValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Validation Details
              </h3>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Email Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedValidation.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedValidation.status).color}`}>
                      {getStatusBadge(selectedValidation.status).text}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Score:</span>
                    <span className={`ml-2 text-sm font-medium ${getScoreColor(selectedValidation.score)}`}>
                      {selectedValidation.score.toFixed(1)}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Verdict:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedValidation.verdict}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Validation Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Syntax:</span>
                    <span className={`text-sm ${selectedValidation.breakdown.syntax.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedValidation.breakdown.syntax.valid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">DNS:</span>
                    <span className={`text-sm ${selectedValidation.breakdown.dns.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedValidation.breakdown.dns.valid ? 'Valid' : 'Invalid'} ({selectedValidation.breakdown.dns.score}/100)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">SMTP:</span>
                    <span className={`text-sm ${selectedValidation.breakdown.smtp.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedValidation.breakdown.smtp.valid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Reputation:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedValidation.breakdown.reputation.reputation_score}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedValidation.suggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Suggestions</h4>
                <ul className="space-y-1">
                  {selectedValidation.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedValidation.warnings.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Warnings</h4>
                <ul className="space-y-1">
                  {selectedValidation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start">
                      <AlertTriangle className="w-4 h-4 mr-2 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageValidations;

