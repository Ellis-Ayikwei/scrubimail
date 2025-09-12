import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Download,
  Calendar,
  Users,
  Zap,
  Lock,
  Globe
} from 'lucide-react';

const TermsOfService: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: FileText },
    { id: 'acceptance', title: 'Acceptance', icon: CheckCircle },
    { id: 'services', title: 'Services', icon: Zap },
    { id: 'usage', title: 'Usage Policy', icon: Users },
    { id: 'api-terms', title: 'API Terms', icon: Globe },
    { id: 'payment', title: 'Payment', icon: Lock },
    { id: 'liability', title: 'Liability', icon: Shield },
    { id: 'termination', title: 'Termination', icon: XCircle }
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
                These Terms of Service ("Terms") govern your use of Scrubimail's email validation services, including our API and web platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-[#333333] dark:text-white mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  What's Allowed
                </h4>
                <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                  <li>• Valid email validation requests</li>
                  <li>• Integration with your applications</li>
                  <li>• Commercial and personal use</li>
                  <li>• Reasonable API usage</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-[#333333] dark:text-white mb-3 flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  What's Prohibited
                </h4>
                <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                  <li>• Excessive API abuse</li>
                  <li>• Reverse engineering</li>
                  <li>• Reselling without permission</li>
                  <li>• Malicious or illegal use</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'acceptance':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Acceptance of Terms
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">By Using Our Service</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    By accessing or using Scrubimail's services, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access our service.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Account Registration</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    You must register for an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Age Requirements</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    You must be at least 18 years old to use our services. If you are under 18, you may only use our services with the involvement and consent of a parent or guardian.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Changes to Terms</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our service. Continued use after changes constitutes acceptance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Description of Services
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Email Validation</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    Our core service provides comprehensive email validation including:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Syntax and RFC compliance checking</li>
                    <li>• DNS and MX record validation</li>
                    <li>• SMTP handshake testing</li>
                    <li>• Domain reputation analysis</li>
                    <li>• Disposable email detection</li>
                    <li>• Risk scoring and assessment</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">API Access</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    We provide RESTful API access for programmatic integration:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Single email validation endpoints</li>
                    <li>• Bulk validation capabilities</li>
                    <li>• Real-time and async processing</li>
                    <li>• Comprehensive response data</li>
                    <li>• Rate limiting and throttling</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Web Dashboard</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    Our web interface provides:
                  </p>
                  <ul className="space-y-1 text-sm text-[#333333]/70 dark:text-gray-400 ml-4">
                    <li>• Interactive email validation</li>
                    <li>• Usage analytics and reporting</li>
                    <li>• API key management</li>
                    <li>• Billing and subscription management</li>
                    <li>• Account settings and preferences</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Service Availability</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance with reasonable notice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Acceptable Use Policy
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Permitted Uses</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Validating email addresses for legitimate business purposes</li>
                    <li>• Cleaning email lists and databases</li>
                    <li>• Preventing email bounces and delivery issues</li>
                    <li>• Compliance with email marketing regulations</li>
                    <li>• Integration with your own applications and services</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Prohibited Uses</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Harassment, stalking, or cyberbullying</li>
                    <li>• Spam, phishing, or other malicious activities</li>
                    <li>• Violation of privacy laws or regulations</li>
                    <li>• Attempting to reverse engineer our services</li>
                    <li>• Reselling our services without written permission</li>
                    <li>• Excessive API usage that impacts service performance</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Rate Limiting</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    We implement rate limiting to ensure fair usage. Excessive requests may result in temporary or permanent suspension of your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'api-terms':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                API Terms of Use
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">API Access</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    API access is provided subject to these additional terms:
                  </p>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• API keys must be kept secure and confidential</li>
                    <li>• You are responsible for all API usage under your account</li>
                    <li>• API responses are provided "as is" without warranty</li>
                    <li>• We may deprecate or modify API endpoints with notice</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Usage Limits</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                      <h5 className="font-medium text-[#333333] dark:text-white mb-2">Free Tier</h5>
                      <ul className="text-sm text-[#333333]/70 dark:text-gray-400 space-y-1">
                        <li>• 100 validations/month</li>
                        <li>• Basic validation features</li>
                        <li>• Standard response times</li>
                      </ul>
                    </div>
                    <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                      <h5 className="font-medium text-[#333333] dark:text-white mb-2">Paid Plans</h5>
                      <ul className="text-sm text-[#333333]/70 dark:text-gray-400 space-y-1">
                        <li>• Higher validation limits</li>
                        <li>• Advanced features</li>
                        <li>• Priority support</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Data Handling</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Email addresses are processed securely and not stored permanently</li>
                    <li>• Validation results may be cached for performance</li>
                    <li>• We do not retain or analyze the content of emails</li>
                    <li>• API requests are logged for security and billing purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Payment Terms
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Billing</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Paid plans are billed monthly or annually</li>
                    <li>• Payment is due immediately upon subscription</li>
                    <li>• We use Stripe for secure payment processing</li>
                    <li>• All fees are non-refundable except as required by law</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Pricing Changes</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    We may change our pricing with 30 days' notice. Price changes will not affect your current billing cycle.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Refunds</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• No refunds for partial months or unused credits</li>
                    <li>• Refunds may be provided for service outages</li>
                    <li>• Disputes must be raised within 30 days of billing</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Account Suspension</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Accounts with unpaid balances may be suspended until payment is received. We reserve the right to terminate accounts for non-payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'liability':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Limitation of Liability
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Service Disclaimer</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    Our services are provided "as is" without warranties of any kind. We do not guarantee:
                  </p>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• 100% accuracy of validation results</li>
                    <li>• Uninterrupted service availability</li>
                    <li>• Compatibility with all systems</li>
                    <li>• Error-free operation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Liability Limits</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Our total liability is limited to the amount paid for services</li>
                    <li>• We are not liable for indirect, incidental, or consequential damages</li>
                    <li>• No liability for data loss or security breaches</li>
                    <li>• Force majeure events are excluded from liability</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Indemnification</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    You agree to indemnify and hold harmless Scrubimail from any claims arising from your use of our services or violation of these terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'termination':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">
                Termination
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Account Termination</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-3">
                    Either party may terminate this agreement:
                  </p>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• You may cancel your subscription at any time</li>
                    <li>• We may terminate for violation of these terms</li>
                    <li>• We may terminate for non-payment</li>
                    <li>• We may discontinue services with 30 days' notice</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#333333] dark:text-white mb-3">Effect of Termination</h4>
                  <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-gray-400">
                    <li>• Access to services will be immediately suspended</li>
                    <li>• Unused credits are non-refundable</li>
                    <li>• Your data will be deleted within 30 days</li>
                    <li>• Surviving provisions remain in effect</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-[#333333] dark:text-white mb-2">Data Export</h4>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Upon termination, you may request an export of your data within 30 days. After this period, data will be permanently deleted.
                  </p>
                </div>
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
              Terms of Service
            </h1>
            <p className="text-lg text-[#333333]/70 dark:text-gray-400">
              Legal terms governing your use of Scrubimail services
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

export default TermsOfService; 