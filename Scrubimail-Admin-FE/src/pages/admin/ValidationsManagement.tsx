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
  DatePicker,
  message,
  Typography,
  Badge,
  Tooltip,
  Progress,
  Tabs
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  MailOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';
import moment from 'moment';

interface ValidationRecord {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  result: {
    is_valid: boolean;
    is_deliverable: boolean;
    is_smtp_valid: boolean;
    is_catch_all: boolean;
    is_role: boolean;
    is_disposable: boolean;
    is_free: boolean;
    confidence_score: number;
    risk_score: number;
    mx_records: string[];
    smtp_response: string;
  };
  created_at: string;
  updated_at: string;
  api_key_used: string;
  validation_type: 'single' | 'bulk';
  processing_time: number;
}

interface ValidationStats {
  total_validations: number;
  valid_emails: number;
  invalid_emails: number;
  risky_emails: number;
  unknown_emails: number;
  average_confidence: number;
  average_processing_time: number;
  validations_today: number;
  validations_this_month: number;
}

const ValidationsManagement: React.FC = () => {
  const [validations, setValidations] = useState<ValidationRecord[]>([]);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedValidation, setSelectedValidation] = useState<ValidationRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { Title, Text } = Typography;
  const { RangePicker } = DatePicker;

  const fetchValidationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [validationsRes, statsRes] = await Promise.all([
        axiosInstance.get('/admin/validations/'),
        axiosInstance.get('/admin/validations/stats/')
      ]);
      // Ensure validations data is properly structured
      const validationsData = Array.isArray(validationsRes.data) ? validationsRes.data : [];
      const normalizedValidations = validationsData.map(validation => ({
        ...validation,
        result: validation.result || {
          confidence_score: 0,
          risk_score: 0,
          is_valid: false,
          is_disposable: false,
          is_free: false,
          mx_records: [],
          smtp_response: ''
        }
      }));
      setValidations(normalizedValidations);
      setStats(statsRes.data);
    } catch (err: any) {
      setError('Failed to fetch validations data');
      console.error('Error fetching validations data:', err);
      setValidations([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationsData();
  }, []);

  const handleViewDetails = (validation: ValidationRecord) => {
    setSelectedValidation(validation);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      valid: 'green',
      invalid: 'red',
      risky: 'orange',
      unknown: 'default'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      valid: <CheckCircleOutlined />,
      invalid: <CloseCircleOutlined />,
      risky: <ClockCircleOutlined />,
      unknown: <ClockCircleOutlined />
    };
    return icons[status as keyof typeof icons] || <ClockCircleOutlined />;
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: ValidationRecord) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.user.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.user.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Text code style={{ fontSize: '12px' }}>{email}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Confidence',
      key: 'confidence',
      render: (record: ValidationRecord) => {
        const confidenceScore = record.result?.confidence_score || 0;
        return (
          <div>
            <Progress 
              percent={Math.round(confidenceScore * 100)} 
              size="small" 
              status={confidenceScore > 0.8 ? 'success' : confidenceScore > 0.5 ? 'normal' : 'exception'}
            />
            <Text style={{ fontSize: '12px' }}>
              {Math.round(confidenceScore * 100)}%
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Risk Score',
      key: 'risk',
      render: (record: ValidationRecord) => {
        const riskScore = record.result?.risk_score || 0;
        return (
          <Tag color={riskScore > 0.7 ? 'red' : riskScore > 0.4 ? 'orange' : 'green'}>
            {Math.round(riskScore * 100)}%
          </Tag>
        );
      },
    },
    {
      title: 'Processing Time',
      dataIndex: 'processing_time',
      key: 'processing_time',
      render: (time: number) => `${time}ms`,
    },
    {
      title: 'Type',
      dataIndex: 'validation_type',
      key: 'validation_type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ValidationRecord) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredValidations = validations.filter(validation => {
    const matchesSearch = validation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || validation.status === filterStatus;
    const matchesUser = filterUser === 'all' || validation.user.id.toString() === filterUser;
    
    let matchesDate = true;
    if (dateRange) {
      const validationDate = new Date(validation.created_at);
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);
      matchesDate = validationDate >= startDate && validationDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesUser && matchesDate;
  });

  const statsCards = [
    {
      title: 'Total Validations',
      value: stats?.total_validations || 0,
      icon: <BarChartOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Valid Emails',
      value: stats?.valid_emails || 0,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Invalid Emails',
      value: stats?.invalid_emails || 0,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      color: '#ff4d4f'
    },
    {
      title: 'Avg Confidence',
      value: stats?.average_confidence ? Math.round(stats.average_confidence * 100) : 0,
      icon: <PieChartOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1',
      suffix: '%'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <ReloadOutlined style={{ fontSize: '32px', color: '#2ED8A3', marginBottom: '16px' }} spin />
          <Text>Loading validations data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Validations Management</Title>
          <Text type="secondary">Monitor and analyze email validation activities</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchValidationsData}
          >
            Refresh
          </Button>
          <Button 
            icon={<DownloadOutlined />}
          >
            Export Data
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

      <Tabs defaultActiveKey="validations" items={[
        {
          key: 'validations',
          label: 'Validation Records',
          children: (
            <Card>
              {/* Filters */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Input
                  placeholder="Search emails, users..."
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
                  <Select.Option value="valid">Valid</Select.Option>
                  <Select.Option value="invalid">Invalid</Select.Option>
                  <Select.Option value="risky">Risky</Select.Option>
                  <Select.Option value="unknown">Unknown</Select.Option>
                </Select>
                <RangePicker
                  value={dateRange ? [moment(dateRange[0]), moment(dateRange[1])] : null}
                  onChange={(dates) => setDateRange(dates ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null)}
                  style={{ width: 250 }}
                />
                <Button icon={<FilterOutlined />}>
                  More Filters
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={filteredValidations}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} validations`,
                }}
                scroll={{ x: 1200 }}
              />
            </Card>
          )
        },
        {
          key: 'analytics',
          label: 'Analytics',
          children: (
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Validation Trends" size="small">
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">Chart visualization would go here</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Status Distribution" size="small">
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">Pie chart would go here</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          )
        }
      ]} />

      {/* Validation Details Modal */}
      <Modal
        title="Validation Details"
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={null}
        width={800}
      >
        {selectedValidation && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Basic Information" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Email:</Text>
                      <Text code style={{ marginLeft: '8px' }}>{selectedValidation.email}</Text>
                    </div>
                    <div>
                      <Text strong>Status:</Text>
                      <Tag color={getStatusColor(selectedValidation.status)} style={{ marginLeft: '8px' }}>
                        {selectedValidation.status.toUpperCase()}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Validation Type:</Text>
                      <Tag style={{ marginLeft: '8px' }}>{selectedValidation.validation_type}</Tag>
                    </div>
                    <div>
                      <Text strong>Processing Time:</Text>
                      <Text style={{ marginLeft: '8px' }}>{selectedValidation.processing_time}ms</Text>
                    </div>
                    <div>
                      <Text strong>Created:</Text>
                      <Text style={{ marginLeft: '8px' }}>{new Date(selectedValidation.created_at).toLocaleString()}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Validation Results" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Is Valid:</Text>
                      <Tag color={selectedValidation.result.is_valid ? 'green' : 'red'} style={{ marginLeft: '8px' }}>
                        {selectedValidation.result.is_valid ? 'Yes' : 'No'}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Is Deliverable:</Text>
                      <Tag color={selectedValidation.result.is_deliverable ? 'green' : 'red'} style={{ marginLeft: '8px' }}>
                        {selectedValidation.result.is_deliverable ? 'Yes' : 'No'}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Is Disposable:</Text>
                      <Tag color={selectedValidation.result.is_disposable ? 'orange' : 'green'} style={{ marginLeft: '8px' }}>
                        {selectedValidation.result.is_disposable ? 'Yes' : 'No'}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Is Free Email:</Text>
                      <Tag color={selectedValidation.result.is_free ? 'blue' : 'default'} style={{ marginLeft: '8px' }}>
                        {selectedValidation.result.is_free ? 'Yes' : 'No'}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Confidence Score:</Text>
                      <Progress 
                        percent={Math.round(selectedValidation.result.confidence_score * 100)} 
                        size="small" 
                        style={{ marginLeft: '8px', width: '100px' }}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            
            {selectedValidation.result.mx_records.length > 0 && (
              <Card title="MX Records" size="small" style={{ marginTop: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedValidation.result.mx_records.map((mx, index) => (
                    <Text key={index} code>{mx}</Text>
                  ))}
                </Space>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ValidationsManagement;
