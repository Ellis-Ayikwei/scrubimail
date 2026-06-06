import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, CheckCircle, AlertCircle, Download, ArrowRight, Loader2, RefreshCw, Clock } from 'lucide-react';
import billingService, {
  BillingProfile,
  UsageStats,
  CreditPackage,
  Invoice,
  TrialStatus,
  ExpiringCreditsInfo
} from '../services/billingService';

interface Plan {
  id: number;
  name: string;
  price: number;
  credits_per_month: number;
  trial_days?: number;
  features?: string[];
  is_active: boolean;
  supports_api: boolean;
  supports_bulk: boolean;
  priority_support: boolean;
}

type ActiveTab = 'overview' | 'packages' | 'invoices';

const CARD =
  'bg-white/95 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm shadow-sm dark:shadow-none';
const CARD_HEADER = 'border-b border-gray-200 dark:border-[#3b4a41]/30';
const CARD_DIVIDE = 'divide-y divide-gray-100 dark:divide-[#3b4a41]/20';
const STAT_GRID_DIVIDE = 'divide-x divide-gray-100 dark:divide-[#3b4a41]/20';
const LABEL = "font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-500 dark:text-[#bacbbf]";
const LABEL_TIGHT = "font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-[#3b4a41]";

const Billing = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [expiringCredits, setExpiringCredits] = useState<ExpiringCreditsInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAllBillingData();
  }, []);

  // Paystack / legacy redirects → dedicated outcome pages; then ?plan= from pricing
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled') ?? searchParams.get('cancelled');
    const failed = searchParams.get('failed');

    if (success === '1') {
      const q = new URLSearchParams();
      const ref = searchParams.get('reference') ?? searchParams.get('trxref');
      if (ref) q.set('reference', ref);
      const trx = searchParams.get('trxref');
      if (trx) q.set('trxref', trx);
      const qs = q.toString();
      const successPath = qs ? `/billing/payment/success?${qs}` : '/billing/payment/success';
      navigate(successPath, { replace: true });
      return;
    }
    if (canceled === '1') {
      navigate(`/billing/payment/cancelled?${searchParams.toString()}`, { replace: true });
      return;
    }
    if (failed === '1') {
      navigate(`/billing/payment/failed?${searchParams.toString()}`, { replace: true });
      return;
    }

    const planParam = searchParams.get('plan');
    if (planParam) {
      setPendingPlanId(Number(planParam));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, navigate, setSearchParams]);

  const fetchAllBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, plansRes, usageRes, packagesRes, invoicesRes] = await Promise.all([
        billingService.getBillingProfile(),
        billingService.getPlans(),
        billingService.getUsageStats(),
        billingService.getCreditPackages(),
        billingService.getInvoices({ page_size: 5 })
      ]);

      setBillingProfile(profileRes);
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes as any).results || []);
      setUsageStats(usageRes);
      setCreditPackages(Array.isArray(packagesRes) ? packagesRes : []);
      setInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);

      // Fetch optional data (non-blocking)
      billingService.getTrialStatus().then(setTrialStatus).catch(() => {});
      billingService.getExpiringCredits(14).then(setExpiringCredits).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to fetch billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async (planId: number) => {
    const targetPlan = plans.find((p) => p.id === planId);
    setActivatingPlan(true);
    setError(null);
    setPlanSuccess(null);
    try {
      const trialDays = targetPlan?.trial_days ?? 0;
      const onTrial = trialStatus?.is_trial || trialStatus?.is_trial_active;
      const trialEligible =
        trialDays > 0 &&
        trialStatus &&
        !trialStatus.trial_converted &&
        !onTrial;

      if (trialEligible) {
        try {
          await billingService.startTrial(planId);
          setPlanSuccess(`Trial started for ${targetPlan?.name ?? 'plan'}.`);
          setPendingPlanId(null);
          await fetchAllBillingData();
          return;
        } catch (trialErr: any) {
          const msg = (trialErr?.message || '').toLowerCase();
          const canFallBackToCheckout =
            msg.includes('trial') ||
            msg.includes('does not offer') ||
            msg.includes('plan not') ||
            msg.includes('already');
          if (!canFallBackToCheckout) {
            setError(trialErr?.message || 'Failed to start trial');
            return;
          }
        }
      }

      const result = await billingService.upgradePlan(planId);
      const checkoutUrl =
        result?.authorization_url ||
        (result as { authorizationUrl?: string })?.authorizationUrl;
      if (checkoutUrl) {
        globalThis.location.assign(checkoutUrl);
        return;
      }

      if (result?.subscription_pending || result?.subscriptionPending) {
        setError('Checkout could not be started: missing payment link from server.');
        return;
      }

      setPlanSuccess('Plan updated.');
      setPendingPlanId(null);
      await fetchAllBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate plan');
    } finally {
      setActivatingPlan(false);
    }
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    setPromoResult(null);
    try {
      const result = await billingService.validatePromoCode(promoCode.trim());
      setPromoResult({ valid: true, message: result.message || 'Promo code is valid!' });
    } catch (err: any) {
      setPromoResult({ valid: false, message: err.message || 'Invalid promo code' });
    } finally {
      setPromoValidating(false);
    }
  };

  const handlePurchasePackage = async (pkg: CreditPackage) => {
    setPurchasingPackage(pkg.id);
    try {
      const result = await billingService.purchaseCreditPackage(
        pkg.id,
        promoResult?.valid ? promoCode : undefined
      );
      const payUrl = result.authorization_url || result.payment_url;
      if (payUrl) {
        globalThis.location.href = payUrl;
      } else {
        await fetchAllBillingData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate purchase');
    } finally {
      setPurchasingPackage(null);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const blob = await billingService.downloadInvoicePDF(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 border border-gray-200 rounded-sm animate-pulse dark:bg-[#1c2024] dark:border-[#3b4a41]/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-600 dark:text-[#6effc0] mb-0.5">
            Account
          </p>
          <h1 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight">
            Billing & Credits
          </h1>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-600 dark:text-[#bacbbf] mt-0.5">
            Manage your subscription, credits, and payment history
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAllBillingData}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 rounded-sm hover:border-emerald-400 hover:text-emerald-700 transition-colors dark:border-[#3b4a41]/40 dark:text-[#bacbbf] dark:hover:border-[#6effc0]/40 dark:hover:text-[#6effc0]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 flex items-center gap-2 text-red-700 font-mono text-xs dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c]">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Plan activation banner */}
      {pendingPlanId &&
        (() => {
          const targetPlan = plans.find((p) => p.id === pendingPlanId);
          if (!targetPlan) return null;
          const onTrial = trialStatus?.is_trial || trialStatus?.is_trial_active;
          const trialEligible =
            (targetPlan.trial_days ?? 0) > 0 &&
            trialStatus &&
            !trialStatus.trial_converted &&
            !onTrial;
          const primaryCta = trialEligible ? 'Start free trial' : 'Continue to checkout';
          return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex items-center justify-between flex-wrap gap-3 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/30">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0 dark:text-[#6effc0]" />
                <div>
                  <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-emerald-800 font-bold dark:text-[#6effc0]">
                    {trialEligible ? 'Start trial' : 'Upgrade plan'}
                  </p>
                  <p className="font-mono text-xs text-gray-600 mt-0.5 dark:text-[#bacbbf]/60">
                    {trialEligible ? (
                      <>
                        Free trial of <strong className="text-gray-900 dark:text-[#e0e3e8]">{targetPlan.name}</strong>{' '}
                        — {targetPlan.credits_per_month.toLocaleString()} validations/mo
                      </>
                    ) : (
                      <>
                        <strong className="text-gray-900 dark:text-[#e0e3e8]">{targetPlan.name}</strong>
                        {targetPlan.price > 0
                          ? ` — $${targetPlan.price}/mo, ${targetPlan.credits_per_month.toLocaleString()} validations/mo. You will be redirected to secure payment.`
                          : ` — ${targetPlan.credits_per_month.toLocaleString()} validations/mo.`}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingPlanId(null)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-500 font-mono text-[9px] uppercase tracking-[0.1em] rounded-sm hover:text-gray-800 transition-colors dark:border-[#3b4a41]/40 dark:text-[#bacbbf]/50 dark:hover:text-[#bacbbf]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleActivatePlan(pendingPlanId)}
                  disabled={activatingPlan}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white font-mono text-[9px] uppercase tracking-[0.15em] font-bold rounded-sm hover:bg-emerald-600 disabled:opacity-40 transition-all dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105"
                >
                  {activatingPlan ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Please wait…
                    </>
                  ) : (
                    primaryCta
                  )}
                </button>
              </div>
            </div>
          );
        })()}

      {planSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 flex items-center gap-2 font-mono text-xs text-emerald-800 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/30 dark:text-[#6effc0]">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {planSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#3b4a41]/30">
        <div className="flex gap-0">
          {(['overview', 'packages', 'invoices'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-700 dark:border-[#6effc0] dark:text-[#6effc0]'
                  : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-[#bacbbf]/50 dark:hover:text-[#bacbbf]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Credits + Plan row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Credits card */}
            <div className={`${CARD} p-5`}>
              <p className={`${LABEL} mb-2`}>Credits Remaining</p>
              <p className="font-['JetBrains_Mono',monospace] text-4xl font-bold text-gray-900 dark:text-[#e0e3e8] mb-1">
                {(billingProfile?.credits_remaining ?? 0).toLocaleString()}
              </p>
              <p className="font-mono text-[10px] text-gray-400 mb-3 dark:text-[#3b4a41]">
                of{' '}
                {((billingProfile?.credits_remaining ?? 0) + (billingProfile?.credits_used_this_month ?? 0)).toLocaleString()}{' '}
                total
              </p>
              {(() => {
                const used = billingProfile?.credits_used_this_month ?? 0;
                const total = (billingProfile?.credits_remaining ?? 0) + used;
                const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                return (
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-[#101418]">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all dark:bg-[#6effc0]"
                      style={{ width: `${100 - pct}%` }}
                    />
                  </div>
                );
              })()}
            </div>
            {/* Current plan */}
            <div className={`${CARD} p-5`}>
              <p className={`${LABEL} mb-2`}>Current Plan</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight">
                  {billingProfile?.current_plan?.name ?? 'Free'}
                </span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono uppercase tracking-[0.08em] text-[9px] px-2 py-0.5 rounded-sm dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0]">
                  Active
                </span>
              </div>
              <p className="font-['JetBrains_Mono',monospace] text-2xl font-bold text-emerald-700 mb-1 dark:text-[#6effc0]">
                ${billingProfile?.current_plan?.price ?? '0'}
                <span className="text-gray-400 text-sm font-normal dark:text-[#3b4a41]">/mo</span>
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-700 hover:underline mt-1 dark:text-[#6effc0]"
              >
                <ArrowRight className="w-3 h-3" /> Upgrade Plan
              </Link>
            </div>
          </div>

          {/* Usage stats */}
          <div className={CARD}>
            <div className={`px-4 py-3 ${CARD_HEADER}`}>
              <p className={LABEL}>Usage Statistics</p>
            </div>
            <div className={`grid grid-cols-2 md:grid-cols-4 ${STAT_GRID_DIVIDE}`}>
              {[
                { label: 'This Month', value: (usageStats?.this_month?.validations ?? 0).toLocaleString() },
                { label: 'Last Month', value: (usageStats?.last_month?.validations ?? 0).toLocaleString() },
                { label: 'Credits Used', value: (billingProfile?.credits_used_this_month ?? 0).toLocaleString() },
                { label: 'API Calls', value: (usageStats?.this_month?.api_calls ?? 0).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="p-4">
                  <p className={`${LABEL_TIGHT} mb-1`}>{label}</p>
                  <p className="font-['JetBrains_Mono',monospace] text-xl font-bold text-gray-900 dark:text-[#e0e3e8]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Trial status */}
          {(trialStatus?.is_trial_active ||
            trialStatus?.is_trial ||
            trialStatus?.is_active) && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-center gap-3 dark:bg-[#f59e0b]/10 dark:border-[#f59e0b]/20">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 dark:text-[#f59e0b]" />
              <div>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-amber-800 font-bold dark:text-[#f59e0b]">
                  Trial Active
                </p>
                <p className="font-mono text-xs text-gray-600 mt-0.5 dark:text-[#bacbbf]/60">
                  {(trialStatus.days_left ?? trialStatus.days_remaining ?? 0) === 1
                    ? '1 day remaining in your trial period'
                    : `${trialStatus.days_left ?? trialStatus.days_remaining ?? 0} days remaining in your trial period`}
                </p>
              </div>
            </div>
          )}

          {/* Expiring credits */}
          {expiringCredits.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center gap-3 dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/20">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 dark:text-[#ff4c4c]" />
              <div>
                <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-red-800 font-bold dark:text-[#ff4c4c]">
                  Credits Expiring Soon
                </p>
                {expiringCredits.map((ec) => (
                  <p
                    key={`${ec.expiry_date}-${ec.credits}`}
                    className="font-mono text-xs text-gray-600 mt-0.5 dark:text-[#bacbbf]/60"
                  >
                    {(ec.credits ?? ec.credits_expiring ?? 0).toLocaleString()} credits expire on{' '}
                    {new Date(ec.expiry_date).toLocaleDateString()}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Active plans */}
          {plans.length > 0 && (
            <div className={CARD}>
              <div className={`px-4 py-3 ${CARD_HEADER} flex items-center justify-between`}>
                <p className={LABEL}>Available Plans</p>
                <button
                  type="button"
                  onClick={() => setShowAllPlans(!showAllPlans)}
                  className="font-mono text-[9px] text-emerald-700 uppercase tracking-[0.1em] hover:underline dark:text-[#6effc0]"
                >
                  {showAllPlans ? 'Show less' : 'Show all'}
                </button>
              </div>
              <div className={CARD_DIVIDE}>
                {(showAllPlans ? plans : plans.slice(0, 3)).map((plan) => {
                  const isCurrent = billingProfile?.current_plan?.id === plan.id;
                  return (
                    <div key={plan.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center justify-center text-emerald-700 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/20 dark:text-[#6effc0]">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.08em] text-[11px] text-gray-900 font-semibold dark:text-[#e0e3e8]">
                            {plan.name}
                          </p>
                          <p className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41]">
                            {plan.credits_per_month?.toLocaleString() ?? 0} credits/mo
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-['JetBrains_Mono',monospace] text-lg font-bold text-gray-900 dark:text-[#e0e3e8]">
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                        </span>
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => {
                            if (!isCurrent) setPendingPlanId(plan.id);
                          }}
                          className="bg-emerald-500 text-white font-mono uppercase tracking-[0.1em] text-[9px] font-bold px-3 py-1.5 rounded-sm hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105"
                        >
                          {isCurrent ? 'Current' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {/* Promo code */}
          <div className={`${CARD} p-5`}>
            <p className={`${LABEL} mb-3`}>Promo Code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="ENTER_CODE"
                className="flex-1 bg-white border border-gray-200 rounded-sm px-3 py-2 text-gray-900 font-mono text-sm uppercase tracking-[0.1em] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none placeholder-gray-400 dark:bg-[#101418] dark:border-[#3b4a41]/40 dark:text-[#e0e3e8] dark:placeholder-[#3b4a41] dark:focus:border-[#6effc0]/50 dark:focus:ring-[#6effc0]/20"
              />
              <button
                type="button"
                onClick={handleValidatePromo}
                disabled={promoValidating || !promoCode.trim()}
                className="bg-emerald-500 text-white font-mono uppercase tracking-[0.1em] text-[10px] font-bold px-4 py-2 rounded-sm hover:bg-emerald-600 transition-all disabled:opacity-40 flex items-center gap-1.5 dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105"
              >
                {promoValidating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking
                  </>
                ) : (
                  'Validate'
                )}
              </button>
            </div>
            {promoResult && (
              <p
                className={`font-mono text-xs mt-2 ${
                  promoResult.valid ? 'text-emerald-700 dark:text-[#6effc0]' : 'text-red-600 dark:text-[#ff4c4c]'
                }`}
              >
                {promoResult.message}
              </p>
            )}
          </div>

          {creditPackages.length === 0 && (
            <div className="text-center py-12">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-[0.2em] dark:text-[#3b4a41]">
                No credit packages available
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {creditPackages.map((pkg) => (
              <div key={pkg.id} className={`${CARD} p-5 flex flex-col gap-4`}>
                <div>
                  <p className={`${LABEL} mb-1`}>{pkg.name}</p>
                  <p className="font-['JetBrains_Mono',monospace] text-3xl font-bold text-gray-900 dark:text-[#e0e3e8]">
                    ${pkg.price}
                  </p>
                  <p className="font-mono text-[10px] text-emerald-700 mt-0.5 dark:text-[#6effc0]">
                    {pkg.credits?.toLocaleString()} credits
                  </p>
                </div>
                {pkg.description && (
                  <p className="font-mono text-[10px] text-gray-500 leading-relaxed dark:text-[#bacbbf]/60">
                    {pkg.description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handlePurchasePackage(pkg)}
                  disabled={purchasingPackage === pkg.id}
                  className="mt-auto w-full bg-emerald-500 text-white font-mono uppercase tracking-[0.1em] text-[10px] font-bold py-2.5 rounded-sm hover:bg-emerald-600 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105"
                >
                  {purchasingPackage === pkg.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Purchase'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className={`${CARD} overflow-hidden`}>
          <div className={`px-4 py-3 ${CARD_HEADER}`}>
            <p className={LABEL}>Invoice History</p>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-[0.2em] dark:text-[#3b4a41]">No invoices yet</p>
            </div>
          ) : (
            <div className={CARD_DIVIDE}>
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors dark:hover:bg-[#262a2f]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-gray-900 dark:text-[#e0e3e8]">{invoice.invoice_number}</p>
                    <p className="font-mono text-[9px] text-gray-400 mt-0.5 dark:text-[#3b4a41]">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-gray-900 dark:text-[#e0e3e8]">
                    ${invoice.total_amount ?? invoice.amount ?? '0'}
                  </span>
                  <span
                    className={`font-mono uppercase tracking-[0.08em] text-[9px] px-2 py-0.5 rounded-sm border flex-shrink-0 ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:border-[#6effc0]/20'
                        : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-[#f59e0b]/10 dark:text-[#f59e0b] dark:border-[#f59e0b]/20'
                    }`}
                  >
                    {invoice.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-gray-100 rounded-sm transition-colors dark:text-[#3b4a41] dark:hover:text-[#6effc0] dark:hover:bg-[#1c2024]"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Billing;
