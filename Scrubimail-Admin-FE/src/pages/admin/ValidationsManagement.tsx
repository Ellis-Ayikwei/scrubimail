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
  Select,
  DatePicker,
  Typography,
  Tooltip,
  Progress,
  Tabs,
  List
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  adminValidationService,
  AdminEmailValidation,
  AdminValidationStats,
  ValidationStatus
} from '../../services/validationService';

const ValidationsManagement: React.FC = () => {
  const [validations, setValidations] = useState<AdminEmailValidation[]>([]);
  const [stats, setStats] = useState<AdminValidationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedValidation, setSelectedValidation] = useState<AdminEmailValidation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { Title, Text } = Typography;
  const { RangePicker } = DatePicker;

  const fetchValidationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [validationsRes, statsRes] = await Promise.all([
        adminValidationService.list(),
        adminValidationService.stats()
      ]);
      setValidations(Array.isArray(validationsRes.data) ? validationsRes.data : []);
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

  const handleViewDetails = (validation: AdminEmailValidation) => {
    setSelectedValidation(validation);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'green',
      failed: 'red',
      processing: 'blue',
      pending: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      completed: <CheckCircleOutlined />,
      failed: <CloseCircleOutlined />,
      processing: <SyncOutlined spin />,
      pending: <ClockCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const columns = [
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
          {(status || 'unknown').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (record: AdminEmailValidation) => {
        const score = record.score || 0;
        return (
          <div>
            <Progress
              percent={score}
              size="small"
              status={score > 80 ? 'success' : score > 50 ? 'normal' : 'exception'}
            />
          </div>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'job_type',
      key: 'job_type',
      render: (type: string) => <Tag>{type || 'single'}</Tag>,
    },
    {
      title: 'Warnings',
      key: 'warnings',
      render: (record: AdminEmailValidation) => {
        const count = Array.isArray(record.warnings) ? record.warnings.length : 0;
        return count > 0 ? <Tag color="orange">{count}</Tag> : <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AdminEmailValidation) => (
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
    const matchesSearch = validation.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || validation.status === filterStatus;

    let matchesDate = true;
    if (dateRange) {
      const validationDate = new Date(validation.created_at);
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);
      matchesDate = validationDate >= startDate && validationDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Derived metrics from the recent_validations sample returned by the stats endpoint.
  const recent = stats?.recent_validations ?? [];
  const recentCompleted = recent.filter(v => v.status === 'completed').length;
  const recentFailed = recent.filter(v => v.status === 'failed').length;
  const avgRecentScore = recent.length
    ? Math.round(recent.reduce((sum, v) => sum + (v.score || 0), 0) / recent.length)
    : 0;

  const statsCards: Array<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    suffix?: string;
  }> = [
    {
      title: 'Total Validations',
      value: stats?.total_validations || 0,
      icon: <BarChartOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Recent Completed',
      value: recentCompleted,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Recent Failed',
      value: recentFailed,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      color: '#ff4d4f'
    },
    {
      title: 'Avg Score (recent)',
      value: avgRecentScore,
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
                  placeholder="Search emails..."
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
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="processing">Processing</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                  <Select.Option value="failed">Failed</Select.Option>
                </Select>
                <RangePicker
                  value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                  onChange={(_, dateStrings) =>
                    setDateRange(dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null)
                  }
                  style={{ width: 250 }}
                />
              </div>

              <Table
                rowKey="id"
                columns={columns}
                dataSource={Array.isArray(filteredValidations) ? filteredValidations : []}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} validations`,
                }}
                scroll={{ x: 1000 }}
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
                        {(selectedValidation.status || 'unknown').toUpperCase()}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Job Type:</Text>
                      <Tag style={{ marginLeft: '8px' }}>{selectedValidation.job_type}</Tag>
                    </div>
                    <div>
                      <Text strong>Score:</Text>
                      <Text style={{ marginLeft: '8px' }}>{selectedValidation.score}</Text>
                    </div>
                    <div>
                      <Text strong>Created:</Text>
                      <Text style={{ marginLeft: '8px' }}>{new Date(selectedValidation.created_at).toLocaleString()}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Score Breakdown" size="small">
                  <pre style={{ margin: 0, maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
                    {JSON.stringify(selectedValidation.breakdown || {}, null, 2)}
                  </pre>
                </Card>
              </Col>
            </Row>

            {Array.isArray(selectedValidation.suggestions) && selectedValidation.suggestions.length > 0 && (
              <Card title="Suggestions" size="small" style={{ marginTop: '16px' }}>
                <List
                  size="small"
                  dataSource={selectedValidation.suggestions}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              </Card>
            )}

            {Array.isArray(selectedValidation.warnings) && selectedValidation.warnings.length > 0 && (
              <Card title="Warnings" size="small" style={{ marginTop: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedValidation.warnings.map((w, index) => (
                    <Tag color="orange" key={index}>{w}</Tag>
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
