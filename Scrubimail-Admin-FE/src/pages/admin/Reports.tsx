import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Typography, Spin, Alert, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';

const { Title, Text } = Typography;

interface ReportData {
    users: { total: number; active: number; new: number; suspended: number };
    validations: { total: number };
    plans: { total_plans: number; active_plans: number };
    payments: {
        total_revenue: number;
        monthly_revenue: number;
        pending_payments: number;
        failed_payments: number;
        average_transaction: number;
    };
    invoices: { paid_total: number; pending_total: number; overdue_count: number; total_invoices: number };
}

interface MetricRow {
    key: string;
    metric: string;
    value: string;
    category: string;
}

const AdminReports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ReportData | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, validationsRes, plansRes, paymentsRes, invoicesRes] = await Promise.all([
                axiosInstance.get('/admin/users/stats/'),
                axiosInstance.get('/admin/validations/stats/'),
                axiosInstance.get('/admin/plans/stats/'),
                axiosInstance.get('/admin/payments/stats/'),
                axiosInstance.get('/admin/invoices/'),
            ]);

            const invoiceStats = invoicesRes.data?.stats || {};

            setData({
                users: {
                    total: usersRes.data.total || 0,
                    active: usersRes.data.active || 0,
                    new: usersRes.data.new || 0,
                    suspended: usersRes.data.suspended || 0,
                },
                validations: {
                    total: validationsRes.data.total_validations || 0,
                },
                plans: {
                    total_plans: plansRes.data.total_plans || 0,
                    active_plans: plansRes.data.active_plans || 0,
                },
                payments: {
                    total_revenue: paymentsRes.data.total_revenue || 0,
                    monthly_revenue: paymentsRes.data.monthly_revenue || 0,
                    pending_payments: paymentsRes.data.pending_payments || 0,
                    failed_payments: paymentsRes.data.failed_payments || 0,
                    average_transaction: paymentsRes.data.average_transaction || 0,
                },
                invoices: {
                    paid_total: invoiceStats.paid_total || 0,
                    pending_total: invoiceStats.pending_total || 0,
                    overdue_count: invoiceStats.overdue_count || 0,
                    total_invoices: invoiceStats.total_invoices || 0,
                },
            });
        } catch (err: any) {
            console.error('Error loading report:', err);
            setError(err?.response?.data?.detail || err?.message || 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const money = (n: number) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const rows: MetricRow[] = data
        ? [
              { key: 'u1', category: 'Users', metric: 'Total users', value: data.users.total.toLocaleString() },
              { key: 'u2', category: 'Users', metric: 'Active users', value: data.users.active.toLocaleString() },
              { key: 'u3', category: 'Users', metric: 'New users (30d)', value: data.users.new.toLocaleString() },
              { key: 'u4', category: 'Users', metric: 'Suspended users', value: data.users.suspended.toLocaleString() },
              { key: 'v1', category: 'Validations', metric: 'Total validations', value: data.validations.total.toLocaleString() },
              { key: 'p1', category: 'Plans', metric: 'Total plans', value: data.plans.total_plans.toLocaleString() },
              { key: 'p2', category: 'Plans', metric: 'Active plans', value: data.plans.active_plans.toLocaleString() },
              { key: 'r1', category: 'Revenue', metric: 'Total revenue', value: money(data.payments.total_revenue) },
              { key: 'r2', category: 'Revenue', metric: 'Revenue this month', value: money(data.payments.monthly_revenue) },
              { key: 'r3', category: 'Revenue', metric: 'Average transaction', value: money(data.payments.average_transaction) },
              { key: 'r4', category: 'Revenue', metric: 'Pending payments', value: data.payments.pending_payments.toLocaleString() },
              { key: 'r5', category: 'Revenue', metric: 'Failed payments', value: data.payments.failed_payments.toLocaleString() },
              { key: 'i1', category: 'Invoices', metric: 'Total invoices', value: data.invoices.total_invoices.toLocaleString() },
              { key: 'i2', category: 'Invoices', metric: 'Paid total', value: money(data.invoices.paid_total) },
              { key: 'i3', category: 'Invoices', metric: 'Pending total', value: money(data.invoices.pending_total) },
              { key: 'i4', category: 'Invoices', metric: 'Overdue invoices', value: data.invoices.overdue_count.toLocaleString() },
          ]
        : [];

    const CATEGORY_COLORS: Record<string, string> = {
        Users: 'blue',
        Validations: 'purple',
        Plans: 'cyan',
        Revenue: 'green',
        Invoices: 'gold',
    };

    const columns: ColumnsType<MetricRow> = [
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 160,
            render: (c: string) => <Tag color={CATEGORY_COLORS[c] || 'default'}>{c}</Tag>,
            filters: Object.keys(CATEGORY_COLORS).map(c => ({ text: c, value: c })),
            onFilter: (value, record) => record.category === value,
        },
        { title: 'Metric', dataIndex: 'metric', key: 'metric' },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            align: 'right',
            render: (v: string) => <Text strong>{v}</Text>,
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Reports</Title>
                    <Text type="secondary">Consolidated summary across users, validations, billing and invoices</Text>
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchReport}>Refresh</Button>
            </div>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message="Failed to load report"
                    description={error}
                    action={<Button size="small" onClick={fetchReport}>Retry</Button>}
                />
            )}

            {data && (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic title="Total Users" value={data.users.total} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic title="Total Validations" value={data.validations.total} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic title="Total Revenue" value={data.payments.total_revenue} prefix="$" precision={2} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic title="Total Invoices" value={data.invoices.total_invoices} />
                            </Card>
                        </Col>
                    </Row>

                    <Card title="Detailed Metrics">
                        <Table
                            columns={columns}
                            dataSource={rows}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </>
            )}
        </div>
    );
};

export default AdminReports;
