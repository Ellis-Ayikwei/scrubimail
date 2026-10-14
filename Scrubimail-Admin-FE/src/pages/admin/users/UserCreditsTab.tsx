import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { DataTable, type DataTableColumn, StatCard, StatCardGrid, StatusBadge, useConfirm } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiError, asList } from '@/lib/api';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { UserTabProps } from './types';

interface Transaction {
    id: string;
    amount: number;
    transaction_type: string;
    description?: string;
    created_at: string;
    paystack_payment_reference?: string | null;
}

const TX_LABEL: Record<string, string> = {
    purchase: 'Purchase',
    usage: 'Usage',
    refund: 'Refund',
    bonus: 'Bonus',
    expired: 'Expired',
    plan_credits: 'Plan credits',
    grant: 'Admin grant',
    deduction: 'Admin deduction',
    auto_reset: 'Monthly reset',
    manual_reset: 'Manual reset',
};

const TX_TONE: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'neutral'> = {
    purchase: 'success',
    grant: 'success',
    bonus: 'success',
    plan_credits: 'success',
    refund: 'info',
    usage: 'neutral',
    deduction: 'danger',
    expired: 'danger',
    auto_reset: 'warning',
    manual_reset: 'warning',
};

const UserCreditsTab: React.FC<UserTabProps> = ({ user, onChanged }) => {
    const confirm = useConfirm();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'add' | 'deduct'>('add');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get('/admin/billing/', { params: { user_id: user.id, limit: 1000 } });
            setTransactions(asList<Transaction>(res.data));
        } catch (e) {
            setTransactions([]);
            setError(apiError(e, 'Could not load the credit history'));
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        void fetchTransactions();
    }, [fetchTransactions]);

    const credits = user.billing?.credits_remaining ?? 0;
    const n = Number.parseInt(amount, 10);
    const validAmount = Number.isFinite(n) && n > 0;
    const overdraw = mode === 'deduct' && validAmount && n > credits;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validAmount || overdraw) return;
        const signed = mode === 'add' ? n : -n;
        confirm.ask({
            title: `${mode === 'add' ? 'Add' : 'Deduct'} ${formatNumber(n)} credits?`,
            description: `Balance goes from ${formatNumber(credits)} to ${formatNumber(credits + signed)}. This is recorded in the user's credit history.`,
            confirmLabel: mode === 'add' ? 'Add credits' : 'Deduct credits',
            destructive: mode === 'deduct',
            onConfirm: async () => {
                setSubmitting(true);
                try {
                    const res = await axiosInstance.post('/admin/billing/adjust/', {
                        user_id: user.id,
                        amount: signed,
                        reason: reason.trim() || (mode === 'add' ? 'Admin credit grant' : 'Admin credit deduction'),
                    });
                    toast.success(res.data?.detail ?? 'Credits updated');
                    setAmount('');
                    setReason('');
                    void fetchTransactions();
                    onChanged();
                } catch (err) {
                    toast.error(apiError(err, 'Could not adjust credits'));
                    throw err;
                } finally {
                    setSubmitting(false);
                }
            },
        });
    };

    const resetCycle = () => {
        const plan = user.billing?.current_plan;
        if (!plan) {
            toast.error('Assign a plan first — the reset refills to the plan allowance.');
            return;
        }
        confirm.ask({
            title: 'Reset the billing cycle?',
            description: `Sets the balance to ${formatNumber(plan.credits_per_month)} credits (the ${plan.name} allowance), zeroes this month's usage and starts a new cycle today. Any credits above the allowance are lost.`,
            confirmLabel: 'Reset cycle',
            destructive: true,
            onConfirm: async () => {
                try {
                    const res = await axiosInstance.post(`/admin/users/${user.id}/reset-billing/`);
                    toast.success(res.data?.detail ?? 'Billing cycle reset');
                    void fetchTransactions();
                    onChanged();
                } catch (err) {
                    toast.error(apiError(err, 'Could not reset the billing cycle'));
                    throw err;
                }
            },
        });
    };

    const columns = useMemo<DataTableColumn<Transaction>[]>(
        () => [
            {
                id: 'type',
                header: 'Type',
                sortValue: (t) => t.transaction_type,
                cell: (t) => (
                    <StatusBadge
                        status={t.transaction_type}
                        label={TX_LABEL[t.transaction_type] ?? t.transaction_type}
                        tone={TX_TONE[t.transaction_type] ?? 'neutral'}
                    />
                ),
            },
            {
                id: 'amount',
                header: 'Credits',
                sortValue: (t) => t.amount,
                className: 'tabular-nums',
                cell: (t) => (
                    <span className={cn('font-medium', t.amount > 0 ? 'text-success' : t.amount < 0 && 'text-destructive')}>
                        {t.amount > 0 ? '+' : ''}
                        {formatNumber(t.amount)}
                    </span>
                ),
            },
            {
                id: 'description',
                header: 'Description',
                cell: (t) => (
                    <div className="max-w-90 min-w-0">
                        <p className="truncate">{t.description || '—'}</p>
                        {t.paystack_payment_reference && (
                            <p className="text-muted-foreground truncate font-mono text-xs">{t.paystack_payment_reference}</p>
                        )}
                    </div>
                ),
            },
            {
                id: 'date',
                header: 'Date',
                sortValue: (t) => t.created_at,
                cell: (t) => (
                    <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(t.created_at)}>
                        {formatDate(t.created_at)}
                    </span>
                ),
            },
        ],
        []
    );

    if (!user.billing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No billing profile</CardTitle>
                    <CardDescription>
                        This user has no billing profile, so credits can't be adjusted. One is created on sign-up; assigning
                        a plan from the Plan tab will not create it either — check the account was provisioned correctly.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <StatCardGrid className="lg:grid-cols-3">
                <StatCard label="Balance" value={formatNumber(credits)} hint="Credits available now" />
                <StatCard
                    label="Used this cycle"
                    value={formatNumber(user.billing.credits_used_this_month ?? 0)}
                    hint={
                        user.billing.current_plan
                            ? `of ${formatNumber(user.billing.current_plan.credits_per_month)} plan credits`
                            : undefined
                    }
                />
                <StatCard
                    label="Cycle started"
                    value={formatDate(user.billing.credits_reset_date)}
                    hint={user.billing.current_plan?.name ?? 'No plan'}
                />
            </StatCardGrid>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Adjust credits</CardTitle>
                        <CardDescription>Grant goodwill credits or claw back an over-allocation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit}>
                            <FieldGroup>
                                <Tabs value={mode} onValueChange={(v) => setMode(v as 'add' | 'deduct')}>
                                    <TabsList className="w-full">
                                        <TabsTrigger value="add" className="flex-1">
                                            <Plus />
                                            Add
                                        </TabsTrigger>
                                        <TabsTrigger value="deduct" className="flex-1">
                                            <Minus />
                                            Deduct
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Field data-invalid={overdraw || undefined}>
                                    <FieldLabel htmlFor="credit-amount">Amount</FieldLabel>
                                    <Input
                                        id="credit-amount"
                                        type="number"
                                        min={1}
                                        step={1}
                                        inputMode="numeric"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        aria-invalid={overdraw || undefined}
                                        placeholder="e.g. 500"
                                    />
                                    <FieldDescription>
                                        {overdraw
                                            ? `Can't deduct more than the ${formatNumber(credits)} available.`
                                            : validAmount
                                              ? `New balance: ${formatNumber(credits + (mode === 'add' ? n : -n))}`
                                              : `Current balance: ${formatNumber(credits)}`}
                                    </FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="credit-reason">Reason</FieldLabel>
                                    <Input
                                        id="credit-reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Shown in the user's history"
                                        maxLength={200}
                                    />
                                </Field>
                                <Button
                                    type="submit"
                                    variant={mode === 'deduct' ? 'destructive' : 'default'}
                                    disabled={!validAmount || overdraw || submitting}
                                >
                                    {mode === 'add' ? 'Add credits' : 'Deduct credits'}
                                </Button>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing cycle</CardTitle>
                            <CardDescription>
                                Refill to the plan allowance and start a fresh cycle today — for when a monthly reset was
                                missed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" onClick={resetCycle}>
                                <RotateCcw />
                                Reset billing cycle
                            </Button>
                        </CardContent>
                    </Card>

                    <div>
                        <h3 className="mb-3 text-sm font-medium">Credit history</h3>
                        <DataTable
                            data={transactions}
                            columns={columns}
                            rowKey={(t) => t.id}
                            loading={loading}
                            error={error}
                            onRetry={() => void fetchTransactions()}
                            pageSize={15}
                            searchFilter={(t, q) =>
                                (t.description ?? '').toLowerCase().includes(q) ||
                                (TX_LABEL[t.transaction_type] ?? t.transaction_type).toLowerCase().includes(q) ||
                                (t.paystack_payment_reference ?? '').toLowerCase().includes(q)
                            }
                            searchPlaceholder="Search history…"
                            emptyTitle="No transactions"
                            emptyDescription="Credit grants, purchases and resets will show here."
                        />
                    </div>
                </div>
            </div>

            {confirm.dialog}
        </div>
    );
};

export default UserCreditsTab;
