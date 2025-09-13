import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // Mock data for analytics
  const stats = {
    totalValidations: 15247,
    validEmails: 12891,
    invalidEmails: 2356,
    accuracyRate: 98.5,
    avgResponseTime: 0.23
  };

  const chartData = [
    { date: '2024-01-01', valid: 120, invalid: 15, risky: 8 },
    { date: '2024-01-02', valid: 98, invalid: 22, risky: 5 },
    { date: '2024-01-03', valid: 156, invalid: 18, risky: 12 },
    { date: '2024-01-04', valid: 142, invalid: 31, risky: 9 },
    { date: '2024-01-05', valid: 189, invalid: 25, risky: 14 },
    { date: '2024-01-06', valid: 167, invalid: 19, risky: 7 },
    { date: '2024-01-07', valid: 203, invalid: 28, risky: 11 }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-[#10B981]" />
              Usage Analytics
            </h1>
            <p className="text-[#333333]/70 dark:text-gray-400">
              Track your email validation performance and usage patterns
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={() => setLoading(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl text-[#333333] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Validations</p>
                <p className="text-2xl font-bold text-[#333333] dark:text-white">{stats.totalValidations.toLocaleString()}</p>
              </div>
              <Mail className="w-8 h-8 text-[#10B981]" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 dark:text-green-400">↗ +12.5%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Valid Emails</p>
                <p className="text-2xl font-bold text-[#333333] dark:text-white">{stats.validEmails.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 dark:text-green-400">↗ +8.3%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invalid Emails</p>
                <p className="text-2xl font-bold text-[#333333] dark:text-white">{stats.invalidEmails.toLocaleString()}</p>
              </div>
              <XCircle className="w-8 h-8 text-[#EF4444]" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-red-600 dark:text-red-400">↘ -3.1%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy Rate</p>
                <p className="text-2xl font-bold text-[#333333] dark:text-white">{stats.accuracyRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#10B981]" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 dark:text-green-400">↗ +0.2%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-[#333333] dark:text-white">{stats.avgResponseTime}s</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 dark:text-green-400">↘ -0.05s</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">faster</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Validation Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Validation Trends</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((day, index) => (
                <div key={index} className="flex flex-col items-center space-y-1 flex-1">
                  <div className="flex flex-col items-center space-y-1 w-full">
                    <div 
                      className="w-full bg-[#10B981] rounded-t-md"
                      style={{ height: `${(day.valid / 250) * 100}px` }}
                    ></div>
                    <div 
                      className="w-full bg-[#EF4444] rounded-none"
                      style={{ height: `${(day.invalid / 250) * 50}px` }}
                    ></div>
                    <div 
                      className="w-full bg-yellow-500 rounded-b-md"
                      style={{ height: `${(day.risky / 250) * 30}px` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Valid</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#EF4444] rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Invalid</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Risky</span>
              </div>
            </div>
          </div>

          {/* Top Domains */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Top Email Domains</h3>
            <div className="space-y-4">
              {[
                { domain: 'gmail.com', count: 4521, percentage: 35 },
                { domain: 'outlook.com', count: 2834, percentage: 22 },
                { domain: 'yahoo.com', count: 1923, percentage: 15 },
                { domain: 'company.com', count: 1456, percentage: 11 },
                { domain: 'hotmail.com', count: 987, percentage: 8 }
              ].map((domain, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                    <span className="text-[#333333] dark:text-white font-medium">{domain.domain}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-[#10B981] h-2 rounded-full"
                        style={{ width: `${domain.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                      {domain.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-white">Recent Validation Activity</h3>
            <button className="text-[#10B981] hover:text-[#059669] text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Count</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { time: '2 min ago', type: 'Bulk Upload', count: 1500, status: 'completed', duration: '45s' },
                  { time: '15 min ago', type: 'Single Validation', count: 1, status: 'completed', duration: '0.2s' },
                  { time: '32 min ago', type: 'API Call', count: 250, status: 'completed', duration: '12s' },
                  { time: '1 hour ago', type: 'Bulk Upload', count: 5000, status: 'failed', duration: '2m 15s' },
                  { time: '2 hours ago', type: 'Single Validation', count: 1, status: 'completed', duration: '0.3s' }
                ].map((activity, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{activity.time}</td>
                    <td className="py-3 px-4 text-sm text-[#333333] dark:text-white">{activity.type}</td>
                    <td className="py-3 px-4 text-sm text-[#333333] dark:text-white">{activity.count.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{activity.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;