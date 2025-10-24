import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Dropdown, 
    Menu, 
    Modal, 
    Form, 
    Select, 
    message,
    Typography,
    Badge,
    Tooltip
} from 'antd';
import axiosInstance from '../../services/axiosInstance';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    FilterOutlined,
    DownloadOutlined,
    MailOutlined,
    UserOutlined,
    TeamOutlined,
    RiseOutlined,
    MoreOutlined,
    StopOutlined
} from '@ant-design/icons';

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
}

const AdminUsers: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        new: 0,
        suspended: 0
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/admin/users/');
            const userData = Array.isArray(response.data) ? response.data : [];
            
            // Normalize user data to ensure all required fields exist
            const normalizedUsers: User[] = userData.map(user => ({
                id: user.id || '',
                name: user.name || user.first_name || user.username || 'Unknown',
                email: user.email || '',
                role: user.role || user.user_type || 'User',
                status: user.is_active ? 'active' as const : 'inactive' as const,
                joinDate: user.date_joined || user.created_at || new Date().toISOString(),
                lastActive: user.last_login || user.updated_at || new Date().toISOString(),
                plan: user.plan || user.subscription_plan || 'Free',
                avatar: user.avatar || user.profile_picture || undefined
            }));
            
            setUsers(normalizedUsers);
            
            // Calculate stats
            const total = normalizedUsers.length;
            const active = normalizedUsers.filter(user => user.status === 'active').length;
            const newUsers = normalizedUsers.filter(user => {
                const joinDate = new Date(user.joinDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return joinDate > thirtyDaysAgo;
            }).length;
            const suspended = normalizedUsers.filter(user => user.status === 'suspended').length;
            
            setStats({ total, active, new: newUsers, suspended });
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Failed to fetch users. Using mock data for demonstration.');
            
            // Fallback to mock data for demonstration
            const mockUsers: User[] = [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    role: 'Admin',
                    status: 'active',
                    joinDate: '2023-01-15',
                    lastActive: '2 hours ago',
                    plan: 'Premium',
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    email: 'jane.smith@example.com',
                    role: 'User',
                    status: 'active',
                    joinDate: '2023-02-20',
                    lastActive: '5 minutes ago',
                    plan: 'Basic',
                },
                {
                    id: '3',
                    name: 'Bob Johnson',
                    email: 'bob.johnson@example.com',
                    role: 'User',
                    status: 'inactive',
                    joinDate: '2023-03-10',
                    lastActive: '3 days ago',
                    plan: 'Pro',
                }
            ];
            
            setUsers(mockUsers);
            setStats({ 
                total: mockUsers.length, 
                active: mockUsers.filter(u => u.status === 'active').length, 
                new: 1, 
                suspended: 0 
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const { Title, Text } = Typography;

    // Filter users based on search
    const filteredUsers = users.filter((user) => {
        const searchTerm = search.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.role && user.role.toLowerCase().includes(searchTerm))
        );
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue(user);
        setIsModalVisible(true);
    };

    const handleDelete = (user: User) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this user?',
            content: `This will permanently delete ${user.name} and all their data.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await axiosInstance.delete(`/admin/users/${user.id}/`);
                    message.success('User deleted successfully');
                    fetchUsers();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    message.error('Failed to delete user');
                }
            },
        });
    };

    const handleView = (user: User) => {
        navigate(`/admin/users/${user.id}`);
    };

    const handleBulkAction = (action: string) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Please select users first');
            return;
        }
        message.success(`${action} action performed on ${selectedRowKeys.length} users`);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                await axiosInstance.patch(`/admin/users/${editingUser.id}/`, values);
                message.success('User updated successfully');
            } else {
                await axiosInstance.post('/admin/users/', values);
                message.success('User created successfully');
            }
            setIsModalVisible(false);
            form.resetFields();
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            message.error('Failed to save user');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingUser(null);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar 
                        src={record.avatar} 
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{text || 'Unknown'}</div>
                        <Text type="secondary">{record.email || 'No email'}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                const safeRole = role || 'User';
                const color = safeRole === 'Admin' ? 'red' : safeRole === 'Moderator' ? 'blue' : 'default';
                return <Tag color={color}>{safeRole}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const safeStatus = status || 'inactive';
                const color = safeStatus === 'active' ? 'green' : safeStatus === 'inactive' ? 'default' : 'red';
                return <Tag color={color}>{safeStatus}</Tag>;
            },
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
        },
        {
            title: 'Join Date',
            dataIndex: 'joinDate',
            key: 'joinDate',
            render: (date: string) => {
                try {
                    return new Date(date).toLocaleDateString();
                } catch (error) {
                    return 'Invalid date';
                }
            },
        },
        {
            title: 'Last Active',
            dataIndex: 'lastActive',
            key: 'lastActive',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text: string, record: User) => (
                <Space>
                    <Tooltip title="View">
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Users Management</Title>
                    <Text type="secondary">Manage your platform users and their permissions</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />}>
                    Add New User
                </Button>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Users"
                            value={stats.total}
                            prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Active Users"
                            value={stats.active}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<Badge status="success" />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="New This Month"
                            value={stats.new}
                            prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Suspended"
                            value={stats.suspended}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<StopOutlined style={{ color: '#cf1322' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Actions */}
            <Card>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <Input
                            placeholder="Search users..."
                            prefix={<SearchOutlined />}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                            style={{ width: 300 }}
                        />
                        <Button icon={<FilterOutlined />}>
                                    Filters
                        </Button>
                        <Button icon={<DownloadOutlined />}>
                                    Export
                        </Button>
                    </Space>

                        {/* Bulk Actions */}
                    {selectedRowKeys.length > 0 && (
                        <Space>
                            <Button 
                                icon={<MailOutlined />}
                                    onClick={() => handleBulkAction('email')}
                                >
                                    Email Selected
                            </Button>
                            <Button 
                                danger 
                                icon={<DeleteOutlined />}
                                    onClick={() => handleBulkAction('delete')}
                                >
                                    Delete Selected
                            </Button>
                        </Space>
                        )}
                </div>

                {/* Data Table */}
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowSelection={rowSelection}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Edit User Modal */}
            <Modal
                title={editingUser ? 'Edit User' : 'Add New User'}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={editingUser || undefined}
                >
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please input the full name!' }]}
                    >
                        <Input placeholder="Enter full name" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input the email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="Enter email address" />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                    >
                        <Select placeholder="Select role">
                            <Select.Option value="Admin">Admin</Select.Option>
                            <Select.Option value="Moderator">Moderator</Select.Option>
                            <Select.Option value="User">User</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: 'Please select a status!' }]}
                    >
                        <Select placeholder="Select status">
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
                            <Select.Option value="suspended">Suspended</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="plan"
                        label="Plan"
                        rules={[{ required: true, message: 'Please select a plan!' }]}
                    >
                        <Select placeholder="Select plan">
                            <Select.Option value="Basic">Basic</Select.Option>
                            <Select.Option value="Premium">Premium</Select.Option>
                            <Select.Option value="Pro">Pro</Select.Option>
                            <Select.Option value="Enterprise">Enterprise</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminUsers;