import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  Select,
  DatePicker
} from 'antd';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Star,
  Eye,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { billingService, CreditPackage, CreditPackagePurchase } from '../../services/billingService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === '') return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const n = Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function formatUsd(value: unknown): string {
  const n = parseMoney(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

const CreditPackagesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [purchases, setPurchases] = useState<CreditPackagePurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPurchases: 0,
    activePackages: 0,
    mostPopular: null as CreditPackage | null
  });

  useEffect(() => {
    fetchPackages();
    fetchPurchases();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const data = await billingService.getCreditPackages();
      const packageList = Array.isArray(data) ? data : [];
      setPackages(packageList);
      calculateStats(packageList);
    } catch (error: any) {
      message.error(error.message || 'Failed to load credit packages');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setPurchaseLoading(true);
    try {
      const data = await billingService.getCreditPackagePurchases();
      const purchaseList = Array.isArray(data) ? data : [];
      setPurchases(purchaseList);
    } catch (error: any) {
      message.error(error.message || 'Failed to load purchases');
      setPurchases([]);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const calculateStats = (pkgList: CreditPackage[]) => {
    const active = pkgList.filter(p => p.is_active).length;
    // `package` is the FK id (UUID string); fall back to nested details if present.
    const purchaseCounts = purchases.reduce((acc, p) => {
      const pkgId = p.package || p.package_details?.id || '';
      if (pkgId) acc[pkgId] = (acc[pkgId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopularId = Object.keys(purchaseCounts).reduce((a, b) =>
      purchaseCounts[a] > purchaseCounts[b] ? a : b, ''
    );
    const mostPopular = pkgList.find(p => p.id === mostPopularId) || null;

    const totalRevenue = purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => {
        const n = parseMoney(p.amount_paid);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);

    setStats({
      totalRevenue,
      totalPurchases: purchases.length,
      activePackages: active,
      mostPopular
    });
  };

  const handleCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      ...pkg,
      expiry_days: pkg.expiry_days || undefined
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await billingService.deleteCreditPackage(id);
      message.success('Package deleted successfully');
      fetchPackages();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete package');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPackage) {
        await billingService.updateCreditPackage(editingPackage.id, values);
        message.success('Package updated successfully');
      } else {
        await billingService.createCreditPackage(values);
        message.success('Package created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchPackages();
    } catch (error: any) {
      message.error(error.message || 'Failed to save package');
    }
  };

  const columns: ColumnsType<CreditPackage> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Package className="w-4 h-4 text-blue-500" />
          <Text strong>{text}</Text>
          {record.is_featured && (
            <Badge count={<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />} />
          )}
        </Space>
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      render: (credits) => (
        <Text className="font-semibold text-blue-600">{credits.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, record) => {
        const priceN = parseMoney(record?.price);
        const origN = parseMoney(record?.original_price);
        return (
        <Space direction="vertical" size={0}>
          <Text className="text-lg font-bold text-gray-900">
            ${Number.isFinite(priceN) ? priceN.toFixed(2) : '0.00'}
          </Text>
          {Number.isFinite(origN) && Number.isFinite(priceN) && origN > priceN && (
            <Text delete className="text-sm text-gray-500">
              ${origN.toFixed(2)}
            </Text>
          )}
          {record.discount_percentage > 0 && (
            <Tag color="red">-{record.discount_percentage}%</Tag>
          )}
        </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiry_days',
      key: 'expiry_days',
      render: (days) => days ? `${days} days` : 'No expiry',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete package"
            description="Are you sure you want to delete this package?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
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

  const purchaseColumns: ColumnsType<CreditPackagePurchase> = [
    {
      title: 'Package',
      key: 'package',
      render: (_, record) => record.package_details?.name || '—',
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => {
        const userId = record.user_details?.id || record.user;
        const label =
          record.user_details?.full_name ||
          record.user_details?.email ||
          (userId ? `${userId.slice(0, 8)}…` : '—');

        if (!userId) return <Text type="secondary">—</Text>;

        return (
          <Button
            type="link"
            className="px-0"
            onClick={() => navigate(`/admin/users/${userId}`)}
          >
            {label}
          </Button>
        );
      },
    },
    {
      title: 'Credits',
      dataIndex: 'credits_purchased',
      key: 'credits_purchased',
      render: (credits) => credits.toLocaleString(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount_paid',
      key: 'amount_paid',
      render: (amount) => `$${formatUsd(amount)}`,
    },
    {
      title: 'Promo Code',
      dataIndex: 'promo_code',
      key: 'promo_code',
      render: (code) => code ? <Tag>{code}</Tag> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          completed: 'green',
          pending: 'orange',
          failed: 'red'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          <Package className="w-6 h-6 inline-block mr-2" />
          Credit Packages Management
        </Title>
        <Text type="secondary">Manage credit packages and track purchase history</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarSign className="w-5 h-5 text-green-500" />}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Purchases"
              value={stats.totalPurchases}
              prefix={<ShoppingCart className="w-5 h-5 text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Packages"
              value={stats.activePackages}
              prefix={<Package className="w-5 h-5 text-purple-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Most Popular"
              value={stats.mostPopular?.name || 'N/A'}
              prefix={<TrendingUp className="w-5 h-5 text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Packages Table */}
      <Card
        title="Credit Packages"
        extra={
          <Space>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchPackages}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreate}
            >
              Create Package
            </Button>
          </Space>
        }
        className="mb-6"
      >
        <Table
          columns={columns}
          dataSource={Array.isArray(packages) ? packages : []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Purchase History */}
      <Card
        title="Purchase History"
        extra={
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchPurchases}
          >
            Refresh
          </Button>
        }
      >
          <Table
            columns={purchaseColumns}
            dataSource={Array.isArray(purchases) ? purchases : []}
            rowKey="id"
            loading={purchaseLoading}
            pagination={{ pageSize: 10 }}
          />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingPackage ? 'Edit Package' : 'Create Package'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Package Name"
            rules={[{ required: true, message: 'Please enter package name' }]}
          >
            <Input placeholder="e.g., Starter Package" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Package description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="credits"
                label="Credits"
                rules={[{ required: true, message: 'Please enter credits' }]}
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="1000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price ($)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  className="w-full"
                  placeholder="9.99"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="original_price"
                label="Original Price ($)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  className="w-full"
                  placeholder="19.99"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiry_days"
                label="Expiry Days"
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="90 (optional)"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_featured"
            valuePropName="checked"
            label="Featured Package"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="is_active"
            valuePropName="checked"
            initialValue={true}
            label="Active"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreditPackagesManagement;

