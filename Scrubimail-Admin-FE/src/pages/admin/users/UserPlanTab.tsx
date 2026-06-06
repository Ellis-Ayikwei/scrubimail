import React, { useState, useEffect } from 'react';
import { Check, Zap, RefreshCw } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import type { AdminUser } from './index';
import { UCARD, ULABEL, UHEADER, UBORDER_B, USKELETON, UMINT, UERR, UOK } from './userTheme';

interface Plan {
  id: number;
  name: string;
  price: string;
  yearly_price?: string;
  credits_per_month: number;
  description?: string;
  features?: string[];
}

interface Props {
  userId: string;
  user: AdminUser;
  onRefresh: () => void;
}

const UserPlanTab: React.FC<Props> = ({ userId, user, onRefresh }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/plans/')
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : res.data?.results ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePlan = async (plan: Plan) => {
    setChanging(plan.id);
    setError(null);
    setSuccess(null);
    try {
      await axiosInstance.post(`/admin/users/${userId}/change_plan/`, { plan_id: plan.id });
      setSuccess(`Plan changed to ${plan.name}`);
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to change plan');
    } finally {
      setChanging(null);
    }
  };

  const currentPlan = user.billing?.current_plan;

  return (
    <div className="space-y-5">
      {error && <div className={`rounded-sm p-3 font-mono text-xs ${UERR}`}>{error}</div>}
      {success && <div className={`rounded-sm p-3 font-mono text-xs ${UOK}`}>{success}</div>}

      {currentPlan && (
        <div className={UCARD}>
          <div className={`px-4 py-3 ${UBORDER_B}`}>
            <p className={UHEADER}>Current Plan</p>
          </div>
          <div className="p-4 flex flex-wrap gap-6">
            <div>
              <p className={`${ULABEL} mb-1`}>Plan Name</p>
              <p className={`font-['JetBrains_Mono',monospace] text-lg font-bold ${UMINT}`}>{currentPlan.name}</p>
            </div>
            <div>
              <p className={`${ULABEL} mb-1`}>Monthly Price</p>
              <p className="font-mono text-lg font-bold text-gray-900 dark:text-[#e0e3e8]">${currentPlan.price}</p>
            </div>
            <div>
              <p className={`${ULABEL} mb-1`}>Credits / Month</p>
              <p className="font-mono text-lg font-bold text-gray-900 dark:text-[#e0e3e8]">
                {currentPlan.credits_per_month.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={UCARD}>
        <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
          <p className={UHEADER}>Available Plans</p>
          {loading && <RefreshCw className={`w-3.5 h-3.5 ${UMINT} animate-spin`} />}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-20 ${USKELETON} rounded animate-pulse`} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">No plans available</p>
          </div>
        ) : (
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative border rounded-sm p-4 transition-all ${
                    isCurrent
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-[#6effc0]/40 dark:bg-[#6effc0]/5'
                      : 'border-gray-200 bg-gray-50 dark:border-[#3b4a41]/40 dark:bg-[#101418] hover:border-gray-300 dark:hover:border-[#3b4a41]/70'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-2 right-2 font-mono text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-[#6effc0]/15 dark:text-[#6effc0] dark:border-[#6effc0]/20 rounded-sm uppercase tracking-[0.1em]">
                      Current
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Zap className={`w-3.5 h-3.5 ${isCurrent ? UMINT : 'text-gray-400 dark:text-[#3b4a41]'}`} />
                    <p
                      className={`font-['Space_Grotesk',sans-serif] font-bold text-sm ${
                        isCurrent ? UMINT : 'text-gray-900 dark:text-[#e0e3e8]'
                      }`}
                    >
                      {plan.name}
                    </p>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between">
                      <span className={ULABEL}>Price</span>
                      <span className="font-mono text-[11px] text-gray-900 dark:text-[#e0e3e8]">${plan.price}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={ULABEL}>Credits</span>
                      <span className="font-mono text-[11px] text-gray-600 dark:text-[#bacbbf]">
                        {plan.credits_per_month.toLocaleString()}
                      </span>
                    </div>
                    {plan.yearly_price && (
                      <div className="flex justify-between">
                        <span className={ULABEL}>Yearly</span>
                        <span className="font-mono text-[11px] text-gray-600 dark:text-[#bacbbf]">${plan.yearly_price}/yr</span>
                      </div>
                    )}
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className={`w-2.5 h-2.5 shrink-0 ${UMINT}`} />
                          <span className="font-mono text-[9px] text-gray-600 dark:text-[#bacbbf]/70">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleChangePlan(plan)}
                      disabled={changing !== null}
                      className="w-full py-2 font-mono text-[9px] uppercase tracking-[0.12em] border border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-[#3b4a41]/60 dark:text-[#bacbbf] dark:hover:border-[#6effc0]/40 dark:hover:text-[#6effc0] rounded-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {changing === plan.id ? 'Changing…' : 'Switch to this plan'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPlanTab;
