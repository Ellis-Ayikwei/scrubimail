import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Key, 
  RefreshCw
} from 'lucide-react';
import { Button, Tabs } from 'antd';
import apiKeyService, { APIKey } from '../../services/apiKeyService';
import { ApiKeyList } from './components/ApiKeyList';
import { ApiKeyAnalytics } from './components/ApiKeyAnalytics';
import { CreateApiKeyModal } from './components/CreateApiKeyModal';
import { EditApiKeyModal } from './components/EditApiKeyModal';
import { useApiKeys } from './hooks/useApiKeys';

interface ApiKeyWithUsage extends APIKey {
  name?: string;
  lastUsed?: string;
  usageCount?: number;
  permissions?: string[];
  description?: string;
}

const ApiKeys: React.FC = () => {
  const {
    apiKeys,
    loading,
    usageStats,
    loadApiKeys,
    handleCreateKey,
    handleDeactivateKey,
    handleEditKey,
    handleUpdateKey
  } = useApiKeys();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyWithUsage | null>(null);
  const [activeTab, setActiveTab] = useState('keys');

  const handleEditClick = (key: ApiKeyWithUsage) => {
    setEditingKey(key);
    setShowEditModal(true);
  };

  const handleUpdateClick = (updatedKey: ApiKeyWithUsage) => {
    handleUpdateKey(updatedKey);
    setShowEditModal(false);
    setEditingKey(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Key className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-[#2ED8A3] flex-shrink-0" />
                <span className="truncate">API Keys</span>
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Manage your API keys for accessing ScrubiMail services
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadApiKeys}
                loading={loading}
                className="w-full sm:w-auto"
                size="middle"
              >
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto bg-[#2ED8A3] hover:bg-[#00C48C] border-none"
                size="middle"
              >
                <span className="hidden sm:inline">Create API Key</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Keys</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{usageStats.totalKeys}</p>
              </div>
              <Key className="w-6 h-6 sm:w-8 sm:h-8 text-[#2ED8A3] flex-shrink-0" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Active Keys</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{usageStats.activeKeys}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Requests</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{usageStats.totalRequests.toLocaleString()}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">This Month</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{usageStats.thisMonth.toLocaleString()}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'keys',
              label: 'API Keys',
              children: (
                <ApiKeyList
                  apiKeys={apiKeys}
                  loading={loading}
                  onEdit={handleEditClick}
                  onDeactivate={handleDeactivateKey}
                />
              )
            },
            {
              key: 'analytics',
              label: 'Analytics',
              children: <ApiKeyAnalytics />
            }
          ]}
        />

        {/* Modals */}
        <CreateApiKeyModal
          open={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          onCreate={handleCreateKey}
        />

        <EditApiKeyModal
          open={showEditModal}
          onCancel={() => setShowEditModal(false)}
          onUpdate={handleUpdateClick}
          editingKey={editingKey}
        />
      </div>
    </div>
  );
};

export default ApiKeys;
