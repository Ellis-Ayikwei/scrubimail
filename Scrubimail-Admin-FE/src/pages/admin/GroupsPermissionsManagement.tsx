import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../services/axiosInstance';

interface PermItem {
  id: number;
  name: string;
  codename: string;
  content_type?: number;
}

interface GroupMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AuthGroup {
  id: number;
  name: string;
  users?: GroupMember[];
  permissions?: PermItem[];
  user_count?: number;
  permission_count?: number;
}

interface AdminUserListItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

const GroupsPermissionsManagement: React.FC = () => {
  const [groups, setGroups] = useState<AuthGroup[]>([]);
  const [allPerms, setAllPerms] = useState<PermItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameGroup, setRenameGroup] = useState<AuthGroup | null>(null);
  const [permGroup, setPermGroup] = useState<AuthGroup | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [modalPermSearch, setModalPermSearch] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const [memberGroup, setMemberGroup] = useState<AuthGroup | null>(null);
  const [allAdminUsers, setAllAdminUsers] = useState<AdminUserListItem[]>([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const [createForm] = Form.useForm();
  const [renameForm] = Form.useForm();

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await axiosInstance.get('/admin/groups/');
      const data = Array.isArray(res.data) ? res.data : [];
      setGroups(data);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setLoadingPerms(true);
    try {
      const res = await axiosInstance.get('/admin/permissions/');
      const data = Array.isArray(res.data) ? res.data : [];
      setAllPerms(data);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to load permissions');
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchPermissions();
  }, [fetchGroups, fetchPermissions]);

  const applyGroupUpdate = useCallback((updated: AuthGroup) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setMemberGroup((prev) => (prev && prev.id === updated.id ? updated : prev));
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    setLoadingAdminUsers(true);
    try {
      const res = await axiosInstance.get('/admin/users/');
      const data = Array.isArray(res.data) ? res.data : [];
      setAllAdminUsers(
        data.map((u: AdminUserListItem) => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
        }))
      );
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoadingAdminUsers(false);
    }
  }, []);

  const openMembersModal = (g: AuthGroup) => {
    setMemberGroup(g);
    setPendingUserIds([]);
    if (allAdminUsers.length === 0) void fetchAdminUsers();
  };

  const closeMembersModal = () => {
    setMemberGroup(null);
    setPendingUserIds([]);
  };

  const memberIdSet = useMemo(() => {
    const ids = new Set<string>();
    (memberGroup?.users ?? []).forEach((u) => ids.add(u.id));
    return ids;
  }, [memberGroup]);

  const addableUserOptions = useMemo(() => {
    return allAdminUsers
      .filter((u) => !memberIdSet.has(u.id))
      .map((u) => {
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
        const label = name ? `${u.email} — ${name}` : u.email;
        return { value: u.id, label };
      });
  }, [allAdminUsers, memberIdSet]);

  const addMembersToGroup = async () => {
    if (!memberGroup || pendingUserIds.length === 0) return;
    setSavingMembers(true);
    try {
      const res = await axiosInstance.post(`/admin/groups/${memberGroup.id}/add-users/`, {
        user_ids: pendingUserIds,
      });
      applyGroupUpdate(res.data as AuthGroup);
      setPendingUserIds([]);
      message.success('User(s) added to group');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to add users');
    } finally {
      setSavingMembers(false);
    }
  };

  const removeUserFromGroup = async (userId: string) => {
    if (!memberGroup) return;
    setSavingMembers(true);
    try {
      const res = await axiosInstance.post(`/admin/groups/${memberGroup.id}/remove-users/`, {
        user_ids: [userId],
      });
      applyGroupUpdate(res.data as AuthGroup);
      message.success('User removed from group');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to remove user');
    } finally {
      setSavingMembers(false);
    }
  };

  const openPermEditor = (g: AuthGroup) => {
    setPermGroup(g);
    setModalPermSearch('');
    setSelectedPermIds((g.permissions ?? []).map((p) => p.id));
  };

  const closePermEditor = () => {
    setPermGroup(null);
    setModalPermSearch('');
    setSelectedPermIds([]);
  };

  const filteredCatalogPerms = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return allPerms;
    return allPerms.filter(
      (p) =>
        p.codename.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [allPerms, catalogSearch]);

  const filteredModalPerms = useMemo(() => {
    const q = modalPermSearch.trim().toLowerCase();
    if (!q) return allPerms;
    return allPerms.filter(
      (p) =>
        p.codename.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [allPerms, modalPermSearch]);

  const saveGroupPermissions = async () => {
    if (!permGroup) return;
    setSavingPerms(true);
    try {
      const res = await axiosInstance.put(`/admin/groups/${permGroup.id}/permissions/`, {
        permission_ids: selectedPermIds,
      });
      const updated = res.data as AuthGroup;
      applyGroupUpdate(updated);
      message.success('Group permissions updated');
      closePermEditor();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const submitCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const name = String(values.name || '').trim();
      if (!name) {
        message.error('Name is required');
        return;
      }
      const res = await axiosInstance.post('/admin/groups/', { name });
      setGroups((prev) => [...prev, res.data as AuthGroup].sort((a, b) => a.name.localeCompare(b.name)));
      message.success('Group created');
      setCreateOpen(false);
      createForm.resetFields();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Failed to create group');
    }
  };

  const submitRename = async () => {
    if (!renameGroup) return;
    try {
      const values = await renameForm.validateFields();
      const name = String(values.name || '').trim();
      if (!name) {
        message.error('Name is required');
        return;
      }
      const res = await axiosInstance.patch(`/admin/groups/${renameGroup.id}/`, { name });
      const updated = res.data as AuthGroup;
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      message.success('Group renamed');
      setRenameGroup(null);
      renameForm.resetFields();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Failed to rename group');
    }
  };

  const deleteGroup = async (g: AuthGroup) => {
    try {
      await axiosInstance.delete(`/admin/groups/${g.id}/`);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      message.success('Group deleted');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to delete group');
    }
  };

  const groupColumns: ColumnsType<AuthGroup> = [
    {
      title: 'Group',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          {row.users && row.users.length > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.users
                .slice(0, 3)
                .map((u) => u.email)
                .join(', ')}
              {row.users.length > 3 ? ` +${row.users.length - 3} more` : ''}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 100,
      render: (n: number, row) => n ?? row.users?.length ?? 0,
    },
    {
      title: 'Permissions',
      dataIndex: 'permission_count',
      key: 'permission_count',
      width: 120,
      render: (n: number, row) => n ?? row.permissions?.length ?? 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 360,
      render: (_, row) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<UserAddOutlined />} onClick={() => openMembersModal(row)}>
            Members
          </Button>
          <Button type="link" size="small" icon={<SafetyCertificateOutlined />} onClick={() => openPermEditor(row)}>
            Permissions
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setRenameGroup(row);
              renameForm.setFieldsValue({ name: row.name });
            }}
          >
            Rename
          </Button>
          <Popconfirm
            title="Delete this group?"
            description="Only allowed when no users are assigned."
            onConfirm={() => deleteGroup(row)}
            okText="Delete"
            cancelText="Cancel"
            disabled={(row.user_count ?? row.users?.length ?? 0) > 0}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={(row.user_count ?? row.users?.length ?? 0) > 0}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const permCatalogColumns: ColumnsType<PermItem> = [
    {
      title: 'Codename',
      dataIndex: 'codename',
      key: 'codename',
      render: (c: string) => <Tag color="blue">{c}</Tag>,
    },
    { title: 'Description', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Groups &amp; permissions
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage Django auth groups and which permissions each group carries. Individual users can still be adjusted
            from each user&apos;s page.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchGroups(); fetchPermissions(); }} loading={loadingGroups || loadingPerms}>
            Refresh
          </Button>
        </Space>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Tabs
          defaultActiveKey="groups"
          items={[
            {
              key: 'groups',
              label: (
                <span>
                  <TeamOutlined /> Auth groups
                </span>
              ),
              children: (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
                      New group
                    </Button>
                  </div>
                  <Table<AuthGroup>
                    rowKey="id"
                    loading={loadingGroups}
                    columns={groupColumns}
                    dataSource={groups}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                  />
                </div>
              ),
            },
            {
              key: 'catalog',
              label: (
                <span>
                  <SafetyCertificateOutlined /> Permission catalog
                </span>
              ),
              children: (
                <div className="space-y-3">
                  <Input.Search
                    allowClear
                    placeholder="Search by codename or label…"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    style={{ maxWidth: 360 }}
                  />
                  <Table<PermItem>
                    rowKey="id"
                    loading={loadingPerms}
                    columns={permCatalogColumns}
                    dataSource={filteredCatalogPerms}
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Create group"
        open={createOpen}
        onOk={submitCreate}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        okText="Create"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter a group name' }]}>
            <Input placeholder="e.g. Support agents" maxLength={150} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rename group"
        open={!!renameGroup}
        onOk={submitRename}
        onCancel={() => { setRenameGroup(null); renameForm.resetFields(); }}
        okText="Save"
        destroyOnClose
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter a group name' }]}>
            <Input maxLength={150} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={memberGroup ? `Members — ${memberGroup.name}` : 'Members'}
        open={!!memberGroup}
        onCancel={closeMembersModal}
        width={640}
        footer={[
          <Button key="close" onClick={closeMembersModal}>
            Close
          </Button>,
        ]}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" className="!mb-3" style={{ fontSize: 12 }}>
          Add accounts from the user directory. Users already in this group are hidden from the picker.
        </Typography.Paragraph>
        <Space direction="vertical" className="w-full" size="middle">
          <Space.Compact className="w-full">
            <Select
              mode="multiple"
              showSearch
              allowClear
              placeholder={loadingAdminUsers ? 'Loading users…' : 'Search by email or name…'}
              className="flex-1 min-w-0"
              style={{ minWidth: 0 }}
              options={addableUserOptions}
              value={pendingUserIds}
              onChange={(v) => setPendingUserIds(v)}
              optionFilterProp="label"
              loading={loadingAdminUsers}
              disabled={loadingAdminUsers}
            />
            <Button
              type="primary"
              onClick={addMembersToGroup}
              loading={savingMembers}
              disabled={pendingUserIds.length === 0 || !memberGroup}
            >
              Add to group
            </Button>
          </Space.Compact>
          <div className="flex justify-end">
            <Button type="link" size="small" onClick={() => void fetchAdminUsers()} loading={loadingAdminUsers}>
              Reload user list
            </Button>
          </div>
          <Typography.Text strong className="block">
            Current members ({memberGroup?.users?.length ?? 0})
          </Typography.Text>
          <Table<GroupMember>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={memberGroup?.users ?? []}
            columns={[
              { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
              {
                title: 'Name',
                key: 'name',
                width: 160,
                render: (_, u) =>
                  [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || '—',
              },
              {
                title: '',
                key: 'rm',
                width: 100,
                render: (_, u) => (
                  <Popconfirm
                    title="Remove from group?"
                    onConfirm={() => removeUserFromGroup(u.id)}
                    okText="Remove"
                    cancelText="Cancel"
                  >
                    <Button type="link" size="small" danger disabled={savingMembers}>
                      Remove
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Space>
      </Modal>

      <Modal
        title={permGroup ? `Permissions — ${permGroup.name}` : 'Permissions'}
        open={!!permGroup}
        onCancel={closePermEditor}
        width={720}
        footer={[
          <Button key="cancel" onClick={closePermEditor}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={savingPerms} onClick={saveGroupPermissions}>
            Save permissions
          </Button>,
        ]}
        destroyOnClose
      >
        <Input.Search
          allowClear
          placeholder="Filter permissions…"
          value={modalPermSearch}
          onChange={(e) => setModalPermSearch(e.target.value)}
          className="mb-2"
        />
        <Space size="middle" wrap className="mb-2">
          <Button
            type="link"
            size="small"
            className="px-0"
            onClick={() => setSelectedPermIds(allPerms.map((p) => p.id))}
            disabled={allPerms.length === 0}
          >
            Select all ({allPerms.length})
          </Button>
          <Button
            type="link"
            size="small"
            className="px-0"
            onClick={() => setSelectedPermIds([])}
            disabled={selectedPermIds.length === 0}
          >
            Clear all
          </Button>
          {modalPermSearch.trim() ? (
            <Button
              type="link"
              size="small"
              className="px-0"
              onClick={() => {
                const next = new Set(selectedPermIds);
                filteredModalPerms.forEach((p) => next.add(p.id));
                setSelectedPermIds(Array.from(next));
              }}
              disabled={filteredModalPerms.length === 0}
            >
              Select all filtered ({filteredModalPerms.length})
            </Button>
          ) : null}
        </Space>
        <div className="max-h-[55vh] overflow-y-auto border border-gray-100 rounded p-2">
          <Checkbox.Group
            style={{ width: '100%' }}
            value={selectedPermIds}
            onChange={(vals) => setSelectedPermIds(vals as number[])}
          >
            <Space direction="vertical" className="w-full">
              {filteredModalPerms.map((p) => (
                <Checkbox key={p.id} value={p.id}>
                  <Typography.Text code>{p.codename}</Typography.Text>
                  <Typography.Text type="secondary" className="ml-2">
                    {p.name}
                  </Typography.Text>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
        <Typography.Paragraph type="secondary" className="mt-2 mb-0" style={{ fontSize: 12 }}>
          {selectedPermIds.length} permission(s) selected. This replaces the group&apos;s permission set.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
};

export default GroupsPermissionsManagement;
