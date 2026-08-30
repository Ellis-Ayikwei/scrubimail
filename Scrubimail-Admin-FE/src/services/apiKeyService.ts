import axiosInstance from "./axiosInstance";

export interface APIKey {
  id: number;
  key: string;
  is_active: boolean;
  created_at: string;
  user: number;
}

export interface CreateAPIKeyResponse {
  id: number;
  key: string;
  is_active: boolean;
  created_at: string;
  message: string;
}

class APIKeyService {
  // Get all API keys for current user
  async getAPIKeys(): Promise<APIKey[]> {
    const response = await axiosInstance.get('/api-keys/');
    return response.data;
  }

  // Create new API key
  async createAPIKey(): Promise<CreateAPIKeyResponse> {
    const response = await axiosInstance.post('/api-keys/');
    return response.data;
  }

  // Deactivate API key
  async deactivateAPIKey(keyId: number): Promise<{ message: string }> {
    const response = await axiosInstance.patch(`/api-keys/${keyId}/deactivate/`);
    return response.data;
  }
}

export const apiKeyService = new APIKeyService();
export default apiKeyService;

// --- Admin API Keys (APIKeySerializer on apps/apikey/serializers.py) ---
// APIKey extends Basemodel → id/pk is a UUID string. Create requires `user_id` (UUID).
// DELETE performs a soft deactivate on the backend.
export interface AdminAPIKeyUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AdminAPIKey {
  id: string;
  key: string;
  masked_key: string;
  is_active: boolean;
  is_expired: boolean;
  is_valid: boolean;
  name: string | null;
  description: string | null;
  user: AdminAPIKeyUser | null;
  last_used: string | null;
  usage_count: number;
  expires_at: string | null;
  days_until_expiry: number | null;
  rate_limit_per_hour: number;
  created_at: string;
  updated_at: string;
}

export interface AdminAPIKeyCreatePayload {
  user_id: string; // UUID
  name: string;
  description?: string;
  expires_at?: string;
  rate_limit_per_hour?: number;
}

export interface AdminAPIKeyUpdatePayload {
  name?: string;
  description?: string;
  expires_at?: string | null;
  rate_limit_per_hour?: number;
  is_active?: boolean;
}

export const adminApiKeyService = {
  // GET /admin/api-keys/ → AdminAPIKey[] (plain array)
  list: () => axiosInstance.get<AdminAPIKey[]>('/admin/api-keys/'),
  // POST body must include user_id (uuid) + name (+ optional description/expires_at/rate_limit_per_hour)
  create: (data: AdminAPIKeyCreatePayload) => axiosInstance.post('/admin/api-keys/', data),
  update: (id: string, data: AdminAPIKeyUpdatePayload) =>
    axiosInstance.patch<AdminAPIKey>(`/admin/api-keys/${id}/`, data),
  // DELETE = soft deactivate
  remove: (id: string) => axiosInstance.delete(`/admin/api-keys/${id}/`),
};