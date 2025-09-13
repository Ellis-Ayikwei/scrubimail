import React from 'react';
import { CheckCircle, Zap, Shield, Code, Globe, Database, Clock, TrendingUp } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const mainFeatures = [
    {
      icon: CheckCircle,
      title: 'Real-time validation',
      description: 'Validate emails instantly with our lightning-fast API. Get results in under 300ms with comprehensive syntax, DNS, and SMTP checks.',
      highlight: 'Sub-300ms response'
    },
    {
      icon: Shield,
      title: 'Advanced fraud detection',
      description: 'Protect your campaigns from disposable emails, spam traps, and role-based addresses with our ML-powered detection engine.',
      highlight: '99.9% accuracy rate'
    },
    {
      icon: Code,
      title: 'Developer-first API',
      description: 'RESTful API with SDKs in multiple languages. Complete documentation, code examples, and 24/7 developer support.',
      highlight: 'Multiple SDKs available'
    }
  ];

  const additionalFeatures = [
    {
      icon: Globe,
      title: 'Global infrastructure',
      description: 'Distributed across multiple regions for optimal performance worldwide'
    },
    {
      icon: Database,
      title: 'Bulk processing',
      description: 'Process millions of emails efficiently with our batch validation system'
    },
    {
      icon: Clock,
      title: '99.9% uptime SLA',
      description: 'Enterprise-grade reliability with comprehensive monitoring and alerts'
    },
    {
      icon: TrendingUp,
      title: 'Detailed analytics',
      description: 'Comprehensive reporting and insights to optimize your email campaigns'
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-normal text-gray-900 dark:text-white mb-6">
            Built for modern applications
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            Our email validation platform combines speed, accuracy, and reliability to help you maintain clean email lists and improve deliverability rates.
          </p>
        </div>
        
        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          {mainFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2ED8A3] rounded-2xl mb-6">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  {feature.highlight}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {additionalFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
                  <IconComponent className="w-6 h-6 text-[#2ED8A3]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-sm text-gray-600 dark:text-gray-300 mr-3">Ready to get started?</span>
            <a 
              href="/register" 
              className="text-[#2ED8A3] hover:text-[#00C48C] font-medium text-sm transition-colors"
            >
              Try it free →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 