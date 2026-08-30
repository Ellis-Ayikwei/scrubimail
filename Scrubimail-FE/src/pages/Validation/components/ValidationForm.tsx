import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, Mail, Play, RefreshCw, Upload, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { VAL_CARD, VAL_CHROME, VAL_CHROME_TITLE, VAL_INSET, VAL_LABEL } from './validationTheme';

interface ValidationFormProps {
    validationMode: 'single' | 'bulk';
    email: string;
    setEmail: (email: string) => void;
    bulkFile: File | null;
    setBulkFile: (file: File | null) => void;
    includeDetails: boolean;
    setIncludeDetails: (include: boolean) => void;
    loading: boolean;
    handleSingleValidate: (e: React.FormEvent) => void;
    handleBulkUpload: (e: React.FormEvent) => void;
    bulkTaskIds: string[];
    bulkStatus: any[];
    checkBulkStatus: () => void;
}

const STATUS_META: Record<string, { icon: typeof CheckCircle2; className: string }> = {
    completed: { icon: CheckCircle2, className: 'text-success' },
    failed: { icon: XCircle, className: 'text-destructive' },
    pending: { icon: Clock, className: 'text-warning' },
};

function StatusIcon({ status }: { status: string }) {
    const meta = STATUS_META[status];
    const Icon = meta?.icon ?? AlertTriangle;
    return <Icon className={cn('size-3.5', meta?.className ?? 'text-muted-foreground')} />;
}

/** The shared "include detailed breakdown" toggle, identical in both modes. */
function DetailsToggle({
    id,
    checked,
    onCheckedChange,
}: {
    id: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
            <Label htmlFor={id} className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
                Include detailed breakdown
            </Label>
        </div>
    );
}

const ValidationForm: React.FC<ValidationFormProps> = ({
    validationMode,
    email,
    setEmail,
    bulkFile,
    setBulkFile,
    includeDetails,
    setIncludeDetails,
    loading,
    handleSingleValidate,
    handleBulkUpload,
    bulkTaskIds,
    bulkStatus,
    checkBulkStatus,
}) => {
    return (
        <div className={VAL_CARD}>
            {/* Terminal chrome bar */}
            <div className={VAL_CHROME}>
                <span className="bg-destructive/60 size-2 rounded-full" />
                <span className="bg-warning/60 size-2 rounded-full" />
                <span className="bg-success/60 size-2 rounded-full" />
                <span className={VAL_CHROME_TITLE}>
                    {validationMode === 'single' ? 'single_email_probe.sh' : 'bulk_upload_job.sh'}
                </span>
            </div>

            <div className="p-5">
                {validationMode === 'single' ? (
                    <form onSubmit={handleSingleValidate} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="target-address" className={VAL_LABEL}>
                                Target Address
                            </Label>
                            <div className="relative">
                                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                                <Input
                                    id="target-address"
                                    type="email"
                                    placeholder="user@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <DetailsToggle
                            id="single-details"
                            checked={includeDetails}
                            onCheckedChange={setIncludeDetails}
                        />

                        <Button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" /> Probing…
                                </>
                            ) : (
                                <>
                                    <Play /> Run Validation
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleBulkUpload} className="space-y-4">
                        <div className="space-y-1.5">
                            <span className={cn('block', VAL_LABEL)}>Upload File (CSV or JSON)</span>
                            <label
                                htmlFor="bulk-file"
                                className="hover:border-success/50 hover:bg-success/5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 transition-colors"
                            >
                                <Upload className="text-muted-foreground size-5" />
                                <span className="text-muted-foreground text-center font-mono text-[10px]">
                                    {bulkFile ? (
                                        <span className="text-success">{bulkFile.name}</span>
                                    ) : (
                                        <>
                                            Click to upload
                                            <br />
                                            <span className="text-[9px] opacity-70">CSV or JSON · max 10 MB</span>
                                        </>
                                    )}
                                </span>
                                <input
                                    id="bulk-file"
                                    type="file"
                                    accept=".csv,application/json"
                                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <DetailsToggle id="bulk-details" checked={includeDetails} onCheckedChange={setIncludeDetails} />

                        <Button
                            type="submit"
                            disabled={loading || !bulkFile}
                            className="w-full font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" /> Uploading…
                                </>
                            ) : (
                                <>
                                    <Upload /> Upload &amp; Validate
                                </>
                            )}
                        </Button>
                    </form>
                )}

                {/* Bulk job status */}
                {bulkTaskIds.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className={VAL_LABEL}>Bulk Jobs</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={checkBulkStatus}
                                className="text-success font-mono text-[9px] tracking-[0.1em] uppercase"
                            >
                                <RefreshCw /> Refresh
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {bulkStatus.map((status) => (
                                <div
                                    key={String(status.job_id ?? status.task_id ?? status.id)}
                                    className={cn('flex items-center justify-between p-2.5', VAL_INSET)}
                                >
                                    <div className="flex items-center gap-2">
                                        <StatusIcon status={status.status} />
                                        <span className="font-mono text-[10px]">Job {status.job_id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'font-mono text-[9px] tracking-[0.1em] uppercase',
                                                STATUS_META[status.status]?.className ?? 'text-muted-foreground'
                                            )}
                                        >
                                            {status.status}
                                        </span>
                                        <span className="text-muted-foreground font-mono text-[9px]">
                                            {status.progress || 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValidationForm;
