import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import billingService from '../services/billingService';

interface Plan {
  id: number;
  name: string;
  price: number;
  yearly_price: number | null;
  credits_per_month: number;
  features?: string[] | Record<string, any>;
  is_active: boolean;
  supports_api: boolean;
  supports_bulk: boolean;
  priority_support: boolean;
  description?: string;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  credits: string;
  features: string[];
  popular: boolean;
}

interface PricingPlanWithCustom extends PricingPlan {
  isCustom: boolean;
}

const PricingSection: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const plansData = await billingService.getPlans();
        const activePlans = Array.isArray(plansData) ? plansData : plansData.results || [];
        
        // Map API plans to component format
        const mappedPlans = activePlans
          .filter((plan: Plan) => plan.is_active)
          .map((plan: Plan): PricingPlanWithCustom => {
            // Format features
            const features: string[] = [];
            
            // Handle features field (could be array or object)
            if (plan.features) {
              if (Array.isArray(plan.features)) {
                features.push(...plan.features);
              } else if (typeof plan.features === 'object') {
                // If features is an object, extract values
                Object.values(plan.features).forEach((feature) => {
                  if (typeof feature === 'string') {
                    features.push(feature);
                  }
                });
              }
            }
            
            // Add feature flags
            if (plan.credits_per_month && plan.credits_per_month > 0) {
              features.unshift(`${plan.credits_per_month.toLocaleString()} validations/month`);
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
            
            // Format price based on billing cycle
            const monthlyPrice = Number(plan.price ?? 0);
            const yearlyPriceValue = plan.yearly_price != null ? Number(plan.yearly_price) : (monthlyPrice * 10); // Default to 10 months if not set
            const currentPrice = billingCycle === 'yearly' ? yearlyPriceValue : monthlyPrice;
            const isCustom = currentPrice === 0 || plan.name?.toLowerCase().includes('enterprise');
            const formattedPrice = isCustom ? 'Custom' : `$${Number(currentPrice).toFixed(0)}`;
            const period = isCustom ? '' : (billingCycle === 'yearly' ? '/year' : '/month');
            
            // Format credits
            const planName = plan.name?.toLowerCase() ?? '';
            const creditsPerMonth = plan.credits_per_month ?? 0;
            const credits = creditsPerMonth === 0 || planName.includes('enterprise')
              ? 'Unlimited'
              : creditsPerMonth.toLocaleString();
            
            // Determine if popular (Professional or Pro plans)
            const isPopular = planName.includes('professional') || 
                            planName.includes('pro');
            
            return {
              name: plan.name ?? 'Unnamed Plan',
              price: formattedPrice,
              period,
              credits,
              features: features.length > 0 ? features : ['Core validation features'],
              popular: isPopular,
              isCustom // Add flag for sorting
            };
          })
          // Sort plans: custom pricing plans go to the end
          .sort((a: PricingPlanWithCustom, b: PricingPlanWithCustom) => {
            // If both are custom or both are not custom, maintain original order
            if (a.isCustom === b.isCustom) {
              return 0;
            }
            // Custom plans go to the end
            return a.isCustom ? 1 : -1;
          })
          // Remove the isCustom flag from the final result
          .map(({ isCustom, ...plan }: PricingPlanWithCustom): PricingPlan => plan);
        
        setPlans(mappedPlans);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError(err.message || 'Failed to load pricing plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [billingCycle]);

  if (loading) {
    return (
      <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include our core validation features.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
        
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#333333]/70 dark:text-gray-400">No pricing plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
            <div key={index} className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border-2 hover:shadow-xl transition-all duration-200 ${
              plan.popular ? 'border-[#2ED8A3] scale-105' : 'border-gray-200 dark:border-gray-700'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#2ED8A3] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#333333] dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl font-bold text-[#333333] dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-[#333333]/70 dark:text-gray-400 ml-1">
                    {plan.period}
                  </span>
                </div>
                <p className="text-[#333333]/70 dark:text-gray-400">
                  {plan.credits} validations per month
                </p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-[#00C48C] mr-3" />
                    <span className="text-[#333333] dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to="/onboarding"
                className={`w-full py-3 px-6 rounded-3xl font-semibold text-center transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] text-white hover:from-[#00C48C] hover:to-[#2ED8A3]'
                    : plan.name?.toLowerCase().includes('free')
                    ? 'bg-[#2ED8A3] text-white hover:bg-[#00C48C]'
                    : 'bg-[#F4F5F7] dark:bg-gray-700 text-[#333333] dark:text-white hover:bg-[#2ED8A3] hover:text-white dark:hover:bg-[#2ED8A3]'
                }`}
              >
                {plan.name?.toLowerCase().includes('free') ? 'Get Started Free' : 'Get Started'}
              </Link>
            </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection; 