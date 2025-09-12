import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Globe, 
  Users, 
  FileText, 
  CheckCircle,
  ArrowLeft,
  Download,
  Calendar,
  MapPin
} from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: Eye },
    { id: 'data-collection', title: 'Data Collection', icon: Database },
    { id: 'data-usage', title: 'Data Usage', icon: Globe },
    { id: 'data-sharing', title: 'Data Sharing', icon: Users },
    { id: 'security', title: 'Security', icon: Lock },
    { id: 'your-rights', title: 'Your Rights', icon: Shield },
    { id: 'cookies', title: 'Cookies', icon: FileText },
    { id: 'contact', title: 'Contact', icon: CheckCircle }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-3">
                Last Updated: December 15, 2024
              </h3>
              <p className="text-[#333333]/70 dark:text-gray-400">
                This Privacy Policy describes how Scrubimail ("we," "us," or "our") collects, uses, and protects your information when you use our email validation service.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-[#333333] dark:text-white mb-2">What We Collect</h4>
                <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                  <li>• Account information (email, name, company)</li>
                  <li>• API usage data and validation requests</li>
                  <li>• Technical data (IP address, browser type)</li>
                  <li>• Payment information (processed securely)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-[#333333] dark:text-white mb-2">What We Don't Collect</h4>
                <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                  <li>• Personal content of emails</li>
                  <li>• Sensitive personal information</li>
                  <li>• Location data (unless provided)</li>
                  <li>• Third-party data without consent</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'data-collection':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Information We Collect
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Account Information</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    When you create an account, we collect:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Email address and password</li>
                    <li>• First and last name</li>
                    <li>• Company name (optional)</li>
                    <li>• Phone number (optional)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Usage Data</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    We automatically collect:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• API request logs and validation results</li>
                    <li>• IP addresses and browser information</li>
                    <li>• Usage patterns and feature preferences</li>
                    <li>• Error logs and performance metrics</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Payment Information</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Payment processing is handled securely by Stripe. We do not store credit card information on our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data-usage':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                How We Use Your Data
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Service Provision</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Provide email validation services</li>
                    <li>• Process API requests and responses</li>
                    <li>• Manage your account and billing</li>
                    <li>• Send service notifications</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Service Improvement</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Analyze usage patterns</li>
                    <li>• Improve validation accuracy</li>
                    <li>• Develop new features</li>
                    <li>• Optimize performance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Security & Compliance</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Detect and prevent fraud</li>
                    <li>• Ensure service security</li>
                    <li>• Comply with legal obligations</li>
                    <li>• Enforce our terms of service</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Communication</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Send important updates</li>
                    <li>• Provide customer support</li>
                    <li>• Share product announcements</li>
                    <li>• Respond to inquiries</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data-sharing':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Data Sharing and Disclosure
              </h3>
              
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">We Do Not Sell Your Data</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Scrubimail does not sell, rent, or trade your personal information to third parties for marketing purposes.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Service Providers</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    We may share data with trusted service providers who assist us in:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Payment processing (Stripe)</li>
                    <li>• Email delivery (SendGrid)</li>
                    <li>• Analytics and monitoring</li>
                    <li>• Customer support tools</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Legal Requirements</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    We may disclose your information if required by law, court order, or government request, or to protect our rights and safety.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Business Transfers</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Data Security
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Technical Measures</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• End-to-end encryption (TLS 1.3)</li>
                    <li>• Secure API authentication</li>
                    <li>• Regular security audits</li>
                    <li>• Intrusion detection systems</li>
                    <li>• DDoS protection</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Organizational Measures</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Employee security training</li>
                    <li>• Access control policies</li>
                    <li>• Regular security assessments</li>
                    <li>• Incident response procedures</li>
                    <li>• Compliance monitoring</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-[#333333] dark:text-white mb-2">Security Certifications</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-[#333333] dark:text-white">SOC 2 Type II</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-[#333333] dark:text-white">GDPR Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-[#333333] dark:text-white">ISO 27001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'your-rights':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Your Privacy Rights
              </h3>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-[#333333] dark:text-white mb-3">Access & Control</h4>
                    <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                      <li>• Access your personal data</li>
                      <li>• Update account information</li>
                      <li>• Download your data</li>
                      <li>• Delete your account</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#333333] dark:text-white mb-3">Communication</h4>
                    <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                      <li>• Opt out of marketing emails</li>
                      <li>• Control notification preferences</li>
                      <li>• Request data portability</li>
                      <li>• Object to data processing</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Exercise Your Rights</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    To exercise any of these rights, contact us at:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-[#333333] dark:text-white">Email: privacy@scrubimail.com</p>
                    <p className="text-[#333333] dark:text-white">Address: [Your Business Address]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Cookie Policy
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Essential Cookies</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    Required for basic website functionality:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Authentication and session management</li>
                    <li>• Security and fraud prevention</li>
                    <li>• Load balancing and performance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Analytics Cookies</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    Help us understand how you use our service:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Usage analytics and metrics</li>
                    <li>• Feature performance tracking</li>
                    <li>• User experience optimization</li>
                  </ul>
                </div>

                <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Cookie Management</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    You can control cookies through your browser settings. However, disabling essential cookies may affect service functionality.
                  </p>
                  <button className="px-4 py-2 bg-[#2ED8A3] text-white text-sm font-medium rounded hover:bg-[#00C48C] transition-colors">
                    Manage Cookie Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Contact Us
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Privacy Inquiries</h4>
                  <div className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <p>Email: privacy@scrubimail.com</p>
                    <p>Response time: Within 48 hours</p>
                    <p>For urgent matters: +1 (555) 123-4567</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Data Protection Officer</h4>
                  <div className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <p>Email: dpo@scrubimail.com</p>
                    <p>For GDPR-specific requests</p>
                    <p>EU residents only</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-[#333333] dark:text-white mb-2">Report Security Issues</h4>
                <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                  If you discover a security vulnerability, please report it to:
                </p>
                <p className="text-sm text-[#333333] dark:text-white">security@scrubimail.com</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-[#333333] dark:text-white hover:text-[#2ED8A3] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-[#2ED8A3] text-[#2ED8A3] rounded-lg hover:bg-[#2ED8A3] hover:text-white transition-colors">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-4xl font-bold text-[#333333] dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-lg text-[#333333]/70 dark:text-gray-400">
              How we collect, use, and protect your data
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Contents
              </h2>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#2ED8A3]/10 text-[#2ED8A3]'
                          : 'text-[#333333] dark:text-gray-400 hover:bg-[#F4F5F7] dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 