import axiosInstance from './axiosInstance';

// --- Pricing Configurations ---
export const getPricingConfigurations = async () => {
  return axiosInstance.get('/price-configurations/');
};

export const createPricingConfiguration = async (data: any) => {
  return axiosInstance.post('/price-configurations/', data);
};

export const updatePricingConfiguration = async (id: number, data: any) => {
  return axiosInstance.put(`/price-configurations/${id}/`, data);
};

export const deletePricingConfiguration = async (id: number) => {
  return axiosInstance.delete(`/price-configurations/${id}/`);
};

export const setDefaultPricingConfiguration = async (id: number) => {
  return axiosInstance.patch('/price-configurations/set-default/', { configuration_id: id });
};

// --- Pricing Factors ---
export const getPricingFactors = async () => {
  return axiosInstance.get('/pricing-factors/');
};

export const createPricingFactor = async (category: string, data: any) => {
  return axiosInstance.post(`/pricing/factors/${category}/`, data);
};

export const updatePricingFactor = async (category: string, id: number, data: any) => {
  return axiosInstance.put(`/pricing/factors/${category}/${id}/`, data);
};

export const deletePricingFactor = async (category: string, id: number) => {
  return axiosInstance.delete(`/pricing/factors/${category}/${id}/`);
};

// --- Admin Plans (PlanSerializer, fields="__all__" on apps/plan/models.py::Plan) ---
// NOTE: DecimalField values are serialized as STRINGS by DRF (price, yearly_price,
// additional_credit_price). Plan primary key is an INTEGER.
export interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  yearly_price: string | null;
  currency: string;
  is_active: boolean;
  features: Record<string, any> | string[];
  credits_per_month: number;
  additional_credit_price: string;
  paystack_plan_code: string | null;
  max_api_calls_per_hour: number;
  max_bulk_emails: number;
  supports_api: boolean;
  supports_bulk: boolean;
  priority_support: boolean;
  trial_days: number;
  created_at: string;
  updated_at: string;
}

// GET /admin/plans/stats/ → { total_plans, active_plans }
export interface PlanStats {
  total_plans: number;
  active_plans: number;
}

export type PlanWritePayload = Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>;

export const plansService = {
  // GET /admin/plans/ → Plan[] (plain array, no pagination envelope)
  list: () => axiosInstance.get<Plan[]>('/admin/plans/'),
  stats: () => axiosInstance.get<PlanStats>('/admin/plans/stats/'),
  create: (data: PlanWritePayload) => axiosInstance.post<Plan>('/admin/plans/', data),
  update: (id: number, data: PlanWritePayload) =>
    axiosInstance.put<Plan>(`/admin/plans/${id}/`, data),
  patch: (id: number, data: PlanWritePayload) =>
    axiosInstance.patch<Plan>(`/admin/plans/${id}/`, data),
  remove: (id: number) => axiosInstance.delete(`/admin/plans/${id}/`),
};
