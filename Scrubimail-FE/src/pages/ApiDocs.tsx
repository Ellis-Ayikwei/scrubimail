import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Play, 
  Download, 
  Shield, 
  Zap, 
  Database, 
  Globe, 
  Mail,
  Clock,
  BarChart3,
  Users,
  Key,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

const ApiDocs: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      name: 'Single Email Validation',
      method: 'POST',
      path: '/scrubimail/api/v1/validate/',
      description: 'Validate a single email address in real-time',
      request: {
        email: 'user@example.com',
        real_time: true
      },
      response: {
        id: 123,
        email: 'user@example.com',
        status: 'completed',
        score: 85,
        verdict: 'Valid',
        is_valid: true,
        breakdown: {
          syntax: { valid: true },
          dns: { valid: true, score: 90 },
          smtp: { valid: true, catch_all: false },
          reputation: { reputation_score: 85 },
          role_based: { is_role_based: false }
        },
        suggestions: [],
        warnings: [],
        validation_time: 0.245
      }
    },
    {
      name: 'Bulk Email Validation',
      method: 'POST',
      path: '/scrubimail/api/v1/validate-bulk/',
      description: 'Submit multiple emails for bulk validation',
      request: {
        emails: ['user1@example.com', 'user2@example.com']
      },
      response: {
        job_id: 456,
        total_emails: 2,
        status: 'pending',
        message: 'Bulk validation job queued successfully'
      }
    },
    {
      name: 'Bulk Job Status',
      method: 'GET',
      path: '/scrubimail/api/v1/bulk-status/{job_id}/',
      description: 'Get bulk job status and progress',
      response: {
        job_id: 456,
        status: 'processing',
        progress: 75,
        total_emails: 2,
        total_processed: 1,
        summary: {
          total_validations: 1,
          completed_validations: 1,
          valid_emails: 1,
          invalid_emails: 0,
          risky_emails: 0,
          avg_score: 85.0
        }
      }
    },
    {
      name: 'Validation History',
      method: 'GET',
      path: '/scrubimail/api/v1/history/',
      description: 'Get validation history with filtering options',
      response: {
        results: [],
        summary: {
          total_validations: 100,
          completed_validations: 95,
          valid_emails: 80,
          invalid_emails: 10,
          risky_emails: 5,
          avg_score: 82.5
        }
      }
    },
    {
      name: 'Analytics',
      method: 'GET',
      path: '/scrubimail/api/v1/analytics/',
      description: 'Get validation analytics and statistics',
      response: {
        period: {
          start_date: '2024-01-01',
          end_date: '2024-01-30',
          days: 30
        },
        overview: {
          total_validations: 1000,
          completed_validations: 950,
          success_rate: 95.0,
          avg_score: 82.5
        },
        daily_stats: [],
        top_domains: []
      }
    },
    {
      name: 'Domain Reputation',
      method: 'GET',
      path: '/scrubimail/api/v1/domain-reputation/{domain}/',
      description: 'Get domain reputation information',
      response: {
        domain: 'example.com',
        reputation_score: 85,
        is_disposable: false,
        is_corporate: true,
        tld_risk: false,
        spam_trap_risk: 0.1,
        last_checked: '2024-01-30T10:00:00Z',
        cached: true
      }
    }
  ];

  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: 'RFC Compliance',
      description: 'Full RFC 5322 + 6531 compliance with IDN support and real-time suggestions'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'DNS & MX Validation',
      description: 'Comprehensive DNS checks including A/AAAA records, MX validation, and DNSSEC awareness'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'SMTP Handshake',
      description: 'Real SMTP testing with EHLO, MAIL FROM, RCPT TO pipeline and catch-all detection'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Domain Reputation',
      description: 'Advanced reputation scoring with disposable domain detection and spam trap identification'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Role Detection',
      description: 'Smart detection of role-based emails and aliases with custom regex rules'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Risk Scoring',
      description: 'ML-driven 0-100 risk scoring with detailed breakdowns and confidence levels'
    }
  ];

  const codeExamples = {
    curl: `curl -X POST "https://api.scrubimail.com/scrubimail/api/v1/validate/" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "real_time": true
  }'`,
    
    javascript: `const response = await fetch('https://api.scrubimail.com/scrubimail/api/v1/validate/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    real_time: true
  })
});

const result = await response.json();
console.log(result);`,
    
    python: `import requests

url = "https://api.scrubimail.com/scrubimail/api/v1/validate/"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "email": "user@example.com",
    "real_time": True
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`,
    
    php: `<?php
$url = 'https://api.scrubimail.com/scrubimail/api/v1/validate/';
$data = [
    'email' => 'user@example.com',
    'real_time' => true
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

print_r($result);
?>`
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              API Documentation
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive email validation API with advanced features, real-time processing, and detailed analytics
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 mb-8 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
            { id: 'endpoints', label: 'Endpoints', icon: <Code className="w-4 h-4" /> },
            { id: 'examples', label: 'Code Examples', icon: <Play className="w-4 h-4" /> },
            { id: 'features', label: 'Features', icon: <Zap className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2ED8A3] text-white'
                  : 'text-[#333333] dark:text-gray-400 hover:text-[#2ED8A3]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Start */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                Quick Start
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#2ED8A3] rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">1. Get API Key</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Sign up and generate your API key from the dashboard
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#2ED8A3] rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">2. Make Request</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Use our REST API to validate emails in real-time
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#2ED8A3] rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">3. Get Results</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Receive comprehensive validation results with risk scoring
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#2ED8A3] mb-2">≤300ms</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">P99 Response Time</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#2ED8A3] mb-2">99.9%</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">Uptime SLA</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#2ED8A3] mb-2">50M+</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">Emails Validated</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#2ED8A3] mb-2">1000+</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">Active Customers</div>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                Authentication
              </h2>
              <p className="text-[#333333]/70 dark:text-gray-400 mb-4">
                All API requests require authentication using either JWT tokens or API keys.
              </p>
              <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#333333] dark:text-white">API Key Header</span>
                  <button
                    onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth')}
                    className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                  >
                    {copiedEndpoint === 'auth' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-sm">Copy</span>
                  </button>
                </div>
                <code className="text-sm text-[#333333] dark:text-white">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-[#333333] dark:text-white">
                      {endpoint.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      endpoint.method === 'GET' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {endpoint.method}
                    </span>
                  </div>
                  <p className="text-[#333333]/70 dark:text-gray-400 mb-3">
                    {endpoint.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm bg-[#F4F5F7] dark:bg-gray-700 px-3 py-1 rounded text-[#333333] dark:text-white">
                      {endpoint.path}
                    </code>
                    <button
                      onClick={() => copyToClipboard(endpoint.path, `endpoint-${index}`)}
                      className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                    >
                      {copiedEndpoint === `endpoint-${index}` ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Request */}
                  {endpoint.request && (
                    <div>
                      <h4 className="text-sm font-semibold text-[#333333] dark:text-white mb-2">Request Body</h4>
                      <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#333333]/50 dark:text-gray-400">JSON</span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(endpoint.request, null, 2), `request-${index}`)}
                            className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                          >
                            {copiedEndpoint === `request-${index}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="text-xs">Copy</span>
                          </button>
                        </div>
                        <pre className="text-sm text-[#333333] dark:text-white overflow-x-auto">
                          {JSON.stringify(endpoint.request, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#333333] dark:text-white mb-2">Response</h4>
                    <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#333333]/50 dark:text-gray-400">JSON</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(endpoint.response, null, 2), `response-${index}`)}
                          className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                        >
                          {copiedEndpoint === `response-${index}` ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="text-xs">Copy</span>
                        </button>
                      </div>
                      <pre className="text-sm text-[#333333] dark:text-white overflow-x-auto">
                        {JSON.stringify(endpoint.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Code Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6 flex items-center">
                <Code className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                Code Examples
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(codeExamples).map(([language, code]) => (
                  <div key={language} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#333333] dark:text-white capitalize">
                        {language}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(code, language)}
                        className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                      >
                        {copiedEndpoint === language ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="text-sm">Copy</span>
                      </button>
                    </div>
                    <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                      <pre className="text-sm text-[#333333] dark:text-white overflow-x-auto">
                        {code}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-[#2ED8A3] rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#333333]/70 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Validation Process */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6 flex items-center">
                <Database className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                Validation Process
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2ED8A3] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">Syntax Check</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    RFC 5322 + 6531 compliance with IDN support
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2ED8A3] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">DNS Validation</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    MX, A/AAAA records with DNSSEC awareness
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2ED8A3] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">SMTP Test</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Real SMTP handshake with catch-all detection
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2ED8A3] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <h3 className="font-semibold text-[#333333] dark:text-white mb-2">Risk Analysis</h3>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Reputation scoring and ML-driven analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Response Codes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                Response Codes
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Success Codes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-800 text-sm font-bold">200</span>
                      </div>
                      <span className="text-[#333333] dark:text-white">OK - Request successful</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-800 text-sm font-bold">201</span>
                      </div>
                      <span className="text-[#333333] dark:text-white">Created - Resource created</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Error Codes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-800 text-sm font-bold">400</span>
                      </div>
                      <span className="text-[#333333] dark:text-white">Bad Request - Invalid input</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-800 text-sm font-bold">401</span>
                      </div>
                      <span className="text-[#333333] dark:text-white">Unauthorized - Invalid API key</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-800 text-sm font-bold">429</span>
                      </div>
                      <span className="text-[#333333] dark:text-white">Rate Limited - Too many requests</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDocs; 