import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileUp,
  Clock,
  Key,
  RefreshCw,
} from 'lucide-react';

import axiosInstance from '@/services/axiosInstance';
import { apiKeyService, APIKey } from '@/services/apiKeyService';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApiKeyPicker from '@/components/app/ApiKeyPicker';

type Tone = 'valid' | 'invalid' | 'unknown';

const TONE_META: Record<Tone, { icon: typeof CheckCircle2; label: string; className: string }> = {
  valid: { icon: CheckCircle2, label: 'Valid', className: 'text-primary' },
  invalid: { icon: XCircle, label: 'Invalid', className: 'text-destructive' },
  unknown: { icon: HelpCircle, label: 'Unknown', className: 'text-muted-foreground' },
};

/** Badge tone per bulk job state returned by /bulk-status/. */
const BULK_TONE: Record<string, 'success' | 'destructive' | 'warning' | 'info' | 'secondary'> = {
  completed: 'success',
  success: 'success',
  failed: 'destructive',
  error: 'destructive',
  pending: 'warning',
  queued: 'warning',
  processing: 'info',
  started: 'info',
};

const ValidationV2: React.FC = () => {
  const [email, setEmail] = useState('');
  const [deep, setDeep] = useState(true);
  const [details, setDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkTaskIds, setBulkTaskIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<any[]>([]);
  const [bulkChecking, setBulkChecking] = useState(false);

  // API key selection — the validation request is attributed to the chosen key.
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [showApiKeyPicker, setShowApiKeyPicker] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchApiKeys = async () => {
      setApiKeyLoading(true);
      try {
        const keys = await apiKeyService.getAPIKeys();
        if (cancelled) return;
        setApiKeys(keys);
        // Default to the first active key so the common case needs no action.
        const active = keys.find((key) => key.is_active);
        if (active) setSelectedApiKey(active);
      } catch (err) {
        console.error('Error fetching API keys:', err);
      } finally {
        if (!cancelled) setApiKeyLoading(false);
      }
    };
    fetchApiKeys();
    return () => {
      cancelled = true;
    };
  }, []);

  const maskApiKey = (key: string) =>
    key.length <= 8 ? key : `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}`;

  const copyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  };

  /** JWT always goes via the interceptor; the API key is additional. */
  const authHeaders = (): Record<string, string> =>
    selectedApiKey ? { 'X-API-Key': selectedApiKey.key } : {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params: Record<string, string> = {};
      if (!deep) params.mode = 'fast';
      if (details) params.details = 'true';
      const res = await axiosInstance.post(
        '/validate/',
        { email: email.trim() },
        { headers: authHeaders(), params }
      );
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Accepts a CSV (first column, header row tolerated) or a JSON array of
   * either strings or objects carrying an `email` field.
   */
  const parseEmails = (text: string, filename: string): string[] => {
    if (filename.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('JSON file must contain an array of addresses');
      return parsed
        .map((entry: any) => (typeof entry === 'string' ? entry : entry?.email))
        .filter((value: unknown): value is string => typeof value === 'string' && value.includes('@'))
        .map((value) => value.trim());
    }

    return text
      .split(/\r?\n/)
      .map((line) => line.split(',')[0]?.trim().replace(/^["']|["']$/g, '') ?? '')
      // Dropping non-matching lines also discards a header row like "email".
      .filter((value) => value.includes('@'));
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    setLoading(true);
    setError(null);
    setBulkStatus([]);
    try {
      const emails = parseEmails(await bulkFile.text(), bulkFile.name);
      if (emails.length === 0) {
        setError('No email addresses found in that file.');
        return;
      }
      const params: Record<string, string> = {};
      if (details) params.details = 'true';
      const res = await axiosInstance.post('/validate-bulk/', { emails }, { headers: authHeaders(), params });
      setBulkTaskIds(res.data.task_ids || [res.data.job_id]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Bulk validation failed');
    } finally {
      setLoading(false);
    }
  };

  const checkBulkStatus = async () => {
    setBulkChecking(true);
    try {
      // Collect first, then set once, so a failed lookup can't leave a partial list.
      const results = await Promise.all(
        bulkTaskIds.map(async (taskId) => {
          try {
            const res = await axiosInstance.get(`/bulk-status/${taskId}/`, { headers: authHeaders() });
            return res.data;
          } catch {
            return { job_id: taskId, status: 'unknown', progress: 0 };
          }
        })
      );
      setBulkStatus(results);
    } finally {
      setBulkChecking(false);
    }
  };

  const status: string | null =
    result?.verification_status || (result ? (result.is_valid ? 'valid' : 'invalid') : null);
  const tone: Tone = status === 'valid' ? 'valid' : status === 'invalid' ? 'invalid' : 'unknown';
  const ToneIcon = TONE_META[tone].icon;
  const requestMs = result?.request_time != null ? Math.round(result.request_time * 1000) : null;

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Email validation</h2>
            <p className="text-sm text-muted-foreground">Verify a single address in real time.</p>
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">API key</span>
              <span className={cn('font-mono', selectedApiKey ? 'text-primary' : 'text-muted-foreground')}>
                {selectedApiKey ? maskApiKey(selectedApiKey.key) : 'None selected'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowApiKeyPicker(true)}>
              <Key />
              Select key
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'single' | 'bulk')}>
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">
              <Zap />
              Single email
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">
              <FileUp />
              Bulk upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardContent className="p-5">
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoFocus
                      />
                      <Button type="submit" disabled={loading || !email.trim()} className="sm:w-36">
                        <Zap />
                        {loading ? 'Checking…' : 'Validate'}
                      </Button>
                    </div>
                  </div>

                  {/* Deep vs fast */}
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                    <Label htmlFor="deep-mode" className="flex-1 cursor-pointer">
                      <span className="block text-sm font-medium">
                        {deep ? 'Deep verification' : 'Fast mode'}
                      </span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {deep
                          ? 'Full SMTP mailbox check — can confirm the address (~2–8s)'
                          : 'Syntax + DNS only — instant, never confirms a mailbox'}
                      </span>
                    </Label>
                    <Switch id="deep-mode" checked={deep} onCheckedChange={setDeep} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="single-details" checked={details} onCheckedChange={(v) => setDetails(v === true)} />
                    <Label htmlFor="single-details" className="text-sm font-normal text-muted-foreground">
                      Include full breakdown
                    </Label>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardContent className="p-5">
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-file">Address list</Label>
                    <label
                      htmlFor="bulk-file"
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <FileUp className="size-5 text-muted-foreground" />
                      <span className="text-center text-sm">
                        {bulkFile ? (
                          <span className="font-medium text-primary">{bulkFile.name}</span>
                        ) : (
                          <>
                            <span className="font-medium">Click to upload</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              CSV (first column) or JSON array
                            </span>
                          </>
                        )}
                      </span>
                      <input
                        id="bulk-file"
                        type="file"
                        accept=".csv,.json,text/csv,application/json"
                        onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="bulk-details" checked={details} onCheckedChange={(v) => setDetails(v === true)} />
                    <Label htmlFor="bulk-details" className="text-sm font-normal text-muted-foreground">
                      Include full breakdown
                    </Label>
                  </div>

                  <Button type="submit" disabled={loading || !bulkFile} className="w-full">
                    <FileUp />
                    {loading ? 'Uploading…' : 'Upload & validate'}
                  </Button>
                </form>

                {/* Job status */}
                {bulkTaskIds.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Bulk jobs
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          ({bulkTaskIds.length})
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={checkBulkStatus}
                        disabled={bulkChecking}
                      >
                        <RefreshCw className={cn(bulkChecking && 'animate-spin')} />
                        Refresh
                      </Button>
                    </div>

                    {bulkStatus.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Job queued. Choose Refresh to check progress.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {bulkStatus.map((job, index) => (
                          <li
                            key={String(job.job_id ?? job.task_id ?? index)}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-2.5"
                          >
                            <span className="min-w-0 truncate font-mono text-xs">
                              {job.job_id ?? job.task_id ?? '—'}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <Badge variant={BULK_TONE[job.status] ?? 'secondary'}>{job.status ?? 'unknown'}</Badge>
                              <span className="w-9 text-right font-mono text-xs text-muted-foreground">
                                {job.progress ?? 0}%
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result — single-email only; bulk reports through the job list. */}
        {mode === 'single' && result && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ToneIcon className={cn('size-5', TONE_META[tone].className)} />
                <CardTitle className={cn('text-base', TONE_META[tone].className)}>
                  {TONE_META[tone].label}
                </CardTitle>
                {result.cached && <Badge variant="secondary">cached</Badge>}
              </div>
              <Badge variant="outline">{result.mode === 'fast' ? 'Fast' : 'Deep'}</Badge>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-5">
              <div className="truncate font-medium">{result.email}</div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Score" value={result.score != null ? `${result.score}` : '—'} />
                <Stat label="Status" value={result.verification_status || '—'} />
                <Stat label="Sub-status" value={result.sub_status || '—'} />
                <Stat
                  label="Time"
                  value={requestMs != null ? `${requestMs} ms` : '—'}
                  icon={Clock}
                />
              </div>

              {result.verdict && (
                <p className="text-sm text-muted-foreground">{result.verdict}</p>
              )}

              {details && result.breakdown && (
                <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {JSON.stringify(result.breakdown, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bulk pointer */}
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileUp className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Working with a large list?</p>
                <p className="text-xs text-muted-foreground">
                  The full bulk workspace adds history and downloadable results.
                </p>
              </div>
            </div>
            <Link to="/bulk-upload" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Bulk upload
            </Link>
          </CardContent>
        </Card>
      </div>

      <ApiKeyPicker
        isOpen={showApiKeyPicker}
        onClose={() => setShowApiKeyPicker(false)}
        apiKeys={apiKeys}
        selectedApiKey={selectedApiKey}
        setSelectedApiKey={setSelectedApiKey}
        apiKeyLoading={apiKeyLoading}
        copiedKey={copiedKey}
        copyApiKey={copyApiKey}
        maskApiKey={maskApiKey}
      />
    </>
  );
};

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Clock;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold capitalize">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {value}
      </p>
    </div>
  );
}

export default ValidationV2;
