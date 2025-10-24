import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  EyeOff,
  Mail,
  TrendingUp,
  BarChart3
} from 'lucide-react';

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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg sm:text-xl font-semibold text-[#333333] dark:text-white flex items-center">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#2ED8A3]" />
            Validation Result
          </h2>
          {includeDetails && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#2ED8A3]/10 text-[#2ED8A3]">
              <span className="w-3 h-3 mr-1">👁️</span>
              Detailed
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[#2ED8A3] hover:text-[#00C48C] transition-colors flex items-center space-x-1 text-sm"
          title={showDetails ? 'Hide detailed breakdown' : 'Show detailed breakdown'}
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-xs">{showDetails ? 'Hide' : 'Show'} Details</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-[#333333]/50" />
          <span className="font-medium text-[#333333] dark:text-white text-sm sm:text-base truncate">{result.email}</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              {getStatusIcon(result.status)}
            </div>
            <div className="text-xs text-[#333333]/70 dark:text-gray-400">Status</div>
            <div className="text-xs sm:text-sm font-medium text-[#333333] dark:text-white capitalize">
              {result.status}
            </div>
          </div>

          {/* Score */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-sm sm:text-lg font-bold text-[#333333] dark:text-white mb-1">
              {result.score}
            </div>
            <div className="text-xs text-[#333333]/70 dark:text-gray-400">Score</div>
          </div>

          {/* Verdict */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-center">
            <div className={`text-xs sm:text-sm font-medium mb-1 ${result.is_valid ? 'text-green-600' : 'text-red-600'}`}>
              {result.verdict || (result.is_valid ? 'Valid' : 'Invalid')}
            </div>
            <div className="text-xs text-[#333333]/70 dark:text-gray-400">Verdict</div>
          </div>

          {/* Validation Time */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xs sm:text-sm font-medium text-[#333333] dark:text-white mb-1">
              {result.validation_time ? `${result.validation_time.toFixed(0)}ms` : 'N/A'}
            </div>
            <div className="text-xs text-[#333333]/70 dark:text-gray-400">Time</div>
          </div>
        </div>

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-[#333333] dark:text-white mb-2">Warnings</h4>
            <ul className="text-xs space-y-1">
              {result.warnings.map((warning: string, i: number) => (
                <li key={i} className="text-[#333333]/70 dark:text-gray-400">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-[#333333] dark:text-white mb-2">Suggestions</h4>
            <ul className="text-xs space-y-1">
              {result.suggestions.map((suggestion: string, i: number) => (
                <li key={i} className="text-[#333333]/70 dark:text-gray-400">• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetails && result.breakdown && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-[#333333] dark:text-white mb-3">Detailed Breakdown</h4>
            
            {/* Syntax Check */}
            {result.breakdown.syntax && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2 flex items-center">
                  <CheckCircle className={`w-3 h-3 mr-1 ${result.breakdown.syntax.valid ? 'text-green-500' : 'text-red-500'}`} />
                  Syntax Check
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span>Valid Format:</span>
                    <span className={result.breakdown.syntax.valid ? 'text-green-600' : 'text-red-600'}>
                      {result.breakdown.syntax.valid ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DNS Check */}
            {result.breakdown.dns && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2 flex items-center">
                  <CheckCircle className={`w-3 h-3 mr-1 ${result.breakdown.dns.valid ? 'text-green-500' : 'text-red-500'}`} />
                  DNS Check
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Domain Exists:</span>
                    <span className={result.breakdown.dns.valid ? 'text-green-600' : 'text-red-600'}>
                      {result.breakdown.dns.valid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {result.breakdown.dns.score && (
                    <div className="flex justify-between">
                      <span>DNS Score:</span>
                      <span className="text-blue-600">{result.breakdown.dns.score}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SMTP Check */}
            {result.breakdown.smtp && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2 flex items-center">
                  <CheckCircle className={`w-3 h-3 mr-1 ${result.breakdown.smtp.valid ? 'text-green-500' : 'text-red-500'}`} />
                  SMTP Check
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Mailbox Exists:</span>
                    <span className={result.breakdown.smtp.valid ? 'text-green-600' : 'text-red-600'}>
                      {result.breakdown.smtp.valid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Catch-All:</span>
                    <span className={result.breakdown.smtp.catch_all ? 'text-yellow-600' : 'text-green-600'}>
                      {result.breakdown.smtp.catch_all ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Reputation Check */}
            {result.breakdown.reputation && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-blue-500" />
                  Reputation Check
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span>Reputation Score:</span>
                    <span className="text-blue-600">{result.breakdown.reputation.reputation_score || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Role-Based Check */}
            {result.breakdown.role_based && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2 flex items-center">
                  <AlertTriangle className={`w-3 h-3 mr-1 ${result.breakdown.role_based.is_role_based ? 'text-yellow-500' : 'text-green-500'}`} />
                  Role-Based Check
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span>Is Role-Based:</span>
                    <span className={result.breakdown.role_based.is_role_based ? 'text-yellow-600' : 'text-green-600'}>
                      {result.breakdown.role_based.is_role_based ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Score */}
            {result.breakdown.risk_score && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2 flex items-center">
                  <BarChart3 className="w-3 h-3 mr-1 text-purple-500" />
                  Risk Assessment
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Risk Score:</span>
                    <span className="text-purple-600">{result.breakdown.risk_score.score || result.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verdict:</span>
                    <span className={result.breakdown.risk_score.is_valid ? 'text-green-600' : 'text-red-600'}>
                      {result.breakdown.risk_score.verdict || result.verdict}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Is Valid:</span>
                    <span className={result.breakdown.risk_score.is_valid ? 'text-green-600' : 'text-red-600'}>
                      {result.breakdown.risk_score.is_valid ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Breakdown (for debugging) */}
            <div className="mt-4">
              <h5 className="text-xs font-medium text-[#333333] dark:text-white mb-2">Raw Data</h5>
              <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-3">
                <pre className="text-xs text-[#333333] dark:text-white overflow-x-auto">
                  {JSON.stringify(result.breakdown, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResults;
