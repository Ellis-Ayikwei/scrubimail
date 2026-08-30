import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileUp,
  Clock,
} from 'lucide-react';

import axiosInstance from '@/services/axiosInstance';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Tone = 'valid' | 'invalid' | 'unknown';

const TONE_META: Record<Tone, { icon: typeof CheckCircle2; label: string; className: string }> = {
  valid: { icon: CheckCircle2, label: 'Valid', className: 'text-primary' },
  invalid: { icon: XCircle, label: 'Invalid', className: 'text-destructive' },
  unknown: { icon: HelpCircle, label: 'Unknown', className: 'text-muted-foreground' },
};

const ValidationV2: React.FC = () => {
  const [email, setEmail] = useState('');
  const [deep, setDeep] = useState(true);
  const [details, setDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

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
      const res = await axiosInstance.post('/validate/', { email: email.trim() }, { params });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const status: string | null =
    result?.verification_status || (result ? (result.is_valid ? 'valid' : 'invalid') : null);
  const tone: Tone = status === 'valid' ? 'valid' : status === 'invalid' ? 'invalid' : 'unknown';
  const ToneIcon = TONE_META[tone].icon;
  const requestMs = result?.request_time != null ? Math.round(result.request_time * 1000) : null;

  return (
    <AppShell title="Validate">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Email validation</h2>
          <p className="text-sm text-muted-foreground">Verify a single address in real time.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
              <button
                type="button"
                onClick={() => setDeep((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-medium">
                    {deep ? 'Deep verification' : 'Fast mode'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {deep
                      ? 'Full SMTP mailbox check — can confirm the address (~2–8s)'
                      : 'Syntax + DNS only — instant, never confirms a mailbox'}
                  </span>
                </span>
                <span
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                    deep ? 'bg-primary' : 'bg-muted-foreground/40'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform',
                      deep && 'translate-x-4'
                    )}
                  />
                </span>
              </button>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={details}
                  onChange={(e) => setDetails(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-ring"
                />
                Include full breakdown
              </label>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
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
                <p className="text-sm font-medium">Validating a whole list?</p>
                <p className="text-xs text-muted-foreground">Upload a CSV for bulk verification.</p>
              </div>
            </div>
            <Link to="/bulk-upload" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Bulk upload
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
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
