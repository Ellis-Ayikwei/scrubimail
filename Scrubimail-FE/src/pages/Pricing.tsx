import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import {
  Check,
  X,
  Zap,
  Shield,
  ArrowRight,
  Globe,
  TrendingUp,
  Database,
  Code,
  Loader2,
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
  planId: number;
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
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const plansData = await billingService.getPlans();
        const activePlans = Array.isArray(plansData)
          ? plansData
          : (plansData as { results?: Plan[] })?.results || [];

        const mappedPlans: PricingTier[] = activePlans
          .filter((plan: Plan) => plan.is_active)
          .map((plan: Plan) => {
            const features: string[] = [];

            if (plan.features) {
              if (Array.isArray(plan.features)) {
                features.push(...plan.features.filter((f) => f != null));
              } else if (typeof plan.features === 'object' && plan.features !== null) {
                Object.entries(plan.features).forEach(([key, value]) => {
                  if (value === true) {
                    const readable = key?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ?? '';
                    if (readable) features.push(readable);
                  } else if (typeof value === 'string' && value) {
                    features.push(value);
                  }
                });
              }
            }

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

            const monthlyPrice = Number(plan.price ?? 0);
            const isCustom = monthlyPrice === 0 || plan.name?.toLowerCase().includes('enterprise');
            const yearlyPriceValue =
              plan.yearly_price != null ? Number(plan.yearly_price) : monthlyPrice * 10;
            const currentPrice = billingCycle === 'yearly' ? yearlyPriceValue : monthlyPrice;
            const originalPrice =
              billingCycle === 'yearly' && monthlyPrice > 0 ? monthlyPrice * 12 : undefined;

            const planName = plan.name?.toLowerCase() ?? '';
            const creditsPerMonth = plan.credits_per_month ?? 0;
            const credits =
              creditsPerMonth === 0 || planName.includes('enterprise')
                ? 'Custom volume'
                : `${creditsPerMonth.toLocaleString()}/month`;

            const support = plan.priority_support
              ? 'Priority support'
              : planName.includes('enterprise')
                ? 'Dedicated account manager'
                : 'Email & chat support';

            const isPopular = planName.includes('professional') || planName.includes('pro');

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

            const limitations = planName.includes('free')
              ? ['No SMTP verification', 'No bulk processing', 'Limited analytics']
              : undefined;

            return {
              id: planName.replace(/\s+/g, '-'),
              planId: plan.id,
              name: plan.name ?? 'Unnamed Plan',
              description: plan.description || '',
              price: isCustom ? 0 : (currentPrice ?? 0),
              originalPrice:
                billingCycle === 'yearly' && !isCustom && originalPrice ? originalPrice : undefined,
              period: billingCycle,
              popular: isPopular,
              features: features.length > 0 ? features : ['Core validation features'],
              limitations,
              validations: credits,
              support,
              buttonText,
              buttonVariant,
            };
          })
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

  const handlePlanSelect = (tier: PricingTier) => {
    const planName = tier.name?.toLowerCase() ?? '';

    if (planName.includes('enterprise')) {
      navigate('/contact');
      return;
    }

    if (isAuthenticated) {
      navigate(`/billing?plan=${tier.planId}`);
    } else {
      if (planName.includes('free')) {
        navigate('/register');
      } else {
        navigate(`/register?plan=${tier.planId}&plan_name=${encodeURIComponent(tier.name)}`);
      }
    }
  };

  const faqs = [
    {
      question: 'What counts as an email validation?',
      answer:
        'Each unique email address processed through our API counts as one validation, regardless of the validation result.',
    },
    {
      question: 'Do unused validations roll over?',
      answer:
        'No, unused validations expire at the end of each billing cycle. We recommend choosing a plan that matches your monthly usage.',
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer:
        'Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at your next billing cycle.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
    },
    {
      question: 'Is there an API rate limit?',
      answer:
        'Yes, rate limits vary by plan. Free: 10 requests/minute, Starter: 100/minute, Professional: 500/minute, Enterprise: custom.',
    },
    {
      question: 'Do you provide technical support?',
      answer:
        'Yes, all plans include support. Free users get community support, while paid plans get email, chat, and phone support.',
    },
  ];

  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Average response time under 300ms worldwide' },
    { icon: Shield, title: '99.9% Accurate', description: 'Industry-leading accuracy with advanced ML models' },
    { icon: Globe, title: 'Global Coverage', description: 'Validate emails from any country or domain' },
    { icon: Database, title: 'Real-time Processing', description: 'Instant validation with live SMTP checking' },
    { icon: Code, title: 'Developer Friendly', description: 'RESTful API with SDKs in multiple languages' },
    { icon: TrendingUp, title: 'Detailed Analytics', description: 'Comprehensive insights and validation reports' },
  ];

  const planButtonClass = (variant: PricingTier['buttonVariant']) => {
    if (variant === 'primary') {
      return 'bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] hover:brightness-110';
    }
    if (variant === 'secondary') {
      return 'bg-gray-900 text-white dark:bg-[#0b1014] dark:text-[#e0e3e8] border border-emerald-500/40 dark:border-[#6effc0]/60 hover:bg-gray-800 dark:hover:bg-[#020617]';
    }
    return 'border border-gray-300 text-gray-900 dark:border-[#3b4a41]/70 dark:text-[#e0e3e8] hover:border-emerald-400 dark:hover:border-[#6effc0]/70 bg-white/50 dark:bg-transparent';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#101418] dark:text-[#e0e3e8]">
      {/* Header */}
      <div className="relative overflow-hidden pt-24 pb-16 border-b border-gray-200 dark:border-[#3b4a41]/25 bg-white dark:bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-50 dark:hidden"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 hidden dark:block"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(59,74,65,0.35) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background:
              'radial-gradient(circle at 50% -10%, rgba(16,185,129,0.14) 0%, transparent 60%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background:
              'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-gray-100 border border-gray-200 dark:bg-[#1c2024] dark:border-[#3b4a41]/40 mb-8 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#6effc0] animate-pulse" />
            <span className="font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.3em] text-emerald-700 dark:text-[#6effc0]">
              Precision Scaling
            </span>
          </div>

          <h1 className="font-['Epilogue',sans-serif] font-black tracking-tighter text-4xl sm:text-5xl lg:text-6xl text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing for{' '}
            <span className="text-emerald-600 dark:text-[#6effc0] italic">Scalable Operations.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-[#94a3b8] mb-10 max-w-2xl mx-auto">
            Choose the surgical precision tier that matches your throughput. No hidden fees, just
            high‑fidelity validation.
          </p>

          <div className="inline-flex items-center bg-gray-200/80 border border-gray-300 dark:bg-[#0b1014] dark:border-[#3b4a41]/60 rounded-sm p-1 mb-4">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 text-xs font-['Space_Grotesk',sans-serif] uppercase tracking-[0.25em] transition-all rounded-sm ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200 dark:bg-[#1c2024] dark:text-white dark:border-white/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 text-xs font-['Space_Grotesk',sans-serif] uppercase tracking-[0.25em] relative transition-all rounded-sm ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200 dark:bg-[#1c2024] dark:text-white dark:border-white/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white'
              }`}
            >
              Annual_Cluster
              <span className="absolute -top-3 -right-2 bg-emerald-500 text-white dark:bg-[#6effc0] dark:text-[#003824] text-[9px] px-2 py-0.5 font-bold uppercase tracking-[0.18em] rounded-sm">
                −17%
              </span>
            </button>
          </div>
          <div className="text-[10px] font-['Space_Grotesk',sans-serif] uppercase tracking-[0.28em] text-gray-500 dark:text-[#64748b]">
            Billing_Mode: {billingCycle === 'monthly' ? 'Standard_Monthly' : 'Annual_Optimized'}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-[#2ED8A3]" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((tier) => (
              <div
                key={tier.id}
                className={`relative p-8 flex flex-col justify-between transition-all duration-300 rounded-sm ${
                  tier.popular
                    ? 'bg-white dark:bg-[#181c20] border-2 border-emerald-400 dark:border-[#6effc0]/60 shadow-lg shadow-emerald-500/10 dark:shadow-[0_0_40px_rgba(110,255,192,0.18)]'
                    : 'bg-white dark:bg-[#181c20] border border-gray-200 dark:border-[#3b4a41]/60 hover:border-emerald-300 dark:hover:border-[#6effc0]/50 hover:shadow-md dark:hover:shadow-[0_0_30px_rgba(110,255,192,0.12)]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] text-[9px] font-['Space_Grotesk',sans-serif] uppercase tracking-[0.25em] rounded-sm">
                    Most_Popular
                  </div>
                )}

                <div className="mb-6 text-center">
                  <div className="font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-[#64748b] mb-2">
                    {tier.name?.toLowerCase().includes('free')
                      ? 'Node_Dev'
                      : tier.name?.toLowerCase().includes('enterprise')
                        ? 'Node_Enterprise'
                        : 'Node_Production'}
                  </div>
                  <h3 className="text-2xl font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name || 'Unnamed Plan'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-[#94a3b8] mb-6">
                    {tier.description || 'Core validation capacity for this node class.'}
                  </p>

                  <div className="mb-4">
                    {Number(tier.price ?? 0) === 0 && tier.name?.toLowerCase().includes('enterprise') ? (
                      <div className="text-4xl font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-white">
                        Custom
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-white">
                          ${Number(tier.price ?? 0).toFixed(0)}
                        </span>
                        {tier.originalPrice && (
                          <span className="text-sm text-gray-400 dark:text-[#64748b] line-through">
                            ${Number(tier.originalPrice).toFixed(0)}
                          </span>
                        )}
                        {Number(tier.price ?? 0) > 0 && (
                          <span className="text-xs text-gray-500 dark:text-[#64748b] font-['Space_Grotesk',sans-serif] uppercase tracking-[0.25em]">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-600 dark:text-[#9ca3af] font-mono mb-6">
                    {tier.validations || 'Custom volume'} • {tier.support || 'Support channel'}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect(tier)}
                    className={`w-full inline-flex items-center justify-center px-6 py-3 text-xs font-['Space_Grotesk',sans-serif] uppercase tracking-[0.25em] transition-all rounded-sm ${planButtonClass(
                      tier.buttonVariant
                    )}`}
                  >
                    {tier.buttonText || 'Get started'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  <h4 className="font-['Space_Grotesk',sans-serif] text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-[#64748b]">
                    Included_Capabilities
                  </h4>
                  <ul className="space-y-2">
                    {(tier.features || []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-[#6effc0] mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-[#cbd5f5]">{feature || 'N/A'}</span>
                      </li>
                    ))}
                    {(tier.limitations || []).map((limitation, index) => (
                      <li key={`limit-${index}`} className="flex items-start gap-2">
                        <X className="w-4 h-4 text-gray-400 dark:text-[#64748b] mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-[#94a3b8]">{limitation || 'N/A'}</span>
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
      <div className="bg-gray-100 dark:bg-[#080c10] py-20 border-t border-gray-200 dark:border-[#3b4a41]/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.3em] text-emerald-700 dark:text-[#6effc0] mb-3">
              Platform_Characteristics
            </div>
            <h2 className="font-['Epilogue',sans-serif] text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
              Surgical Infrastructure. Pricing that follows.
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-[#94a3b8] max-w-2xl mx-auto">
              Every tier runs on the same high‑fidelity validation engine—only capacity and support
              envelopes change.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#101418] border border-gray-200 dark:border-[#3b4a41]/60 px-6 py-8 flex flex-col items-start gap-4 rounded-sm shadow-sm dark:shadow-none"
              >
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/40 flex items-center justify-center rounded-sm">
                  <feature.icon className="w-5 h-5 text-emerald-600 dark:text-[#6effc0]" />
                </div>
                <h3 className="font-['Epilogue',sans-serif] text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-[#9ca3af]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-[#101418] py-20 border-t border-gray-200 dark:border-[#3b4a41]/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12">
            <div className="font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.3em] text-emerald-700 dark:text-[#6effc0] mb-2">
              Technical_Briefing
            </div>
            <h2 className="font-['Epilogue',sans-serif] text-3xl font-bold text-gray-900 dark:text-white">
              Pricing Questions, Answered.
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#3b4a41]/60 rounded-sm p-6"
              >
                <h3 className="text-sm font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-gray-900 dark:text-[#e0e3e8] mb-2">
                  {String(index + 1).padStart(2, '0')}. {faq.question}
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#94a3b8] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 dark:bg-[#080c10] py-20 border-t border-gray-200 dark:border-[#3b4a41]/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.3em] text-emerald-700 dark:text-[#6effc0] mb-4">
            Ready_To_Deploy
          </div>
          <h2 className="font-['Epilogue',sans-serif] text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
            Ready to build with precision?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#94a3b8] mb-8 max-w-xl mx-auto">
            Pick a node class, wire your API key, and start streaming validated traffic in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? '/billing' : '/register')}
              className="inline-flex items-center justify-center px-10 py-4 bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.3em] font-bold hover:brightness-110 transition-all rounded-sm"
            >
              {isAuthenticated ? 'Go_To_Billing' : 'Start_Free_Trial'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <Link
              to="/api-docs"
              className="inline-flex items-center justify-center px-10 py-4 border border-emerald-400/60 dark:border-[#6effc0]/60 text-gray-900 dark:text-[#e0e3e8] font-['Space_Grotesk',sans-serif] text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-50 dark:hover:bg-white/5 transition-all rounded-sm"
            >
              View_Specification
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
