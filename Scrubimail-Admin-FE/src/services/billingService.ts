import axiosInstance from './axiosInstance';

// ==================== INTERFACES ====================

export interface CreditPackage {
  id: string; // UUID
  name: string;
  credits: number;
  price: number | string;
  original_price: number | string | null;
  discount_percentage: number;
  expiry_days: number | null;
  is_featured: boolean;
  is_active: boolean;
  description: string;
  // Derived / read-only fields exposed by CreditPackageSerializer
  effective_price?: number | string;
  price_per_credit?: number | string;
  is_available?: boolean;
  savings?: number;
  sort_order?: number;
  max_purchases_per_user?: number | null;
  total_available?: number | null;
  total_sold?: number;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string; // UUID
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

export interface InvoiceUserInfo {
  id: string; // UUID
  email: string;
  name: string | null;
}

export interface Invoice {
  id: string; // UUID
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoice_type: 'subscription' | 'credit_package' | 'credit_purchase' | 'refund';
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  amount_paid?: number | string;
  currency: string;
  // Backend field is `invoice_date` (not `issue_date`).
  invoice_date: string;
  due_date: string;
  paid_date: string | null;
  payment_method?: string | null;
  payment_reference: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  metadata?: any;
  line_items: InvoiceLineItem[];
  user: string; // UUID
  // Attached by the admin invoices endpoint for customer display.
  user_info?: InvoiceUserInfo;
  is_overdue?: boolean;
  balance_due?: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number | string;
  // Backend field is `total` (not `total_price`).
  total: number | string;
}

export interface UsageAlert {
  threshold: number;
  crossed: boolean;
  alert_sent: boolean;
  last_sent_date: string | null;
}

export interface CreditPackagePurchase {
  id: string; // UUID
  // Serializer exposes `package` as the FK id (UUID) and the nested object as
  // `package_details`.
  package: string; // UUID
  package_details?: CreditPackage;
  user: string; // UUID
  // Nested user summary so tables can show a name instead of the raw UUID.
  user_details?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  } | null;
  billing_profile?: string;
  credits_purchased: number;
  amount_paid: number | string;
  currency?: string;
  promo_code?: string | null;
  discount_amount?: number | string;
  payment_method: string;
  payment_reference: string | null;
  payment_provider?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: any;
  purchased_at?: string;
  created_at: string;
  completed_at: string | null;
  failed_at?: string | null;
  refunded_at?: string | null;
}

/** A CreditTransaction row as returned by GET /admin/billing/. */
export interface CreditTransaction {
  id: string; // UUID
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  paystack_payment_reference: string | null;
  metadata: any;
  expiry_date: string | null;
  is_expired: boolean;
  expired_at: string | null;
  is_expiring_soon: boolean;
  days_until_expiry: number | null;
}

/** Shape of GET /admin/billing/stats/. */
export interface BillingStats {
  total_revenue: number;
  recent_billing: CreditTransaction[];
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

export interface ExpiringCreditsInfo {
  credits_expiring: number;
  expiry_date: string;
  days_until_expiry: number;
}

export interface TrialStatus {
  is_active: boolean;
  plan_id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  converted: boolean;
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
  // ========== Credit Packages ==========
  
  /**
   * Get all credit packages
   */
  async getCreditPackages(): Promise<CreditPackage[]> {
    try {
      const response = await axiosInstance.get('/credit-packages/');
      // Backend returns { success: true, packages: [...] }
      return response.data.packages || response.data;
    } catch (error: any) {
      console.error('Error fetching credit packages:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load credit packages');
    }
  }

  /**
   * Get credit package details
   */
  async getCreditPackageDetails(id: string): Promise<CreditPackage> {
    try {
      const response = await axiosInstance.get(`/credit-packages/${id}/`);
      // Backend returns { success: true, package: {...} }
      return response.data.package || response.data;
    } catch (error: any) {
      console.error('Error fetching package details:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load package details');
    }
  }

  /**
   * Create credit package (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async createCreditPackage(data: Partial<CreditPackage>): Promise<CreditPackage> {
    try {
      const response = await axiosInstance.post('/credit-packages/', data);
      return response.data.package || response.data;
    } catch (error: any) {
      console.error('Error creating package:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create package');
    }
  }

  /**
   * Update credit package (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async updateCreditPackage(id: string, data: Partial<CreditPackage>): Promise<CreditPackage> {
    try {
      const response = await axiosInstance.put(`/credit-packages/${id}/`, data);
      return response.data.package || response.data;
    } catch (error: any) {
      console.error('Error updating package:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update package');
    }
  }

  /**
   * Delete credit package (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async deleteCreditPackage(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/credit-packages/${id}/`);
    } catch (error: any) {
      console.error('Error deleting package:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete package');
    }
  }

  /**
   * Purchase credit package
   */
  async purchaseCreditPackage(packageId: string, promoCode?: string): Promise<any> {
    try {
      const response = await axiosInstance.post('/purchase-package/', {
        package_id: packageId,
        promo_code: promoCode || null
      });
      // Backend returns { success: true, purchase: {...} }
      return response.data.purchase || response.data;
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      throw new Error(error.response?.data?.detail || 'Failed to purchase package');
    }
  }

