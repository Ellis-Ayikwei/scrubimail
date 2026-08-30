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
  message,
  Typography,
  Tooltip,
  Switch,
  Tabs
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  RiseOutlined,
  PlusOutlined,
  WalletOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';
import { billingService, CreditTransaction, BillingStats } from '../../services/billingService';

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
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [form] = Form.useForm();
  const [adjustForm] = Form.useForm();

  const { Title, Text } = Typography;

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txns, statsData, plansRes] = await Promise.all([
        billingService.getBillingTransactions(),
        billingService.getBillingStats().catch(() => null),
        axiosInstance.get('/admin/plans/')
      ]);
      setTransactions(Array.isArray(txns) ? txns : []);
      setBillingStats(statsData);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
    } catch (err: any) {
      setError('Failed to fetch billing data');
      console.error('Error fetching billing data:', err);
      setTransactions([]);
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

  // Adjust a user's credit balance: POST /admin/billing/adjust/ {user_id, amount, reason}
  const handleAdjustCredits = async (values: any) => {
    setAdjusting(true);
    try {
      const res = await billingService.adjustCredits(
        values.user_id,
        Number(values.amount),
        values.reason
      );
      message.success(res.detail || 'Credits adjusted successfully');
      setShowAdjustModal(false);
      adjustForm.resetFields();
      fetchBillingData();
    } catch (err: any) {
      message.error(err.message || 'Failed to adjust credits');
    } finally {
      setAdjusting(false);
    }
  };

  const transactionTypeColor = (type: string): string => {
    const map: Record<string, string> = {
      purchase: 'green',
      grant: 'green',
      deduction: 'red',
      usage: 'orange',
      refund: 'blue',
      manual_reset: 'purple',
      expiration: 'default',
    };
    return map[type] || 'blue';
  };

  const billingColumns = [
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      render: (type: string) => (
        <Tag color={transactionTypeColor(type)}>{(type || '').replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount >= 0 ? '+' : ''}{amount?.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <Text>{desc || '-'}</Text>,
    },
    {
      title: 'Reference',
      dataIndex: 'paystack_payment_reference',
      key: 'paystack_payment_reference',
      render: (ref: string | null) => ref ? <Text code>{ref}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
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
        <Text strong>${record.price} {record.currency?.toUpperCase()}</Text>
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
      render: (max: number) => max === -1 ? 'Unlimited' : max?.toLocaleString(),
    },
    {
      title: 'Max API Calls',
      dataIndex: 'max_api_calls',
      key: 'max_api_calls',
      render: (max: number) => max === -1 ? 'Unlimited' : max?.toLocaleString(),
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

  const filteredTransactions = transactions.filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (record.description && record.description.toLowerCase().includes(term)) ||
      (record.transaction_type && record.transaction_type.toLowerCase().includes(term)) ||
      (record.paystack_payment_reference && record.paystack_payment_reference.toLowerCase().includes(term));

    const matchesType = filterType === 'all' || record.transaction_type === filterType;

    return matchesSearch && matchesType;
  });

  const transactionTypes = Array.from(new Set(transactions.map(t => t.transaction_type).filter(Boolean)));

  const stats = [
    {
      title: 'Total Revenue',
      value: billingStats?.total_revenue ?? 0,
      prefix: <DollarOutlined style={{ color: '#52c41a' }} />,
    },
    {
      title: 'Total Transactions',
      value: transactions.length,
      prefix: <RiseOutlined style={{ color: '#722ed1' }} />,
    },
    {
      title: 'Total Plans',
      value: plans.length,
      prefix: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: 'Active Plans',
      value: plans.filter(p => p.is_active).length,
      prefix: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
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
          <Text type="secondary">Manage credit transactions, plans, and billing records</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchBillingData}
          >
            Refresh
          </Button>
          <Button
            icon={<WalletOutlined />}
            onClick={() => setShowAdjustModal(true)}
          >
            Adjust Credits
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
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="billing" items={[
        {
          key: 'billing',
          label: 'Credit Transactions',
          children: (
            <Card>
              {/* Filters */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Input
                  placeholder="Search description, reference, type..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 300 }}
                />
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: 180 }}
                  placeholder="Transaction Type"
                >
                  <Select.Option value="all">All Types</Select.Option>
                  {transactionTypes.map(type => (
                    <Select.Option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </Select.Option>
                  ))}
                </Select>
                <Button icon={<DownloadOutlined />}>
                  Export
                </Button>
              </div>

              <Table
                rowKey="id"
                columns={billingColumns}
                dataSource={Array.isArray(filteredTransactions) ? filteredTransactions : []}
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
                rowKey="id"
                columns={planColumns}
                dataSource={Array.isArray(plans) ? plans : []}
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

      {/* Adjust Credits Modal */}
      <Modal
        title="Adjust User Credits"
        open={showAdjustModal}
        onCancel={() => {
          setShowAdjustModal(false);
          adjustForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={adjustForm}
          layout="vertical"
          onFinish={handleAdjustCredits}
        >
          <Form.Item
            name="user_id"
            label="User ID (UUID)"
            rules={[{ required: true, message: 'Please enter the user id' }]}
          >
            <Input placeholder="Enter user UUID" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (use a negative value to deduct)"
            rules={[{ required: true, message: 'Please enter an amount' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="e.g. 100 or -50" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
          >
            <Input.TextArea rows={2} placeholder="Reason for adjustment" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowAdjustModal(false);
                adjustForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={adjusting}>
                Apply Adjustment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
