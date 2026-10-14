import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { EmptyState, ErrorState, useConfirm } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiError, asList } from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { UserTabProps } from './types';

interface Plan {
    id: number;
    name: string;
    price: string;
    credits_per_month: number;
    description?: string;
    features?: string[] | Record<string, unknown>;
    is_active?: boolean;
}

const UserPlanTab: React.FC<UserTabProps> = ({ user, onChanged }) => {
    const confirm = useConfirm();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        axiosInstance
            .get('/admin/plans/')
            .then((res) => setPlans(asList<Plan>(res.data).filter((p) => p.is_active !== false)))
            .catch((e) => setError(apiError(e, 'Could not load plans')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const current = user.billing?.current_plan;

    const change = (plan: Plan) => {
        confirm.ask({
            title: `Move to ${plan.name}?`,
            description: `The balance is replaced with ${formatNumber(plan.credits_per_month)} credits, this month's usage resets to zero and a new cycle starts today. No payment is taken — this is an admin override.`,
            confirmLabel: `Switch to ${plan.name}`,
            onConfirm: async () => {
                try {
                    const res = await axiosInstance.post(`/admin/users/${user.id}/change_plan/`, { plan_id: plan.id });
                    toast.success(res.data?.detail ?? `Plan changed to ${plan.name}`);
                    onChanged();
                } catch (e) {
                    toast.error(apiError(e, 'Could not change the plan'));
                    throw e;
                }
            },
        });
    };

    const features = (p: Plan) =>
        Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === 'string').slice(0, 5) : [];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Current plan</CardTitle>
                    <CardDescription>
                        {current
                            ? `${current.name} · ${formatCurrency(current.price)}/mo · ${formatNumber(
                                  current.credits_per_month
                              )} credits per cycle · since ${formatDate(user.billing?.plan_start_date)}`
                            : 'No plan assigned. Pick one below.'}
                    </CardDescription>
                </CardHeader>
            </Card>

            {error ? (
                <ErrorState description={error} onRetry={load} />
            ) : loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <EmptyState title="No active plans" description="Create a plan under Billing → Plans first." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrent = current?.id === plan.id;
                        return (
                            <Card key={plan.id} className={cn(isCurrent && 'ring-primary ring-2')}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {plan.name}
                                        {isCurrent && <Badge>Current</Badge>}
                                    </CardTitle>
                                    <CardDescription>
                                        {formatCurrency(plan.price)}/mo · {formatNumber(plan.credits_per_month)} credits
                                    </CardDescription>
                                </CardHeader>
                                {(plan.description || features(plan).length > 0) && (
                                    <CardContent className="space-y-2 text-sm">
                                        {plan.description && <p className="text-muted-foreground">{plan.description}</p>}
                                        {features(plan).map((f) => (
                                            <p key={f} className="flex items-start gap-2">
                                                <Check className="text-success mt-0.5 size-4 shrink-0" />
                                                {f}
                                            </p>
                                        ))}
                                    </CardContent>
                                )}
                                <CardFooter className="mt-auto">
                                    <Button
                                        className="w-full"
                                        variant={isCurrent ? 'outline' : 'default'}
                                        disabled={isCurrent || !user.billing}
                                        onClick={() => change(plan)}
                                    >
                                        {isCurrent ? 'Current plan' : 'Switch to this plan'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {confirm.dialog}
        </div>
    );
};

export default UserPlanTab;
