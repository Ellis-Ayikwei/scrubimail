/**
 * Client-side mirror of ScrubiMail-BE/apps/billing/credit_pricing.py (also copied in
 * Scrubimail-FE/src/utils/creditPricing.ts).
 *
 * Used for instant calculator feedback only — checkout always re-quotes on the
 * server, which is what the user is charged. Keep the two in step.
 *
 * Money is computed in integer micro-units (1e-6) so totals round exactly like
 * Python's Decimal ROUND_HALF_UP (unit prices allow at most 6 decimals).
 */

export interface CreditPricingTier {
  from: number;
  unit_price: string;
}

export interface CreditPricingRules {
  is_enabled: boolean;
  currency: string;
  tiers_mode: 'volume' | 'graduated';
  tiers: CreditPricingTier[];
  min_credits: number;
  max_credits: number;
  credit_step: number;
  expiry_days: number | null;
  min_total?: string;
  charge_currency?: string | null;
  charge_rate?: string | null;
  error?: string;
}

export interface CreditQuote {
  credits: number;
  total: number;
  effectiveUnitPrice: number;
  tierIndex: number;
  tierUnitPrice: number;
  savings: number;
  nextTier: { credits: number; creditsNeeded: number; unitPrice: number; total: number } | null;
  chargeEstimate: { amount: number; currency: string } | null;
}

const toMicros = (unit: string | number) => Math.round(Number(unit) * 1e6);
const microsToCents = (micros: number) => Math.floor((micros + 5000) / 10000);

const tierIndex = (rules: CreditPricingRules, credits: number) => {
  let idx = 0;
  rules.tiers.forEach((t, i) => {
    if (credits >= t.from) idx = i;
  });
  return idx;
};

/** Total in cents for `credits` under the rules. */
export function priceCents(rules: CreditPricingRules, credits: number): number {
  const { tiers } = rules;
  if (rules.tiers_mode === 'graduated') {
    let micros = 0;
    for (let i = 0; i < tiers.length; i++) {
      if (credits < tiers[i].from) break;
      const lo = i === 0 ? 1 : tiers[i].from;
      const hi = i + 1 < tiers.length ? tiers[i + 1].from - 1 : credits;
      micros += (Math.min(credits, hi) - lo + 1) * toMicros(tiers[i].unit_price);
    }
    return microsToCents(micros);
  }
  return microsToCents(credits * toMicros(tiers[tierIndex(rules, credits)].unit_price));
}

export type QuoteProblem = { error: string };

export function checkCredits(rules: CreditPricingRules, credits: number): string | null {
  if (!Number.isFinite(credits) || credits <= 0) return 'Enter how many credits you need.';
  if (credits < rules.min_credits) return `The minimum purchase is ${rules.min_credits.toLocaleString()} credits.`;
  if (credits > rules.max_credits)
    return `The maximum purchase is ${rules.max_credits.toLocaleString()} credits. Contact sales for more.`;
  if (credits % rules.credit_step) return `Credits must be a multiple of ${rules.credit_step.toLocaleString()}.`;
  return null;
}

/** Snap free-typed credits to the nearest buyable amount within limits. */
export function snapCredits(rules: CreditPricingRules, credits: number): number {
  const step = rules.credit_step;
  const snapped = Math.round(credits / step) * step;
  return Math.min(rules.max_credits, Math.max(rules.min_credits, snapped));
}

export function quoteForCredits(rules: CreditPricingRules, credits: number): CreditQuote | QuoteProblem {
  const problem = checkCredits(rules, credits);
  if (problem) return { error: problem };
  const totalCents = priceCents(rules, credits);
  const idx = tierIndex(rules, credits);
  const baseCents = microsToCents(credits * toMicros(rules.tiers[0].unit_price));

  let nextTier: CreditQuote['nextTier'] = null;
  const nt = rules.tiers[idx + 1];
  if (nt) {
    const ntCredits = Math.ceil(nt.from / rules.credit_step) * rules.credit_step;
    if (ntCredits <= rules.max_credits) {
      nextTier = {
        credits: ntCredits,
        creditsNeeded: ntCredits - credits,
        unitPrice: Number(nt.unit_price),
        total: priceCents(rules, ntCredits) / 100,
      };
    }
  }

  const total = totalCents / 100;
  const rate = rules.charge_rate ? Number(rules.charge_rate) : null;
  return {
    credits,
    total,
    effectiveUnitPrice: total / credits,
    tierIndex: idx,
    tierUnitPrice: Number(rules.tiers[idx].unit_price),
    savings: Math.max(baseCents - totalCents, 0) / 100,
    nextTier,
    chargeEstimate:
      rate && rules.charge_currency && rules.charge_currency !== rules.currency
        ? { amount: Math.round(total * rate * 100) / 100, currency: rules.charge_currency }
        : null,
  };
}

/** Most credits `amount` buys without exceeding it (mirrors credits_for_amount). */
export function creditsForAmount(rules: CreditPricingRules, amount: number): number | QuoteProblem {
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount greater than 0.' };
  const budget = Math.round(amount * 100);
  const step = rules.credit_step;
  let best = 0;
  if (rules.tiers_mode === 'graduated') {
    let lo = 0;
    let hi = Math.floor(rules.max_credits / step);
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (priceCents(rules, mid * step) <= budget) lo = mid;
      else hi = mid - 1;
    }
    best = lo * step;
  } else {
    rules.tiers.forEach((t, i) => {
      const tierHi = i + 1 < rules.tiers.length ? rules.tiers[i + 1].from - 1 : rules.max_credits;
      let c = Math.floor((budget * 10000) / toMicros(t.unit_price));
      c = Math.min(c, tierHi, rules.max_credits);
      c -= c % step;
      while (c > 0 && priceCents(rules, c) > budget) c -= step;
      if (c >= Math.max(t.from, 1) || (i === 0 && c > 0)) best = Math.max(best, c);
    });
  }
  if (best < rules.min_credits) {
    const min = (priceCents(rules, rules.min_credits) / 100).toFixed(2);
    return {
      error: `The minimum purchase is ${rules.min_credits.toLocaleString()} credits (${formatMoney(Number(min), rules.currency)}).`,
    };
  }
  return best;
}

export function formatMoney(value: number, currency = 'USD', maxFractionDigits = 2): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: Math.min(2, maxFractionDigits),
      maximumFractionDigits: maxFractionDigits,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(Math.min(2, maxFractionDigits))}`;
  }
}

export const formatUnitPrice = (value: number, currency = 'USD') => formatMoney(value, currency, 5);

export const isQuoteProblem = (v: unknown): v is QuoteProblem =>
  typeof v === 'object' && v !== null && 'error' in v;
