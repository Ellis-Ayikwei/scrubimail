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
import billingService, { BillingProfile, BillingAnalytics, UsageStats } from '../services/billingService';

interface Plan {
  id: number;
  name: string;
  price: number;
  credits_per_month: number;
  features?: string[];
  is_active: boolean;
  supports_api: boolean;
  supports_bulk: boolean;
  priority_support: boolean;
}

const Billing = () => {
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, plansRes, usageRes] = await Promise.all([
          billingService.getBillingProfile(),
          billingService.getPlans(),
          billingService.getUsageStats()
        ]);
        
        setBillingProfile(profileRes);
        setPlans(Array.isArray(plansRes) ? plansRes : plansRes.results || []);
        setUsageStats(usageRes);
      } catch (err: any) {
        console.error('Error fetching billing data:', err);
        setError(err.message || 'Failed to fetch billing information');
      } finally {
        setLoading(false);
      }
    };
    fetchBillingData();
  }, []);

  const currentPlan = billingProfile?.current_plan;
  const creditsRemaining = billingProfile?.credits_remaining || 0;
  const creditsUsedThisMonth = billingProfile?.credits_used_this_month || 0;
  const totalCredits = currentPlan?.credits_per_month || 0;
  const usageThisMonth = usageStats?.this_month?.validations || creditsUsedThisMonth;
  const totalValidations = usageStats?.total_validations || 0;
  
  // Map plan icons
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return Star;
    if (name.includes('enterprise')) return Users;
    return Crown;
  };

  // Map plan colors
  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return 'from-gray-400 to-gray-600';
    if (name.includes('enterprise')) return 'from-purple-500 to-purple-700';
    return 'from-[#2ED8A3] to-[#004E8A]';
  };

  // Format features from plan
  const formatPlanFeatures = (plan: Plan): string[] => {
    const features: string[] = [];
    if (plan.credits_per_month) {
      features.push(`${plan.credits_per_month.toLocaleString()} validations/month`);
    }
    if (plan.supports_api) {
      features.push('API access');
    }
    if (plan.supports_bulk) {
      features.push('Bulk validation');
    }
    if (plan.priority_support) {
      features.push('Priority support');
    } else {
      features.push('Community support');
    }
    if (plan.features && Array.isArray(plan.features)) {
      features.push(...plan.features);
    }
    return features;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3] mx-auto mb-4" />
          <p className="text-[#333333] dark:text-white">Loading billing information...</p>
        </div>
      </div>
    );
  }

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
              {currentPlan && (
                <div className={`w-8 h-8 bg-gradient-to-r ${getPlanColor(currentPlan.name)} rounded-lg flex items-center justify-center`}>
                  {React.createElement(getPlanIcon(currentPlan.name), { className: "w-4 h-4 text-white" })}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-[#333333] dark:text-white mb-1">
              {currentPlan?.name || 'Free'}
            </div>
            <div className="text-[#333333]/70 dark:text-gray-400 mb-4">
              ${currentPlan?.price || 0}/month
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#333333]/70 dark:text-gray-400">Credits Remaining:</span>
                <span className="font-semibold text-[#333333] dark:text-white">{creditsRemaining.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#333333]/70 dark:text-gray-400">Total Credits:</span>
                <span className="font-semibold text-[#333333] dark:text-white">{totalCredits.toLocaleString()}</span>
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
              {usageThisMonth.toLocaleString()}
            </div>
            <div className="text-[#333333]/70 dark:text-gray-400 mb-4">
              Validations Used
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#2ED8A3] to-[#00C48C] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalCredits > 0 ? (usageThisMonth / totalCredits) * 100 : 0), 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-[#333333]/50 dark:text-gray-400 mt-2">
              {totalCredits > 0 ? Math.round((usageThisMonth / totalCredits) * 100) : 0}% of monthly limit
            </div>
          </div>

          {/* Total Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-white">Total Usage</h2>
              <Zap className="w-6 h-6 text-[#2ED8A3]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] dark:text-white mb-1">
              {totalValidations.toLocaleString()}
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
            {plans.filter(p => p.is_active).map((planItem) => {
              const IconComponent = getPlanIcon(planItem.name);
              const isCurrentPlan = currentPlan?.id === planItem.id;
              const features = formatPlanFeatures(planItem);
              const isPopular = planItem.name.toLowerCase().includes('professional') || planItem.name.toLowerCase().includes('pro');
              
              return (
                <div 
                  key={planItem.id} 
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                    isPopular 
                      ? 'border-[#2ED8A3]' 
                      : isCurrentPlan 
                        ? 'border-[#2ED8A3]/50' 
                        : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#2ED8A3] text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getPlanColor(planItem.name)} rounded-xl flex items-center justify-center mx-auto mb-3`}>
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
                      {planItem.credits_per_month.toLocaleString()} validations per month
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#2ED8A3] mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#333333] dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={() => {
                      if (!isCurrentPlan) {
                        billingService.upgradePlan(planItem.id).then(() => {
                          window.location.reload();
                        }).catch(err => {
                          setError(err.message || 'Failed to upgrade plan');
                        });
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-[#F4F5F7] dark:bg-gray-700 text-[#333333] dark:text-white cursor-default'
                        : isPopular
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
              <button 
                onClick={async () => {
                  if (window.confirm('Are you sure you want to cancel your subscription?')) {
                    try {
                      await billingService.cancelSubscription();
                      window.location.reload();
                    } catch (err: any) {
                      setError(err.message || 'Failed to cancel subscription');
                    }
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors"
              >
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