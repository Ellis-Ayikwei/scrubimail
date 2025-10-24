import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Key,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { apiKeyService, APIKey } from '../../services/apiKeyService';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ValidationForm from './components/ValidationForm';
import ValidationResults from './components/ValidationResults';
import QuickStats from './components/QuickStats';
import ApiKeyModal from './components/ApiKeyModal';
import HelpCard from './components/HelpCard';


const Validation = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkTaskIds, setBulkTaskIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [validationMode, setValidationMode] = useState<'single' | 'bulk'>('single');
  
  // API Key selection states
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setApiKeyLoading(true);
        const keys = await apiKeyService.getAPIKeys();
        setApiKeys(keys);
        // Auto-select the first active key if available
        const activeKey = keys.find(key => key.is_active);
        if (activeKey) {
          setSelectedApiKey(activeKey);
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
      } finally {
        setApiKeyLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const handleSingleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Always send JWT token, and add API key if selected
      const headers: Record<string, string> = {};
      if (selectedApiKey) {
        headers['X-API-Key'] = selectedApiKey.key;
      }
      const params = includeDetails ? { details: 'true' } : {};
      const res = await axiosInstance.post('/validate/', { email }, { 
        headers,
        params 
      });
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
      
      // Always send JWT token, and add API key if selected
      const headers: Record<string, string> = {};
      if (selectedApiKey) {
        headers['X-API-Key'] = selectedApiKey.key;
      }
      const params = includeDetails ? { details: 'true' } : {};
      
      const res = await axiosInstance.post('/validate-bulk/', { emails }, {
        headers,
        params
      });
      setBulkTaskIds(res.data.task_ids || [res.data.job_id]);
    } catch (err: any) {
      setError('Bulk validation failed');
    } finally {
      setLoading(false);
    }
  };

  const checkBulkStatus = async () => {
    setBulkStatus([]);
    const headers: Record<string, string> = {};
    if (selectedApiKey) {
      headers['X-API-Key'] = selectedApiKey.key;
    }
    
    for (const taskId of bulkTaskIds) {
      try {
        const res = await axiosInstance.get(`/bulk-status/${taskId}/`, { headers });
        setBulkStatus(prev => [...prev, res.data]);
      } catch {}
    }
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

  const copyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
                <Mail className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-[#2ED8A3]" />
                <span className="truncate">Email Validation</span>
              </h1>
              <p className="text-sm sm:text-base text-[#333333]/70 dark:text-gray-400">
                Validate single emails or upload files for bulk validation
              </p>
            </div>
            
            {/* API Key Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:flex-shrink-0">
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400">Using API Key:</p>
                <p className="text-xs sm:text-sm font-medium text-[#333333] dark:text-white truncate max-w-[200px] sm:max-w-none">
                  {selectedApiKey ? maskApiKey(selectedApiKey.key) : 'None selected'}
                </p>
              </div>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Select API Key</span>
                <span className="sm:hidden">Select Key</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
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
              className={`flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
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
              className={`flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
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

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Validation Form */}
          <div className="space-y-4 sm:space-y-6">
            <ValidationForm
              validationMode={validationMode}
              email={email}
              setEmail={setEmail}
              bulkFile={bulkFile}
              setBulkFile={setBulkFile}
              includeDetails={includeDetails}
              setIncludeDetails={setIncludeDetails}
              loading={loading}
              handleSingleValidate={handleSingleValidate}
              handleBulkUpload={handleBulkUpload}
              bulkTaskIds={bulkTaskIds}
              bulkStatus={bulkStatus}
              checkBulkStatus={checkBulkStatus}
            />

            <QuickStats />
          </div>

          {/* Results */}
          <div className="space-y-4 sm:space-y-6">
            {result && (
              <ValidationResults
                result={result}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                includeDetails={includeDetails}
              />
            )}

            <HelpCard />
          </div>
        </div>

        {/* API Key Selection Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKeys={apiKeys}
          selectedApiKey={selectedApiKey}
          setSelectedApiKey={setSelectedApiKey}
          apiKeyLoading={apiKeyLoading}
          copiedKey={copiedKey}
          copyApiKey={copyApiKey}
          maskApiKey={maskApiKey}
        />
      </div>
    </div>
  );
};

export default Validation;
