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
  Modal, 
  Form, 
  Select, 
  InputNumber,
  Switch,
  message,
  Typography,
  Badge,
  Tooltip,
  Popconfirm,
  Divider,
  List
} from 'antd';
import {
  CrownOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearly_price: number | null;
  currency: string;
  billing_cycle?: 'monthly' | 'yearly';
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  max_validations: number;
  max_api_calls: number;
  max_users: number;
  support_level: 'basic' | 'standard' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
  subscription_count: number;
  revenue: number;
}

interface PlanStats {
  total_plans: number;
  active_plans: number;
  total_subscriptions: number;
  monthly_revenue: number;
  popular_plan: string;
  average_plan_price: number;
}

const PlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form] = Form.useForm();

  const { Title, Text } = Typography;

  const fetchPlansData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, statsRes] = await Promise.all([
        axiosInstance.get('/admin/plans/'),
        axiosInstance.get('/admin/plans/stats/')
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setStats(statsRes.data);
    } catch (err: any) {
      setError('Failed to fetch plans data');
      console.error('Error fetching plans data:', err);
      setPlans([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansData();
  }, []);

  const toFeaturesArray = (features: any): string[] => {
    if (Array.isArray(features)) return features.filter(Boolean);
    if (typeof features === 'string') return features.split('\n').map((f: string) => f.trim()).filter(Boolean);
    return [];
  };

  const handleCreatePlan = async (values: any) => {
    try {
      const payload = { ...values, features: toFeaturesArray(values.features) };
      const response = await axiosInstance.post('/admin/plans/', payload);
      setPlans(prev => [response.data, ...prev]);
      setShowPlanModal(false);
      form.resetFields();
      message.success('Plan created successfully');
    } catch (err: any) {
      message.error(err.message || 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async (values: any) => {
    if (!editingPlan) return;
    try {
      const payload = { ...values, features: toFeaturesArray(values.features) };
      const response = await axiosInstance.put(`/admin/plans/${editingPlan.id}/`, payload);
      setPlans(prev => prev.map(plan =>
        plan.id === editingPlan.id ? response.data : plan
      ));
      setShowPlanModal(false);
      setEditingPlan(null);
      form.resetFields();
      message.success('Plan updated successfully');
    } catch (err: any) {
      message.error(err.message || 'Failed to update plan');
    }
  };

  const handleTogglePlan = async (planId: number, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/admin/plans/${planId}/`, {
        is_active: !isActive
      });
      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, is_active: !isActive } : plan
      ));
      message.success(`Plan ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      message.error(err.message || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      await axiosInstance.delete(`/admin/plans/${planId}/`);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      message.success('Plan deleted successfully');
    } catch (err: any) {
      message.error(err.message || 'Failed to delete plan');
    }
  };

  const columns = [
    {
      title: 'Plan',
      key: 'plan',
      render: (record: Plan) => (
        <Space>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong>{record.name}</Text>
              {record.is_popular && <Tag color="gold" icon={<StarOutlined />}>Popular</Tag>}
              {!record.is_active && <Tag color="red">Inactive</Tag>}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      render: (record: Plan) => (
        <div>
          <Text strong style={{ fontSize: '16px' }}>
            ${record.price || 0} {(record.currency || 'USD').toUpperCase()}
          </Text>
          <div>
            <Tag>{record.billing_cycle || 'monthly'}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Limits',
      key: 'limits',
      render: (record: Plan) => (
        <Space direction="vertical" size="small">
          <div>
            <Text type="secondary">Validations:</Text>
            <Text style={{ marginLeft: '4px' }}>
              {record.max_validations === -1 || record.max_validations === null || record.max_validations === undefined 
                ? 'Unlimited' 
                : (record.max_validations || 0).toLocaleString()}
            </Text>
          </div>
          <div>
            <Text type="secondary">API Calls:</Text>
            <Text style={{ marginLeft: '4px' }}>
              {record.max_api_calls === -1 || record.max_api_calls === null || record.max_api_calls === undefined 
                ? 'Unlimited' 
                : (record.max_api_calls || 0).toLocaleString()}
            </Text>
          </div>
          <div>
            <Text type="secondary">Users:</Text>
            <Text style={{ marginLeft: '4px' }}>
              {record.max_users === -1 || record.max_users === null || record.max_users === undefined 
                ? 'Unlimited' 
                : (record.max_users || 0).toLocaleString()}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Support',
      dataIndex: 'support_level',
      key: 'support_level',
      render: (level: string) => {
        if (!level) return <Tag>N/A</Tag>;
        const colors = {
          basic: 'default',
          standard: 'blue',
          premium: 'purple',
          enterprise: 'gold'
        };
        return <Tag color={colors[level as keyof typeof colors] || 'default'}>{level.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Subscriptions',
      dataIndex: 'subscription_count',
      key: 'subscription_count',
      render: (count: number) => (
        <Badge count={count || 0} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong>${(revenue || 0).toLocaleString()}</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Plan) => (
        <Switch 
          checked={record.is_active} 
          onChange={() => handleTogglePlan(record.id, record.is_active)}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Plan) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Edit Plan">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingPlan(record);
                form.setFieldsValue({
                  ...record,
                  features: Array.isArray(record.features) ? record.features.join('\n') : ''
                });
                setShowPlanModal(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this plan?"
            description="This action cannot be undone."
            onConfirm={() => handleDeletePlan(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Tooltip title="Delete Plan">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && plan.is_active) ||
                         (filterStatus === 'inactive' && !plan.is_active);
    const matchesCycle = filterCycle === 'all' || plan.billing_cycle === filterCycle;
    
    return matchesSearch && matchesStatus && matchesCycle;
  });

  const statsCards = [
    {
      title: 'Total Plans',
      value: stats?.total_plans || 0,
      icon: <CrownOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Active Plans',
      value: stats?.active_plans || 0,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Total Subscriptions',
      value: stats?.total_subscriptions || 0,
      icon: <UserOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    },
    {
      title: 'Monthly Revenue',
      value: stats?.monthly_revenue || 0,
      icon: <DollarOutlined style={{ color: '#fa8c16' }} />,
      color: '#fa8c16',
      suffix: 'USD'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <ReloadOutlined style={{ fontSize: '32px', color: '#2ED8A3', marginBottom: '16px' }} spin />
          <Text>Loading plans data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Plans Management</Title>
          <Text type="secondary">Manage subscription plans and pricing</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchPlansData}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowPlanModal(true)}
          >
            Create Plan
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
            <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
            <Text type="danger">{error}</Text>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Plans Table */}
      <Card>
        {/* Filters */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search plans..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
            placeholder="Status"
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
          <Select
            value={filterCycle}
            onChange={setFilterCycle}
            style={{ width: 150 }}
            placeholder="Billing Cycle"
          >
            <Select.Option value="all">All Cycles</Select.Option>
            <Select.Option value="monthly">Monthly</Select.Option>
            <Select.Option value="yearly">Yearly</Select.Option>
          </Select>
          <Button icon={<DownloadOutlined />}>
            Export
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredPlans}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} plans`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit Plan Modal */}
      <Modal
        title={editingPlan ? 'Edit Plan' : 'Create New Plan'}
        open={showPlanModal}
        onCancel={() => {
          setShowPlanModal(false);
          setEditingPlan(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingPlan ? handleUpdatePlan : handleCreatePlan}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Plan Name"
                rules={[{ required: true, message: 'Please input the plan name!' }]}
              >
                <Input placeholder="Enter plan name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_popular"
                label="Popular Plan"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the description!' }]}
          >
            <Input.TextArea placeholder="Enter plan description" rows={3} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Monthly Price"
                rules={[{ required: true, message: 'Please input the monthly price!' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Enter monthly price"
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="yearly_price"
                label="Yearly Price"
                tooltip="Leave empty to auto-calculate (monthly * 10)"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Enter yearly price (optional)"
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Please select currency!' }]}
                initialValue="USD"
              >
                <Select>
                  <Select.Option value="USD">USD</Select.Option>
                  <Select.Option value="EUR">EUR</Select.Option>
                  <Select.Option value="GBP">GBP</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="max_validations"
                label="Max Validations"
                rules={[{ required: true, message: 'Please input max validations!' }]}
              >
                <InputNumber 
                  min={-1} 
                  style={{ width: '100%' }}
                  placeholder="-1 for unlimited"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="max_api_calls"
                label="Max API Calls"
                rules={[{ required: true, message: 'Please input max API calls!' }]}
              >
                <InputNumber 
                  min={-1} 
                  style={{ width: '100%' }}
                  placeholder="-1 for unlimited"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="max_users"
                label="Max Users"
                rules={[{ required: true, message: 'Please input max users!' }]}
              >
                <InputNumber 
                  min={-1} 
                  style={{ width: '100%' }}
                  placeholder="-1 for unlimited"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="support_level"
            label="Support Level"
            rules={[{ required: true, message: 'Please select support level!' }]}
          >
            <Select>
              <Select.Option value="basic">Basic</Select.Option>
              <Select.Option value="standard">Standard</Select.Option>
              <Select.Option value="premium">Premium</Select.Option>
              <Select.Option value="enterprise">Enterprise</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="features"
            label="Features (one per line)"
            rules={[{ required: true, message: 'Please input features!' }]}
          >
            <Input.TextArea 
              placeholder="Enter features, one per line"
              rows={4}
            />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Active Plan"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowPlanModal(false);
                setEditingPlan(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlansManagement;
