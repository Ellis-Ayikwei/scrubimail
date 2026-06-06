import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const panel =
  'bg-white/95 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm shadow-sm dark:shadow-none';
const panelHeaderBorder = 'border-b border-gray-200 dark:border-[#3b4a41]/30';
const codeShell =
  'bg-slate-900 border border-slate-700/80 dark:border-[#3b4a41]/40 rounded-sm font-mono text-xs text-emerald-400 dark:text-[#6effc0] overflow-x-auto';
const labelMuted =
  "font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-[#3b4a41]";
const bodyMutedSoft = 'font-mono text-[10px] text-gray-500 dark:text-[#bacbbf]/60';

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
          avg_score: 85
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
          success_rate: 95,
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

  return (
    <div className="app-bg min-h-screen bg-white dark:bg-transparent" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-600 dark:text-[#6effc0] mb-0.5">
            Developer Reference
          </p>
          <h1 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-3xl tracking-tight">
            API Documentation
          </h1>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf] mt-1">
            REST API v1 · Base URL: api.scrubimail.com
          </p>
        </div>

        {/* Tab bar */}
        <div className="border-b border-gray-200 dark:border-[#3b4a41]/30 flex gap-0 flex-wrap">
          {['overview', 'authentication', 'endpoints', 'errors', 'sdks'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-700 dark:border-[#6effc0] dark:text-[#6effc0]'
                  : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-[#bacbbf]/50 dark:hover:text-[#bacbbf]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Base URL', value: 'api.scrubimail.com/scrubimail/api/v1' },
                { label: 'Auth Method', value: 'Bearer Token / API Key' },
                { label: 'Response Format', value: 'JSON' },
              ].map(({ label, value }) => (
                <div key={label} className={`${panel} p-4`}>
                  <p className={`${labelMuted} mb-1`}>{label}</p>
                  <p className="font-['JetBrains_Mono',monospace] text-xs text-emerald-600 dark:text-[#6effc0]">{value}</p>
                </div>
              ))}
            </div>

            <div className={`${panel} p-5`}>
              <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf] mb-3">
                Quick Start
              </p>
              <div className={`${codeShell} p-4`}>
                <span className="text-slate-500"># Install and validate</span>
                {'\n'}
                <span className="text-slate-300">curl -X POST https://api.scrubimail.com/scrubimail/api/v1/validate/ \</span>
                {'\n'}
                {'  '}
                <span className="text-slate-300">-H "Authorization: Bearer YOUR_TOKEN" \</span>
                {'\n'}
                {'  '}
                <span className="text-slate-300">-H "Content-Type: application/json" \</span>
                {'\n'}
                {'  '}
                <span className="text-slate-300">-d </span>
                <span className="text-emerald-400 dark:text-[#6effc0]">'{`{"email":"user@example.com"}`}'</span>
              </div>
            </div>

            <div className={panel}>
              <div className={`px-4 py-3 ${panelHeaderBorder}`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf]">
                  API Capabilities
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-[#3b4a41]/20">
                {[
                  { title: 'Single Validation', desc: 'Real-time email verification with SMTP handshake, DNS/MX lookup, and syntax analysis in <300ms.' },
                  { title: 'Bulk Processing', desc: 'Async processing of up to 100,000 addresses per batch via background Celery workers.' },
                  { title: 'Score & Verdict', desc: 'Each email returns a 0-100 confidence score and DELIVERABLE/BOUNCED/RISKY verdict.' },
                  { title: 'Detailed Breakdown', desc: 'Optional deep analysis: syntax, DNS, SMTP, reputation, role-based and catch-all detection.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="p-4">
                    <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-emerald-600 dark:text-[#6effc0] font-bold mb-1">
                      {title}
                    </p>
                    <p className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]/80 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Authentication */}
        {activeTab === 'authentication' && (
          <div className="space-y-4">
            <div className={`${panel} p-5`}>
              <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf] mb-3">
                Bearer Token (JWT)
              </p>
              <div className={`${codeShell} p-4`}>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</div>
              <p className={`${bodyMutedSoft} mt-3`}>
                JWT tokens are obtained via the /auth/login/ endpoint. Tokens expire after 24 hours.
              </p>
            </div>
            <div className={`${panel} p-5`}>
              <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf] mb-3">
                API Key
              </p>
              <div className={`${codeShell} p-4`}>{`X-API-Key: your_scrubimail_api_key`}</div>
              <p className={`${bodyMutedSoft} mt-3`}>
                API keys can be generated in the dashboard. Use for server-to-server integrations.
              </p>
            </div>
          </div>
        )}

        {/* Endpoints */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            {endpoints.map((ep) => (
              <div key={ep.path} className={`${panel} overflow-hidden`}>
                <div className={`flex items-center gap-3 px-4 py-3 ${panelHeaderBorder}`}>
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm border ${
                      ep.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                        : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-[#60a5fa]/15 dark:text-[#60a5fa] dark:border-[#60a5fa]/20'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-['JetBrains_Mono',monospace] text-xs text-gray-900 dark:text-[#e0e3e8] flex-1 break-all">
                    {ep.path}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ep.path, ep.path)}
                    className="text-gray-400 hover:text-emerald-600 dark:text-[#3b4a41] dark:hover:text-[#6effc0] transition-colors"
                  >
                    {copiedEndpoint === ep.path ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]/70 mb-4">{ep.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`${labelMuted} mb-2`}>Request Body</p>
                      <div className={`${codeShell} p-3 text-[10px]`}>
                        <pre>{JSON.stringify(ep.request, null, 2)}</pre>
                      </div>
                    </div>
                    <div>
                      <p className={`${labelMuted} mb-2`}>Response</p>
                      <div className={`${codeShell} p-3 text-[10px] max-h-48`}>
                        <pre>{JSON.stringify(ep.response, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Errors */}
        {activeTab === 'errors' && (
          <div className={`${panel} overflow-hidden`}>
            <div className={`px-4 py-3 ${panelHeaderBorder}`}>
              <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf]">
                HTTP Status Codes
              </p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-[#3b4a41]/20">
              {[
                { code: '200', label: 'OK', desc: 'Request successful', color: '#6effc0' },
                { code: '201', label: 'Created', desc: 'Resource created successfully', color: '#6effc0' },
                { code: '400', label: 'Bad Request', desc: 'Invalid request body or parameters', color: '#f59e0b' },
                { code: '401', label: 'Unauthorized', desc: 'Missing or invalid authentication token', color: '#ff4c4c' },
                { code: '403', label: 'Forbidden', desc: 'Insufficient permissions for this resource', color: '#ff4c4c' },
                { code: '404', label: 'Not Found', desc: 'The requested resource does not exist', color: '#ff4c4c' },
                { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded. See X-RateLimit headers', color: '#f59e0b' },
                { code: '500', label: 'Internal Server Error', desc: 'An unexpected server error occurred', color: '#ff4c4c' },
              ].map(({ code, label, desc, color }) => (
                <div
                  key={code}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#262a2f] transition-colors"
                >
                  <span
                    className="font-['JetBrains_Mono',monospace] text-sm font-bold w-12 flex-shrink-0"
                    style={{ color }}
                  >
                    {code}
                  </span>
                  <span className="font-mono text-xs text-gray-900 dark:text-[#e0e3e8] w-36 flex-shrink-0">{label}</span>
                  <span className={bodyMutedSoft}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SDKs */}
        {activeTab === 'sdks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { lang: 'JavaScript / Node.js', install: 'npm install scrubimail-js', status: 'Stable' },
              { lang: 'Python', install: 'pip install scrubimail', status: 'Stable' },
              { lang: 'Go', install: 'go get github.com/scrubimail/go-sdk', status: 'Beta' },
              { lang: 'PHP', install: 'composer require scrubimail/php-sdk', status: 'Beta' },
            ].map(({ lang, install, status }) => (
              <div key={lang} className={`${panel} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-[#e0e3e8] text-sm tracking-tight">
                    {lang}
                  </p>
                  <span
                    className={`font-mono uppercase tracking-[0.08em] text-[9px] px-2 py-0.5 rounded-sm border ${
                      status === 'Stable'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                        : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-[#f59e0b]/10 dark:text-[#f59e0b] dark:border-[#f59e0b]/20'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className={`${codeShell} px-3 py-2 flex items-center justify-between`}>
                  <code>{install}</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(install, lang)}
                    className="text-gray-400 hover:text-emerald-600 dark:text-[#3b4a41] dark:hover:text-[#6effc0] ml-3 flex-shrink-0"
                  >
                    {copiedEndpoint === lang ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-[#6effc0]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDocs; 