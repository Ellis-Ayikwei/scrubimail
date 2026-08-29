import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon?: LucideIcon;
    /** Percentage change vs. the previous period. Sign drives colour and arrow. */
    delta?: number | null;
    deltaLabel?: string;
    hint?: string;
    loading?: boolean;
    className?: string;
}

/**
 * One KPI tile. `StatCardGrid` lays these out — don't hand-roll the grid, so
 * every module's stat row keeps the same rhythm.
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    delta,
    deltaLabel = 'vs. last month',
    hint,
    loading,
    className,
}: StatCardProps) {
    const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
    const positive = hasDelta && delta! >= 0;

    return (
        <Card className={cn('gap-0 py-4', className)}>
            <CardContent className="px-4">
                <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground text-sm font-medium">{label}</span>
                    {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
                </div>

                {loading ? (
                    <Skeleton className="mt-2 h-8 w-24" />
                ) : (
                    <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
                )}

                {(hasDelta || hint) && !loading && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                        {hasDelta && (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-0.5 font-medium',
                                    positive ? 'text-success' : 'text-destructive'
                                )}
                            >
                                {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                                {Math.abs(delta!).toFixed(1)}%
                            </span>
                        )}
                        <span className="text-muted-foreground truncate">{hint ?? deltaLabel}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/** Responsive grid for a row of stat tiles. */
export function StatCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
    );
}
