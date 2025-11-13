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
  Select,
  Input,
  DatePicker,
  message,
  Typography,
  Tooltip,
  Badge,
  Descriptions,
  Divider
} from 'antd';
import {
  FileText,
  Download,
  Eye,
  Filter,
  RefreshCw,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { billingService, Invoice } from '../../services/billingService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const InvoicesManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await billingService.getInvoices(filters);
      // Handle both array and wrapped response format
      const invoiceList = Array.isArray(data) ? data : ((data as any).invoices || []);
      setInvoices(invoiceList);
      calculateStats(invoiceList);
    } catch (error: any) {
      message.error(error.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoiceList: Invoice[]) => {
    const paid = invoiceList.filter(i => i.status === 'paid');
    const pending = invoiceList.filter(i => i.status === 'pending');
    const overdue = invoiceList.filter(i => i.status === 'overdue');

    setStats({
      totalPaid: paid.length,
      totalPending: pending.length,
      totalOverdue: overdue.length,
      totalRevenue: paid.reduce((sum, i) => sum + (i.total_amount || 0), 0)
    });
  };

  const handleViewDetails = async (id: string) => {
    try {
      const invoice = await billingService.getInvoiceDetails(id);
      setSelectedInvoice(invoice);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error(error.message || 'Failed to load invoice details');
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const blob = await billingService.downloadInvoicePDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Invoice downloaded successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to download invoice');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await billingService.updateInvoiceStatus(id, status);
      message.success('Invoice status updated successfully');
      fetchInvoices();
    } catch (error: any) {
      message.error(error.message || 'Failed to update invoice status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'green',
      pending: 'orange',
      overdue: 'red',
      draft: 'default',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (text, record) => (
        <Space>
          <FileText className="w-4 h-4 text-blue-500" />
          <Text strong className="font-mono">{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'invoice_type',
      key: 'invoice_type',
      render: (type) => (
        <Tag>{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <Text strong className="text-lg">
          ${(record.total_amount || 0).toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Paid', value: 'paid' },
        { text: 'Pending', value: 'pending' },
        { text: 'Overdue', value: 'overdue' },
        { text: 'Draft', value: 'draft' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Issue Date',
      dataIndex: 'issue_date',
      key: 'issue_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
      sorter: (a, b) => {
        if (!a.issue_date || !b.issue_date) return 0;
        return dayjs(a.issue_date).unix() - dayjs(b.issue_date).unix();
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
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
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              type="text"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleDownloadPDF(record.id)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Mark as Paid">
              <Button
                type="text"
                icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                onClick={() => handleStatusUpdate(record.id, 'paid')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          <FileText className="w-6 h-6 inline-block mr-2" />
          Invoice Management
        </Title>
        <Text type="secondary">View and manage all system invoices</Text>
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
              title="Paid Invoices"
              value={stats.totalPaid}
              prefix={<CheckCircle className="w-5 h-5 text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Invoices"
              value={stats.totalPending}
              prefix={<Clock className="w-5 h-5 text-orange-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue Invoices"
              value={stats.totalOverdue}
              prefix={<AlertCircle className="w-5 h-5 text-red-500" />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <Space wrap>
          <Select
            placeholder="Status"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value || undefined })}
          >
            <Select.Option value="paid">Paid</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="overdue">Overdue</Select.Option>
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>

          <Select
            placeholder="Type"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, invoice_type: value || undefined })}
          >
            <Select.Option value="subscription">Subscription</Select.Option>
            <Select.Option value="credit_package">Credit Package</Select.Option>
            <Select.Option value="credit_purchase">Credit Purchase</Select.Option>
            <Select.Option value="refund">Refund</Select.Option>
          </Select>

          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  date_from: dates[0]?.toISOString(),
                  date_to: dates[1]?.toISOString()
                });
              } else {
                setFilters({ ...filters, date_from: undefined, date_to: undefined });
              }
            }}
          />

          <Input
            placeholder="Min Amount"
            type="number"
            style={{ width: 120 }}
            onChange={(e) => setFilters({ ...filters, min_amount: e.target.value || undefined })}
          />

          <Input
            placeholder="Max Amount"
            type="number"
            style={{ width: 120 }}
            onChange={(e) => setFilters({ ...filters, max_amount: e.target.value || undefined })}
          />

          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchInvoices}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Invoices Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        title="Invoice Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedInvoice(null);
        }}
        footer={[
          <Button key="download" icon={<Download className="w-4 h-4" />} onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice.id)}>
            Download PDF
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedInvoice && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Invoice Number">
                <Text strong className="font-mono">{selectedInvoice.invoice_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedInvoice.status)}>
                  {selectedInvoice.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedInvoice.invoice_type.replace('_', ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {selectedInvoice.issue_date ? dayjs(selectedInvoice.issue_date).format('MMM DD, YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {selectedInvoice.due_date ? dayjs(selectedInvoice.due_date).format('MMM DD, YYYY') : '-'}
              </Descriptions.Item>
              {selectedInvoice.paid_date && (
                <Descriptions.Item label="Paid Date">
                  {dayjs(selectedInvoice.paid_date).format('MMM DD, YYYY')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>Line Items</Divider>

            <Table
              dataSource={selectedInvoice.line_items || []}
              rowKey={(record, index) => record.id || `item-${index}`}
              pagination={false}
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', render: (price) => `$${(price || 0).toFixed(2)}` },
                { title: 'Total', dataIndex: 'total_price', key: 'total_price', render: (total) => `$${(total || 0).toFixed(2)}` },
              ]}
            />

            <Divider />

            <div className="text-right space-y-2">
              <div className="flex justify-end">
                <Text>Subtotal: </Text>
                <Text strong className="ml-4">${(selectedInvoice.subtotal || 0).toFixed(2)}</Text>
              </div>
              {(selectedInvoice.discount_amount || 0) > 0 && (
                <div className="flex justify-end">
                  <Text>Discount: </Text>
                  <Text strong className="ml-4 text-red-500">-${(selectedInvoice.discount_amount || 0).toFixed(2)}</Text>
                </div>
              )}
              {(selectedInvoice.tax_amount || 0) > 0 && (
                <div className="flex justify-end">
                  <Text>Tax: </Text>
                  <Text strong className="ml-4">${(selectedInvoice.tax_amount || 0).toFixed(2)}</Text>
                </div>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div className="flex justify-end">
                <Text strong className="text-lg">Total: </Text>
                <Text strong className="ml-4 text-lg text-blue-600">${(selectedInvoice.total_amount || 0).toFixed(2)}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesManagement;

