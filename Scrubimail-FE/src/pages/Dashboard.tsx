import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  FileText, 
  Key, 
  History, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Activity
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Validations', value: '12,847', change: '+12%', changeType: 'positive', icon: Activity },
    { label: 'Valid Emails', value: '11,234', change: '+8%', changeType: 'positive', icon: CheckCircle },
    { label: 'Invalid Emails', value: '1,613', change: '-3%', changeType: 'negative', icon: TrendingDown },
    { label: 'Credits Remaining', value: '1,250', change: '', changeType: 'neutral', icon: Activity },
  ];

  const quickActions = [
    {
      title: 'Single Email Validation',
      description: 'Validate individual email addresses',
      icon: CheckCircle,
      link: '/validate',
      color: 'from-[#2ED8A3] to-[#00C48C]',
    },
    {
      title: 'Bulk Validation',
      description: 'Upload CSV file for batch validation',
      icon: FileText,
      link: '/validate',
      color: 'from-[#004E8A] to-[#2ED8A3]',
    },
    {
      title: 'API Integration',
      description: 'Get your API key for programmatic access',
      icon: Key,
      link: '/apikeys',
      color: 'from-[#FFC947] to-[#FF4C4C]',
    },
    {
      title: 'View History',
      description: 'Check your validation history and reports',
      icon: History,
      link: '/history',
      color: 'from-[#2ED8A3] to-[#004E8A]',
    },
  ];

  const recentActivity = [
    { email: 'john@example.com', status: 'valid', time: '2 minutes ago' },
    { email: 'invalid-email', status: 'invalid', time: '5 minutes ago' },
    { email: 'sarah@company.com', status: 'valid', time: '10 minutes ago' },
    { email: 'test@domain', status: 'invalid', time: '15 minutes ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-white/90 text-lg">
          Ready to validate some emails? You have <span className="font-semibold">1,250 credits</span> remaining.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333333] dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#333333] dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="flex flex-col items-end">
                  <IconComponent className="w-8 h-8 text-[#2ED8A3] mb-2" />
                  {stat.change && (
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-[#00C48C]' : 
                      stat.changeType === 'negative' ? 'text-[#FF4C4C]' : 'text-[#333333]'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white text-xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[#333333] dark:text-white mb-2">{action.title}</h3>
                <p className="text-sm text-[#333333]/70 dark:text-gray-400">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4">Recent Validations</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#F4F5F7] dark:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'valid' ? 'bg-[#00C48C]' : 'bg-[#FF4C4C]'
                  }`}></div>
                  <span className="font-medium text-[#333333] dark:text-white">{activity.email}</span>
                </div>
                <span className="text-sm text-[#333333]/70 dark:text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
          <Link
            to="/history"
            className="mt-4 inline-flex items-center text-[#2ED8A3] hover:text-[#004E8A] font-medium"
          >
            View all history
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4">API Usage</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[#333333]/70 dark:text-gray-400">This month</span>
              <span className="font-semibold text-[#333333] dark:text-white">847 validations</span>
            </div>
            <div className="w-full bg-[#F4F5F7] dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
            <div className="flex justify-between text-sm text-[#333333]/70 dark:text-gray-400">
              <span>0</span>
              <span>1,250</span>
            </div>
          </div>
          <Link
            to="/billing"
            className="mt-4 inline-flex items-center text-[#2ED8A3] hover:text-[#004E8A] font-medium"
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