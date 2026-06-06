import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  TrendingUp,
  BarChart3,
  Shield,
  Server
} from 'lucide-react';
import {
  VAL_CARD,
  VAL_CHROME_BETWEEN,
  VAL_CHROME_TITLE,
  VAL_INSET,
  VAL_ROW_BORDER,
  VAL_CODE,
} from './validationTheme';

interface ValidationResultsProps {
  result: any;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  includeDetails: boolean;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({
  result,
  showDetails,
  setShowDetails,
  includeDetails
}) => {
  const isValid = result.is_valid;
  const verdict = result.verdict || (isValid ? 'Valid' : 'Invalid');
  const score = typeof result.score === 'number' ? result.score : null;

  const scoreClass =
    score === null
      ? 'text-gray-500 dark:text-[#bacbbf]'
      : score >= 80
        ? 'text-emerald-600 dark:text-[#6effc0]'
        : score >= 50
          ? 'text-amber-600 dark:text-[#f59e0b]'
          : 'text-red-600 dark:text-[#ff4c4c]';

  const Row: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono = true }) => (
    <div className={`flex items-center justify-between py-1.5 ${VAL_ROW_BORDER}`}>
      <span className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/50">
        {label}
      </span>
      <span className={`${mono ? 'font-mono' : ''} text-[10px] text-gray-900 dark:text-[#e0e3e8]`}>{value}</span>
    </div>
  );

  const CheckRow: React.FC<{ label: string; valid: boolean }> = ({ label, valid }) => (
    <div className={`flex items-center justify-between py-1.5 ${VAL_ROW_BORDER}`}>
      <span className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/50">
        {label}
      </span>
      <span
        className={`flex items-center gap-1 font-mono text-[9px] ${
          valid ? 'text-emerald-600 dark:text-[#6effc0]' : 'text-red-600 dark:text-[#ff4c4c]'
        }`}
      >
        {valid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {valid ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );

  return (
    <div className={VAL_CARD}>
      {/* Terminal chrome */}
      <div className={VAL_CHROME_BETWEEN}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/60 dark:bg-[#6effc0]/60" />
          <span className={VAL_CHROME_TITLE}>validation_result.json</span>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 font-mono text-[9px] text-gray-400 hover:text-emerald-700 transition-colors uppercase tracking-[0.1em] dark:text-[#bacbbf]/40 dark:hover:text-[#6effc0]"
        >
          {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showDetails ? 'Hide' : 'Show'} Raw
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Header verdict */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#6effc0]" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 dark:text-[#ff4c4c]" />
            )}
            <span className="font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-[#e0e3e8] text-sm">
              {verdict}
            </span>
            {includeDetails && (
              <span className="font-mono text-[9px] px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm uppercase tracking-[0.1em] dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0]">
                Detailed
              </span>
            )}
          </div>
          {score !== null && (
            <span className={`font-['JetBrains_Mono',monospace] font-bold text-xl ${scoreClass}`}>{score}</span>
          )}
        </div>

        {/* Summary rows */}
        <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
          <Row label="Email" value={<span className="truncate max-w-[200px] block">{result.email}</span>} />
          <Row label="Status" value={result.status} />
          {score !== null && (
            <Row label="Score" value={<span className={scoreClass}>{score} / 100</span>} />
          )}
          {result.validation_time && (
            <Row label="Response Time" value={`${result.validation_time.toFixed(0)} ms`} />
          )}
        </div>

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 dark:bg-[#f59e0b]/5 dark:border-[#f59e0b]/20">
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-amber-800 dark:text-[#f59e0b] mb-2">
              Warnings
            </p>
            <ul className="space-y-1">
              {result.warnings.map((w: string, i: number) => (
                <li key={i} className="font-mono text-[10px] text-amber-900/80 dark:text-[#bacbbf]/70">
                  → {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 dark:bg-[#60a5fa]/5 dark:border-[#60a5fa]/20">
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-blue-800 dark:text-[#60a5fa] mb-2">
              Suggestions
            </p>
            <ul className="space-y-1">
              {result.suggestions.map((s: string, i: number) => (
                <li key={i} className="font-mono text-[10px] text-blue-900/80 dark:text-[#bacbbf]/70">
                  → {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed breakdown */}
        {showDetails && result.breakdown && (
          <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-[#3b4a41]/30">
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-400 dark:text-[#bacbbf]/50">
              Breakdown
            </p>

            {result.breakdown.syntax && (
              <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Syntax
                </p>
                <CheckRow label="Valid Format" valid={result.breakdown.syntax.valid} />
              </div>
            )}

            {result.breakdown.dns && (
              <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5 flex items-center gap-1">
                  <Server className="w-3 h-3" /> DNS
                </p>
                <CheckRow label="Domain Exists" valid={result.breakdown.dns.valid} />
                {result.breakdown.dns.score !== undefined && (
                  <Row label="DNS Score" value={result.breakdown.dns.score} />
                )}
              </div>
            )}

            {result.breakdown.smtp && (
              <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> SMTP
                </p>
                <CheckRow label="Mailbox Exists" valid={result.breakdown.smtp.valid} />
                <Row
                  label="Catch-All"
                  value={
                    <span
                      className={
                        result.breakdown.smtp.catch_all
                          ? 'text-amber-600 dark:text-[#f59e0b]'
                          : 'text-emerald-600 dark:text-[#6effc0]'
                      }
                    >
                      {result.breakdown.smtp.catch_all ? 'YES' : 'NO'}
                    </span>
                  }
                />
              </div>
            )}

            {result.breakdown.reputation && (
              <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Reputation
                </p>
                <Row label="Score" value={result.breakdown.reputation.reputation_score ?? 'N/A'} />
              </div>
            )}

            {result.breakdown.role_based && (
              <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Role-Based
                </p>
                <Row
                  label="Is Role Address"
                  value={
                    <span
                      className={
                        result.breakdown.role_based.is_role_based
                          ? 'text-amber-600 dark:text-[#f59e0b]'
                          : 'text-emerald-600 dark:text-[#6effc0]'
                      }
                    >
                      {result.breakdown.role_based.is_role_based ? 'YES' : 'NO'}
                    </span>
                  }
                />
              </div>
            )}

            {result.breakdown.risk_score && (
              <div className={`${VAL_INSET} rounded-sm px-4 py-2`}>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Risk Assessment
                </p>
                <Row label="Risk Score" value={result.breakdown.risk_score.score ?? result.score} />
                <Row label="Verdict" value={result.breakdown.risk_score.verdict ?? result.verdict} />
                <CheckRow label="Valid" valid={result.breakdown.risk_score.is_valid} />
              </div>
            )}

            {/* Raw JSON */}
            <div>
              <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-1.5">
                Raw Data
              </p>
              <pre className={VAL_CODE}>{JSON.stringify(result.breakdown, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResults;
