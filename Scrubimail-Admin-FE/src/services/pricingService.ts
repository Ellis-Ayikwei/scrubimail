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