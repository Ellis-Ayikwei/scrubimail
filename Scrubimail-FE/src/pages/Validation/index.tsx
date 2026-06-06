import React, { useState, useEffect } from 'react';
import { Mail, Upload, AlertTriangle, Key } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { apiKeyService, APIKey } from '../../services/apiKeyService';
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
    <div className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-600 dark:text-[#6effc0] mb-0.5">
            Verification Engine
          </p>
          <h1 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight">
            Email Validation
          </h1>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf] mt-0.5">
            VERSION 4.2.0 // DEEP_SMTP_INSPECTION_ACTIVE
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf]">
              API Key:
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-emerald-700 dark:text-[#6effc0]">
              {selectedApiKey ? maskApiKey(selectedApiKey.key) : 'None selected'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-mono uppercase tracking-[0.1em] text-[10px] px-3 py-1.5 rounded-sm hover:border-emerald-400 hover:text-emerald-700 transition-colors dark:border-[#3b4a41]/40 dark:text-[#bacbbf] dark:hover:border-[#6effc0]/40 dark:hover:text-[#6effc0]"
          >
            <Key className="w-3 h-3" /> Select Key
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 flex items-center gap-2 text-red-700 font-mono text-xs dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex bg-gray-100 border border-gray-200 rounded-sm p-0.5 dark:bg-[#1c2024] dark:border-[#3b4a41]/40">
        <button
          type="button"
          onClick={() => setValidationMode('single')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 font-mono uppercase tracking-[0.1em] text-[10px] rounded-sm transition-all ${
            validationMode === 'single'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20'
              : 'text-gray-400 hover:text-gray-700 dark:text-[#bacbbf]/50 dark:hover:text-[#bacbbf]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> Single Email
        </button>
        <button
          type="button"
          onClick={() => setValidationMode('bulk')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 font-mono uppercase tracking-[0.1em] text-[10px] rounded-sm transition-all ${
            validationMode === 'bulk'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20'
              : 'text-gray-400 hover:text-gray-700 dark:text-[#bacbbf]/50 dark:hover:text-[#bacbbf]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Bulk Upload
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
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
        <div className="space-y-4">
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
  );
};

export default Validation;
