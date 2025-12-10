import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Typography,
  Tooltip,
  Popconfirm,
  Badge,
  DatePicker,
  Select,
  Steps,
  Divider
} from 'antd';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { billingService, PromoCode, PromoCodeRedemption } from '../../services/billingService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PromoCodesManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<PromoCodeRedemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    activeCodes: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
    mostUsed: null as PromoCode | null
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchRedemptions();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const data = await billingService.getAvailablePromoCodes();
      const codeList = Array.isArray(data) ? data : [];
      setPromoCodes(codeList);
      calculateStats(codeList);
    } catch (error: any) {
      message.error(error.message || 'Failed to load promo codes');
      setPromoCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      const data = await billingService.getPromoCodeRedemptions();
      const redemptionList = Array.isArray(data) ? data : [];
      setRedemptions(redemptionList);
    } catch (error: any) {
      message.error(error.message || 'Failed to load redemptions');
      setRedemptions([]);
    }
  };

  const calculateStats = (codes: PromoCode[]) => {
    const active = codes.filter(c => c.is_active).length;
    const redemptionCounts = redemptions.reduce((acc, r) => {
      const promoCodeId = typeof r.promo_code === 'object' ? r.promo_code.id : String(r.promo_code);
      acc[promoCodeId] = (acc[promoCodeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedId = Object.keys(redemptionCounts).reduce((a, b) =>
      redemptionCounts[a] > redemptionCounts[b] ? a : b, ''
    );
    const mostUsed = codes.find(c => c.id === mostUsedId) || null;

    const totalDiscount = redemptions.reduce((sum, r) => sum + r.discount_amount, 0);

    setStats({
      activeCodes: active,
      totalRedemptions: redemptions.length,
      totalDiscountGiven: totalDiscount,
      mostUsed
    });
  };

  const handleCreate = () => {
    setEditingCode(null);
    setWizardStep(0);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setWizardStep(0);
    form.setFieldsValue({
      ...code,
      valid_from: code.valid_from ? dayjs(code.valid_from) : undefined,
      valid_until: code.valid_until ? dayjs(code.valid_until) : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await billingService.deactivatePromoCode(id);
      message.success('Promo code deactivated successfully');
      fetchPromoCodes();
    } catch (error: any) {
      message.error(error.message || 'Failed to deactivate promo code');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Get all form values to ensure we have data from all steps
      const allValues = form.getFieldsValue();
      const submitData = {
        ...allValues,
        ...values, // Override with any passed values
        valid_from: (allValues.valid_from || values.valid_from) 
          ? (allValues.valid_from || values.valid_from).toISOString() 
          : undefined,
        valid_until: (allValues.valid_until || values.valid_until) 
          ? (allValues.valid_until || values.valid_until).toISOString() 
          : undefined,
      };

      // Remove undefined values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      if (editingCode) {
        await billingService.updatePromoCode(editingCode.id, submitData);
        message.success('Promo code updated successfully');
      } else {
        await billingService.createPromoCode(submitData);
        message.success('Promo code created successfully');
      }
      setModalVisible(false);
      setWizardStep(0);
      form.resetFields();
      fetchPromoCodes();
    } catch (error: any) {
      message.error(error.message || 'Failed to save promo code');
    }
  };

  const columns: ColumnsType<PromoCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text, record) => (
        <Space>
          <Ticket className="w-4 h-4 text-purple-500" />
          <Text strong className="font-mono">{text}</Text>
          {record.is_active && (
            <Badge status="success" text="Active" />
          )}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'discount_type',
      key: 'discount_type',
      render: (type) => {
        const colors: Record<string, string> = {
          percentage: 'blue',
          fixed_amount: 'green',
          free_credits: 'orange'
        };
        return <Tag color={colors[type]}>{type.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => {
        if (record.discount_type === 'percentage') {
          return `${record.discount_value}%`;
        } else if (record.discount_type === 'fixed_amount') {
          return `$${record.discount_value}`;
        } else {
          return `${record.discount_value} credits`;
        }
      },
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <Text>
          {record.current_uses} / {record.max_uses || '∞'}
        </Text>
      ),
    },
    {
      title: 'Valid Period',
      key: 'period',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text className="text-xs">
            From: {dayjs(record.valid_from).format('MMM DD, YYYY')}
          </Text>
          <Text className="text-xs">
            Until: {dayjs(record.valid_until).format('MMM DD, YYYY')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive, record) => {
        const now = dayjs();
        const validFrom = dayjs(record.valid_from);
        const validUntil = dayjs(record.valid_until);
        const isExpired = now.isAfter(validUntil);
        const notStarted = now.isBefore(validFrom);

        if (isExpired) return <Tag color="red">Expired</Tag>;
        if (notStarted) return <Tag color="orange">Not Started</Tag>;
        return <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Deactivate promo code"
            description="Are you sure you want to deactivate this code?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Deactivate">
              <Button
                type="text"
                danger
                icon={<Trash2 className="w-4 h-4" />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const redemptionColumns: ColumnsType<PromoCodeRedemption> = [
    {
      title: 'Code',
      key: 'code',
      render: (_, record) => record.promo_code.code,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Discount',
      dataIndex: 'discount_amount',
      key: 'discount_amount',
      render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Bonus Credits',
      dataIndex: 'bonus_credits',
      key: 'bonus_credits',
      render: (credits) => credits || 0,
    },
    {
      title: 'Applied To',
      key: 'applied_to',
      render: (_, record) => (
        <Tag>{record.applied_to} #{record.applied_to_id}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
  ];

  const steps = [
    { title: 'Basic Info' },
    { title: 'Validity & Limits' },
    { title: 'Applicability' },
    { title: 'Review' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          <Ticket className="w-6 h-6 inline-block mr-2" />
          Promo Codes Management
        </Title>
        <Text type="secondary">Create and manage promotional codes</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Codes"
              value={stats.activeCodes}
              prefix={<Ticket className="w-5 h-5 text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Redemptions"
              value={stats.totalRedemptions}
              prefix={<Users className="w-5 h-5 text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Discount Given"
              value={stats.totalDiscountGiven}
              prefix={<DollarSign className="w-5 h-5 text-purple-500" />}
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Most Used"
              value={stats.mostUsed?.code || 'N/A'}
              prefix={<TrendingUp className="w-5 h-5 text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Promo Codes Table */}
      <Card
        title="Promo Codes"
        extra={
          <Space>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchPromoCodes}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreate}
            >
              Create Promo Code
            </Button>
          </Space>
        }
        className="mb-6"
      >
        <Table
          columns={columns}
          dataSource={Array.isArray(promoCodes) ? promoCodes : []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Redemption History */}
      <Card title="Redemption History">
        <Table
          columns={redemptionColumns}
          dataSource={Array.isArray(redemptions) ? redemptions : []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Modal with Wizard */}
      <Modal
        title={editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setWizardStep(0);
          form.resetFields();
        }}
        onOk={async () => {
          if (wizardStep < 3) {
            // Validate current step before moving to next
            try {
              const fields = wizardStep === 0 
                ? ['code', 'description', 'discount_type', 'discount_value']
                : wizardStep === 1
                ? ['valid_from', 'valid_until', 'max_uses', 'max_uses_per_user', 'min_purchase_amount', 'first_purchase_only']
                : ['applicable_plans', 'applicable_packages'];
              
              await form.validateFields(fields);
              setWizardStep(wizardStep + 1);
            } catch (error) {
              // Validation failed, don't proceed
              console.error('Validation failed:', error);
            }
          } else {
            // Final step - validate all fields and submit
            try {
              await form.validateFields();
              const values = form.getFieldsValue();
              await handleSubmit(values);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }
        }}
        width={700}
        okText={wizardStep < 3 ? 'Next' : 'Save'}
        cancelText={wizardStep > 0 ? 'Back' : 'Cancel'}
      >
        <Steps current={wizardStep} className="mb-6">
          {steps.map(step => (
            <Steps.Step key={step.title} title={step.title} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {wizardStep === 0 && (
            <>
              <Form.Item
                name="code"
                label="Promo Code"
                rules={[
                  { required: true, message: 'Please enter promo code' },
                  { pattern: /^[A-Z0-9]+$/, message: 'Only uppercase letters and numbers allowed' }
                ]}
              >
                <Input placeholder="SAVE20" className="font-mono" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea rows={2} placeholder="Promo code description" />
              </Form.Item>

              <Form.Item
                name="discount_type"
                label="Discount Type"
                rules={[{ required: true, message: 'Please select discount type' }]}
              >
                <Select>
                  <Select.Option value="percentage">Percentage</Select.Option>
                  <Select.Option value="fixed_amount">Fixed Amount</Select.Option>
                  <Select.Option value="free_credits">Free Credits</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="discount_value"
                label="Discount Value"
                rules={[{ required: true, message: 'Please enter discount value' }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="20"
                />
              </Form.Item>
            </>
          )}

          {wizardStep === 1 && (
            <>
              <Form.Item
                name="valid_from"
                label="Valid From"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="valid_until"
                label="Valid Until"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="max_uses"
                label="Max Uses (Total)"
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="Leave empty for unlimited"
                />
              </Form.Item>

              <Form.Item
                name="max_uses_per_user"
                label="Max Uses Per User"
                rules={[{ required: true, message: 'Please enter max uses per user' }]}
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="1"
                />
              </Form.Item>

              <Form.Item
                name="min_purchase_amount"
                label="Minimum Purchase Amount"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  className="w-full"
                  placeholder="0.00"
                />
              </Form.Item>

              <Form.Item
                name="first_purchase_only"
                valuePropName="checked"
                label="First Purchase Only"
              >
                <Switch />
              </Form.Item>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <Form.Item
                name="applicable_plans"
                label="Applicable Plans (Leave empty for all)"
              >
                <Select mode="multiple" placeholder="Select plans">
                  {/* Plans would be loaded from API */}
                </Select>
              </Form.Item>

              <Form.Item
                name="applicable_packages"
                label="Applicable Packages (Leave empty for all)"
              >
                <Select mode="multiple" placeholder="Select packages">
                  {/* Packages would be loaded from API */}
                </Select>
              </Form.Item>

              <Form.Item
                name="is_active"
                valuePropName="checked"
                initialValue={true}
                label="Active"
              >
                <Switch />
              </Form.Item>
            </>
          )}

          {wizardStep === 3 && (
            <div>
              <Text>Review your promo code settings before creating.</Text>
              {/* Review summary would go here */}
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PromoCodesManagement;

