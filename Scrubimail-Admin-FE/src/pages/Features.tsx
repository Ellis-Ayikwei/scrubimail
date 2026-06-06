import React from 'react';
import { 
  CheckCircle, 
  Zap, 
  Shield, 
  Globe, 
  Code, 
  BarChart3,
  Mail,
  Database,
  Clock,
  Users,
  ArrowRight,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: Zap,
      title: 'Lightning Fast Validation',
      description: 'Validate emails in under 300ms with our optimized infrastructure and global CDN.',
      features: ['Sub-second response times', 'Bulk processing up to 100K emails', 'Real-time validation API']
    },
    {
      icon: Shield,
      title: '99.9% Accuracy Rate',
      description: 'Industry-leading accuracy with comprehensive validation checks and machine learning.',
      features: ['Syntax validation', 'Domain verification', 'SMTP server checks', 'Reputation scoring']
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Validate emails from any country with support for international domains and formats.',
      features: ['200+ country support', 'Unicode domain handling', 'Regional compliance']
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'Easy integration with RESTful APIs, SDKs, and comprehensive documentation.',
      features: ['REST API', 'Multiple SDKs', 'Webhook support', 'Interactive docs']
    },
    {
      icon: Database,
      title: 'Bulk Processing',
      description: 'Process large email lists efficiently with our scalable bulk validation system.',
      features: ['CSV/JSON upload', 'Progress tracking', 'Result export', 'Queue management']
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Detailed insights and reports to optimize your email validation strategy.',
      features: ['Usage analytics', 'Domain insights', 'Performance metrics', 'Custom reports']
    }
  ];

  const validationChecks = [
    {
      name: 'Syntax Validation',
      description: 'Checks email format according to RFC standards',
      accuracy: '100%'
    },
    {
      name: 'Domain Verification',
      description: 'Verifies domain exists and has valid MX records',
      accuracy: '99.8%'
    },
    {
      name: 'SMTP Validation',
      description: 'Connects to mail server to verify mailbox exists',
      accuracy: '99.5%'
    },
    {
      name: 'Role Account Detection',
      description: 'Identifies generic accounts like admin@, support@',
      accuracy: '98.9%'
    },
    {
      name: 'Disposable Email Detection',
      description: 'Flags temporary and disposable email services',
      accuracy: '99.2%'
    },
    {
      name: 'Reputation Scoring',
      description: 'Assesses sender reputation and deliverability',
      accuracy: '97.5%'
    }
  ];

  const integrations = [
    { name: 'Salesforce', logo: '🔷' },
    { name: 'HubSpot', logo: '🟠' },
    { name: 'Mailchimp', logo: '🐵' },
    { name: 'Zapier', logo: '⚡' },
    { name: 'Webhook', logo: '🔗' },
    { name: 'REST API', logo: '🔧' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0d1117] to-[#161b22] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Powerful Email Validation
            <br />
            <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
              Features
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Discover the comprehensive features that make our email validation service 
            the most accurate and reliable solution for businesses of all sizes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-[#10B981] text-white font-semibold rounded-3xl hover:bg-[#059669] transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex items-center px-8 py-4 text-white border border-gray-600 rounded-3xl hover:bg-gray-800 transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-[#F8FAFC] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Everything You Need for Email Validation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our comprehensive suite of features ensures accurate, fast, and reliable email validation for your business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#10B981]/10 rounded-3xl flex items-center justify-center mb-6">
                    <IconComponent className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-[#10B981] mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Validation Process */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Comprehensive Validation Process
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our multi-step validation process ensures maximum accuracy and reliability for every email address.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validationChecks.map((check, index) => (
              <div key={index} className="bg-[#F8FAFC] dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#333333] dark:text-white">
                    {check.name}
                  </h3>
                  <span className="text-sm font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">
                    {check.accuracy}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {check.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-20 bg-[#F8FAFC] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Industry-Leading Performance
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Numbers that speak for themselves
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50M+', label: 'Emails validated monthly', icon: Mail },
              { number: '<300ms', label: 'Average response time', icon: Clock },
              { number: '99.9%', label: 'Uptime guarantee', icon: Shield },
              { number: '10K+', label: 'Developers trust us', icon: Users }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-[#10B981]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-[#10B981]" />
                  </div>
                  <div className="text-3xl font-bold text-[#333333] dark:text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Seamless Integrations
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
            Connect with your favorite tools and platforms
          </p>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center">
            {integrations.map((integration, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">{integration.logo}</span>
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {integration.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#10B981] to-[#059669]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of developers who trust our email validation service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-[#10B981] font-semibold rounded-3xl hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 text-white border border-white/30 rounded-3xl hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;