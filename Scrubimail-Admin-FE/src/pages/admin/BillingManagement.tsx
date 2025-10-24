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
  Divider,
  Tabs
} from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  RiseOutlined,
  BankOutlined,
  WalletOutlined,
  PlusOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';

interface BillingRecord {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  next_billing_date: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  is_active: boolean;
  max_validations: number;
  max_api_calls: number;
}

const BillingManagement: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form] = Form.useForm();

  const { Title, Text } = Typography;

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingRes, plansRes] = await Promise.all([
        axiosInstance.get('/admin/billing/'),
        axiosInstance.get('/admin/plans/')
      ]);
      setBillingRecords(Array.isArray(billingRes.data) ? billingRes.data : []);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
    } catch (err: any) {
      setError('Failed to fetch billing data');
      console.error('Error fetching billing data:', err);
      setBillingRecords([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleCreatePlan = async (values: any) => {
    try {
      const response = await axiosInstance.post('/admin/plans/', values);
      setPlans(prev => [response.data, ...prev]);
      setShowPlanModal(false);
      form.resetFields();
      message.success('Plan created successfully');
    } catch (err: any) {
      message.error('Failed to create plan');
    }
  };

  const handleUpdatePlan = async (values: any) => {
    if (!editingPlan) return;
    try {
      const response = await axiosInstance.put(`/admin/plans/${editingPlan.id}/`, values);
      setPlans(prev => prev.map(plan => 
        plan.id === editingPlan.id ? response.data : plan
      ));
      setShowPlanModal(false);
      setEditingPlan(null);
      form.resetFields();
      message.success('Plan updated successfully');
    } catch (err: any) {
      message.error('Failed to update plan');
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
      message.error('Failed to update plan');
    }
  };

  const billingColumns = [
    {
      title: 'User',
      key: 'user',
      render: (record: BillingRecord) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.user?.name || 'Unknown User'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.user?.email || 'No email'}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => <Tag color="blue">{plan}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          cancelled: 'red',
          expired: 'orange',
          pending: 'blue'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (record: BillingRecord) => (
        <Text strong>${record.amount} {record.currency.toUpperCase()}</Text>
      ),
    },
    {
      title: 'Billing Cycle',
      dataIndex: 'billing_cycle',
      key: 'billing_cycle',
      render: (cycle: string) => <Tag>{cycle}</Tag>,
    },
    {
      title: 'Next Billing',
      dataIndex: 'next_billing_date',
      key: 'next_billing_date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: BillingRecord) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const planColumns = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Plan) => (
        <Space>
          <Text strong>{name}</Text>
          {!record.is_active && <Tag color="red">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      render: (record: Plan) => (
        <Text strong>${record.price} {record.currency.toUpperCase()}</Text>
      ),
    },
    {
      title: 'Billing Cycle',
      dataIndex: 'billing_cycle',
      key: 'billing_cycle',
      render: (cycle: string) => <Tag>{cycle}</Tag>,
    },
    {
      title: 'Max Validations',
      dataIndex: 'max_validations',
      key: 'max_validations',
      render: (max: number) => max === -1 ? 'Unlimited' : max.toLocaleString(),
    },
    {
      title: 'Max API Calls',
      dataIndex: 'max_api_calls',
      key: 'max_api_calls',
      render: (max: number) => max === -1 ? 'Unlimited' : max.toLocaleString(),
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
          <Tooltip title="Edit Plan">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingPlan(record);
                form.setFieldsValue(record);
                setShowPlanModal(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredBillingRecords = billingRecords.filter(record => {
    const matchesSearch = (record.user?.name && record.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.user?.email && record.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.plan && record.plan.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || record.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = [
    {
      title: 'Total Revenue',
      value: 125430,
      prefix: <DollarOutlined style={{ color: '#52c41a' }} />,
      suffix: 'USD'
    },
    {
      title: 'Active Subscriptions',
      value: 1247,
      prefix: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: 'Monthly Recurring Revenue',
      value: 45680,
      prefix: <RiseOutlined style={{ color: '#722ed1' }} />,
      suffix: 'USD'
    },
    {
      title: 'Churn Rate',
      value: 2.4,
      prefix: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      suffix: '%'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <ReloadOutlined style={{ fontSize: '32px', color: '#2ED8A3', marginBottom: '16px' }} spin />
          <Text>Loading billing data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Billing Management</Title>
          <Text type="secondary">Manage subscriptions, plans, and billing records</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchBillingData}
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
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                valueStyle={{ color: stat.title === 'Churn Rate' ? '#ff4d4f' : '#1890ff' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="billing" items={[
        {
          key: 'billing',
          label: 'Billing Records',
          children: (
            <Card>
              {/* Filters */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Input
                  placeholder="Search users, plans..."
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
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                  <Select.Option value="expired">Expired</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                </Select>
                <Select
                  value={filterPlan}
                  onChange={setFilterPlan}
                  style={{ width: 150 }}
                  placeholder="Plan"
                >
                  <Select.Option value="all">All Plans</Select.Option>
                  {plans.map(plan => (
                    <Select.Option key={plan.id} value={plan.name}>
                      {plan.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button icon={<DownloadOutlined />}>
                  Export
                </Button>
              </div>

              <Table
                columns={billingColumns}
                dataSource={filteredBillingRecords}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
                }}
                scroll={{ x: 1000 }}
              />
            </Card>
          )
        },
        {
          key: 'plans',
          label: 'Subscription Plans',
          children: (
            <Card>
              <Table
                columns={planColumns}
                dataSource={plans}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} plans`,
                }}
                scroll={{ x: 800 }}
              />
            </Card>
          )
        }
      ]} />

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
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingPlan ? handleUpdatePlan : handleCreatePlan}
        >
          <Form.Item
            name="name"
            label="Plan Name"
            rules={[{ required: true, message: 'Please input the plan name!' }]}
          >
            <Input placeholder="Enter plan name" />
          </Form.Item>
          
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
                label="Price"
                rules={[{ required: true, message: 'Please input the price!' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Enter price"
                />
              </Form.Item>
            </Col>
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
          
          <Form.Item
            name="billing_cycle"
            label="Billing Cycle"
            rules={[{ required: true, message: 'Please select billing cycle!' }]}
          >
            <Select>
              <Select.Option value="monthly">Monthly</Select.Option>
              <Select.Option value="yearly">Yearly</Select.Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
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
          </Row>
          
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

export default BillingManagement;
