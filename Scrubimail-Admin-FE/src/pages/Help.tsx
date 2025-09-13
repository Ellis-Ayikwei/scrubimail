import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Video,
  MessageSquare,
  Mail,
  BookOpen,
  Zap,
  Shield,
  CreditCard,
  Settings,
  ArrowRight
} from 'lucide-react';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Help: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <TopBar />
      
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-[#F4F5F7] to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#333333] dark:text-white mb-6">
              Help Center
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Find answers to common questions, learn how to use our API, and get the support you need.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  className="w-full px-6 py-4 pl-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent text-[#333333] dark:text-white"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#333333] dark:text-white mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-[#333333]/70 dark:text-gray-300">
              Find help articles organized by topic
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Getting Started',
                description: 'Learn the basics of email validation and how to get started with our API.',
                icon: '🚀',
                count: 8
              },
              {
                title: 'API Integration',
                description: 'Step-by-step guides for integrating our API into your applications.',
                icon: '🔌',
                count: 12
              },
              {
                title: 'Account & Billing',
                description: 'Manage your account, view usage, and handle billing questions.',
                icon: '💳',
                count: 6
              },
              {
                title: 'Troubleshooting',
                description: 'Common issues and their solutions to help you resolve problems quickly.',
                icon: '🔧',
                count: 10
              },
              {
                title: 'Best Practices',
                description: 'Learn how to optimize your email validation implementation.',
                icon: '📚',
                count: 7
              },
              {
                title: 'API Reference',
                description: 'Complete API documentation with examples and response formats.',
                icon: '📖',
                count: 15
              }
            ].map((category, index) => (
              <div key={index} className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <div className="text-3xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">{category.title}</h3>
                <p className="text-[#333333]/70 dark:text-gray-400 mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2ED8A3] font-medium">{category.count} articles</span>
                  <ArrowRight className="w-5 h-5 text-[#2ED8A3]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#333333] dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[#333333]/70 dark:text-gray-300">
              Quick answers to the most common questions
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                question: 'How accurate is your email validation?',
                answer: 'Our email validation service achieves 99.9% accuracy by combining multiple validation techniques including syntax checking, domain verification, MX record validation, and disposable email detection.'
              },
              {
                question: 'What is the API response time?',
                answer: 'Our API typically responds in under 100ms for single email validation requests. For bulk requests, processing time depends on the number of emails but averages 50-100 emails per second.'
              },
              {
                question: 'How do I get my API key?',
                answer: 'Sign up for a free account and your API key will be automatically generated. You can find it in your dashboard under the API Keys section.'
              },
              {
                question: 'Is there a rate limit for the API?',
                answer: 'Yes, we have rate limits to ensure fair usage. Free plans have 100 requests per minute, while paid plans have higher limits based on your subscription tier.'
              },
              {
                question: 'Do you support bulk email validation?',
                answer: 'Yes, we offer bulk validation endpoints that can process thousands of emails efficiently. This is available on all paid plans.'
              },
              {
                question: 'What happens if an email is invalid?',
                answer: 'Our API returns detailed information about why an email is invalid, including specific error codes and suggestions for correction when possible.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <span className="font-semibold text-[#333333] dark:text-white">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#2ED8A3] transition-transform duration-200 ${expandedFAQ === index ? 'rotate-180' : ''}`} />
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-[#333333]/70 dark:text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#333333] dark:text-white mb-4">
              Quick Links
            </h2>
            <p className="text-lg text-[#333333]/70 dark:text-gray-300">
              Popular resources to help you get started quickly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'API Documentation',
                description: 'Complete API reference',
                icon: '📖',
                link: '/api-docs'
              },
              {
                title: 'Integration Guides',
                description: 'Step-by-step tutorials',
                icon: '🔌',
                link: '/integrations'
              },
              {
                title: 'Pricing Plans',
                description: 'Choose the right plan',
                icon: '💰',
                link: '/pricing'
              },
              {
                title: 'Contact Support',
                description: 'Get help from our team',
                icon: '💬',
                link: '/contact'
              }
            ].map((link, index) => (
              <Link
                key={index}
                to={link.link}
                className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200"
              >
                <div className="text-3xl mb-4">{link.icon}</div>
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2">{link.title}</h3>
                <p className="text-[#333333]/70 dark:text-gray-400">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A]">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still Need Help?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 bg-white text-[#004E8A] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Contact Support
            </Link>
            <a
              href="mailto:support@scrubimail.com"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#004E8A] transition-all duration-200"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email Us
            </a>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Help; 