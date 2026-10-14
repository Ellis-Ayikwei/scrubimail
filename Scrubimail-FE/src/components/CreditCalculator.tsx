import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, Sparkles, TrendingDown } from 'lucide-react';
import billingService from '../services/billingService';
import {
  CreditPricingRules,
  CreditQuote,
  creditsForAmount,
  formatMoney,
  formatUnitPrice,
  isQuoteProblem,
  quoteForCredits,
  snapCredits,
} from '../utils/creditPricing';

type InputMode = 'credits' | 'amount';

interface CreditCalculatorProps {
  /** Credits to start from (e.g. carried over from the pricing page). */
  initialCredits?: number;
  /** Label for the action button. */
  ctaLabel?: (quote: CreditQuote, currency: string) => string | undefined;
  /** Called with the credits to buy; the server re-prices them at checkout. */
  onCheckout: (request: { credits: number } | { amount: number }, quote: CreditQuote) => Promise<void> | void;
}

const LABEL =
  "font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] text-gray-500 dark:text-[#bacbbf]";
const INPUT =
  'w-full bg-white border border-gray-200 rounded-sm pl-9 pr-3 py-3 text-gray-900 font-mono text-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none dark:bg-[#101418] dark:border-[#3b4a41]/40 dark:text-[#e0e3e8] dark:focus:border-[#6effc0]/50 dark:focus:ring-[#6effc0]/20';

// The slider spans 1k..millions of credits, so it moves on a log scale.
const SLIDER_STEPS = 1000;
const sliderToCredits = (rules: CreditPricingRules, pos: number) =>
  snapCredits(rules, rules.min_credits * Math.pow(rules.max_credits / rules.min_credits, pos / SLIDER_STEPS));
const creditsToSlider = (rules: CreditPricingRules, credits: number) =>
  Math.round(
    (Math.log(Math.max(credits, rules.min_credits) / rules.min_credits) /
      Math.log(rules.max_credits / rules.min_credits)) *
      SLIDER_STEPS
  );

