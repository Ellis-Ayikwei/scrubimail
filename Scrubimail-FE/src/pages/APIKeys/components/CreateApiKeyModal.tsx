import React, { useState } from 'react';
import { 
  Key, 
  Settings, 
  Shield, 
  Activity, 
  Zap, 
  AlertCircle, 
  Plus 
} from 'lucide-react';
import { 
  Button, 
  Modal, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Alert, 
  Row, 
  Col, 
  Divider 
} from 'antd';

interface CreateApiKeyModalProps {
  open: boolean;
  onCancel: () => void;
  onCreate: (keyData: any) => void;
}

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  open,
  onCancel,
  onCreate
}) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [ipWhitelist, setIpWhitelist] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<number>(1000);
  const [keyPrefix, setKeyPrefix] = useState<string>('');
  const [keyLength, setKeyLength] = useState<number>(32);
  const [notifyOnUsage, setNotifyOnUsage] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [rotationDays, setRotationDays] = useState<number>(90);

  const resetForm = () => {
    setNewKeyName('');
    setNewKeyDescription('');
    setSelectedPermissions(['read']);
    setExpirationDate('');
    setIpWhitelist('');
    setRateLimit(1000);
    setKeyPrefix('');
    setKeyLength(32);
    setNotifyOnUsage(false);
    setAutoRotate(false);
    setRotationDays(90);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      return;
    }

    const keyData = {
      name: newKeyName,
      description: newKeyDescription,
      permissions: selectedPermissions,
      expirationDate,
      ipWhitelist,
      rateLimit,
      keyPrefix,
      keyLength,
      notifyOnUsage,
      autoRotate,
      rotationDays
    };

    onCreate(keyData);
    resetForm();
  };

  const permissionOptions = [
    { label: 'Read', value: 'read' },
    { label: 'Write', value: 'write' },
    { label: 'Delete', value: 'delete' },
    { label: 'Admin', value: 'admin' }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-[#2ED8A3]" />
          <span>Create New API Key</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      width="90%"
      style={{ maxWidth: 800 }}
      centered
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={handleCreate}
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
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Name *
                </label>
                <Input
                  placeholder="e.g., Production API, Development Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  size="middle"
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Prefix
                </label>
                <Input
                  placeholder="Optional key prefix"
                  value={keyPrefix}
                  onChange={(e) => setKeyPrefix(e.target.value)}
                  size="middle"
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
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
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
                  size="middle"
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Length
                </label>
                <Select
                  value={keyLength}
                  onChange={setKeyLength}
                  className="w-full"
                  size="middle"
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
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
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
                  size="middle"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration Date (Optional)
                </label>
                <DatePicker
                  value={expirationDate ? new Date(expirationDate) : null}
                  onChange={(date) => setExpirationDate(date ? date.toISOString().split('T')[0] : '')}
                  className="w-full"
                  size="middle"
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
  );
};
