import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

import { billingService, BillingProfile } from '@/services/billingService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Credit balance and plan summary pinned to the bottom of the sidebar.
 *
 * `credits_remaining` and `credits_used_this_month` are the only two figures
 * the profile exposes, so the allowance is their sum rather than the plan's
 * `credits_per_month` — top-ups mean those two can differ.
 */
export function SidebarUsage() {
    const isAuthenticated = useIsAuthenticated();
    const [profile, setProfile] = useState<BillingProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        billingService
            .getBillingProfile()
            .then((data) => {
                if (!cancelled) setProfile(data);
            })
            .catch(() => {
                // Non-critical chrome: stay silent and render nothing.
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="h-7 w-full" />
            </div>
        );
    }

    if (!profile) return null;

    const remaining = profile.credits_remaining ?? 0;
    const used = profile.credits_used_this_month ?? 0;
    const allowance = remaining + used;
    const usedPct = allowance > 0 ? Math.min((used / allowance) * 100, 100) : 0;
    const low = allowance > 0 && remaining / allowance <= 0.1;

    return (
        <div className="space-y-2.5 rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Credits</span>
                <span className="truncate text-xs font-medium text-primary">
                    {profile.current_plan?.name ?? 'Free'}
                </span>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                    <span className={cn('font-medium', low ? 'text-destructive' : 'text-foreground')}>
                        {remaining.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">of {allowance.toLocaleString()}</span>
                </div>
                <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                    role="progressbar"
                    aria-valuenow={Math.round(usedPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Credits used this month"
                >
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-700',
                            low ? 'bg-destructive' : 'bg-primary'
                        )}
                        style={{ width: `${usedPct}%` }}
                    />
                </div>
            </div>

            <Button
                render={<Link to="/billing" />}
                size="sm"
                variant={low ? 'default' : 'outline'}
                className="w-full"
            >
                {low ? 'Top up credits' : 'Manage plan'}
            </Button>
        </div>
    );
}

export default SidebarUsage;
