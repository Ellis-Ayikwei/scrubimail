import { APIKey } from '../../services/apiKeyService';

export interface ApiKeyWithUsage extends APIKey {
  name?: string;
  lastUsed?: string;
  usageCount?: number;
  permissions?: string[];
  description?: string;
}

export interface UsageStats {
  totalRequests: number;
  activeKeys: number;
  totalKeys: number;
  thisMonth: number;
}

export interface CreateApiKeyData {
  name: string;
  description?: string;
  permissions: string[];
  expirationDate?: string;
  ipWhitelist?: string;
  rateLimit: number;
  keyPrefix: string;
  keyLength: number;
  notifyOnUsage: boolean;
  autoRotate: boolean;
  rotationDays: number;
}
