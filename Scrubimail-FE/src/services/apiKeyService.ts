import api from './api';

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
    const response = await api.get('/api-keys/');
    return response.data;
  }

  // Create new API key
  async createAPIKey(): Promise<CreateAPIKeyResponse> {
    const response = await api.post('/api-keys/');
    return response.data;
  }

  // Deactivate API key
  async deactivateAPIKey(keyId: number): Promise<{ message: string }> {
    const response = await api.patch(`/api-keys/${keyId}/deactivate/`);
    return response.data;
  }
}

export const apiKeyService = new APIKeyService();
export default apiKeyService;