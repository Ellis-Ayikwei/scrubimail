import axiosInstance from './axiosInstance';

/** Normalize Django / Paystack error payloads for UI messages. */
export function parseBillingApiError(error: any): string {
  const d = error?.response?.data;
  if (!d) return error?.message || 'Request failed';
  if (typeof d === 'string') return d;
  if (d.detail != null) {
    if (typeof d.detail === 'string') return d.detail;
    if (Array.isArray(d.detail)) {
      return d.detail.map((x: any) => (typeof x === 'string' ? x : x?.msg || JSON.stringify(x))).join(', ');
    }
  }
  if (d.error != null) return typeof d.error === 'string' ? d.error : JSON.stringify(d.error);
  if (d.message != null) return String(d.message);
  return 'Request failed';
}

// ==================== INTERFACES ====================

export interface BillingProfile {
  id: number;
  current_plan: {
    id: number;
    name: string;
    price: number;
    credits_per_month: number;
    features?: string[];
    supports_api?: boolean;
    supports_bulk?: boolean;
    priority_support?: boolean;
  };
  credits_remaining: number;
  credits_used_this_month: number;
  billing_status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'suspended';
  total_credits_purchased: number;
  total_amount_spent: number;
  last_credit_purchase: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  auto_renew: boolean;
  usage_percentage: number;
  is_trial: boolean;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingAnalytics {
  overview: {
    total_credits: number;
    credits_used: number;
    credits_remaining: number;
    usage_percentage: number;
    monthly_usage: number;
    average_daily_usage: number;
  };
  monthly_breakdown: Array<{
    month: string;
    credits_used: number;
    cost: number;
  }>;
  plan_details: {
    current_plan: string;
    plan_price: number;
    next_billing_date: string | null;
    auto_renew: boolean;
  };
}

export interface UsageStats {
  total_validations: number;
  valid_emails: number;
  invalid_emails: number;
  success_rate: number;
  this_month: {
    validations: number;
    credits_used: number;
    cost: number;
    api_calls?: number;
  };
  /** Optional breakdown when API returns prior month stats */
  last_month?: {
    validations?: number;
    credits_used?: number;
    cost?: number;
    api_calls?: number;
  };
  daily_usage: Array<{
    date: string;
    validations: number;
    credits_used: number;
  }>;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  original_price: number;
  discount_percentage: number;
  expiry_days: number | null;
  is_featured: boolean;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreditPackagePurchase {
  id: string;
  package: CreditPackage;
  user: number;
  credits_purchased: number;
  amount_paid: number;
  promo_code: string | null;
  discount_amount: number;
  payment_method: string;
  payment_reference: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_credits';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  max_uses: number | null;
  max_uses_per_user: number | null;
  current_uses: number;
  min_purchase_amount: number;
  first_purchase_only: boolean;
  applicable_plans: number[];
  applicable_packages: number[];
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeRedemption {
  id: number;
  promo_code: PromoCode;
  user: number;
  discount_amount: number;
  bonus_credits: number;
  applied_to: 'plan' | 'package';
  applied_to_id: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoice_type: 'subscription' | 'credit_package' | 'credit_purchase' | 'refund';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  /** Some list serializers expose a single display amount */
  amount?: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  payment_reference: string | null;
  customer_snapshot: any;
  line_items: InvoiceLineItem[];
  user: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface UsageAlert {
  threshold: number;
  crossed: boolean;
  alert_sent: boolean;
  last_sent_date: string | null;
}

/** POST /verify-payment/ — server-side Paystack verify + idempotent fulfillment */
export interface PaymentVerificationResult {
  ok: boolean;
  message?: string;
  payment_type?: string | null;
  paystack_status?: string | null;
}

export interface ExpiringCreditsInfo {
  credits_expiring: number;
  expiry_date: string;
  days_until_expiry: number;
  /** Alias for UI rows (from transaction amount) */
  credits?: number;
}

/** Matches `TrialStatusView` (and tolerates older shapes). */
export interface TrialStatus {
  is_trial_active?: boolean;
  is_trial?: boolean;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  days_left?: number;
  trial_converted?: boolean;
  current_plan?: string | null;
  is_active?: boolean;
  days_remaining?: number;
  plan_id?: number;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
  converted?: boolean;
}

export interface RateLimitStatus {
  current_plan: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  current_usage: {
    minute: number;
    hour: number;
    day: number;
  };
}

// ==================== BILLING SERVICE ====================

class BillingService {
  // ========== Core Billing Profile ==========

  async getBillingProfile(): Promise<BillingProfile> {
    try {
      const response = await axiosInstance.get('/credits/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load billing information');
    }
  }

  async getBillingAnalytics(): Promise<BillingAnalytics> {
    try {
      const response = await axiosInstance.get('/analytics/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load billing analytics');
    }
  }

  async getUsageStats(): Promise<UsageStats> {
    try {
      const response = await axiosInstance.get('/usage-stats/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load usage statistics');
    }
  }

  // ========== Plans ==========

  async getPlans(): Promise<any[]> {
    try {
      const response = await axiosInstance.get('/plans/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load plans');
    }
  }

  async upgradePlan(planId: number): Promise<any> {
    try {
      const response = await axiosInstance.post('/upgrade/', { plan_id: planId });
      const data = response.data || {};
      const authUrl =
        data.authorization_url ||
        (data as Record<string, unknown>).authorizationUrl ||
        data.checkout_url ||
        (data as Record<string, unknown>).checkoutUrl;
      return { ...data, authorization_url: authUrl as string | undefined };
    } catch (error: any) {
      throw new Error(parseBillingApiError(error) || 'Failed to upgrade plan');
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    try {
      const { data } = await axiosInstance.post('/verify-payment/', { reference });
      return {
        ok: !!data?.ok,
        message: data?.message,
        payment_type: data?.payment_type,
        paystack_status: data?.paystack_status,
      };
    } catch (error: any) {
      const d = error?.response?.data;
      if (d && typeof d === 'object') {
        return {
          ok: !!d.ok,
          message: d.message || parseBillingApiError(error),
          payment_type: d.payment_type,
          paystack_status: d.paystack_status,
        };
      }
      return { ok: false, message: parseBillingApiError(error) };
    }
  }

  async cancelSubscription(): Promise<any> {
    try {
      const response = await axiosInstance.post('/cancel-subscription/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to cancel subscription');
    }
  }

  async getBillingHistory(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      const response = await axiosInstance.get('/history/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load billing history');
    }
  }

  // ========== Credit Packages ==========

  async getCreditPackages(): Promise<CreditPackage[]> {
    try {
      const response = await axiosInstance.get('/credit-packages/');
      return response.data.packages || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load credit packages');
    }
  }

  async getCreditPackageDetails(id: string): Promise<CreditPackage> {
    try {
      const response = await axiosInstance.get(`/credit-packages/${id}/`);
      return response.data.package || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load package details');
    }
  }

  async purchaseCreditPackage(packageId: string, promoCode?: string): Promise<any> {
    try {
      const response = await axiosInstance.post('/purchase-package/', {
        package_id: packageId,
        promo_code: promoCode || null
      });
      const data = response.data;
      const nested = data?.purchase;
      const base = nested && typeof nested === 'object' ? nested : {};
      const payUrl = data.payment_url || data.authorization_url;
      return {
        ...base,
        ...data,
        authorization_url: payUrl || base.authorization_url,
        payment_url: data.payment_url,
      };
    } catch (error: any) {
      throw new Error(parseBillingApiError(error) || 'Failed to purchase package');
    }
  }

  async getCreditPackagePurchases(filters?: any): Promise<CreditPackagePurchase[]> {
    try {
      const response = await axiosInstance.get('/package-purchases/', { params: filters });
      return response.data.purchases || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load purchase history');
    }
  }

  async completePurchase(purchaseId: string, paymentReference: string): Promise<CreditPackagePurchase> {
    try {
      const response = await axiosInstance.post(`/package-purchases/${purchaseId}/complete/`, {
        payment_reference: paymentReference
      });
      return response.data.purchase || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to complete purchase');
    }
  }

  // Keep old method for backwards compat
  async purchaseCredits(amount: number, paymentMethod: string): Promise<any> {
    try {
      const response = await axiosInstance.post('/purchase-credits/', {
        amount,
        payment_method: paymentMethod
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to purchase credits');
    }
  }

  // ========== Promo Codes ==========

  async validatePromoCode(code: string, planId?: number, packageId?: string): Promise<any> {
    try {
      const response = await axiosInstance.post('/promo-codes/validate/', {
        code,
        plan_id: planId,
        package_id: packageId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Invalid promo code');
    }
  }

  async redeemPromoCode(code: string, planId?: number, packageId?: string): Promise<any> {
    try {
      const response = await axiosInstance.post('/promo-codes/redeem/', {
        code,
        plan_id: planId,
        package_id: packageId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to redeem promo code');
    }
  }

  async getPromoCodeRedemptions(): Promise<PromoCodeRedemption[]> {
    try {
      const response = await axiosInstance.get('/promo-codes/redemptions/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load redemptions');
    }
  }

  // ========== Invoices ==========

  async getInvoices(filters?: any): Promise<Invoice[]> {
    try {
      const response = await axiosInstance.get('/invoices/', { params: filters });
      return response.data.invoices || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load invoices');
    }
  }

  async getInvoiceDetails(id: string): Promise<Invoice> {
    try {
      const response = await axiosInstance.get(`/invoices/${id}/`);
      return response.data.invoice || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load invoice details');
    }
  }

  async downloadInvoicePDF(id: string): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`/invoices/${id}/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to download invoice');
    }
  }

  async generateInvoice(data: any): Promise<Invoice> {
    try {
      const response = await axiosInstance.post('/invoices/generate/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to generate invoice');
    }
  }

  // ========== Usage Alerts ==========

  async getUsageAlertsStatus(): Promise<UsageAlert[]> {
    try {
      const response = await axiosInstance.get('/usage-alerts/');
      return response.data.alerts || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load usage alerts');
    }
  }

  // ========== Trial Management ==========

  async startTrial(planId: number): Promise<any> {
    try {
      const response = await axiosInstance.post('/start-trial/', { plan_id: planId });
      return response.data;
    } catch (error: any) {
      throw new Error(parseBillingApiError(error) || 'Failed to start trial');
    }
  }

  async getTrialStatus(): Promise<TrialStatus | null> {
    try {
      const response = await axiosInstance.get('/trial-status/');
      return response.data;
    } catch (error: any) {
      throw new Error(parseBillingApiError(error) || 'Failed to load trial status');
    }
  }

  // ========== Credit Expiration ==========

  async getExpiringCredits(days: number = 7): Promise<ExpiringCreditsInfo[]> {
    try {
      const response = await axiosInstance.get('/credits/expiring/', { params: { days } });
      const data = response.data;
      const txs =
        data?.expiring_credits?.transactions ??
        data?.expiring?.transactions ??
        (Array.isArray(data) ? data : []);
      if (!Array.isArray(txs)) return [];
      return txs.map((t: any) => {
        const n = Number(t.amount ?? t.credits ?? 0);
        return {
          credits_expiring: n,
          credits: n,
          expiry_date: t.expiry_date ?? '',
          days_until_expiry: Number(t.days_until_expiry ?? 0),
        };
      });
    } catch (error: any) {
      throw new Error(parseBillingApiError(error) || 'Failed to load expiring credits');
    }
  }

  async getCreditBalanceDetail(): Promise<any> {
    try {
      const response = await axiosInstance.get('/credits/balance-detail/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load credit balance');
    }
  }

  // ========== Rate Limiting ==========

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    try {
      const response = await axiosInstance.get('/rate-limit-status/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to load rate limit status');
    }
  }
}

export const billingService = new BillingService();
export default billingService;
