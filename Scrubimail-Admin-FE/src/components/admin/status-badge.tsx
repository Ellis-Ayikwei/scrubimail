import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<StatusTone, string> = {
    success: 'bg-success/10 text-success dark:bg-success/20',
    warning: 'bg-warning/15 text-warning-foreground dark:bg-warning/25 dark:text-warning',
    danger: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
    info: 'bg-info/10 text-info dark:bg-info/20',
    neutral: 'bg-muted text-muted-foreground',
};

/**
 * Maps the status vocabularies the API uses onto a small set of tones, so a
 * "completed" validation and an "active" user read the same way everywhere.
 */
const TONE_BY_STATUS: Record<string, StatusTone> = {
    // shared
    active: 'success',
    completed: 'success',
    succeeded: 'success',
    success: 'success',
    paid: 'success',
    verified: 'success',
    valid: 'success',
    enabled: 'success',

    pending: 'warning',
    processing: 'info',
    queued: 'info',
    in_progress: 'info',
    trialing: 'info',
    draft: 'neutral',

    failed: 'danger',
    error: 'danger',
    invalid: 'danger',
    cancelled: 'danger',
    canceled: 'danger',
    suspended: 'danger',
    expired: 'danger',
    overdue: 'danger',
    revoked: 'danger',
    disabled: 'danger',

    inactive: 'neutral',
    unknown: 'neutral',
    risky: 'warning',
    unverified: 'warning',
};

const humanize = (status: string) =>
    status
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

export interface StatusBadgeProps {
    status: string | null | undefined;
    /** Override the inferred tone when a module's vocabulary differs. */
    tone?: StatusTone;
    label?: string;
    className?: string;
}

export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
    if (!status) return <span className="text-muted-foreground">—</span>;

    const key = status.toLowerCase().trim();
    const resolved = tone ?? TONE_BY_STATUS[key] ?? 'neutral';

    return (
        <Badge variant="outline" className={cn('border-transparent', TONE_CLASS[resolved], className)}>
            {label ?? humanize(status)}
        </Badge>
    );
}
