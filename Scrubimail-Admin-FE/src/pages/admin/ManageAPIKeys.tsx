import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Avatar, 
  Modal, 
  Form, 
  Select, 
  InputNumber,
  message,
  Typography,
  Badge,
  Tooltip,
  Popconfirm,
  Switch,
  Divider
} from 'antd';
import {
  KeyOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MoreOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';
import { adminApiKeyService, AdminAPIKey as APIKey } from '../../services/apiKeyService';

interface User {
  id: string; // UUID (AdminUserSerializer)
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

const userLabel = (user: User) =>
  [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email;

const ManageAPIKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecretKeys, setShowSecretKeys] = useState<Set<string>>(new Set());
  const [form] = Form.useForm();

  const { Title, Text } = Typography;

  const fetchAPIKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiKeyService.list();
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : [];
      setApiKeys(data);
    } catch (err: any) {
      setError('Failed to fetch API keys');
      console.error('Error fetching API keys:', err);
      // Set empty array on error to prevent filter errors
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/admin/users/');
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : [];
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      // Set empty array on error to prevent filter errors
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchAPIKeys();
    fetchUsers();
  }, []);

  const handleCreateKey = async (values: any) => {
    try {
      // user_id is a UUID string — do NOT parseInt it.
      await adminApiKeyService.create({
        name: values.name,
        user_id: values.user_id,
        description: values.description || undefined,
        rate_limit_per_hour: values.rate_limit || 1000,
      });

      setShowCreateModal(false);
      form.resetFields();
      message.success('API key created successfully');
      fetchAPIKeys(); // Refresh to get the full serialized key (create returns partial data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create API key');
      message.error(err.response?.data?.detail || 'Failed to create API key');
    }
  };

  const handleToggleKey = async (keyId: string, isActive: boolean) => {
    try {
      await adminApiKeyService.update(keyId, { is_active: !isActive });
      setApiKeys(prev => prev.map(key =>
        key.id === keyId ? { ...key, is_active: !isActive } : key
      ));
      message.success(`API key ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      setError('Failed to update API key');
      message.error('Failed to update API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await adminApiKeyService.remove(keyId);
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      message.success('API key deleted successfully');
    } catch (err: any) {
      setError('Failed to delete API key');
      message.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
    message.success('API key copied to clipboard');
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

  const columns = [
    {
      title: 'Key Details',
      key: 'keyDetails',
      render: (record: APIKey) => (
        <Space>
          <Badge 
            status={record.is_active ? 'success' : 'error'} 
            text={record.name || `API Key ${record.id}`}
          />
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
              {showSecretKeys.has(record.id) ? (record.key || record.masked_key || 'N/A') : (record.masked_key || '••••••••••••••••••••••••••••••••')}
            </div>
            <Space style={{ marginTop: '4px' }}>
              <Tooltip title={showSecretKeys.has(record.id) ? 'Hide key' : 'Show key'}>
                <Button 
                  type="text" 
                  size="small" 
                  icon={showSecretKeys.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => toggleKeyVisibility(record.id)}
                />
              </Tooltip>
              <Tooltip title="Copy key">
                <Button 
                  type="text" 
                  size="small" 
                  icon={copiedKey === record.id ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => copyToClipboard(record.key || record.masked_key || '')}
                />
              </Tooltip>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (record: APIKey) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.user?.name || 'No name'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.user?.email || 'N/A'}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean, record: APIKey) => (
        <Space>
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
          <Switch 
            checked={isActive} 
            onChange={() => handleToggleKey(record.id, isActive)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (record: APIKey) => (
        <Text>{record.usage_count || 0} requests</Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created',
      render: (date: string) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{new Date(date).toLocaleDateString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: APIKey) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this API key?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteKey(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredKeys = (Array.isArray(apiKeys) ? apiKeys : []).filter(key => {
    const matchesSearch = key.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (key.key || key.masked_key || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = filterUser === 'all' || key.user?.id?.toString() === filterUser;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && key.is_active) ||
                         (filterStatus === 'inactive' && !key.is_active);
    
    return matchesSearch && matchesUser && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <ReloadOutlined style={{ fontSize: '32px', color: '#2ED8A3', marginBottom: '16px' }} spin />
          <Text>Loading API keys...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>API Keys Management</Title>
          <Text type="secondary">Manage all API keys across the platform</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchAPIKeys}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Key
          </Button>
        </Space>
      </div>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: '6px', 
            padding: '12px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
            <Text type="danger">{error}</Text>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
          <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Search</Text>
              <Input
                placeholder="Search by name, email, or key..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Col>
          
          <Col xs={24} md={8}>
          <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>User</Text>
              <Select
              value={filterUser}
                onChange={setFilterUser}
                style={{ width: '100%' }}
                placeholder="All Users"
              >
                <Select.Option value="all">All Users</Select.Option>
                {(Array.isArray(users) ? users : []).map(user => (
                  <Select.Option key={user.id} value={user.id.toString()}>
                  {userLabel(user)}
                  </Select.Option>
              ))}
              </Select>
          </div>
          </Col>
          
          <Col xs={24} md={8}>
          <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Status</Text>
              <Select
              value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%' }}
                placeholder="All Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
          </div>
          </Col>
        </Row>
      </Card>

      {/* API Keys Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredKeys}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} API keys`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create Key Modal */}
      <Modal
        title="Create New API Key"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateKey}
        >
          <Form.Item
            name="name"
            label="Key Name"
            rules={[{ required: true, message: 'Please input the key name!' }]}
          >
            <Input placeholder="Enter key name" />
          </Form.Item>
          
          <Form.Item
            name="user_id"
            label="User"
            rules={[{ required: true, message: 'Please select a user!' }]}
          >
            <Select placeholder="Select user" showSearch optionFilterProp="children">
              {(Array.isArray(users) ? users : []).map(user => (
                <Select.Option key={user.id} value={user.id.toString()}>
                  {userLabel(user)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="rate_limit"
            label="Rate Limit (requests/hour)"
            rules={[{ required: true, message: 'Please input the rate limit!' }]}
            initialValue={1000}
          >
            <InputNumber 
              min={1} 
              max={100000} 
              style={{ width: '100%' }}
              placeholder="Enter rate limit"
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description (optional)"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Enter description for this API key"
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Key
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageAPIKeys;

