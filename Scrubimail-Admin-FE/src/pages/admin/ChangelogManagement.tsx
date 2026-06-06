import React, { useEffect, useState } from 'react';
import {
    Table, Card, Button, Space, Tag, Modal, Form, Input, Select,
    message, Typography, Popconfirm, Tooltip, Badge, DatePicker
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
    CheckCircleOutlined, ClockCircleOutlined, SendOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../../services/axiosInstance';

interface ChangelogEntry {
    id: number;
    version: string;
    title: string;
    summary: string;
    body: string;
    entry_type: string;
    entry_type_display: string;
    status: 'draft' | 'published';
    status_display: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

const TYPE_COLORS: Record<string, string> = {
    feature: 'green',
    improvement: 'blue',
    fix: 'orange',
    security: 'red',
    breaking: 'volcano',
    deprecation: 'default',
};

const { Title, Text } = Typography;

const ChangelogManagement: React.FC = () => {
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ChangelogEntry | null>(null);
    const [previewEntry, setPreviewEntry] = useState<ChangelogEntry | null>(null);
    const [form] = Form.useForm();

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/admin/changelog/');
            setEntries(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (err: any) {
            message.error(err.message || 'Failed to load changelog entries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        setShowModal(true);
    };

    const openEdit = (record: ChangelogEntry) => {
        setEditing(record);
        form.setFieldsValue({
            ...record,
            published_at: record.published_at ? dayjs(record.published_at) : null,
        });
        setShowModal(true);
    };

    const handleSubmit = async (values: any) => {
        const payload = {
            ...values,
            published_at: values.published_at ? values.published_at.toISOString() : null,
        };
        try {
            if (editing) {
                const res = await axiosInstance.put(`/admin/changelog/${editing.id}/`, payload);
                setEntries(prev => prev.map(e => (e.id === editing.id ? res.data : e)));
                message.success('Entry updated');
            } else {
                const res = await axiosInstance.post('/admin/changelog/', payload);
                setEntries(prev => [res.data, ...prev]);
                message.success('Entry created');
            }
            setShowModal(false);
            form.resetFields();
        } catch (err: any) {
            message.error(err.message || 'Failed to save entry');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await axiosInstance.delete(`/admin/changelog/${id}/`);
            setEntries(prev => prev.filter(e => e.id !== id));
            message.success('Entry deleted');
        } catch (err: any) {
            message.error(err.message || 'Failed to delete entry');
        }
    };

    const handlePublish = async (id: number) => {
        try {
            const res = await axiosInstance.post(`/admin/changelog/${id}/publish/`);
            setEntries(prev => prev.map(e => (e.id === id ? res.data : e)));
            message.success('Entry published');
        } catch (err: any) {
            message.error(err.message || 'Failed to publish entry');
        }
    };

    const columns = [
        {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
            render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>,
            width: 100,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (title: string, record: ChangelogEntry) => (
                <div>
                    <Text strong>{title}</Text>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.summary}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'entry_type',
            key: 'entry_type',
            width: 130,
            render: (type: string, record: ChangelogEntry) => (
                <Tag color={TYPE_COLORS[type] || 'default'}>{record.entry_type_display}</Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: string) =>
                status === 'published' ? (
                    <Badge status="success" text="Published" />
                ) : (
                    <Badge status="default" text="Draft" />
                ),
        },
        {
            title: 'Published',
            dataIndex: 'published_at',
            key: 'published_at',
            width: 150,
            render: (date: string | null) =>
                date ? dayjs(date).format('DD MMM YYYY') : <Text type="secondary">—</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 160,
            render: (record: ChangelogEntry) => (
                <Space>
                    <Tooltip title="Preview">
                        <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setPreviewEntry(record)} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
                    </Tooltip>
                    {record.status === 'draft' && (
                        <Tooltip title="Publish now">
                            <Button
                                type="text"
                                icon={<SendOutlined />}
                                size="small"
                                style={{ color: '#52c41a' }}
                                onClick={() => handlePublish(record.id)}
                            />
                        </Tooltip>
                    )}
                    <Popconfirm
                        title="Delete this entry?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        okType="danger"
                        cancelText="Cancel"
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Changelog</Title>
                    <Text type="secondary">Manage public release notes and announcements</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchEntries}>Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Entry</Button>
                </Space>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={entries}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 15, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t}` }}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={editing ? 'Edit Changelog Entry' : 'New Changelog Entry'}
                open={showModal}
                onCancel={() => { setShowModal(false); setEditing(null); form.resetFields(); }}
                footer={null}
                width={720}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="version" label="Version" rules={[{ required: true, message: 'Required' }]}>
                            <Input placeholder="e.g. v2.4.0" />
                        </Form.Item>
                        <Form.Item name="entry_type" label="Type" rules={[{ required: true, message: 'Required' }]} initialValue="feature">
                            <Select>
                                <Select.Option value="feature">New Feature</Select.Option>
                                <Select.Option value="improvement">Improvement</Select.Option>
                                <Select.Option value="fix">Bug Fix</Select.Option>
                                <Select.Option value="security">Security</Select.Option>
                                <Select.Option value="breaking">Breaking Change</Select.Option>
                                <Select.Option value="deprecation">Deprecation</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="Short headline for this change" />
                    </Form.Item>

                    <Form.Item name="summary" label="Summary" rules={[{ required: true, message: 'Required' }]}>
                        <Input.TextArea rows={2} placeholder="One or two sentences shown in the list view" />
                    </Form.Item>

                    <Form.Item name="body" label="Body (Markdown)" rules={[{ required: true, message: 'Required' }]}>
                        <Input.TextArea rows={8} placeholder="Full details — supports Markdown" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="status" label="Status" initialValue="draft">
                            <Select>
                                <Select.Option value="draft">Draft</Select.Option>
                                <Select.Option value="published">Published</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="published_at" label="Publish Date (optional)">
                            <DatePicker style={{ width: '100%' }} showTime />
                        </Form.Item>
                    </div>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setShowModal(false); setEditing(null); form.resetFields(); }}>Cancel</Button>
                            <Button type="primary" htmlType="submit">{editing ? 'Save Changes' : 'Create Entry'}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                title={previewEntry ? `${previewEntry.version} — ${previewEntry.title}` : ''}
                open={!!previewEntry}
                onCancel={() => setPreviewEntry(null)}
                footer={<Button onClick={() => setPreviewEntry(null)}>Close</Button>}
                width={640}
            >
                {previewEntry && (
                    <div>
                        <Space style={{ marginBottom: 12 }}>
                            <Tag color={TYPE_COLORS[previewEntry.entry_type] || 'default'}>{previewEntry.entry_type_display}</Tag>
                            {previewEntry.status === 'published'
                                ? <Tag icon={<CheckCircleOutlined />} color="success">Published</Tag>
                                : <Tag icon={<ClockCircleOutlined />} color="default">Draft</Tag>}
                            {previewEntry.published_at && (
                                <Text type="secondary">{dayjs(previewEntry.published_at).format('DD MMM YYYY')}</Text>
                            )}
                        </Space>
                        <p style={{ fontStyle: 'italic', color: '#666', marginBottom: 12 }}>{previewEntry.summary}</p>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#f5f5f5', padding: 16, borderRadius: 6 }}>
                            {previewEntry.body}
                        </pre>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ChangelogManagement;
