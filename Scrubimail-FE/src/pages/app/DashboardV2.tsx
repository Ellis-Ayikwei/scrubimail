import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileUp,
  KeyRound,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Mail,
} from 'lucide-react';
import dayjs from 'dayjs';

import { validationService, ValidationHistory } from '@/services/validationService';
import { billingService, BillingProfile, UsageStats } from '@/services/billingService';
import { userService } from '@/services/userService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const QUICK_ACTIONS = [
  { title: 'Single validation', desc: 'Verify one address in real time', icon: CheckCircle2, to: '/validate' },
  { title: 'Bulk upload', desc: 'Validate a CSV or list at scale', icon: FileUp, to: '/bulk-upload' },
  { title: 'API keys', desc: 'Integrate validation into your stack', icon: KeyRound, to: '/apikeys' },
  { title: 'History', desc: 'Review and export past results', icon: HistoryIcon, to: '/history' },
];

const DashboardV2: React.FC = () => {
  const [history, setHistory] = useState<ValidationHistory | null>(null);
  const [billing, setBilling] = useState<BillingProfile | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profile = await userService.getComprehensiveProfile().catch(() => null);
      if (profile?.billing) {
        setBilling({
          credits_remaining: profile.billing.credits_remaining,
          credits_used_this_month: profile.billing.credits_used_this_month,
          current_plan: {
            name: profile.billing.current_plan?.name,
            price: profile.billing.current_plan?.price,
          },
        } as BillingProfile);
      }
      if (profile?.usage) {
        setUsage({
          total_validations: profile.usage.total_validations,
          valid_emails: profile.usage.valid_emails,
          invalid_emails: profile.usage.invalid_emails,
          success_rate: profile.usage.success_rate,
        } as UsageStats);
      }
      if (!profile) {
        const [b, u] = await Promise.all([
          billingService.getBillingProfile().catch(() => null),
          billingService.getUsageStats().catch(() => null),
        ]);
        if (b) setBilling(b);
        if (u) setUsage(u);
      }
      const h = await validationService.getValidationHistory({ page_size: 6 }).catch(() => null);
      if (h) setHistory(h);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditsUsed = billing?.credits_used_this_month ?? 0;
  const creditsRemaining = billing?.credits_remaining ?? 0;
  const creditsTotal = creditsRemaining + creditsUsed;
  const usedPct = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0;

  const kpis = [
    { label: 'Total validations', value: usage?.total_validations, change: '+12%', up: true },
    { label: 'Valid emails', value: usage?.valid_emails, change: '+8%', up: true },
    { label: 'Invalid emails', value: usage?.invalid_emails, change: '-3%', up: false },
    {
      label: 'Success rate',
      value: usage?.success_rate != null ? `${usage.success_rate.toFixed(1)}%` : undefined,
      change: '',
      up: true,
    },
  ];

  const recent = history?.results?.slice(0, 6) ?? [];

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Here’s what’s happening with your email validation.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => (window.location.href = '/validate')}>
              <Zap />
              New validation
            </Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-7 w-20" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {typeof k.value === 'number' ? k.value.toLocaleString() : k.value ?? '0'}
                  </p>
                )}
                {k.change && !loading && (
                  <div className="mt-1.5 flex items-center gap-1">
                    {k.up ? (
                      <TrendingUp className="size-3.5 text-primary" />
                    ) : (
                      <TrendingDown className="size-3.5 text-destructive" />
                    )}
                    <span className={k.up ? 'text-xs text-primary' : 'text-xs text-destructive'}>
                      {k.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: actions + recent */}
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.title} to={a.to} className="group">
                    <Card className="transition-colors hover:border-primary/40 hover:bg-muted/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </div>
                          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>
                        <p className="mt-3 text-sm font-semibold">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{a.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Recent validations</CardTitle>
                <Link to="/history" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-1 p-4">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : recent.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 p-10 text-center">
                    <Mail className="size-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No validations yet</p>
                    <Button size="sm" className="mt-1" onClick={() => (window.location.href = '/validate')}>
                      Run your first check
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {recent.map((r: any) => {
                      const valid = r.is_valid;
                      return (
                        <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                          <span
                            className={
                              'size-2 shrink-0 rounded-full ' + (valid ? 'bg-primary' : 'bg-destructive')
                            }
                          />
                          <span className="min-w-0 flex-1 truncate text-sm">{r.email}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {r.created_at ? dayjs(r.created_at).format('MMM D, HH:mm') : ''}
                          </span>
                          <Badge variant={valid ? 'success' : 'destructive'}>
                            {valid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: credits + plan */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Credit usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-semibold tracking-tight">
                      {loading ? '—' : creditsRemaining.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">of {creditsTotal.toLocaleString()} left</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {creditsUsed.toLocaleString()} used this month
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current plan</span>
                  <Badge>{billing?.current_plan?.name ?? 'Free'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly</span>
                  <span className="text-sm font-medium">${billing?.current_plan?.price ?? '0'}</span>
                </div>

                <Button className="w-full" onClick={() => (window.location.href = '/billing')}>
                  Refill credits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Deliverability tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Validate before every send to cut bounces and protect your sender reputation. Bulk-clean
                  your lists monthly for best inbox placement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardV2;
