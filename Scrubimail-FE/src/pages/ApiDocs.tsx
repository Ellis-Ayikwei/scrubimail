import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const panel =
  'bg-white/95 dark:bg-card border border-gray-200 dark:border-border/40 rounded-sm shadow-sm dark:shadow-none';
const panelHeaderBorder = 'border-b border-gray-200 dark:border-border/30';
const codeShell =
  'bg-slate-900 border border-slate-700/80 dark:border-border/40 rounded-sm font-mono text-xs text-emerald-400 dark:text-primary overflow-x-auto';
const labelMuted =
  "font-label uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-muted-foreground/70";
const bodyMutedSoft = 'font-mono text-[10px] text-gray-500 dark:text-muted-foreground/60';

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
      description:
        'Deep verification by default: full mailbox check inline (~2-8s), can return valid/invalid. Add ?mode=fast for the sub-100ms syntax/DNS-only path. Repeat lookups are cached.',
      request: {
        email: 'user@example.com'
      },
      response: {
        id: '9fa54b0c-ccf6-43a5-8706-522dc42c5e52',
        email: 'user@example.com',
        status: 'completed',
        score: 96,
        verdict: 'Valid',
        is_valid: true,
        verification_status: 'valid',
        sub_status: 'mailbox_exists',
        mode: 'deep',
        cached: false,
        verified_at: '2026-07-11T09:12:04Z',
        breakdown: {
          syntax: { valid: true },
          dns: { valid: true, score: 90 },
          smtp: { valid: true, catch_all: false },
          reputation: { reputation_score: 92, is_spam_trap: false },
          role_based: { is_role_based: false }
        },
        suggestions: [],
        warnings: [],
        validation_time: 2.13
      }
    },
    {
      name: 'Bulk Email Validation',
      method: 'POST',
      path: '/scrubimail/api/v1/validate-bulk/',
      description:
        'Enqueue a bulk job. Returns 202 immediately with a job_id; poll bulk-status for progress. Credits are consumed per processed address.',
      request: {
        emails: ['user1@example.com', 'user2@example.com']
      },
      response: {
        job_id: '456e...uuid',
        total_emails: 2,
        status: 'pending',
        message: 'Bulk validation job accepted and queued for processing.',
        status_url: '/scrubimail/api/v1/bulk-status/456e...uuid/'
      }
    },
    {
      name: 'Bulk Job Status',
      method: 'GET',
      path: '/scrubimail/api/v1/bulk-status/{job_id}/',
      description: 'Get bulk job status and progress',
      response: {
        job_id: '456e...uuid',
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
    <div className="app-bg min-h-screen bg-white dark:bg-transparent">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <p className="font-label uppercase tracking-[0.2em] text-[9px] text-emerald-600 dark:text-primary mb-0.5">
            Developer Reference
          </p>
          <h1 className="font-headline font-black text-gray-900 dark:text-foreground text-3xl tracking-tight">
            API Documentation
          </h1>
          <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground mt-1">
            REST API v1 · Base URL: api.scrubimail.com
          </p>
        </div>

        {/* Tab bar */}
        <div className="border-b border-gray-200 dark:border-border/30 flex gap-0 flex-wrap">
          {['overview', 'authentication', 'endpoints', 'errors', 'sdks'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-label uppercase tracking-[0.1em] text-[10px] border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-700 dark:border-primary dark:text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-muted-foreground/50 dark:hover:text-muted-foreground'
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
                  <p className="font-mono text-xs text-emerald-600 dark:text-primary">{value}</p>
                </div>
              ))}
            </div>

            <div className={`${panel} p-5`}>
              <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground mb-3">
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
                <span className="text-emerald-400 dark:text-primary">'{`{"email":"user@example.com"}`}'</span>
              </div>
            </div>

            <div className={panel}>
              <div className={`px-4 py-3 ${panelHeaderBorder}`}>
                <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground">
                  API Capabilities
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {[
                  { title: 'Single Validation', desc: 'Real-time email verification with SMTP handshake, DNS/MX lookup, and syntax analysis in <300ms.' },
                  { title: 'Bulk Processing', desc: 'Async processing of up to 100,000 addresses per batch via background Celery workers.' },
                  { title: 'Score & Verdict', desc: 'Each email returns a 0-100 confidence score and DELIVERABLE/BOUNCED/RISKY verdict.' },
                  { title: 'Detailed Breakdown', desc: 'Optional deep analysis: syntax, DNS, SMTP, reputation, role-based and catch-all detection.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="p-4">
                    <p className="font-label uppercase tracking-[0.1em] text-[10px] text-emerald-600 dark:text-primary font-bold mb-1">
                      {title}
                    </p>
                    <p className="font-mono text-[10px] text-gray-600 dark:text-muted-foreground/80 leading-relaxed">{desc}</p>
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
              <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground mb-3">
                Bearer Token (JWT)
              </p>
              <div className={`${codeShell} p-4`}>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</div>
              <p className={`${bodyMutedSoft} mt-3`}>
                JWT tokens are obtained via the /auth/login/ endpoint. Tokens expire after 24 hours.
              </p>
            </div>
            <div className={`${panel} p-5`}>
              <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground mb-3">
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
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-primary/15 dark:text-primary dark:border-primary/20'
                        : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-info/15 dark:text-info dark:border-info/20'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-mono text-xs text-gray-900 dark:text-foreground flex-1 break-all">
                    {ep.path}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ep.path, ep.path)}
                    className="text-gray-400 hover:text-emerald-600 dark:text-muted-foreground/70 dark:hover:text-primary transition-colors"
                  >
                    {copiedEndpoint === ep.path ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] text-gray-600 dark:text-muted-foreground/70 mb-4">{ep.description}</p>
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
          <div className="space-y-4">
          <div className={`${panel} overflow-hidden`}>
            <div className={`px-4 py-3 ${panelHeaderBorder}`}>
              <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground">
                HTTP Status Codes
              </p>
            </div>
            <div className="divide-y divide-border">
              {[
                { code: '200', label: 'OK', desc: 'Request successful', color: 'var(--success)' },
                { code: '201', label: 'Created', desc: 'Resource created successfully', color: 'var(--success)' },
                { code: '400', label: 'Bad Request', desc: 'Invalid request body or parameters', color: 'var(--warning)' },
                { code: '401', label: 'Unauthorized', desc: 'Missing or invalid authentication token', color: 'var(--destructive)' },
                { code: '403', label: 'Forbidden', desc: 'Insufficient permissions for this resource', color: 'var(--destructive)' },
                { code: '404', label: 'Not Found', desc: 'The requested resource does not exist', color: 'var(--destructive)' },
                { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded. See X-RateLimit headers', color: 'var(--warning)' },
                { code: '500', label: 'Internal Server Error', desc: 'An unexpected server error occurred', color: 'var(--destructive)' },
              ].map(({ code, label, desc, color }) => (
                <div
                  key={code}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-muted transition-colors"
                >
                  <span
                    className="font-mono text-sm font-bold w-12 flex-shrink-0"
                    style={{ color }}
                  >
                    {code}
                  </span>
                  <span className="font-mono text-xs text-gray-900 dark:text-foreground w-36 flex-shrink-0">{label}</span>
                  <span className={bodyMutedSoft}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unified error envelope */}
          <div className={`${panel} overflow-hidden`}>
            <div className={`px-4 py-3 ${panelHeaderBorder}`}>
              <p className="font-label uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-muted-foreground">
                Error Envelope
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className={bodyMutedSoft}>
                Every non-2xx response uses one shape. Branch on{' '}
                <code className="font-mono text-[11px]">error.code</code> — a stable
                machine-readable value — not on the message or HTTP status.
              </p>
              <pre className="bg-gray-900 dark:bg-black/40 rounded-md p-4 overflow-x-auto text-xs text-slate-200 font-mono">
{`{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "email: Enter a valid email address.",
    "details": [{ "field": "email", "issue": "Enter a valid email address." }],
    "meta": {}
  }
}`}
              </pre>
              <div className="divide-y divide-border">
                {[
                  ['validation_error', '400', 'Request body / query failed validation'],
                  ['authentication_required', '401', 'No valid credentials supplied'],
                  ['invalid_credentials', '401', 'Credentials supplied but rejected'],
                  ['permission_denied', '403', 'Authenticated but not allowed'],
                  ['not_found', '404', 'Resource does not exist'],
                  ['insufficient_credits', '402', 'Not enough credits for the request'],
                  ['rate_limit_exceeded', '429', 'Throttled or bulk-per-request limit exceeded'],
                  ['internal_error', '500', 'Unexpected server error (no internals exposed)'],
                  ['api_error', '—', 'Fallback for anything unmapped'],
                ].map(([code, http, desc]) => (
                  <div key={code} className="flex items-center gap-4 py-2">
                    <code className="font-mono text-[11px] text-emerald-700 dark:text-primary w-52 flex-shrink-0">
                      {code}
                    </code>
                    <span className="font-mono text-[11px] text-gray-500 dark:text-muted-foreground/60 w-10 flex-shrink-0">
                      {http}
                    </span>
                    <span className={bodyMutedSoft}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
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
                  <p className="font-headline font-bold text-gray-900 dark:text-foreground text-sm tracking-tight">
                    {lang}
                  </p>
                  <span
                    className={`font-mono uppercase tracking-[0.08em] text-[9px] px-2 py-0.5 rounded-sm border ${
                      status === 'Stable'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-primary/10 dark:text-primary dark:border-primary/20'
                        : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-warning/10 dark:text-warning dark:border-warning/20'
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
                    className="text-gray-400 hover:text-emerald-600 dark:text-muted-foreground/70 dark:hover:text-primary ml-3 flex-shrink-0"
                  >
                    {copiedEndpoint === lang ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-primary" />
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