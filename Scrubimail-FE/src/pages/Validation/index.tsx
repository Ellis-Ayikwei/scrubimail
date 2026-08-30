import React, { useState, useEffect } from 'react';
import { Mail, Upload, AlertTriangle, Key } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { apiKeyService, APIKey } from '../../services/apiKeyService';
import ValidationForm from './components/ValidationForm';
import ValidationResults from './components/ValidationResults';
import QuickStats from './components/QuickStats';
import ApiKeyModal from './components/ApiKeyModal';
import HelpCard from './components/HelpCard';
import { VAL_LABEL } from './components/validationTheme';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  // Deep = full inline SMTP verification (can return "valid", ~2-8s). Off = fast
  // syntax/DNS-only path (?mode=fast, sub-100ms, never confirms a mailbox).
  const [deepMode, setDeepMode] = useState(true);
  
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
      const params: Record<string, string> = {};
      if (includeDetails) params.details = 'true';
      if (!deepMode) params.mode = 'fast';
      const res = await axiosInstance.post('/validate/', { email }, {
        headers,
        params
      });
      setResult(res.data);
      setShowDetails(false);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
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
      setError(err.message || 'Bulk validation failed');
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-success font-label uppercase tracking-[0.2em] text-[9px] mb-0.5">
            Verification Engine
          </p>
          <h1 className="font-headline text-2xl font-black tracking-tight">
            Email Validation
          </h1>
          <p className="text-muted-foreground font-label uppercase tracking-[0.1em] text-[10px] mt-0.5">
            VERSION 4.2.0 // DEEP_SMTP_INSPECTION_ACTIVE
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-label uppercase tracking-[0.1em] text-[10px]">
              API Key:
            </span>
            <span className="text-success font-mono text-[10px]">
              {selectedApiKey ? maskApiKey(selectedApiKey.key) : 'None selected'}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setShowApiKeyModal(true)}
            className="font-mono tracking-[0.1em] uppercase"
          >
            <Key /> Select Key
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Mode toggle */}
      <Tabs value={validationMode} onValueChange={(value) => setValidationMode(value as 'single' | 'bulk')}>
        <TabsList className="w-full">
          <TabsTrigger value="single" className="flex-1 font-mono text-[10px] tracking-[0.1em] uppercase">
            <Mail /> Single Email
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1 font-mono text-[10px] tracking-[0.1em] uppercase">
            <Upload /> Bulk Upload
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Deep vs fast verification (single mode only) */}
      {validationMode === 'single' && (
        <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <div className="flex flex-col">
            <Label htmlFor="deep-mode" className="font-mono uppercase tracking-[0.1em] text-[10px]">
              {deepMode ? 'Deep verification' : 'Fast mode'}
            </Label>
            <span className="text-muted-foreground font-mono text-[9px]">
              {deepMode
                ? 'Full inline SMTP check — can confirm the mailbox (~2-8s)'
                : 'Syntax + DNS only — instant, never confirms a mailbox'}
            </span>
          </div>
          <Switch id="deep-mode" checked={deepMode} onCheckedChange={setDeepMode} />
        </div>
      )}

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
