import React, { useState } from 'react';
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
  Code
} from 'lucide-react';

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
  
  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started with email validation',
      price: 0,
      period: billingCycle,
      validations: '1,000/month',
      support: 'Community support',
      buttonText: 'Get started free',
      buttonVariant: 'outline',
      features: [
        '1,000 email validations per month',
        'Basic syntax validation',
        'DNS record checking',
        'API access',
        'Standard response time',
        'Email support'
      ],
      limitations: [
        'No SMTP verification',
        'No bulk processing',
        'Limited analytics'
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal for small businesses and growing teams',
      price: billingCycle === 'monthly' ? 29 : 290,
      originalPrice: billingCycle === 'yearly' ? 348 : undefined,
      period: billingCycle,
      validations: '10,000/month',
      support: 'Email & chat support',
      buttonText: 'Start free trial',
      buttonVariant: 'primary',
      popular: true,
      features: [
        '10,000 email validations per month',
        'Full syntax & DNS validation',
        'SMTP verification',
        'Disposable email detection',
        'Role-based email detection',
        'Fast response times (<300ms)',
        'Basic analytics dashboard',
        'API documentation',
        'Email & chat support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Advanced features for marketing teams and agencies',
      price: billingCycle === 'monthly' ? 99 : 990,
      originalPrice: billingCycle === 'yearly' ? 1188 : undefined,
      period: billingCycle,
      validations: '50,000/month',
      support: 'Priority support',
      buttonText: 'Start free trial',
      buttonVariant: 'primary',
      features: [
        '50,000 email validations per month',
        'All Starter features',
        'Bulk file processing',
        'Advanced spam trap detection',
        'Catch-all domain detection',
        'Domain reputation scoring',
        'Advanced analytics & reporting',
        'Webhook integrations',
        'Custom validation rules',
        'Priority support (24/7)'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      price: 0,
      period: 'custom',
      validations: 'Custom volume',
      support: 'Dedicated account manager',
      buttonText: 'Contact sales',
      buttonVariant: 'secondary',
      features: [
        'Unlimited email validations',
        'All Professional features',
        'Custom API rate limits',
        'White-label solutions',
        'On-premise deployment',
        'Custom integrations',
        'Advanced security features',
        'SLA guarantees',
        'Dedicated account manager',
        'Custom training & onboarding'
      ]
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingTiers.map((tier) => (
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
                  {tier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {tier.description}
                </p>
                
                <div className="mb-4">
                  {tier.id === 'enterprise' ? (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${tier.price}
                      </span>
                      {tier.originalPrice && (
                        <span className="text-lg text-gray-400 line-through ml-2">
                          ${tier.originalPrice}
                        </span>
                      )}
                      {tier.price > 0 && (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {tier.validations} • {tier.support}
                </div>

                <Link
                  to={tier.id === 'enterprise' ? '/contact' : '/register'}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-3xl font-medium transition-all duration-200 ${
                    tier.buttonVariant === 'primary'
                      ? 'bg-[#2ED8A3] text-white hover:bg-[#00C48C] shadow-lg hover:shadow-xl'
                      : tier.buttonVariant === 'secondary'
                      ? 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                      : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#2ED8A3] hover:text-[#2ED8A3]'
                  }`}
                >
                  {tier.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  What's included:
                </h4>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {tier.limitations?.map((limitation, index) => (
                    <li key={`limit-${index}`} className="flex items-start">
                      <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-400">
                        {limitation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
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
              to="/register"
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