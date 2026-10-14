import type { StatusTone } from '@/components/admin';

/**
 * A validation's "outcome" as the admin API reports it: the deliverability
 * verdict for completed rows, the job state otherwise. Mirrors
 * VERDICT_STATUSES / JOB_STATUSES in apps/admin/views.py.
 */
export const OUTCOMES = {
    valid: { label: 'Valid', tone: 'success', color: 'var(--color-success)' },
    invalid: { label: 'Invalid', tone: 'danger', color: 'var(--color-destructive)' },
    catch_all: { label: 'Catch-all', tone: 'warning', color: 'var(--color-warning)' },
    unknown: { label: 'Unknown', tone: 'neutral', color: 'var(--color-muted-foreground)' },
    do_not_mail: { label: 'Do not mail', tone: 'danger', color: 'var(--color-primary)' },
    pending: { label: 'Pending', tone: 'info', color: 'var(--color-info)' },
    processing: { label: 'Processing', tone: 'info', color: 'var(--color-info)' },
    failed: { label: 'Failed', tone: 'danger', color: 'var(--color-destructive)' },
} as const satisfies Record<string, { label: string; tone: StatusTone; color: string }>;

export type Outcome = keyof typeof OUTCOMES;

export const OUTCOME_FILTER_ITEMS: Record<string, string> = {
    all: 'All outcomes',
    ...Object.fromEntries(Object.entries(OUTCOMES).map(([k, v]) => [k, v.label])),
};

export function outcomeMeta(status: string | null | undefined) {
    return OUTCOMES[(status ?? '') as Outcome] ?? { label: status || '—', tone: 'neutral' as StatusTone, color: 'var(--color-muted-foreground)' };
}

/** Text colour for a 0–100 deliverability score. */
export function scoreClass(score: number | null | undefined) {
    if (score == null) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning-foreground dark:text-warning';
    return 'text-destructive';
}

export interface AdminValidation {
    id: string;
    email: string;
    status: string;
    job_status: string;
    sub_status?: string | null;
    score: number | null;
    verdict: string;
    is_valid: boolean;
    job_type: string;
    bulk_job_id?: string | null;
    processing_ms: number | null;
    created_at: string;
    user: { id: string; email: string; name?: string | null } | null;
    breakdown: Record<string, Record<string, unknown> | undefined>;
    suggestions: string[];
    warnings: string[];
    metadata: Record<string, unknown>;
}

export interface AdminValidationPage {
    results: AdminValidation[];
    count: number;
    limit: number;
    offset: number;
}
