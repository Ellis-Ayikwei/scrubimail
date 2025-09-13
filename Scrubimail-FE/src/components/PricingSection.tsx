import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const PricingSection: React.FC = () => {
  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      credits: '1,000',
      features: [
        'Single email validation',
        'Basic API access',
        'Community support',
        'Standard response time'
      ],
      popular: false
    },
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      credits: '10,000',
      features: [
        'Everything in Free',
        'Bulk validation (up to 1,000)',
        'Advanced validation checks',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      credits: '50,000',
      features: [
        'Everything in Starter',
        'Priority API access',
        'Priority support',
        'Custom integrations',
        'Advanced analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      credits: 'Unlimited',
      features: [
        'Everything in Professional',
        'Dedicated infrastructure',
        'Custom validation rules',
        '24/7 phone support',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  return (
    <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our core validation features.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingPlans.map((plan, index) => (
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
                    : plan.name === 'Free'
                    ? 'bg-[#2ED8A3] text-white hover:bg-[#00C48C]'
                    : 'bg-[#F4F5F7] dark:bg-gray-700 text-[#333333] dark:text-white hover:bg-[#2ED8A3] hover:text-white dark:hover:bg-[#2ED8A3]'
                }`}
              >
                {plan.name === 'Free' ? 'Get Started Free' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 