import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  FileText, 
  Key, 
  History, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Activity,
  RefreshCw
} from 'lucide-react';
import { validationService, ValidationHistory, ValidationAnalytics } from '../services/validationService';
import { billingService, BillingProfile, UsageStats } from '../services/billingService';
import { userService, ComprehensiveProfile } from '../services/userService';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ValidationAnalytics | null>(null);
  const [history, setHistory] = useState<ValidationHistory | null>(null);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to get comprehensive profile first
      try {
        const comprehensive = await userService.getComprehensiveProfile();
        console.log('Comprehensive profile fetched for dashboard:', comprehensive);
        setComprehensiveProfile(comprehensive);
        
        // Extract data from comprehensive profile
        if (comprehensive.billing) {
          setBillingProfile({
            id: 1, // Default ID
            current_plan: comprehensive.billing.current_plan,
            credits_remaining: comprehensive.billing.credits_remaining,
            credits_used_this_month: comprehensive.billing.credits_used_this_month,
            billing_status: 'active',
            total_credits_purchased: comprehensive.billing.credits_remaining + comprehensive.billing.credits_used_this_month,
            total_amount_spent: 0,
            last_credit_purchase: null,
            plan_start_date: new Date().toISOString(),
            plan_end_date: null,
            auto_renew: false,
            usage_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        if (comprehensive.usage) {
          setUsageStats(comprehensive.usage);
        }
        
        // Still fetch analytics and history separately for detailed data
        const [analyticsData, historyData] = await Promise.all([
          validationService.getValidationAnalytics().catch(() => null),
          validationService.getValidationHistory({ page_size: 4 }).catch(() => null)
        ]);
        
        if (analyticsData) setAnalytics(analyticsData);
        if (historyData) setHistory(historyData);
        
      } catch (comprehensiveError) {
        console.log('Comprehensive profile failed, falling back to individual calls:', comprehensiveError);
        
        // Fallback to individual API calls
        const [analyticsData, historyData, billingData, usageData] = await Promise.all([
          validationService.getValidationAnalytics(),
          validationService.getValidationHistory({ page_size: 4 }),
          billingService.getBillingProfile(),
          billingService.getUsageStats()
        ]);
        console.log('Fallback dashboard data fetched:', { analyticsData, historyData, billingData, usageData });
        setAnalytics(analyticsData);
        setHistory(historyData);
        setBillingProfile(billingData);
        setUsageStats(usageData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data for demo purposes
      setBillingProfile({
        id: 1,
        current_plan: {
          id: 1,
          name: 'Free Plan',
          price: 0,
          credits: 100,
          features: ['Basic validation']
        },
        credits_remaining: 100,
        credits_used_this_month: 0,
        billing_status: 'active',
        total_credits_purchased: 100,
        total_amount_spent: 0,
        last_credit_purchase: null,
        plan_start_date: new Date().toISOString(),
        plan_end_date: null,
        auto_renew: false,
        usage_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: 'Total Validations', 
      value: usageStats?.total_validations?.toLocaleString() || '0', 
      change: '+12%', 
      changeType: 'positive' as const, 
      icon: Activity 
    },
    { 
      label: 'Valid Emails', 
      value: usageStats?.valid_emails?.toLocaleString() || '0', 
      change: '+8%', 
      changeType: 'positive' as const, 
      icon: CheckCircle 
    },
    { 
      label: 'Invalid Emails', 
      value: usageStats?.invalid_emails?.toLocaleString() || '0', 
      change: '-3%', 
      changeType: 'negative' as const, 
      icon: TrendingDown 
    },
    { 
      label: 'Success Rate', 
      value: `${usageStats?.success_rate.toFixed(1) || '0'}%`, 
      change: '', 
      changeType: 'neutral' as const, 
      icon: Activity 
    },
  ];

  const quickActions = [
    {
      title: 'Single Email Validation',
      description: 'Validate individual email addresses',
      icon: CheckCircle,
      link: '/validate',
      color: 'bg-[#2ED8A3]',
      hoverColor: 'hover:bg-[#00C48C]',
    },
    {
      title: 'Bulk Validation',
      description: 'Upload CSV file for batch validation',
      icon: FileText,
      link: '/validate',
      color: 'bg-[#004E8A]',
      hoverColor: 'hover:bg-[#1E5A8A]',
    },
    {
      title: 'API Integration',
      description: 'Get your API key for programmatic access',
      icon: Key,
      link: '/apikeys',
      color: 'bg-[#8B5CF6]',
      hoverColor: 'hover:bg-[#7C3AED]',
    },
    {
      title: 'View History',
      description: 'Check your validation history and reports',
      icon: History,
      link: '/history',
      color: 'bg-[#F59E0B]',
      hoverColor: 'hover:bg-[#D97706]',
    },
  ];

  const recentActivity = history?.results.slice(0, 4).map(result => ({
    email: result.email,
    status: result.is_valid ? 'valid' : 'invalid',
    time: dayjs((result as any).created_at).format('ddd DD MMM, YYYY - HH:mm')
  })) || [
    { email: 'Loading...', status: 'valid', time: '' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-[#2ED8A3] transition-colors duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {loading ? 'Loading your dashboard...' : (
                <>You have validated <span className="font-semibold text-[#2ED8A3]">{usageStats?.total_validations?.toLocaleString() || '0'} emails</span> this month.</>
              )}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Credits Remaining</p>
              <p className="text-2xl font-bold text-[#2ED8A3]">{billingProfile?.credits_remaining?.toLocaleString() || '0'}</p>
            </div>
            <div className="w-16 h-16 bg-[#2ED8A3]/10 rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-[#2ED8A3]" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="w-4 h-4 text-[#00C48C] mr-1" />
                      ) : stat.changeType === 'negative' ? (
                        <TrendingDown className="w-4 h-4 text-[#FF4C4C] mr-1" />
                      ) : null}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-[#00C48C]' : 
                        stat.changeType === 'negative' ? 'text-[#FF4C4C]' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.changeType === 'positive' ? 'bg-[#00C48C]/10' : stat.changeType === 'negative' ? 'bg-[#FF4C4C]/10' : 'bg-[#2ED8A3]/10'} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${
                    stat.changeType === 'positive' ? 'text-[#00C48C]' : 
                    stat.changeType === 'negative' ? 'text-[#FF4C4C]' : 'text-[#2ED8A3]'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-[#2ED8A3]"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-200`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[#2ED8A3] transition-colors duration-200">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <History className="w-5 h-5 mr-2 text-[#2ED8A3]" />
            Recent Validations
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'valid' ? 'bg-[#00C48C]' : 'bg-[#FF4C4C]'
                  }`}></div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{activity.email}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
          <Link
            to="/history"
            className="mt-4 inline-flex items-center text-[#2ED8A3] hover:text-[#00C48C] font-medium text-sm"
          >
            View all history
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-[#2ED8A3]" />
            API Usage
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">This month</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {usageStats?.this_month?.validations?.toLocaleString() || '0'} validations
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-[#2ED8A3] h-2 rounded-full transition-all duration-1000 ease-out" 
                  style={{ 
                    width: billingProfile ? `${Math.min((billingProfile.credits_used_this_month / (billingProfile.credits_remaining + billingProfile.credits_used_this_month)) * 100, 100)}%` : '0%' 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>0</span>
                <span>{billingProfile ? ((billingProfile.credits_remaining || 0) + (billingProfile.credits_used_this_month || 0)).toLocaleString() : '0'}</span>
              </div>
            </div>
            <div className="bg-[#2ED8A3]/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-[#2ED8A3] font-medium text-sm">Credits Remaining</span>
                <span className="text-lg font-bold text-[#2ED8A3]">{billingProfile?.credits_remaining?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
          <Link
            to="/billing"
            className="mt-4 inline-flex items-center text-[#2ED8A3] hover:text-[#00C48C] font-medium text-sm"
          >
            Manage billing
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 