  /**
   * Get credit package purchases
   */
  async getCreditPackagePurchases(filters?: any): Promise<CreditPackagePurchase[]> {
    try {
      const response = await axiosInstance.get('/package-purchases/', {
        params: filters
      });
      // Backend returns { success: true, purchases: [...] }
      return response.data.purchases || response.data;
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load purchases');
    }
  }

  /**
   * Complete package purchase
   */
  async completePurchase(purchaseId: string, paymentReference: string): Promise<CreditPackagePurchase> {
    try {
      const response = await axiosInstance.post(`/package-purchases/${purchaseId}/complete/`, {
        payment_reference: paymentReference
      });
      return response.data.purchase || response.data;
    } catch (error: any) {
      console.error('Error completing purchase:', error);
      throw new Error(error.response?.data?.detail || 'Failed to complete purchase');
    }
  }

  // ========== Promo Codes ==========

  /**
   * Validate promo code
   */
  async validatePromoCode(code: string, planId?: number, packageId?: number): Promise<any> {
    try {
      const response = await axiosInstance.post('/promo-codes/validate/', {
        code,
        plan_id: planId,
        package_id: packageId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      throw new Error(error.response?.data?.detail || 'Invalid promo code');
    }
  }

  /**
   * Redeem promo code
   */
  async redeemPromoCode(code: string, planId?: number, packageId?: number): Promise<any> {
    try {
      const response = await axiosInstance.post('/promo-codes/redeem/', {
        code,
        plan_id: planId,
        package_id: packageId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error redeeming promo code:', error);
      throw new Error(error.response?.data?.detail || 'Failed to redeem promo code');
    }
  }

  /**
   * Get user's promo code redemptions
   */
  async getPromoCodeRedemptions(): Promise<PromoCodeRedemption[]> {
    try {
      const response = await axiosInstance.get('/promo-codes/redemptions/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching redemptions:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load redemptions');
    }
  }

  /**
   * Get all promo codes (Admin only)
   */
  async getAvailablePromoCodes(): Promise<PromoCode[]> {
    try {
      const response = await axiosInstance.get('/promo-codes/');
      // Backend returns { success: true, promo_codes: [...] }
      return response.data.promo_codes || response.data;
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load promo codes');
    }
  }

  /**
   * Create promo code (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async createPromoCode(data: Partial<PromoCode>): Promise<PromoCode> {
    console.log("data", data);
    try {
      const response = await axiosInstance.post('/promo-codes/', data);
      return response.data.promo_code || response.data;
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create promo code');
    }
  }

  /**
   * Update promo code (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
    try {
      const response = await axiosInstance.put(`/promo-codes/${id}/`, data);
      return response.data.promo_code || response.data;
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update promo code');
    }
  }

  /**
   * Deactivate promo code (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async deactivatePromoCode(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/promo-codes/${id}/`);
    } catch (error: any) {
      console.error('Error deactivating promo code:', error);
      throw new Error(error.response?.data?.detail || 'Failed to deactivate promo code');
    }
  }

  // ========== Invoices ==========

  /**
   * Get all invoices via admin endpoint (all users).
   * Falls back to user-scoped /invoices/ if admin endpoint fails.
   */
  async getInvoices(filters?: any): Promise<any> {
    try {
      const response = await axiosInstance.get('/admin/invoices/', {
        params: filters
      });
      // Admin endpoint returns { results: [...], stats: {...}, ... }
      return response.data;
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load invoices');
    }
  }

  /**
   * Get invoice details
   */
  async getInvoiceDetails(id: string): Promise<Invoice> {
    try {
      const response = await axiosInstance.get(`/invoices/${id}/`);
      // Backend returns { success: true, invoice: {...} }
      return response.data.invoice || response.data;
    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load invoice details');
    }
  }

  /**
   * Generate invoice
   */
  async generateInvoice(data: any): Promise<Invoice> {
    try {
      const response = await axiosInstance.post('/invoices/generate/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate invoice');
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoicePDF(id: string): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`/invoices/${id}/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      throw new Error(error.response?.data?.detail || 'Failed to download invoice');
    }
  }

  /**
   * Update invoice status via admin endpoint
   */
  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    try {
      const response = await axiosInstance.patch(`/admin/invoices/${id}/`, {
        status
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update invoice status');
    }
  }

  // ========== Admin Billing / Credits ==========

  /**
   * Get all credit-transaction billing records (admin).
   * GET /admin/billing/ → PLAIN ARRAY of CreditTransaction.
   */
  async getBillingTransactions(): Promise<CreditTransaction[]> {
    try {
      const response = await axiosInstance.get('/admin/billing/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching billing transactions:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load billing records');
    }
  }

  /**
   * Get billing stats (admin).
   * GET /admin/billing/stats/ → { total_revenue, recent_billing:[] }.
   */
  async getBillingStats(): Promise<BillingStats> {
    try {
      const response = await axiosInstance.get('/admin/billing/stats/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching billing stats:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load billing stats');
    }
  }

  /**
   * Adjust a user's credit balance (admin).
   * POST /admin/billing/adjust/ body { user_id, amount(+/-), reason }.
   */
  async adjustCredits(userId: string, amount: number, reason?: string): Promise<{ detail: string; credits_remaining: number }> {
    try {
      const response = await axiosInstance.post('/admin/billing/adjust/', {
        user_id: userId,
        amount,
        reason: reason || 'Admin adjustment',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adjusting credits:', error);
      throw new Error(error.response?.data?.detail || 'Failed to adjust credits');
    }
  }

  /**
   * Reset a user's billing cycle (admin).
   * POST /admin/users/<uuid>/reset-billing/.
   */
  async resetBillingCycle(userId: string): Promise<{ detail: string; credits_remaining: number }> {
    try {
      const response = await axiosInstance.post(`/admin/users/${userId}/reset-billing/`);
      return response.data;
    } catch (error: any) {
      console.error('Error resetting billing cycle:', error);
      throw new Error(error.response?.data?.detail || 'Failed to reset billing cycle');
    }
  }

  /**
   * Change a user's plan (admin).
   * POST /admin/users/<uuid>/change_plan/ body { plan_id }.
   */
  async changeUserPlan(userId: string, planId: number): Promise<{ detail: string; credits_remaining: number }> {
    try {
      const response = await axiosInstance.post(`/admin/users/${userId}/change_plan/`, {
        plan_id: planId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error changing plan:', error);
      throw new Error(error.response?.data?.detail || 'Failed to change plan');
    }
  }

  // ========== Usage Alerts ==========

  /**
   * Get usage alerts status
   */
  async getUsageAlertsStatus(): Promise<UsageAlert[]> {
    try {
      const response = await axiosInstance.get('/usage-alerts/');
      // Backend returns { success: true, alerts: [...] }
      return response.data.alerts || response.data;
    } catch (error: any) {
      console.error('Error fetching usage alerts:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load usage alerts');
    }
  }

  /**
   * Trigger usage alert check
   */
  async triggerUsageAlertCheck(): Promise<any> {
    try {
      const response = await axiosInstance.post('/usage-alerts/');
      return response.data;
    } catch (error: any) {
      console.error('Error triggering alert check:', error);
      throw new Error(error.response?.data?.detail || 'Failed to trigger alert check');
    }
  }

  /**
   * Get system-wide usage alerts stats (Admin only)
   * NOTE: This endpoint may need to be created in the backend
   */
  async getSystemUsageAlertsStats(): Promise<any> {
    try {
      // For now, use the regular usage alerts endpoint
      // TODO: Create admin-specific endpoint in backend
      const response = await axiosInstance.get('/usage-alerts/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching system alerts stats:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load system stats');
    }
  }

  // ========== Trial Management ==========

  /**
   * Start trial
   */
  async startTrial(planId: number): Promise<any> {
    try {
      const response = await axiosInstance.post('/start-trial/', {
        plan_id: planId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error starting trial:', error);
      throw new Error(error.response?.data?.detail || 'Failed to start trial');
    }
  }

  /**
   * Get trial status
   */
  async getTrialStatus(): Promise<TrialStatus | null> {
    try {
      const response = await axiosInstance.get('/trial-status/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching trial status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load trial status');
    }
  }

  // ========== Credit Expiration ==========

  /**
   * Get expiring credits
   */
  async getExpiringCredits(days: number = 7): Promise<ExpiringCreditsInfo[]> {
    try {
      const response = await axiosInstance.get('/credits/expiring/', {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching expiring credits:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load expiring credits');
    }
  }

  /**
   * Get credit balance detail
   */
  async getCreditBalanceDetail(): Promise<any> {
    try {
      const response = await axiosInstance.get('/credits/balance-detail/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching credit balance:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load credit balance');
    }
  }

  // ========== Rate Limiting ==========

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<RateLimitStatus> {
    try {
      const response = await axiosInstance.get('/rate-limit-status/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching rate limit status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load rate limit status');
    }
  }

  // ========== Plan Management ==========

  /**
   * Get plans
   */
  async getPlans(): Promise<any[]> {
    try {
      const response = await axiosInstance.get('/plans/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load plans');
    }
  }

  /**
   * Get plan details
   */
  async getPlanDetails(id: number): Promise<any> {
    try {
      const response = await axiosInstance.get(`/plans/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching plan details:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load plan details');
    }
  }

  /**
   * Compare plans
   */
  async comparePlans(): Promise<any> {
    try {
      const response = await axiosInstance.get('/plans/compare/');
      return response.data;
    } catch (error: any) {
      console.error('Error comparing plans:', error);
      throw new Error(error.response?.data?.detail || 'Failed to compare plans');
    }
  }

  /**
   * Get recommended plan
   */
  async getRecommendedPlan(): Promise<any> {
    try {
      const response = await axiosInstance.get('/plans/recommend/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching recommended plan:', error);
      throw new Error(error.response?.data?.detail || 'Failed to load recommended plan');
    }
  }
}

export const billingService = new BillingService();
export default billingService;

