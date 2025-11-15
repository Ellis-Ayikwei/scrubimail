import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  Shield, 
  Users, 
  Headphones, 
  ArrowRight, 
  Star,
  Clock,
  Globe,
  TrendingUp,
  Database,
  Code,
  Loader2
} from 'lucide-react';
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

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  period: string;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  validations: string;
  support: string;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const plansData = await billingService.getPlans();
        const activePlans = Array.isArray(plansData) ? plansData : plansData.results || [];
        
        // Map API plans to component format
        const mappedPlans: PricingTier[] = activePlans
          .filter((plan: Plan) => plan.is_active)
          .map((plan: Plan) => {
            // Format features from plan
            const features: string[] = [];
            
            // Handle features field (could be array or object)
            if (plan.features) {
              if (Array.isArray(plan.features)) {
                features.push(...plan.features.filter(f => f != null));
              } else if (typeof plan.features === 'object' && plan.features !== null) {
                // Convert feature object to readable strings
                Object.entries(plan.features).forEach(([key, value]) => {
                  if (value === true) {
                    // Convert key to readable format
                    const readable = key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? '';
                    if (readable) features.push(readable);
                  } else if (typeof value === 'string' && value) {
                    features.push(value);
                  }
                });
              }
            }
            
            // Add feature flags
            if (plan.credits_per_month && plan.credits_per_month > 0) {
              features.unshift(`${plan.credits_per_month.toLocaleString()} email validations per month`);
            }
            if (plan.supports_api) {
              features.push('API access');
            }
            if (plan.supports_bulk) {
              features.push('Bulk file processing');
            }
            if (plan.priority_support) {
              features.push('Priority support (24/7)');
            } else {
              features.push('Email & chat support');
            }
            
            // Format price based on billing cycle
            const monthlyPrice = Number(plan.price ?? 0);
            const isCustom = monthlyPrice === 0 || plan.name?.toLowerCase().includes('enterprise');
            const yearlyPriceValue = plan.yearly_price != null ? Number(plan.yearly_price) : (monthlyPrice * 10); // Default to 10 months if not set
            const currentPrice = billingCycle === 'yearly' ? yearlyPriceValue : monthlyPrice;
            const originalPrice = billingCycle === 'yearly' && monthlyPrice > 0 ? (monthlyPrice * 12) : undefined;
            
            // Format credits
            const planName = plan.name?.toLowerCase() ?? '';
            const creditsPerMonth = plan.credits_per_month ?? 0;
            const credits = creditsPerMonth === 0 || planName.includes('enterprise')
              ? 'Custom volume'
              : `${creditsPerMonth.toLocaleString()}/month`;
            
            // Determine support level
            const support = plan.priority_support 
              ? 'Priority support' 
              : planName.includes('enterprise')
              ? 'Dedicated account manager'
              : 'Email & chat support';
            
            // Determine if popular (Professional or Pro plans)
            const isPopular = planName.includes('professional') || 
                            planName.includes('pro');
            
            // Button text and variant
            let buttonText = 'Get started';
            let buttonVariant: 'primary' | 'secondary' | 'outline' = 'primary';
            
            if (planName.includes('free')) {
              buttonText = 'Get started free';
              buttonVariant = 'outline';
            } else if (planName.includes('enterprise')) {
              buttonText = 'Contact sales';
              buttonVariant = 'secondary';
            } else {
              buttonText = 'Start free trial';
            }
            
            // Limitations for free plan
            const limitations = planName.includes('free') ? [
              'No SMTP verification',
              'No bulk processing',
              'Limited analytics'
            ] : undefined;
            
            return {
              id: planName.replace(/\s+/g, '-'),
              name: plan.name ?? 'Unnamed Plan',
              description: plan.description || '',
              price: isCustom ? 0 : (currentPrice ?? 0),
              originalPrice: billingCycle === 'yearly' && !isCustom && originalPrice ? originalPrice : undefined,
              period: billingCycle,
              popular: isPopular,
              features: features.length > 0 ? features : ['Core validation features'],
              limitations,
              validations: credits,
              support,
              buttonText,
              buttonVariant
            };
          })
          // Sort plans: custom pricing plans go to the end
          .sort((a: PricingTier, b: PricingTier) => {
            const aPrice = Number(a.price ?? 0);
            const bPrice = Number(b.price ?? 0);
            const aName = a.name?.toLowerCase() ?? '';
            const bName = b.name?.toLowerCase() ?? '';
            const aIsCustom = aPrice === 0 && aName.includes('enterprise');
            const bIsCustom = bPrice === 0 && bName.includes('enterprise');
            if (aIsCustom === bIsCustom) {
              return aPrice - bPrice;
            }
            return aIsCustom ? 1 : -1;
          });
        
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

  const faqs = [
    {
      question: 'What counts as an email validation?',
      answer: 'Each unique email address processed through our API counts as one validation, regardless of the validation result.'
    },
    {
      question: 'Do unused validations roll over?',
      answer: 'No, unused validations expire at the end of each billing cycle. We recommend choosing a plan that matches your monthly usage.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at your next billing cycle.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us for a full refund.'
    },
    {
      question: 'Is there an API rate limit?',
      answer: 'Yes, rate limits vary by plan. Free: 10 requests/minute, Starter: 100/minute, Professional: 500/minute, Enterprise: custom.'
    },
    {
      question: 'Do you provide technical support?',
      answer: 'Yes, all plans include support. Free users get community support, while paid plans get email, chat, and phone support.'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Average response time under 300ms worldwide'
    },
    {
      icon: Shield,
      title: '99.9% Accurate',
      description: 'Industry-leading accuracy with advanced ML models'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Validate emails from any country or domain'
    },
    {
      icon: Database,
      title: 'Real-time Processing',
      description: 'Instant validation with live SMTP checking'
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'RESTful API with SDKs in multiple languages'
    },
    {
      icon: TrendingUp,
      title: 'Detailed Analytics',
      description: 'Comprehensive insights and validation reports'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm font-medium mb-8">
            <Star className="w-4 h-4 mr-2" />
            30-day money-back guarantee
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white mb-6">
            Simple, transparent pricing
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Choose the perfect plan for your email validation needs. All plans include our core validation features with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-16">
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
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page.</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400">No pricing plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-8 ${
                tier.popular
                  ? 'border-[#2ED8A3] shadow-2xl scale-105'
                  : 'border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl'
              } transition-all duration-300`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#2ED8A3] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {tier.name || 'Unnamed Plan'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {tier.description || 'No description available'}
                </p>
                
                <div className="mb-4">
                  {(Number(tier.price ?? 0) === 0 && tier.name?.toLowerCase().includes('enterprise')) ? (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${Number(tier.price ?? 0).toFixed(0)}
                      </span>
                      {tier.originalPrice && (
                        <span className="text-lg text-gray-400 line-through ml-2">
                          ${Number(tier.originalPrice).toFixed(0)}
                        </span>
                      )}
                      {Number(tier.price ?? 0) > 0 && (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {tier.validations || 'N/A'} • {tier.support || 'N/A'}
                </div>

                <Link
                  to={tier.name?.toLowerCase().includes('enterprise') ? '/contact' : '/onboarding'}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-3xl font-medium transition-all duration-200 ${
                    tier.buttonVariant === 'primary'
                      ? 'bg-[#2ED8A3] text-white hover:bg-[#00C48C] shadow-lg hover:shadow-xl'
                      : tier.buttonVariant === 'secondary'
                      ? 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                      : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#2ED8A3] hover:text-[#2ED8A3]'
                  }`}
                >
                  {tier.buttonText || 'Get started'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  What's included:
                </h4>
                <ul className="space-y-3">
                  {(tier.features || []).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature || 'N/A'}
                      </span>
                    </li>
                  ))}
                  {(tier.limitations || []).map((limitation, index) => (
                    <li key={`limit-${index}`} className="flex items-start">
                      <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-400">
                        {limitation || 'N/A'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Why choose ScrubiMail?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Industry-leading email validation with enterprise-grade reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2ED8A3] rounded-2xl mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Still have questions?
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center text-[#2ED8A3] hover:text-[#00C48C] font-medium"
            >
              Contact our sales team
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#2ED8A3] to-[#00C48C] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to improve your email deliverability?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of developers who trust ScrubiMail for their email validation needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center px-8 py-4 bg-white text-[#2ED8A3] font-semibold rounded-3xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Start free trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-3xl hover:bg-white/10 transition-colors"
            >
              View documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;