const CreditCalculator: React.FC<CreditCalculatorProps> = ({ initialCredits, ctaLabel, onCheckout }) => {
  const [rules, setRules] = useState<CreditPricingRules | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<InputMode>('credits');
  const [creditsInput, setCreditsInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    billingService
      .getCreditPricing()
      .then((r) => {
        if (cancelled) return;
        setRules(r);
        const start = initialCredits ? snapCredits(r, initialCredits) : snapCredits(r, Math.max(r.min_credits, 10000));
        setCreditsInput(String(start));
      })
      .catch((e) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
    };
  }, [initialCredits]);

  // Everything below is recomputed on each keystroke — locally, no network.
  const result = useMemo(() => {
    if (!rules) return null;
    if (mode === 'credits') {
      const credits = Number(creditsInput.replace(/[,\s]/g, ''));
      return quoteForCredits(rules, credits);
    }
    const amount = Number(amountInput.replace(/[,\s]/g, ''));
    const credits = creditsForAmount(rules, amount);
    return isQuoteProblem(credits) ? credits : quoteForCredits(rules, credits);
  }, [rules, mode, creditsInput, amountInput]);

  const quote = result && !isQuoteProblem(result) ? result : null;
  const problem = result && isQuoteProblem(result) ? result.error : null;

  if (loadError || (rules && (!rules.is_enabled || rules.error))) {
    return null; // Pay-as-you-go switched off (or misconfigured): packages still work.
  }
  if (!rules) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-[#6effc0]" />
      </div>
    );
  }

  const ccy = rules.currency;
  const switchMode = (next: InputMode) => {
    // Carry the current quote across so toggling never loses the user's place.
    if (quote) {
      if (next === 'amount') setAmountInput(quote.total.toFixed(2));
      else setCreditsInput(String(quote.credits));
    }
    setMode(next);
  };
  const setCredits = (credits: number) => {
    setMode('credits');
    setCreditsInput(String(credits));
  };

  const handleCheckout = async () => {
    if (!quote) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // In amount mode the server re-derives credits from the amount, so the
      // user is never charged more than they typed.
      await onCheckout(
        mode === 'amount' ? { amount: Number(amountInput.replace(/[,\s]/g, '')) } : { credits: quote.credits },
        quote
      );
    } catch (e: any) {
      setSubmitError(e?.message || 'Could not start checkout');
    } finally {
      setSubmitting(false);
    }
  };

  const nudge = quote?.nextTier;
  const cliff = nudge && nudge.total <= quote!.total;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Input side */}
      <div className="lg:col-span-3 bg-white/95 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className={LABEL}>Pay as you go</p>
          <div className="inline-flex bg-gray-100 dark:bg-[#101418] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm p-0.5">
            {(
              [
                ['credits', 'I need credits'],
                ['amount', 'I want to spend'],
              ] as [InputMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`px-3 py-1.5 font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[10px] rounded-sm transition-colors ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-[#262a2f] dark:text-[#6effc0]'
                    : 'text-gray-500 hover:text-gray-800 dark:text-[#bacbbf]/60 dark:hover:text-[#bacbbf]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="credit-calc-input" className={`${LABEL} block mb-2`}>
            {mode === 'credits' ? 'Validations needed' : `Amount to spend (${ccy})`}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-gray-400 dark:text-[#bacbbf]/50">
              {mode === 'credits' ? '#' : '$'}
            </span>
            <input
              id="credit-calc-input"
              inputMode={mode === 'credits' ? 'numeric' : 'decimal'}
              value={mode === 'credits' ? creditsInput : amountInput}
              onChange={(e) => {
                const v = e.target.value.replace(mode === 'credits' ? /[^\d,]/g : /[^\d.,]/g, '');
                if (mode === 'credits') setCreditsInput(v);
                else setAmountInput(v);
              }}
              onBlur={() => {
                // Snap typed credits to a buyable amount once the user is done typing.
                if (mode === 'credits' && rules && creditsInput) {
                  const n = Number(creditsInput.replace(/[,\s]/g, ''));
                  if (Number.isFinite(n) && n > 0) setCreditsInput(String(snapCredits(rules, n)));
                }
              }}
              className={INPUT}
              aria-describedby="credit-calc-hint"
            />
          </div>
          <input
            type="range"
            min={0}
            max={SLIDER_STEPS}
            value={creditsToSlider(rules, quote?.credits ?? rules.min_credits)}
            onChange={(e) => setCredits(sliderToCredits(rules, Number(e.target.value)))}
            className="w-full mt-4 accent-emerald-600 dark:accent-[#6effc0]"
            aria-label="Credits"
          />
          <div className="flex justify-between font-mono text-[10px] text-gray-400 dark:text-[#bacbbf]/50">
            <span>{rules.min_credits.toLocaleString()}</span>
            <span>{rules.max_credits.toLocaleString()}</span>
          </div>
          <p id="credit-calc-hint" className="font-mono text-[10px] text-gray-500 dark:text-[#bacbbf]/60 mt-2">
            {problem ? (
              <span className="text-red-600 dark:text-[#ff4c4c]">{problem}</span>
            ) : (
              <>
                1 credit = 1 email validation · multiples of {rules.credit_step.toLocaleString()} ·{' '}
                {rules.expiry_days ? `credits expire after ${rules.expiry_days} days` : 'credits never expire'}
              </>
            )}
          </p>
        </div>

        {/* Live result */}
        <div className="border-t border-gray-100 dark:border-[#3b4a41]/30 pt-5 grid grid-cols-2 gap-4" aria-live="polite">
          <div>
            <p className={LABEL}>{mode === 'credits' ? 'You pay' : "You'll get"}</p>
            <p className="font-['JetBrains_Mono',monospace] text-3xl font-bold text-gray-900 dark:text-[#e0e3e8] mt-1">
              {quote
                ? mode === 'credits'
                  ? formatMoney(quote.total, ccy)
                  : `${quote.credits.toLocaleString()}`
                : '—'}
            </p>
            <p className="font-mono text-[10px] text-gray-500 dark:text-[#bacbbf]/60 mt-1">
              {quote
                ? mode === 'credits'
                  ? `${quote.credits.toLocaleString()} validations`
                  : `validations for ${formatMoney(quote.total, ccy)}`
                : ' '}
            </p>
          </div>
          <div>
            <p className={LABEL}>Per validation</p>
            <p className="font-['JetBrains_Mono',monospace] text-3xl font-bold text-emerald-700 dark:text-[#6effc0] mt-1">
              {quote ? formatUnitPrice(quote.effectiveUnitPrice, ccy) : '—'}
            </p>
            {quote && quote.savings > 0 && (
              <p className="font-mono text-[10px] text-emerald-700 dark:text-[#6effc0] mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> You save {formatMoney(quote.savings, ccy)} vs base rate
              </p>
            )}
          </div>
        </div>

        {nudge && (
          <button
            type="button"
            onClick={() => setCredits(nudge.credits)}
            className="w-full text-left flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-sm px-3 py-2.5 hover:bg-emerald-100 transition-colors dark:bg-[#6effc0]/5 dark:border-[#6effc0]/20 dark:hover:bg-[#6effc0]/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0] mt-0.5 flex-shrink-0" />
            <span className="font-mono text-[11px] text-emerald-900 dark:text-[#bacbbf]">
              {cliff ? (
                <>
                  <strong>{nudge.credits.toLocaleString()} credits cost {formatMoney(nudge.total, ccy)}</strong> — less than
                  you'd pay now. Switch?
                </>
              ) : (
                <>
                  Add {nudge.creditsNeeded.toLocaleString()} more to drop to{' '}
                  <strong>{formatUnitPrice(nudge.unitPrice, ccy)}</strong>/validation ({nudge.credits.toLocaleString()} for{' '}
                  {formatMoney(nudge.total, ccy)}).
                </>
              )}
            </span>
          </button>
        )}

        <div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!quote || submitting}
            className="w-full bg-emerald-600 text-white font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[11px] font-bold py-3 rounded-sm hover:bg-emerald-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2 dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting checkout…
              </>
            ) : (
              <>
                {quote
                  ? ctaLabel?.(quote, ccy) ??
                    `Buy ${quote.credits.toLocaleString()} credits for ${formatMoney(quote.total, ccy)}`
                  : 'Buy credits'}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          {quote?.chargeEstimate && (
            <p className="font-mono text-[10px] text-gray-500 dark:text-[#bacbbf]/60 mt-2 text-center">
              Charged in {quote.chargeEstimate.currency} at checkout: ≈{' '}
              {formatMoney(quote.chargeEstimate.amount, quote.chargeEstimate.currency)} at today's rate
            </p>
          )}
          {submitError && (
            <p className="font-mono text-xs text-red-600 dark:text-[#ff4c4c] mt-2 text-center">{submitError}</p>
          )}
        </div>
      </div>

      {/* Tier table */}
      <div className="lg:col-span-2 bg-white/95 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#3b4a41]/30">
          <p className={LABEL}>Volume pricing</p>
          <p className="font-mono text-[10px] text-gray-400 dark:text-[#bacbbf]/50 mt-0.5">
            {rules.tiers_mode === 'volume'
              ? 'Your whole purchase gets the rate of the tier it reaches'
              : 'Each band of credits is priced at its own rate'}
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className={`${LABEL} px-4 py-2 font-normal`}>Credits</th>
              <th className={`${LABEL} px-4 py-2 font-normal text-right`}>Per validation</th>
            </tr>
          </thead>
          <tbody>
            {rules.tiers.map((tier, i) => {
              const next = rules.tiers[i + 1];
              if (tier.from > rules.max_credits) return null;
              const active = quote?.tierIndex === i;
              return (
                <tr
                  key={tier.from}
                  onClick={() => setCredits(snapCredits(rules, tier.from))}
                  className={`cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-50 dark:bg-[#6effc0]/10'
                      : 'hover:bg-gray-50 dark:hover:bg-[#262a2f]'
                  }`}
                >
                  <td
                    className={`px-4 py-2 font-mono text-xs ${
                      active ? 'text-emerald-800 font-bold dark:text-[#6effc0]' : 'text-gray-700 dark:text-[#e0e3e8]'
                    }`}
                  >
                    {Math.max(tier.from, rules.min_credits).toLocaleString()}
                    {next ? ` – ${(next.from - 1).toLocaleString()}` : '+'}
                  </td>
                  <td
                    className={`px-4 py-2 font-mono text-xs text-right ${
                      active ? 'text-emerald-800 font-bold dark:text-[#6effc0]' : 'text-gray-700 dark:text-[#e0e3e8]'
                    }`}
                  >
                    {formatUnitPrice(Number(tier.unit_price), ccy)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreditCalculator;
