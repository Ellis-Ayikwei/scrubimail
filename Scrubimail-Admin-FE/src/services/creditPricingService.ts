import axiosInstance from './axiosInstance';
import type { CreditPricingRules, CreditPricingTier } from '../utils/creditPricing';

export interface AdminCreditPricing extends Omit<CreditPricingRules, 'min_total' | 'charge_currency' | 'charge_rate'> {
  updated_at: string | null;
  updated_by_email: string | null;
  preview: Array<{
    credits: number;
    total: string;
    effective_unit_price: string;
    savings: string;
    tier_index: number;
  }>;
  config_error?: string;
}

export type AdminCreditPricingUpdate = Partial<
  Pick<
    AdminCreditPricing,
    'is_enabled' | 'currency' | 'tiers_mode' | 'min_credits' | 'max_credits' | 'credit_step' | 'expiry_days'
  >
> & { tiers?: CreditPricingTier[] };

/** Flatten DRF validation errors ({field: [msg]}, {non_field_errors: [...]}) into one line. */
function validationMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const msgs = Object.values(data as Record<string, unknown>)
      .flat()
      .filter((m): m is string => typeof m === 'string');
    if (msgs.length) return msgs.join(' ');
  }
  return fallback;
}

export const creditPricingService = {
  async get(): Promise<AdminCreditPricing> {
    const response = await axiosInstance.get('/admin/credit-pricing/');
    return response.data;
  },

  async update(data: AdminCreditPricingUpdate): Promise<AdminCreditPricing> {
    // Resolve 400s here: the shared interceptor drops DRF's per-field messages.
    const response = await axiosInstance.put('/admin/credit-pricing/', data, {
      validateStatus: (status) => status < 500 && status !== 401,
    });
    if (response.status >= 400) {
      throw new Error(validationMessage(response.data, 'Failed to save credit pricing'));
    }
    return response.data;
  },
};

export default creditPricingService;
