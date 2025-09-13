import axiosInstance from "./axiosInstance";

export interface APIKey {
  id: number;
  key: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateAPIKeyResponse {
  id: number;
  key: string;
  is_active: boolean;
  created_at: string;
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