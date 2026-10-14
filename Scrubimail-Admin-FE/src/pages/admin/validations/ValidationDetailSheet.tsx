import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Lightbulb, XCircle } from 'lucide-react';

import { StatusBadge } from '@/components/admin';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/format';
import { outcomeMeta, scoreClass, type AdminValidation } from '@/lib/validation';

/** One breakdown check rendered as pass / fail / n.a. with its useful extras. */
function Check({ label, data }: { label: string; data?: Record<string, unknown> }) {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="flex items-center justify-between py-2 text-sm">
                <span>{label}</span>
                <span className="text-muted-foreground">Not run</span>
            </div>
        );
    }
    const ok = data.valid ?? data.is_valid ?? data.mailbox_exists;
    const extras: string[] = [];
    if (typeof data.score === 'number') extras.push(`score ${data.score}`);
    if (typeof data.reputation_score === 'number') extras.push(`reputation ${data.reputation_score}`);
    if (data.catch_all === true) extras.push('catch-all');
    if (data.is_role_based === true) extras.push('role-based');
    if (data.is_disposable === true) extras.push('disposable');
    if (typeof data.response_code === 'number') extras.push(`SMTP ${data.response_code}`);
    if (typeof data.error === 'string' && data.error) extras.push(data.error);

    return (
        <div className="flex items-start justify-between gap-4 py-2 text-sm">
            <span>{label}</span>
            <span className="flex items-center gap-1.5 text-right">
                {extras.length > 0 && <span className="text-muted-foreground text-xs">{extras.join(' · ')}</span>}
                {ok === true ? (
                    <CheckCircle2 className="text-success size-4" />
                ) : ok === false ? (
                    <XCircle className="text-destructive size-4" />
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                )}
            </span>
        </div>
    );
}

export function ValidationDetailSheet({
    validation,
    onOpenChange,
}: {
    validation: AdminValidation | null;
    onOpenChange: (open: boolean) => void;
}) {
    const v = validation;
    const meta = outcomeMeta(v?.status);

    return (
        <Sheet open={Boolean(v)} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                {v && (
                    <>
                        <SheetHeader>
                            <SheetTitle className="break-all">{v.email}</SheetTitle>
                            <SheetDescription>
                                Validated {formatDateTime(v.created_at)} · {v.job_type}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-5 px-4 pb-6">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border p-3">
                                    <p className="text-muted-foreground text-xs">Outcome</p>
                                    <StatusBadge status={v.status} label={meta.label} tone={meta.tone} className="mt-1.5" />
                                </div>
                                <div className="rounded-xl border p-3">
                                    <p className="text-muted-foreground text-xs">Score</p>
                                    <p className={`mt-1 text-lg font-semibold tabular-nums ${scoreClass(v.score)}`}>
                                        {v.score ?? '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl border p-3">
                                    <p className="text-muted-foreground text-xs">Time</p>
                                    <p className="mt-1 text-lg font-semibold tabular-nums">
                                        {v.processing_ms != null ? `${v.processing_ms}ms` : '—'}
                                    </p>
                                </div>
                            </div>

                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                                <dt className="text-muted-foreground">Verdict</dt>
                                <dd>{v.verdict}</dd>
                                {v.sub_status && (
                                    <>
                                        <dt className="text-muted-foreground">Sub-status</dt>
                                        <dd className="font-mono text-xs">{v.sub_status}</dd>
                                    </>
                                )}
                                <dt className="text-muted-foreground">Job state</dt>
                                <dd>{v.job_status}</dd>
                                <dt className="text-muted-foreground">User</dt>
                                <dd className="truncate">
                                    {v.user ? (
                                        <Link to={`/admin/users/${v.user.id}`} className="text-primary hover:underline">
                                            {v.user.email}
                                        </Link>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                                {v.bulk_job_id && (
                                    <>
                                        <dt className="text-muted-foreground">Bulk job</dt>
                                        <dd className="truncate font-mono text-xs">{v.bulk_job_id}</dd>
                                    </>
                                )}
                                <dt className="text-muted-foreground">ID</dt>
                                <dd className="truncate font-mono text-xs">{v.id}</dd>
                            </dl>

                            <Separator />

                            <div>
                                <h3 className="mb-1 text-sm font-medium">Checks</h3>
                                <div className="divide-y">
                                    <Check label="Syntax" data={v.breakdown?.syntax} />
                                    <Check label="DNS / MX" data={v.breakdown?.dns} />
                                    <Check label="SMTP mailbox" data={v.breakdown?.smtp} />
                                    <Check label="Reputation" data={v.breakdown?.reputation} />
                                    <Check label="Role account" data={v.breakdown?.role_based} />
                                </div>
                            </div>

                            {v.warnings.length > 0 && (
                                <div className="space-y-1.5">
                                    <h3 className="text-sm font-medium">Warnings</h3>
                                    {v.warnings.map((w, i) => (
                                        <p key={i} className="flex items-start gap-2 text-sm">
                                            <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
                                            {w}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {v.suggestions.length > 0 && (
                                <div className="space-y-1.5">
                                    <h3 className="text-sm font-medium">Suggestions</h3>
                                    {v.suggestions.map((s, i) => (
                                        <p key={i} className="flex items-start gap-2 text-sm">
                                            <Lightbulb className="text-info mt-0.5 size-4 shrink-0" />
                                            {s}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <details className="rounded-xl border">
                                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Raw result</summary>
                                <pre className="bg-muted/40 max-h-80 overflow-auto px-3 py-2 text-xs">
                                    {JSON.stringify({ breakdown: v.breakdown, metadata: v.metadata }, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
