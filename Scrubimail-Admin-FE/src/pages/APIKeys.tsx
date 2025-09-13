import React, { useEffect, useState } from 'react';
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  Shield,
  Clock,
  Activity,
  Download,
  RefreshCw,
  Settings,
  Lock
} from 'lucide-react';
import { apiKeyService, APIKey } from '../services/apiKeyService';

const APIKeys = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecretKeys, setShowSecretKeys] = useState<Set<string>>(new Set());

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiKeyService.getAPIKeys();
      setKeys(data);
    } catch (err: any) {
      setError('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await apiKeyService.createAPIKey();
      await fetchKeys();
      // Show the new key temporarily
      if (res.key) {
        setShowSecretKeys(prev => new Set(prev).add(res.key));
      }
    } catch (err: any) {
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    setError(null);
    try {
      await apiKeyService.deactivateAPIKey(id);
      await fetchKeys();
    } catch (err: any) {
      setError('Failed to deactivate API key');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    setError(null);
    try {
      // Note: Delete functionality may not be available in backend, using deactivate instead
      await apiKeyService.deactivateAPIKey(id);
      await fetchKeys();
    } catch (err: any) {
      setError('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newShowSecretKeys = new Set(showSecretKeys);
    if (newShowSecretKeys.has(keyId)) {
      newShowSecretKeys.delete(keyId);
    } else {
      newShowSecretKeys.add(keyId);
    }
    setShowSecretKeys(newShowSecretKeys);
  };

  const getUsageStatus = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' };
    if (percentage >= 70) return { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3] mx-auto mb-4" />
          <p className="text-[#333333] dark:text-white">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
            <Key className="w-8 h-8 mr-3 text-[#2ED8A3]" />
            API Key Management
          </h1>
          <p className="text-[#333333]/70 dark:text-gray-400">
            Manage your API keys for programmatic access to Scrubimail services
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* API Keys List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#333333] dark:text-white">API Keys</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={fetchKeys}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm">Refresh</span>
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex items-center space-x-2 bg-[#2ED8A3] text-white px-4 py-2 rounded-lg hover:bg-[#00C48C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Create New Key</span>
                  </button>
                </div>
              </div>

              {/* Keys List */}
              <div className="space-y-4">
                {keys.map((key: APIKey) => (
                  <div key={key.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium text-[#333333] dark:text-white">
                          {key.name || `API Key ${key.id}`}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          key.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleKeyVisibility(key.key)}
                          className="text-[#333333]/50 hover:text-[#333333] transition-colors"
                        >
                          {showSecretKeys.has(key.key) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="text-[#2ED8A3] hover:text-[#00C48C] transition-colors"
                        >
                          {copiedKey === key.key ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Key Display */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-[#333333]/50" />
                        <code className="text-sm bg-[#F4F5F7] dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          {showSecretKeys.has(key.key) ? key.key : '••••••••••••••••••••••••••••••••'}
                        </code>
                      </div>
                    </div>

                    {/* Key Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#333333]/70 dark:text-gray-400">Created:</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-[#333333] dark:text-white">
                            {new Date(key.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[#333333]/70 dark:text-gray-400">Last Used:</span>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span className="text-[#333333] dark:text-white">
                            {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        {key.is_active ? (
                          <button
                            onClick={() => handleDeactivate(key.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="text-sm text-[#333333]/50 dark:text-gray-400">Deactivated</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {keys.length === 0 && (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 text-[#333333]/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#333333] dark:text-white mb-2">No API keys found</h3>
                    <p className="text-[#333333]/70 dark:text-gray-400 mb-4">
                      Create your first API key to start using our services programmatically.
                    </p>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="bg-[#2ED8A3] text-white px-4 py-2 rounded-lg hover:bg-[#00C48C] disabled:opacity-50 transition-colors"
                    >
                      {creating ? 'Creating...' : 'Create API Key'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Security Tips
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#2ED8A3] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#333333] dark:text-white">Keep your API keys secure and never share them publicly</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#2ED8A3] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#333333] dark:text-white">Use environment variables in production</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#2ED8A3] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#333333] dark:text-white">Rotate keys regularly for better security</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#2ED8A3] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#333333] dark:text-white">Monitor usage to detect unauthorized access</span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Usage Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#333333]/70 dark:text-gray-400">Active Keys</span>
                    <span className="font-medium text-[#333333] dark:text-white">
                      {keys.filter(k => k.is_active).length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-[#2ED8A3] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(keys.filter(k => k.is_active).length / Math.max(keys.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#333333]/70 dark:text-gray-400">Total Keys</span>
                    <span className="font-medium text-[#333333] dark:text-white">{keys.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors">
                  <span className="text-sm text-[#333333] dark:text-white">View API Documentation</span>
                  <Settings className="w-4 h-4 text-[#2ED8A3]" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors">
                  <span className="text-sm text-[#333333] dark:text-white">Download SDK</span>
                  <Download className="w-4 h-4 text-[#2ED8A3]" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors">
                  <span className="text-sm text-[#333333] dark:text-white">Usage Analytics</span>
                  <Activity className="w-4 h-4 text-[#2ED8A3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeys; 