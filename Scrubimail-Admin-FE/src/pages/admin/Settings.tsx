import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Switch,
    Button,
    Select,
    InputNumber,
    Divider,
    Typography,
    Space,
    message,
    Tabs,
    Row,
    Col,
    Alert,
    Spin
} from 'antd';
import {
    Settings,
    Mail,
    CreditCard,
    Key,
    Bell,
    Shield,
    Server,
    Save,
    RefreshCw,
    Globe,
    Database,
    Lock,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SettingsData {
    general: {
        site_name: string;
        site_url: string;
        admin_email: string;
        support_email: string;
        timezone: string;
        language: string;
        maintenance_mode: boolean;
    };
    email: {
        smtp_host: string;
        smtp_port: number;
        smtp_username: string;
        smtp_password: string;
        smtp_use_tls: boolean;
        from_email: string;
        from_name: string;
    };
    payment: {
        payment_gateway: string;
        paystack_public_key: string;
        paystack_secret_key: string;
        stripe_public_key: string;
        stripe_secret_key: string;
        currency: string;
        enable_payments: boolean;
    };
    api: {
        rate_limit_per_minute: number;
        rate_limit_per_hour: number;
        rate_limit_per_day: number;
        api_key_expiry_days: number;
        require_api_key: boolean;
    };
    notifications: {
        email_notifications: boolean;
        admin_notifications: boolean;
        user_registration_notification: boolean;
        payment_notification: boolean;
        validation_notification: boolean;
    };
    security: {
        password_min_length: number;
        require_strong_password: boolean;
        session_timeout: number;
        two_factor_auth: boolean;
        ip_whitelist: string;
    };
    system: {
        max_file_size: number;
        allowed_file_types: string;
        backup_frequency: string;
        log_retention_days: number;
        debug_mode: boolean;
    };
}

const AdminSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [form] = Form.useForm();

    const [settings, setSettings] = useState<SettingsData>({
        general: {
            site_name: 'ScrubiMail',
            site_url: 'https://scrubimail.com',
            admin_email: 'admin@scrubimail.com',
            support_email: 'support@scrubimail.com',
            timezone: 'UTC',
            language: 'en',
            maintenance_mode: false
        },
        email: {
            smtp_host: '',
            smtp_port: 587,
            smtp_username: '',
            smtp_password: '',
            smtp_use_tls: true,
            from_email: 'noreply@scrubimail.com',
            from_name: 'ScrubiMail'
        },
        payment: {
            payment_gateway: 'paystack',
            paystack_public_key: '',
            paystack_secret_key: '',
            stripe_public_key: '',
            stripe_secret_key: '',
            currency: 'USD',
            enable_payments: true
        },
        api: {
            rate_limit_per_minute: 60,
            rate_limit_per_hour: 1000,
            rate_limit_per_day: 10000,
            api_key_expiry_days: 365,
            require_api_key: true
        },
        notifications: {
            email_notifications: true,
            admin_notifications: true,
            user_registration_notification: true,
            payment_notification: true,
            validation_notification: true
        },
        security: {
            password_min_length: 8,
            require_strong_password: true,
            session_timeout: 24,
            two_factor_auth: false,
            ip_whitelist: ''
        },
        system: {
            max_file_size: 10,
            allowed_file_types: 'pdf,doc,docx,xls,xlsx',
            backup_frequency: 'daily',
            log_retention_days: 30,
            debug_mode: false
        }
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API endpoint when available
            // const response = await axiosInstance.get('/admin/settings/');
            // setSettings(response.data);
            message.info('Settings loaded (using default values)');
        } catch (error: any) {
            message.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            // TODO: Replace with actual API endpoint when available
            // await axiosInstance.put('/admin/settings/', values);
            message.success('Settings saved successfully');
            setSettings({ ...settings, ...values });
        } catch (error: any) {
            message.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        form.setFieldsValue(settings);
    }, []);

    const tabItems = [
        {
            key: 'general',
            label: (
                <Space>
                    <Globe className="w-4 h-4" />
                    General
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.general}
                        onFinish={(values) => handleSave({ general: values })}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="site_name"
                                    label="Site Name"
                                    rules={[{ required: true, message: 'Please enter site name' }]}
                                >
                                    <Input placeholder="ScrubiMail" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="site_url"
                                    label="Site URL"
                                    rules={[{ required: true, message: 'Please enter site URL' }]}
                                >
                                    <Input placeholder="https://scrubimail.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="admin_email"
                                    label="Admin Email"
                                    rules={[
                                        { required: true, message: 'Please enter admin email' },
                                        { type: 'email', message: 'Please enter a valid email' }
                                    ]}
                                >
                                    <Input placeholder="admin@scrubimail.com" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="support_email"
                                    label="Support Email"
                                    rules={[
                                        { required: true, message: 'Please enter support email' },
                                        { type: 'email', message: 'Please enter a valid email' }
                                    ]}
                                >
                                    <Input placeholder="support@scrubimail.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="timezone"
                                    label="Timezone"
                                    rules={[{ required: true, message: 'Please select timezone' }]}
                                >
                                    <Select>
                                        <Select.Option value="UTC">UTC</Select.Option>
                                        <Select.Option value="America/New_York">America/New_York</Select.Option>
                                        <Select.Option value="America/Los_Angeles">America/Los_Angeles</Select.Option>
                                        <Select.Option value="Europe/London">Europe/London</Select.Option>
                                        <Select.Option value="Asia/Tokyo">Asia/Tokyo</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="language"
                                    label="Default Language"
                                    rules={[{ required: true, message: 'Please select language' }]}
                                >
                                    <Select>
                                        <Select.Option value="en">English</Select.Option>
                                        <Select.Option value="es">Spanish</Select.Option>
                                        <Select.Option value="fr">French</Select.Option>
                                        <Select.Option value="de">German</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="maintenance_mode"
                            label="Maintenance Mode"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save General Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'email',
            label: (
                <Space>
                    <Mail className="w-4 h-4" />
                    Email
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.email}
                        onFinish={(values) => handleSave({ email: values })}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="smtp_host"
                                    label="SMTP Host"
                                    rules={[{ required: true, message: 'Please enter SMTP host' }]}
                                >
                                    <Input placeholder="smtp.gmail.com" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="smtp_port"
                                    label="SMTP Port"
                                    rules={[{ required: true, message: 'Please enter SMTP port' }]}
                                >
                                    <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="587" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="smtp_username"
                                    label="SMTP Username"
                                    rules={[{ required: true, message: 'Please enter SMTP username' }]}
                                >
                                    <Input placeholder="your-email@gmail.com" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="smtp_password"
                                    label="SMTP Password"
                                    rules={[{ required: true, message: 'Please enter SMTP password' }]}
                                >
                                    <Input.Password placeholder="••••••••" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="from_email"
                                    label="From Email"
                                    rules={[
                                        { required: true, message: 'Please enter from email' },
                                        { type: 'email', message: 'Please enter a valid email' }
                                    ]}
                                >
                                    <Input placeholder="noreply@scrubimail.com" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="from_name"
                                    label="From Name"
                                    rules={[{ required: true, message: 'Please enter from name' }]}
                                >
                                    <Input placeholder="ScrubiMail" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="smtp_use_tls"
                            label="Use TLS"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save Email Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'payment',
            label: (
                <Space>
                    <CreditCard className="w-4 h-4" />
                    Payment
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.payment}
                        onFinish={(values) => handleSave({ payment: values })}
                    >
                        <Form.Item
                            name="payment_gateway"
                            label="Payment Gateway"
                            rules={[{ required: true, message: 'Please select payment gateway' }]}
                        >
                            <Select>
                                <Select.Option value="paystack">Paystack</Select.Option>
                                <Select.Option value="stripe">Stripe</Select.Option>
                                <Select.Option value="paypal">PayPal</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="currency"
                            label="Default Currency"
                            rules={[{ required: true, message: 'Please select currency' }]}
                        >
                            <Select>
                                <Select.Option value="USD">USD - US Dollar</Select.Option>
                                <Select.Option value="EUR">EUR - Euro</Select.Option>
                                <Select.Option value="GBP">GBP - British Pound</Select.Option>
                                <Select.Option value="NGN">NGN - Nigerian Naira</Select.Option>
                            </Select>
                        </Form.Item>

                        <Divider>Paystack Settings</Divider>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="paystack_public_key"
                                    label="Paystack Public Key"
                                >
                                    <Input.Password placeholder="Enter Paystack public key" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="paystack_secret_key"
                                    label="Paystack Secret Key"
                                >
                                    <Input.Password placeholder="Enter Paystack secret key" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider>Stripe Settings</Divider>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="stripe_public_key"
                                    label="Stripe Public Key"
                                >
                                    <Input.Password placeholder="Enter Stripe public key" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="stripe_secret_key"
                                    label="Stripe Secret Key"
                                >
                                    <Input.Password placeholder="Enter Stripe secret key" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="enable_payments"
                            label="Enable Payments"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save Payment Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'api',
            label: (
                <Space>
                    <Key className="w-4 h-4" />
                    API
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.api}
                        onFinish={(values) => handleSave({ api: values })}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="rate_limit_per_minute"
                                    label="Rate Limit (per minute)"
                                    rules={[{ required: true, message: 'Please enter rate limit' }]}
                                >
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="rate_limit_per_hour"
                                    label="Rate Limit (per hour)"
                                    rules={[{ required: true, message: 'Please enter rate limit' }]}
                                >
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="rate_limit_per_day"
                                    label="Rate Limit (per day)"
                                    rules={[{ required: true, message: 'Please enter rate limit' }]}
                                >
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="api_key_expiry_days"
                            label="API Key Expiry (days)"
                            rules={[{ required: true, message: 'Please enter expiry days' }]}
                        >
                            <InputNumber min={1} max={3650} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="require_api_key"
                            label="Require API Key for Validation"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save API Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'notifications',
            label: (
                <Space>
                    <Bell className="w-4 h-4" />
                    Notifications
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.notifications}
                        onFinish={(values) => handleSave({ notifications: values })}
                    >
                        <Form.Item
                            name="email_notifications"
                            label="Enable Email Notifications"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name="admin_notifications"
                            label="Admin Notifications"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Divider>Notification Types</Divider>

                        <Form.Item
                            name="user_registration_notification"
                            label="User Registration Notifications"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name="payment_notification"
                            label="Payment Notifications"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name="validation_notification"
                            label="Validation Notifications"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save Notification Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'security',
            label: (
                <Space>
                    <Shield className="w-4 h-4" />
                    Security
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.security}
                        onFinish={(values) => handleSave({ security: values })}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="password_min_length"
                                    label="Minimum Password Length"
                                    rules={[{ required: true, message: 'Please enter minimum length' }]}
                                >
                                    <InputNumber min={6} max={32} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="session_timeout"
                                    label="Session Timeout (hours)"
                                    rules={[{ required: true, message: 'Please enter session timeout' }]}
                                >
                                    <InputNumber min={1} max={168} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="require_strong_password"
                            label="Require Strong Password"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name="two_factor_auth"
                            label="Enable Two-Factor Authentication"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name="ip_whitelist"
                            label="IP Whitelist (comma-separated)"
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="192.168.1.1, 10.0.0.1"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save Security Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'system',
            label: (
                <Space>
                    <Server className="w-4 h-4" />
                    System
                </Space>
            ),
            children: (
                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={settings.system}
                        onFinish={(values) => handleSave({ system: values })}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="max_file_size"
                                    label="Max File Size (MB)"
                                    rules={[{ required: true, message: 'Please enter max file size' }]}
                                >
                                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="log_retention_days"
                                    label="Log Retention (days)"
                                    rules={[{ required: true, message: 'Please enter retention days' }]}
                                >
                                    <InputNumber min={1} max={365} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="allowed_file_types"
                            label="Allowed File Types (comma-separated)"
                            rules={[{ required: true, message: 'Please enter allowed file types' }]}
                        >
                            <Input placeholder="pdf,doc,docx,xls,xlsx" />
                        </Form.Item>

                        <Form.Item
                            name="backup_frequency"
                            label="Backup Frequency"
                            rules={[{ required: true, message: 'Please select backup frequency' }]}
                        >
                            <Select>
                                <Select.Option value="hourly">Hourly</Select.Option>
                                <Select.Option value="daily">Daily</Select.Option>
                                <Select.Option value="weekly">Weekly</Select.Option>
                                <Select.Option value="monthly">Monthly</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="debug_mode"
                            label="Debug Mode"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Alert
                            message="Warning"
                            description="Debug mode should only be enabled in development environments."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={saving}>
                                Save System Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                    <Settings className="w-6 h-6" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    Settings
                </Title>
                <Text type="secondary">Manage your system settings and configurations</Text>
            </div>

            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                />
            </Card>
        </div>
    );
};

export default AdminSettings;
