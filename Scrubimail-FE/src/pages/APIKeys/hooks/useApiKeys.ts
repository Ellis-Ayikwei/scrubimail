import { useState, useEffect } from 'react';
import { message } from 'antd';
import apiKeyService, { APIKey } from '../../../services/apiKeyService';

interface ApiKeyWithUsage extends APIKey {
  name?: string;
  lastUsed?: string;
  usageCount?: number;
  permissions?: string[];
  description?: string;
}

interface UsageStats {
  totalRequests: number;
  activeKeys: number;
  totalKeys: number;
  thisMonth: number;
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalRequests: 0,
    activeKeys: 0,
    totalKeys: 0,
    thisMonth: 0
  });

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await apiKeyService.getAPIKeys();
      
      // Add mock usage data for now - replace with real analytics
      const keysWithUsage = keys.map(key => ({
        ...key,
        name: `API Key ${key.id}`,
        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageCount: Math.floor(Math.random() * 1000),
        permissions: ['read', 'write'],
        description: `API key created on ${new Date(key.created_at).toLocaleDateString()}`
      }));
      
      setApiKeys(keysWithUsage);
      
      // Update stats
      setUsageStats({
        totalRequests: keysWithUsage.reduce((sum, key) => sum + (key.usageCount || 0), 0),
        activeKeys: keysWithUsage.filter(key => key.is_active).length,
        totalKeys: keysWithUsage.length,
        thisMonth: Math.floor(Math.random() * 5000)
      });
    } catch (error) {
      console.error('Failed to load API keys:', error);
      message.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (keyData: any) => {
    try {
      const newKey = await apiKeyService.createAPIKey();
      const keyWithUsage: ApiKeyWithUsage = {
        ...newKey,
        name: keyData.name,
        description: keyData.description,
        lastUsed: 'Never',
        usageCount: 0,
        permissions: keyData.permissions
      };
      
      setApiKeys(prev => [keyWithUsage, ...prev]);
      message.success('API key created successfully');
      loadApiKeys(); // Refresh the list
    } catch (error) {
      console.error('Failed to create API key:', error);
      message.error('Failed to create API key');
    }
  };

  const handleDeactivateKey = async (keyId: number) => {
    try {
      await apiKeyService.deactivateAPIKey(keyId);
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: false } : key
      ));
      message.success('API key deactivated');
      loadApiKeys(); // Refresh the list
    } catch (error) {
      console.error('Failed to deactivate API key:', error);
      message.error('Failed to deactivate API key');
    }
  };

  const handleEditKey = (key: ApiKeyWithUsage) => {
    // This will be handled by the parent component
    return key;
  };

  const handleUpdateKey = (updatedKey: ApiKeyWithUsage) => {
    setApiKeys(prev => prev.map(key => 
      key.id === updatedKey.id ? updatedKey : key
    ));
    message.success('API key updated');
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    usageStats,
    loadApiKeys,
    handleCreateKey,
    handleDeactivateKey,
    handleEditKey,
    handleUpdateKey
  };
};
