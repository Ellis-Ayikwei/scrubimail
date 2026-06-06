import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Space,
  Tag,
  Typography,
  Divider,
  Statistic,
  Timeline,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Tabs,
  Badge,
  Tooltip,
  Popconfirm,
  Descriptions
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DollarOutlined,
  KeyOutlined,
  SafetyOutlined,
  HistoryOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastActive: string;
  plan: string;
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
  preferences?: any;
  billingInfo?: any;
  validationHistory?: any[];
  apiKeys?: any[];
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/users/${id}/`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      message.error('Failed to fetch user details');
      // Fallback to mock data
      setUser({
        id: id || '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        status: 'active',
        joinDate: '2023-01-15T10:30:00Z',
        lastActive: '2023-12-15T14:30:00Z',
        plan: 'Premium',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, New York, NY 10001',
        bio: 'Experienced developer with 5+ years in web development.',
        preferences: {
          notifications: true,
          theme: 'light',
          language: 'en'
        },
        billingInfo: {
          totalSpent: 1250.00,
          lastPayment: '2023-12-01',
          nextBilling: '2024-01-01',
          paymentMethod: 'Credit Card ****1234'
        },
        validationHistory: [
          { id: 1, email: 'test@example.com', status: 'valid', date: '2023-12-15' },
          { id: 2, email: 'invalid@test.com', status: 'invalid', date: '2023-12-14' }
        ],
        apiKeys: [
          { id: 1, name: 'Production API', key: '****1234', status: 'active' },
          { id: 2, name: 'Development API', key: '****5678', status: 'active' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleEdit = () => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        plan: user.plan,
        phone: user.phone,
        address: user.address,
        bio: user.bio
      });
      setEditModalVisible(true);
    }
  };

  const handleSave = async (values: any) => {
    try {
      await axiosInstance.patch(`/admin/users/${id}/`, values);
      message.success('User updated successfully');
      setEditModalVisible(false);
      fetchUser();
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Failed to update user');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone and will permanently delete all user data.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axiosInstance.delete(`/admin/users/${id}/`);
          message.success('User deleted successfully');
          navigate('/admin/users');
        } catch (error) {
          console.error('Error deleting user:', error);
          message.error('Failed to delete user');
        }
      },
    });
  };

  const handleStatusChange = async (status: string) => {
    try {
      await axiosInstance.patch(`/admin/users/${id}/`, { status });
      message.success(`User status changed to ${status}`);
      fetchUser();
    } catch (error) {
      console.error('Error updating user status:', error);
      message.error('Failed to update user status');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const validationColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'valid' ? 'green' : 'red'}>
          {status === 'valid' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => moment(date).format('MMM DD, YYYY'),
    },
  ];

  const apiKeyColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <Text code copyable>{key}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/admin/users')}
          >
            Back to Users
          </Button>
          <div>
            <Title level={2} style={{ margin: 0 }}>User Details</Title>
            <Text type="secondary">Manage user information and activity</Text>
          </div>
        </div>
        <Space>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            Edit User
          </Button>
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* User Profile Card */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Avatar 
                size={120} 
                src={user.avatar} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <Title level={3} style={{ marginTop: '16px', marginBottom: '8px' }}>
                {user.name}
              </Title>
              <Text type="secondary">{user.email}</Text>
              <div style={{ marginTop: '16px' }}>
                <Tag color={user.status === 'active' ? 'green' : 'red'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {user.status}
                </Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} md={18}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Role"
                  value={user.role}
                  prefix={<SafetyOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Plan"
                  value={user.plan}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Member Since"
                  value={moment(user.joinDate).format('MMM YYYY')}
                  prefix={<CalendarOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Descriptions column={2}>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {user.phone || 'Not provided'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Active">
                {moment(user.lastActive).fromNow()}
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {user.address || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Bio" span={2}>
                {user.bio || 'No bio provided'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="Billing Information" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Total Spent">
                      ${user.billingInfo?.totalSpent || 0}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Payment">
                      {user.billingInfo?.lastPayment || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Next Billing">
                      {user.billingInfo?.nextBilling || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Method">
                      {user.billingInfo?.paymentMethod || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="Preferences" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Notifications">
                      <Switch 
                        checked={user.preferences?.notifications} 
                        disabled 
                        size="small"
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Theme">
                      {user.preferences?.theme || 'light'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Language">
                      {user.preferences?.language || 'en'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="Validation History" key="validations">
            <Table
              columns={validationColumns}
              dataSource={user.validationHistory || []}
              pagination={false}
              size="small"
            />
          </TabPane>
          
          <TabPane tab="API Keys" key="apikeys">
            <Table
              columns={apiKeyColumns}
              dataSource={user.apiKeys || []}
              pagination={false}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select>
                  <Select.Option value="Admin">Admin</Select.Option>
                  <Select.Option value="User">User</Select.Option>
                  <Select.Option value="Moderator">Moderator</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                  <Select.Option value="suspended">Suspended</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="plan"
                label="Plan"
                rules={[{ required: true, message: 'Please select plan' }]}
              >
                <Select>
                  <Select.Option value="Free">Free</Select.Option>
                  <Select.Option value="Basic">Basic</Select.Option>
                  <Select.Option value="Pro">Pro</Select.Option>
                  <Select.Option value="Premium">Premium</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="bio"
            label="Bio"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserDetail;
