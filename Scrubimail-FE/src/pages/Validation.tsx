import React, { useState } from 'react';
import { 
  Mail, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Download,
  FileText,
  BarChart3,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Clock,
  TrendingUp
} from 'lucide-react';
import axiosInstance from '../services/axiosInstance';

const Validation = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkTaskIds, setBulkTaskIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [validationMode, setValidationMode] = useState<'single' | 'bulk'>('single');

  const handleSingleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/validate/', { email });
      setResult(res.data);
      setShowDetails(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    setLoading(true);
    setError(null);
    try {
      const text = await bulkFile.text();
      let emails: string[] = [];
      if (bulkFile.name.endsWith('.csv')) {
        emails = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      } else {
        emails = JSON.parse(text);
      }
      const res = await axiosInstance.post('/validate-bulk/', { emails });
      setBulkTaskIds(res.data.task_ids || [res.data.job_id]);
    } catch (err: any) {
      setError('Bulk validation failed');
    } finally {
      setLoading(false);
    }
  };

  const checkBulkStatus = async () => {
    setBulkStatus([]);
    for (const taskId of bulkTaskIds) {
      try {
        const res = await axiosInstance.get(`/bulk-status/${taskId}/`);
        setBulkStatus(prev => [...prev, res.data]);
      } catch {}
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
            <Mail className="w-8 h-8 mr-3 text-[#2ED8A3]" />
            Email Validation
          </h1>
          <p className="text-[#333333]/70 dark:text-gray-400">
            Validate single emails or upload files for bulk validation
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setValidationMode('single')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                validationMode === 'single'
                  ? 'bg-[#2ED8A3] text-white shadow-sm'
                  : 'text-[#333333] dark:text-gray-400 hover:text-[#2ED8A3]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Single Email</span>
            </button>
            <button
              onClick={() => setValidationMode('bulk')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                validationMode === 'bulk'
                  ? 'bg-[#2ED8A3] text-white shadow-sm'
                  : 'text-[#333333] dark:text-gray-400 hover:text-[#2ED8A3]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Upload</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Validation Form */}
          <div className="space-y-6">
            {validationMode === 'single' ? (
              /* Single Email Validation */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                  Single Email Validation
                </h2>
                
                <form onSubmit={handleSingleValidate} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#333333]/50" />
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter email address to validate"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center space-x-2 bg-[#2ED8A3] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00C48C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Validate Email</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Bulk Email Validation */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                  Bulk Email Validation
                </h2>
                
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                      Upload File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#2ED8A3] transition-colors">
                      <Upload className="w-8 h-8 text-[#333333]/50 mx-auto mb-2" />
                      <input
                        id="file"
                        type="file"
                        accept=".csv,application/json"
                        onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="file" className="cursor-pointer">
                        <p className="text-sm text-[#333333] dark:text-gray-400 mb-2">
                          {bulkFile ? bulkFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-[#333333]/50 dark:text-gray-500">
                          CSV or JSON files up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !bulkFile}
                    className="w-full flex items-center justify-center space-x-2 bg-[#2ED8A3] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00C48C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload & Validate</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Bulk Status */}
                {bulkTaskIds.length > 0 && (
                  <div className="mt-6 p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-[#333333] dark:text-white">Bulk Jobs</h3>
                      <button
                        onClick={checkBulkStatus}
                        className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Refresh</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {bulkStatus.map((status, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status.status)}
                            <span className="text-sm text-[#333333] dark:text-white">
                              Job {status.job_id}
                            </span>
                          </div>
                          <span className="text-xs text-[#333333]/50 dark:text-gray-400">
                            {status.progress || 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#2ED8A3]">1,247</div>
                  <div className="text-sm text-[#333333]/70 dark:text-gray-400">Validations Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#333333] dark:text-white">98.5%</div>
                  <div className="text-sm text-[#333333]/70 dark:text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#333333] dark:text-white flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                    Validation Result
                  </h2>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                  >
                    {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-[#333333]/50" />
                    <span className="font-medium text-[#333333] dark:text-white">{result.email}</span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm text-[#333333] dark:text-white capitalize">
                      {result.status}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#333333] dark:text-white">Validation Score:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadge(result.score)}`}>
                      {result.score}
                    </span>
                  </div>

                  {/* Verdict */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#333333] dark:text-white">Verdict:</span>
                    <span className={`text-sm font-medium ${result.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                      {result.verdict || (result.is_valid ? 'Valid' : 'Invalid')}
                    </span>
                  </div>

                  {/* Validation Time */}
                  {result.validation_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#333333] dark:text-white">Validation Time:</span>
                      <span className="text-sm text-[#333333]/70 dark:text-gray-400">
                        {result.validation_time.toFixed(2)}ms
                      </span>
                    </div>
                  )}

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
                      <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-3">
                        <pre className="text-xs text-[#333333] dark:text-white overflow-x-auto">
                          {JSON.stringify(result.breakdown, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Need Help?
              </h3>
              <p className="text-sm text-[#333333]/70 dark:text-gray-400 mb-4">
                Learn more about our validation process and how to interpret results.
              </p>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-2 bg-[#F4F5F7] dark:bg-gray-700 rounded hover:bg-[#2ED8A3]/10 transition-colors">
                  <span className="text-sm text-[#333333] dark:text-white">View API Documentation</span>
                  <FileText className="w-4 h-4 text-[#2ED8A3]" />
                </button>
                <button className="w-full flex items-center justify-between p-2 bg-[#F4F5F7] dark:bg-gray-700 rounded hover:bg-[#2ED8A3]/10 transition-colors">
                  <span className="text-sm text-[#333333] dark:text-white">Download Sample Files</span>
                  <Download className="w-4 h-4 text-[#2ED8A3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Validation; 