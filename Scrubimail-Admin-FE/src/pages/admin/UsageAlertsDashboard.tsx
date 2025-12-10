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
  Progress,
  message,
  Typography,
  Tooltip,
  Badge,
  Alert
} from 'antd';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  RefreshCw,
  Send,
  Mail
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { billingService, UsageAlert } from '../../services/billingService';

const { Title, Text } = Typography;

interface UserUsageData {
  user_id: number;
  user_email: string;
  credits_remaining: number;
  credits_used: number;
  total_credits: number;
  usage_percentage: number;
  alerts: UsageAlert[];
}

const UsageAlertsDashboard: React.FC = () => {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [userUsageData, setUserUsageData] = useState<UserUsageData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSystemStats();
    // In a real implementation, you'd fetch user usage data from an admin endpoint
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const stats = await billingService.getSystemUsageAlertsStats();
      setSystemStats(stats);
    } catch (error: any) {
      message.error(error.message || 'Failed to load system stats');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCheck = async () => {
    try {
      await billingService.triggerUsageAlertCheck();
      message.success('Usage alert check triggered successfully');
      fetchSystemStats();
    } catch (error: any) {
      message.error(error.message || 'Failed to trigger alert check');
    }
  };

  const getThresholdColor = (threshold: number) => {
    if (threshold >= 100) return '#ff4d4f';
    if (threshold >= 90) return '#ff7a45';
    if (threshold >= 75) return '#faad14';
    return '#1890ff';
  };

  const getThresholdIcon = (threshold: number) => {
    if (threshold >= 90) return <AlertTriangle className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const userColumns: ColumnsType<UserUsageData> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Users className="w-4 h-4 text-blue-500" />
          <Text>{record.user_email}</Text>
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <div>
          <Progress
            percent={record.usage_percentage}
            strokeColor={getThresholdColor(record.usage_percentage)}
            format={(percent) => `${percent?.toFixed(1)}%`}
          />
          <Text className="text-xs text-gray-500">
            {record.credits_used.toLocaleString()} / {record.total_credits.toLocaleString()} credits
          </Text>
        </div>
      ),
    },
    {
      title: 'Alerts Triggered',
      key: 'alerts',
      render: (_, record) => (
        <Space>
          {record.alerts.map((alert, idx) => (
            <Tooltip
              key={idx}
              title={`${alert.threshold}% threshold - ${alert.alert_sent ? 'Sent' : 'Pending'}`}
            >
              <Badge
                status={alert.alert_sent ? 'success' : 'warning'}
                count={alert.threshold}
              />
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const highestAlert = record.alerts
          .filter(a => a.crossed)
          .sort((a, b) => b.threshold - a.threshold)[0];
        
        if (!highestAlert) {
          return <Tag color="green">Normal</Tag>;
        }
        
        return (
          <Tag color={getThresholdColor(highestAlert.threshold)}>
            {highestAlert.threshold}% Threshold Crossed
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<Send className="w-4 h-4" />}
          onClick={() => handleTriggerCheck()}
        >
          Trigger Alert
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          <Bell className="w-6 h-6 inline-block mr-2" />
          Usage Alerts Dashboard
        </Title>
        <Text type="secondary">Monitor user usage alerts across the system</Text>
      </div>

      {/* System Stats */}
      {systemStats && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Alerts Sent Today"
                value={systemStats.alerts_sent_today || 0}
                prefix={<Mail className="w-5 h-5 text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Users Above 90%"
                value={systemStats.users_above_90 || 0}
                prefix={<AlertTriangle className="w-5 h-5 text-orange-500" />}
                valueStyle={{ color: '#ff7a45' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Low Credit Warnings"
                value={systemStats.low_credit_warnings || 0}
                prefix={<Bell className="w-5 h-5 text-yellow-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Delivery Success Rate"
                value={systemStats.delivery_success_rate || 0}
                prefix={<CheckCircle className="w-5 h-5 text-green-500" />}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Alert Thresholds Info */}
      <Card className="mb-6" title="Alert Thresholds">
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">50%</div>
              <Text type="secondary">Info Alert</Text>
              <div className="mt-2">
                <Tag color="blue">Halfway through credits</Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">75%</div>
              <Text type="secondary">Warning Alert</Text>
              <div className="mt-2">
                <Tag color="orange">Consider upgrading soon</Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">90%</div>
              <Text type="secondary">Alert</Text>
              <div className="mt-2">
                <Tag color="red">Running low on credits!</Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">100%</div>
              <Text type="secondary">Urgent Alert</Text>
              <div className="mt-2">
                <Tag color="red">No credits remaining!</Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* User Usage Table */}
      <Card
        title="User Usage & Alerts"
        extra={
          <Space>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchSystemStats}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<Send className="w-4 h-4" />}
              onClick={handleTriggerCheck}
            >
              Trigger Manual Check
            </Button>
          </Space>
        }
      >
        {userUsageData.length === 0 ? (
          <Alert
            message="No user data available"
            description="User usage data will appear here once users start using the system."
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={userColumns}
            dataSource={Array.isArray(userUsageData) ? userUsageData : []}
            rowKey="user_id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        )}
      </Card>

      {/* Alert Activity Timeline - Would show recent alert activity */}
      <Card className="mt-6" title="Recent Alert Activity">
        <Alert
          message="Alert timeline feature"
          description="This section would display a timeline of recent alert activities, including when alerts were sent, delivery status, and user responses."
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
};

export default UsageAlertsDashboard;

