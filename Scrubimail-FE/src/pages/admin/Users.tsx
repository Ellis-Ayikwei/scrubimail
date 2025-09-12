import React, { useState } from 'react';
import { DataTable } from 'mantine-datatable';
import IconSearch from '../../components/Icon/IconSearch';
import IconPlus from '../../components/Icon/IconPlus';
import IconEdit from '../../components/Icon/IconEdit';
import IconTrash from '../../components/Icon/IconTrash';
import IconEye from '../../components/Icon/IconEye';
import IconFilter from '../../components/Icon/IconFilter';
import IconDownload from '../../components/Icon/IconDownload';
import IconMail from '../../components/Icon/IconMail';
import IconBan from '../../components/Icon/IconBan';
import IconUsersGroup from '../../components/Icon/IconUsersGroup';
import IconTrendingUp from '../../components/Icon/IconTrendingUp';

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
    const [search, setSearch] = useState('');
    const [selectedRecords, setSelectedRecords] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<{ columnAccessor: string; direction: 'asc' | 'desc' }>({
        columnAccessor: 'name',
        direction: 'asc',
    });

    // Sample data
    const users: User[] = [
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
        },
        {
            id: '4',
            name: 'Alice Brown',
            email: 'alice.brown@example.com',
            role: 'Moderator',
            status: 'active',
            joinDate: '2023-01-25',
            lastActive: '1 hour ago',
            plan: 'Premium',
        },
        {
            id: '5',
            name: 'Charlie Wilson',
            email: 'charlie.wilson@example.com',
            role: 'User',
            status: 'suspended',
            joinDate: '2023-04-05',
            lastActive: '1 week ago',
            plan: 'Basic',
        },
        // Add more sample users...
    ];

    // Filter users based on search
    const filteredUsers = users.filter((user) => {
        return (
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.role.toLowerCase().includes(search.toLowerCase())
        );
    });

    // Sort users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aValue = a[sortStatus.columnAccessor as keyof User];
        const bValue = b[sortStatus.columnAccessor as keyof User];
        
        if (sortStatus.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleEdit = (user: User) => {
        console.log('Edit user:', user);
        // Implement edit functionality
    };

    const handleDelete = (user: User) => {
        console.log('Delete user:', user);
        // Implement delete functionality
    };

    const handleView = (user: User) => {
        console.log('View user:', user);
        // Implement view functionality
    };

    const handleBulkAction = (action: string) => {
        console.log(`Bulk action: ${action}`, selectedRecords);
        // Implement bulk actions
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your platform users and their permissions</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark flex items-center gap-2">
                    <IconPlus className="w-4 h-4" />
                    Add New User
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8,549</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <IconUsersGroup className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">7,234</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">New This Month</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">423</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <IconTrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Suspended</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">89</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                            <IconBan className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2">
                                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                    <IconFilter className="w-4 h-4" />
                                    Filters
                                </button>
                                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                    <IconDownload className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedRecords.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkAction('email')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <IconMail className="w-4 h-4" />
                                    Email Selected
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                                >
                                    <IconTrash className="w-4 h-4" />
                                    Delete Selected
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <DataTable
                    columns={[
                        {
                            accessor: 'name',
                            title: 'User',
                            sortable: true,
                            render: ({ name, email, avatar }) => (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                        {avatar ? (
                                            <img src={avatar} alt={name} className="w-full h-full rounded-full" />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'role',
                            title: 'Role',
                            sortable: true,
                            render: ({ role }) => (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    role === 'Admin'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                                        : role === 'Moderator'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {role}
                                </span>
                            ),
                        },
                        {
                            accessor: 'status',
                            title: 'Status',
                            sortable: true,
                            render: ({ status }) => (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    status === 'active'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                        : status === 'inactive'
                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                }`}>
                                    {status}
                                </span>
                            ),
                        },
                        {
                            accessor: 'plan',
                            title: 'Plan',
                            sortable: true,
                        },
                        {
                            accessor: 'joinDate',
                            title: 'Join Date',
                            sortable: true,
                            render: ({ joinDate }) => (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(joinDate).toLocaleDateString()}
                                </span>
                            ),
                        },
                        {
                            accessor: 'lastActive',
                            title: 'Last Active',
                            sortable: true,
                            render: ({ lastActive }) => (
                                <span className="text-sm text-gray-500 dark:text-gray-400">{lastActive}</span>
                            ),
                        },
                        {
                            accessor: 'actions',
                            title: 'Actions',
                            textAlignment: 'right',
                            render: (user) => (
                                <div className="flex items-center justify-end space-x-2">
                                    <button
                                        onClick={() => handleView(user)}
                                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        title="View user"
                                    >
                                        <IconEye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        title="Edit user"
                                    >
                                        <IconEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user)}
                                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        title="Delete user"
                                    >
                                        <IconTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    records={sortedUsers}
                    selectedRecords={selectedRecords}
                    onSelectedRecordsChange={setSelectedRecords}
                    page={page}
                    onPageChange={setPage}
                    recordsPerPage={pageSize}
                    recordsPerPageOptions={[10, 20, 30, 50]}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    minHeight={400}
                    striped
                    highlightOnHover
                    withBorder={false}
                    className="dark:text-white"
                />
            </div>
        </div>
    );
};

export default AdminUsers;