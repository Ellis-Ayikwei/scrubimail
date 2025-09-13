import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  Activity,
  Shield,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  Edit,
  RotateCcw,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { Button, Input, Select, Modal, message, Tooltip, Badge, Tabs, Card, Statistic, Switch, DatePicker, InputNumber, Divider, Alert, Space, Form, Row, Col } from 'antd';
import apiKeyService, { APIKey } from '../services/apiKeyService';

interface ApiKeyWithUsage extends APIKey {
  name?: string;
  lastUsed?: string;
  usageCount?: number;
  permissions?: string[];
  description?: string;
}

const ApiKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyWithUsage | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [ipWhitelist, setIpWhitelist] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<number>(1000);
  const [keyPrefix, setKeyPrefix] = useState<string>('sk_');
  const [keyLength, setKeyLength] = useState<number>(32);
  const [notifyOnUsage, setNotifyOnUsage] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [rotationDays, setRotationDays] = useState<number>(90);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('keys');
  const [usageStats, setUsageStats] = useState({
    totalRequests: 0,
    activeKeys: 0,
    totalKeys: 0,
    thisMonth: 0
  });

  // Load API keys from backend
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

  useEffect(() => {
    loadApiKeys();
  }, []);

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

  const resetCreateForm = () => {
    setNewKeyName('');
    setNewKeyDescription('');
    setSelectedPermissions(['read']);
    setExpirationDate('');
    setIpWhitelist('');
    setRateLimit(1000);
    setKeyPrefix('sk_');
    setKeyLength(32);
    setNotifyOnUsage(false);
    setAutoRotate(false);
    setRotationDays(90);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      message.error('Please enter a name for the API key');
      return;
    }

    try {
      const newKey = await apiKeyService.createAPIKey();
      const keyWithUsage: ApiKeyWithUsage = {
        ...newKey,
        name: newKeyName,
        description: newKeyDescription,
        lastUsed: 'Never',
        usageCount: 0,
        permissions: selectedPermissions
      };
      setApiKeys(prev => [keyWithUsage, ...prev]);
      resetCreateForm();
      setShowCreateModal(false);
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
    setEditingKey(key);
    setNewKeyName(key.name || '');
    setNewKeyDescription(key.description || '');
    setSelectedPermissions(key.permissions || ['read']);
    setShowEditModal(true);
  };

  const handleUpdateKey = () => {
    if (!editingKey || !newKeyName.trim()) return;
    
    setApiKeys(prev => prev.map(key => 
      key.id === editingKey.id 
        ? { 
            ...key, 
            name: newKeyName, 
            description: newKeyDescription,
            permissions: selectedPermissions 
          } 
        : key
    ));
    setShowEditModal(false);
    setEditingKey(null);
    message.success('API key updated');
  };

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && key.is_active) ||
                         (statusFilter === 'inactive' && !key.is_active);
    return matchesSearch && matchesStatus;
  });

  const permissionOptions = [
    { label: 'Read', value: 'read' },
    { label: 'Write', value: 'write' },
    { label: 'Delete', value: 'delete' },
    { label: 'Admin', value: 'admin' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Key className="w-8 h-8 mr-3 text-[#2ED8A3]" />
                API Keys
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your API keys for accessing ScrubiMail services
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadApiKeys}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateModal(true)}
                className="bg-[#2ED8A3] hover:bg-[#00C48C] border-none"
              >
                Create API Key
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Statistic
              title="Total Keys"
              value={usageStats.totalKeys}
              prefix={<Key className="w-4 h-4 text-[#2ED8A3]" />}
              valueStyle={{ color: '#2ED8A3' }}
            />
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Statistic
              title="Active Keys"
              value={usageStats.activeKeys}
              prefix={<CheckCircle className="w-4 h-4 text-green-500" />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Statistic
              title="Total Requests"
              value={usageStats.totalRequests}
              prefix={<Activity className="w-4 h-4 text-blue-500" />}
              valueStyle={{ color: '#3B82F6' }}
            />
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Statistic
              title="This Month"
              value={usageStats.thisMonth}
              prefix={<BarChart3 className="w-4 h-4 text-purple-500" />}
              valueStyle={{ color: '#8B5CF6' }}
            />
          </Card>
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
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search API keys..."
                          prefix={<Search className="w-4 h-4 text-gray-400" />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-full sm:w-48"
                        options={[
                          { label: 'All Keys', value: 'all' },
                          { label: 'Active', value: 'active' },
                          { label: 'Inactive', value: 'inactive' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* API Keys List */}
                  {loading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Loading API keys...</p>
                    </div>
                  ) : filteredKeys.length === 0 ? (
                    <div className="text-center py-12">
                      <Key className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {searchTerm ? 'No matching API keys' : 'No API Keys'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {searchTerm ? 'Try adjusting your search terms' : 'Create your first API key to start using our services'}
                      </p>
                      {!searchTerm && (
                        <Button
                          type="primary"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setShowCreateModal(true)}
                          className="bg-[#2ED8A3] hover:bg-[#00C48C] border-none"
                        >
                          Create API Key
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredKeys.map((apiKey) => (
                        <Card
                          key={apiKey.id}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {apiKey.name}
                                </h3>
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
                              
                              {apiKey.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {apiKey.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="flex items-center space-x-2">
                                  <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono">
                                    {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                                  </code>
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

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>Last Used: {apiKey.lastUsed || 'Never'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Shield className="w-4 h-4 mr-2" />
                                  <span>Permissions: {apiKey.permissions?.join(', ') || 'None'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Activity className="w-4 h-4 mr-2" />
                                  <span>Usage: {apiKey.usageCount || 0} requests</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <Tooltip title="Edit key">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<Edit className="w-4 h-4" />}
                                  onClick={() => handleEditKey(apiKey)}
                                />
                              </Tooltip>
                              {apiKey.is_active && (
                                <Tooltip title="Deactivate key">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<RotateCcw className="w-4 h-4" />}
                                    onClick={() => handleDeactivateKey(apiKey.id)}
                                    danger
                                  />
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'analytics',
              label: 'Analytics',
              children: (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Usage Analytics
                  </h3>
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Analytics dashboard coming soon
                    </p>
                  </div>
                </div>
              )
            }
          ]}
        />

        {/* Create API Key Modal */}
        <Modal
          title={
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-[#2ED8A3]" />
              <span>Create New API Key</span>
            </div>
          }
          open={showCreateModal}
          onCancel={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }}
          width={800}
          footer={[
            <Button key="cancel" onClick={() => {
              setShowCreateModal(false);
              resetCreateForm();
            }}>
              Cancel
            </Button>,
            <Button
              key="create"
              type="primary"
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
              className="bg-[#2ED8A3] hover:bg-[#00C48C] border-none"
              icon={<Plus className="w-4 h-4" />}
            >
              Create API Key
            </Button>
          ]}
        >
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Basic Information
              </h4>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key Name *
                    </label>
                    <Input
                      placeholder="e.g., Production API, Development Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      size="large"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key Prefix
                    </label>
                    <Input
                      placeholder="sk_"
                      value={keyPrefix}
                      onChange={(e) => setKeyPrefix(e.target.value)}
                      size="large"
                    />
                  </div>
                </Col>
              </Row>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <Input.TextArea
                  placeholder="Describe what this API key will be used for..."
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Divider />

            {/* Security & Permissions */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Security & Permissions
              </h4>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions *
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Select permissions"
                      value={selectedPermissions}
                      onChange={setSelectedPermissions}
                      options={permissionOptions}
                      className="w-full"
                      size="large"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key Length
                    </label>
                    <Select
                      value={keyLength}
                      onChange={setKeyLength}
                      className="w-full"
                      size="large"
                      options={[
                        { label: '16 characters', value: 16 },
                        { label: '32 characters', value: 32 },
                        { label: '64 characters', value: 64 },
                        { label: '128 characters', value: 128 }
                      ]}
                    />
                  </div>
                </Col>
              </Row>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IP Whitelist (Optional)
                </label>
                <Input.TextArea
                  placeholder="Enter IP addresses or CIDR blocks, one per line&#10;Example:&#10;192.168.1.1&#10;10.0.0.0/8"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to allow access from any IP address
                </p>
              </div>
            </div>

            <Divider />

            {/* Rate Limiting & Usage */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Rate Limiting & Usage
              </h4>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rate Limit (requests per hour)
                    </label>
                    <InputNumber
                      min={1}
                      max={100000}
                      value={rateLimit}
                      onChange={(value) => setRateLimit(value || 1000)}
                      className="w-full"
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiration Date (Optional)
                    </label>
                    <DatePicker
                      value={expirationDate ? new Date(expirationDate) : null}
                      onChange={(date) => setExpirationDate(date ? date.toISOString().split('T')[0] : '')}
                      className="w-full"
                      size="large"
                      placeholder="Select expiration date"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Advanced Options */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                Advanced Options
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Usage Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when this API key is used
                    </div>
                  </div>
                  <Switch
                    checked={notifyOnUsage}
                    onChange={setNotifyOnUsage}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Auto Rotation</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically rotate this key for security
                    </div>
                  </div>
                  <Switch
                    checked={autoRotate}
                    onChange={setAutoRotate}
                  />
                </div>

                {autoRotate && (
                  <div className="ml-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rotation Interval (days)
                    </label>
                    <InputNumber
                      min={1}
                      max={365}
                      value={rotationDays}
                      onChange={(value) => setRotationDays(value || 90)}
                      className="w-32"
                      size="large"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Security Warning */}
            <Alert
              message="Security Notice"
              description="API keys provide full access to your account. Keep them secure and never share them publicly. Store them in environment variables or secure configuration files."
              type="warning"
              showIcon
              icon={<AlertCircle className="w-4 h-4" />}
            />
          </div>
        </Modal>

        {/* Edit API Key Modal */}
        <Modal
          title={
            <div className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-[#2ED8A3]" />
              <span>Edit API Key</span>
            </div>
          }
          open={showEditModal}
          onCancel={() => setShowEditModal(false)}
          width={600}
          footer={[
            <Button key="cancel" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>,
            <Button
              key="update"
              type="primary"
              onClick={handleUpdateKey}
              disabled={!newKeyName.trim()}
              className="bg-[#2ED8A3] hover:bg-[#00C48C] border-none"
              icon={<Edit className="w-4 h-4" />}
            >
              Update Key
            </Button>
          ]}
        >
          <div className="space-y-6">
            <Alert
              message="Note"
              description="You can only edit the name, description, and permissions. Security settings like IP whitelist and rate limits cannot be changed after creation."
              type="info"
              showIcon
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Name *
              </label>
              <Input
                placeholder="Enter a name for your API key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                size="large"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Input.TextArea
                placeholder="Optional description"
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions
              </label>
              <Select
                mode="multiple"
                placeholder="Select permissions"
                value={selectedPermissions}
                onChange={setSelectedPermissions}
                options={permissionOptions}
                className="w-full"
                size="large"
              />
            </div>

            {editingKey && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Current Key</h5>
                <code className="text-sm text-gray-600 dark:text-gray-400 break-all">
                  {editingKey.key}
                </code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Created: {new Date(editingKey.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ApiKeys;