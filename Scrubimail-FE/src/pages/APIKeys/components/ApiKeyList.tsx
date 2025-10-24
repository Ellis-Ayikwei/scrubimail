import React, { useState } from 'react';
import { 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Key, 
  CheckCircle, 
  Calendar,
  Activity,
  Shield,
  Clock,
  Edit,
  RotateCcw,
  Search,
  Plus
} from 'lucide-react';
import { Button, Input, Select, Card, Badge, Tooltip, message } from 'antd';

interface ApiKeyWithUsage {
  id: number;
  key: string;
  is_active: boolean;
  created_at: string;
  name?: string;
  lastUsed?: string;
  usageCount?: number;
  permissions?: string[];
  description?: string;
}

interface ApiKeyListProps {
  apiKeys: ApiKeyWithUsage[];
  loading: boolean;
  onEdit: (key: ApiKeyWithUsage) => void;
  onDeactivate: (keyId: number) => void;
}

export const ApiKeyList: React.FC<ApiKeyListProps> = ({
  apiKeys,
  loading,
  onEdit,
  onDeactivate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      message.success('API key copied to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      message.error('Failed to copy API key');
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return '•'.repeat(key.length);
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4);
  };

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && key.is_active) ||
                         (statusFilter === 'inactive' && !key.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2ED8A3] mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading API keys...</p>
      </div>
    );
  }

  if (filteredKeys.length === 0) {
    return (
      <div className="text-center py-12">
        <Key className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {searchTerm ? 'No matching API keys' : 'No API Keys'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {searchTerm ? 'Try adjusting your search terms' : 'Create your first API key to start using our services'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search API keys..."
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              size="middle"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-48"
            size="middle"
            options={[
              { label: 'All Keys', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
            ]}
          />
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredKeys.map((apiKey) => (
          <Card
            key={apiKey.id}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            size="small"
          >
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {apiKey.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge
                      status={apiKey.is_active ? 'success' : 'error'}
                      text={apiKey.is_active ? 'Active' : 'Inactive'}
                    />
                    {apiKey.usageCount && apiKey.usageCount > 0 && (
                      <Badge
                        count={apiKey.usageCount}
                        style={{ backgroundColor: '#3B82F6' }}
                        title="Usage Count"
                      />
                    )}
                  </div>
                </div>
                
                {apiKey.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {apiKey.description}
                  </p>
                )}
                
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4 mb-4">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-mono truncate flex-1">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Tooltip title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}>
                        <Button
                          type="text"
                          size="small"
                          icon={visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        />
                      </Tooltip>
                      <Tooltip title="Copy to clipboard">
                        <Button
                          type="text"
                          size="small"
                          icon={copiedKey === apiKey.key ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          onClick={() => copyToClipboard(apiKey.key)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center min-w-0">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Last Used: {apiKey.lastUsed || 'Never'}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Permissions: {apiKey.permissions?.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Usage: {apiKey.usageCount || 0} requests</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4 flex-shrink-0">
                <Tooltip title="Edit key">
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => onEdit(apiKey)}
                  />
                </Tooltip>
                {apiKey.is_active && (
                  <Tooltip title="Deactivate key">
                    <Button
                      type="text"
                      size="small"
                      icon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => onDeactivate(apiKey.id)}
                      danger
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
