import axiosInstance from './axiosInstance';

export interface BillingProfile {
  id: number;
  current_plan: {
    id: number;
    name: string;
    price: number;
    credits: number;
    features: string[];
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
  };
  daily_usage: Array<{
    date: string;
    validations: number;
    credits_used: number;
  }>;
}

class BillingService {
  /**
   * Get user's billing profile and credits
   */
  async getBillingProfile(): Promise<BillingProfile> {
    try {
      const response = await axiosInstance.get('/credits/');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing profile:', error);
      throw new Error('Failed to load billing information');
    }
  }

  /**
   * Get billing analytics and usage statistics
   */
  async getBillingAnalytics(): Promise<BillingAnalytics> {
    try {
      const response = await axiosInstance.get('/analytics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing analytics:', error);
      throw new Error('Failed to load billing analytics');
    }
  }

  /**
   * Get detailed usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    try {
      const response = await axiosInstance.get('/usage-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw new Error('Failed to load usage statistics');
    }
  }

  /**
   * Get available plans
   */
  async getPlans() {
    try {
      const response = await axiosInstance.get('/plans/');
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Failed to load plans');
    }
  }

  /**
   * Purchase credits
   */
  async purchaseCredits(amount: number, paymentMethod: string) {
    try {
      const response = await axiosInstance.post('/purchase-credits/', {
        amount,
        payment_method: paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error purchasing credits:', error);
      throw new Error('Failed to purchase credits');
    }
  }

  /**
   * Upgrade plan
   */
  async upgradePlan(planId: number) {
    try {
      const response = await axiosInstance.post('/upgrade/', {
        plan_id: planId
      });
      return response.data;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw new Error('Failed to upgrade plan');
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(page: number = 1, pageSize: number = 20) {
    try {
      const response = await axiosInstance.get('/history/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw new Error('Failed to load billing history');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      const response = await axiosInstance.post('/cancel-subscription/');
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }
}

export const billingService = new BillingService();
export default billingService;
