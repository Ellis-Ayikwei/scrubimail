import * as React from 'react';
import { AlertTriangle, Inbox, RefreshCw, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** Centred spinner for first loads where no skeleton shape is meaningful. */
export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
    return (
        <div className={cn('text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm', className)}>
            <Spinner />
            {label}
        </div>
    );
}

export function EmptyState({
    title = 'Nothing here yet',
    description,
    icon: Icon = Inbox,
    action,
    className,
}: {
    title?: string;
    description?: React.ReactNode;
    icon?: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <Empty className={className}>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Icon />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                {description && <EmptyDescription>{description}</EmptyDescription>}
            </EmptyHeader>
            {action && <EmptyContent>{action}</EmptyContent>}
        </Empty>
    );
}

/**
 * Failure state with a retry affordance. Pages should pass the same fetch
 * function they use on mount so retry is always wired up.
 */
export function ErrorState({
    title = 'Something went wrong',
    description,
    onRetry,
    className,
}: {
    title?: string;
    description?: React.ReactNode;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <Empty className={className}>
            <EmptyHeader>
                <EmptyMedia variant="icon" className="text-destructive bg-destructive/10">
                    <AlertTriangle />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                {description && <EmptyDescription>{description}</EmptyDescription>}
            </EmptyHeader>
            {onRetry && (
                <EmptyContent>
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        <RefreshCw />
                        Try again
                    </Button>
                </EmptyContent>
            )}
        </Empty>
    );
}
