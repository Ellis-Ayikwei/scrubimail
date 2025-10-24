import React, { useState, useEffect } from 'react';
import { Edit, AlertCircle } from 'lucide-react';
import { Button, Modal, Input, Select, Alert } from 'antd';

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

interface EditApiKeyModalProps {
  open: boolean;
  onCancel: () => void;
  onUpdate: (updatedKey: ApiKeyWithUsage) => void;
  editingKey: ApiKeyWithUsage | null;
}

export const EditApiKeyModal: React.FC<EditApiKeyModalProps> = ({
  open,
  onCancel,
  onUpdate,
  editingKey
}) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);

  useEffect(() => {
    if (editingKey) {
      setNewKeyName(editingKey.name || '');
      setNewKeyDescription(editingKey.description || '');
      setSelectedPermissions(editingKey.permissions || ['read']);
    }
  }, [editingKey]);

  const handleUpdate = () => {
    if (!editingKey || !newKeyName.trim()) return;
    
    const updatedKey: ApiKeyWithUsage = {
      ...editingKey,
      name: newKeyName,
      description: newKeyDescription,
      permissions: selectedPermissions
    };
    
    onUpdate(updatedKey);
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
          <Edit className="w-5 h-5 text-[#2ED8A3]" />
          <span>Edit API Key</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width="90%"
      style={{ maxWidth: 600 }}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="update"
          type="primary"
          onClick={handleUpdate}
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
  );
};
