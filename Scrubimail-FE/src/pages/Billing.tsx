import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  Download,
  ArrowRight,
  Loader2,
  Crown,
  Star,
  Users
} from 'lucide-react';
import axiosInstance from '../services/axiosInstance';

const Billing = () => {
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>({
    thisMonth: 0,
    lastMonth: 0,
    totalValidations: 0
  });

  useEffect(() => {
    const fetchBillingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [creditsRes, usageRes] = await Promise.all([
          axiosInstance.get('/credits/'),
          axiosInstance.get('/analytics/')
        ]);
        setCredits(creditsRes.data.credits);
        setUsage({
          thisMonth: usageRes.data.overview?.total_validations || 0,
          lastMonth: 0, // TODO: Get from analytics
          totalValidations: usageRes.data.overview?.total_validations || 0
        });
      } catch (err: any) {
        setError('Failed to fetch billing information');
      } finally {
        setLoading(false);
      }
    };
    fetchBillingData();
  }, []);

  const plans = [
    { 
      name: 'Free', 
      price: 0, 
      credits: 100, 
      popular: false,
      icon: Star,
      features: [
        '100 validations/month',
        'Basic email validation',
        'Community support',
        'Standard response times'
      ],
      color: 'from-gray-400 to-gray-600'
    },
    { 
      name: 'Professional', 
      price: 29, 
      credits: 1000, 
      popular: true,
      icon: Crown,
      features: [
        '1,000 validations/month',
        'Advanced validation features',
        'Priority support',
        'API access',
        'Bulk validation',
        'Analytics dashboard'
      ],
      color: 'from-[#2ED8A3] to-[#004E8A]'
    },
    { 
      name: 'Enterprise', 
      price: 99, 
      credits: 5000, 
      popular: false,
      icon: Users,
      features: [
        '5,000 validations/month',
        'All Professional features',
        '24/7 phone support',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee'
      ],
      color: 'from-purple-500 to-purple-700'
    },
  ];

  const currentPlan = plans.find(p => p.name.toLowerCase() === plan.toLowerCase()) || plans[0];

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3] mx-auto mb-4" />
  //         <p className="text-[#333333] dark:text-white">Loading billing information...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-[#2ED8A3]" />
            Billing & Credits
          </h1>
          <p className="text-[#333333]/70 dark:text-gray-400">
            Manage your subscription, view usage, and upgrade your plan
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan & Usage */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-white">Current Plan</h2>
              <div className={`w-8 h-8 bg-gradient-to-r ${currentPlan.color} rounded-lg flex items-center justify-center`}>
                <currentPlan.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#333333] dark:text-white mb-1">
              {currentPlan.name}
            </div>
            <div className="text-[#333333]/70 dark:text-gray-400 mb-4">
              ${currentPlan.price}/month
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#333333]/70 dark:text-gray-400">Credits Remaining:</span>
                <span className="font-semibold text-[#333333] dark:text-white">{credits?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#333333]/70 dark:text-gray-400">Total Credits:</span>
                <span className="font-semibold text-[#333333] dark:text-white">{currentPlan.credits.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Usage This Month */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-white">Usage This Month</h2>
              <TrendingUp className="w-6 h-6 text-[#2ED8A3]" />
            </div>
            <div className="text-3xl font-bold text-[#2ED8A3] mb-1">
              {usage.thisMonth?.toLocaleString() || '0'}
            </div>
            <div className="text-[#333333]/70 dark:text-gray-400 mb-4">
              Validations Used
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#2ED8A3] to-[#00C48C] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(((usage.thisMonth || 0) / currentPlan.credits) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-[#333333]/50 dark:text-gray-400 mt-2">
              {Math.round(((usage.thisMonth || 0) / currentPlan.credits) * 100)}% of monthly limit
            </div>
          </div>

          {/* Total Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-white">Total Usage</h2>
              <Zap className="w-6 h-6 text-[#2ED8A3]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] dark:text-white mb-1">
              {usage.totalValidations?.toLocaleString() || '0'}
            </div>
            <div className="text-[#333333]/70 dark:text-gray-400 mb-4">
              All Time Validations
            </div>
            <div className="flex items-center text-sm text-[#333333]/70 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              Since account creation
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((planItem) => {
              const IconComponent = planItem.icon;
              const isCurrentPlan = planItem.name.toLowerCase() === currentPlan.name.toLowerCase();
              
              return (
                <div 
                  key={planItem.name} 
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                    planItem.popular 
                      ? 'border-[#2ED8A3]' 
                      : isCurrentPlan 
                        ? 'border-[#2ED8A3]/50' 
                        : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {planItem.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#2ED8A3] text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${planItem.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-2">
                      {planItem.name}
                    </h3>
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-3xl font-bold text-[#333333] dark:text-white">
                        ${planItem.price}
                      </span>
                      <span className="text-[#333333]/70 dark:text-gray-400 ml-1">
                        /month
                      </span>
                    </div>
                    <p className="text-[#333333]/70 dark:text-gray-400">
                      {planItem.credits.toLocaleString()} validations per month
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {planItem.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#2ED8A3] mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#333333] dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-[#F4F5F7] dark:bg-gray-700 text-[#333333] dark:text-white cursor-default'
                        : planItem.popular
                          ? 'bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] text-white hover:from-[#00C48C] hover:to-[#2ED8A3]'
                          : 'bg-[#F4F5F7] dark:bg-gray-700 text-[#333333] dark:text-white hover:bg-[#2ED8A3] hover:text-white dark:hover:bg-[#2ED8A3]'
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Billing Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors">
                <span className="text-[#333333] dark:text-white">Download Invoice</span>
                <Download className="w-4 h-4 text-[#2ED8A3]" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors">
                <span className="text-[#333333] dark:text-white">Update Payment Method</span>
                <ArrowRight className="w-4 h-4 text-[#2ED8A3]" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors">
                <span className="text-[#333333] dark:text-white">Cancel Subscription</span>
                <ArrowRight className="w-4 h-4 text-[#2ED8A3]" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Need Help?</h3>
            <p className="text-[#333333]/70 dark:text-gray-400 mb-4">
              Have questions about billing or need to upgrade your plan? Our support team is here to help.
            </p>
            <button className="w-full bg-[#2ED8A3] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00C48C] transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing; 