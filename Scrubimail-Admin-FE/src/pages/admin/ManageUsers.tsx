import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  CreditCard,
  Activity,
  AlertTriangle,
  MoreVertical,
  Shield,
  Clock
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

interface UserGroup {
  id: number;
  name: string;
  user_count?: number;
}

interface UserPermission {
  id: number;
  name: string;
  codename: string;
  content_type?: unknown;
}

interface UserBilling {
  credits_remaining: number;
  credits_used_this_month: number;
  current_plan: { id: number; name: string; price: string; credits_per_month: number } | null;
}

// Aligned with the backend AdminUserSerializer shape (snake_case).
interface User {
  id: string; // UUID string, not a number
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string | null;
  user_type?: string;
  account_status?: string;
  last_active?: string | null;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups?: UserGroup[];
  roles?: string[];
  user_permissions?: UserPermission[];
  billing?: UserBilling | null;
}

interface UserStats {
  total: number;
  active: number;
  new: number;
  suspended: number;
}

const getDisplayName = (user: User): string => {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return full || user.email;
};

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /admin/users/ returns a PLAIN ARRAY (no { results }).
      const response = await axiosInstance.get('/admin/users/');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/users/stats/');
      const { total, active, new: newUsers, suspended } = response.data ?? {};
      setStats({
        total: total ?? 0,
        active: active ?? 0,
        new: newUsers ?? 0,
        suspended: suspended ?? 0,
      });
    } catch (err: any) {
      // Stats are non-critical; cards fall back to values derived from the list.
      console.error('Error fetching user stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/`, {
        is_active: !isActive
      });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !isActive } : user
      ));
    } catch (err: any) {
      setError('Failed to update user status');
    }
  };

  const handleToggleStaffStatus = async (userId: string, isStaff: boolean) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/`, {
        is_staff: !isStaff
      });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_staff: !isStaff } : user
      ));
    } catch (err: any) {
      setError('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axiosInstance.delete(`/admin/users/${userId}/`);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err: any) {
      setError('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = user.email.toLowerCase().includes(term) ||
                         getDisplayName(user).toLowerCase().includes(term) ||
                         (user.user_type ?? '').toLowerCase().includes(term);

    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.is_staff) ||
                       (filterRole === 'user' && !user.is_staff);
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleBadge = (user: User) => {
    if (user.is_superuser) {
      return { text: 'Super Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    } else if (user.is_staff) {
      return { text: 'Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    } else {
      return { text: 'User', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#2ED8A3] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1">Manage all users and their permissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchUsers}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 bg-[#2ED8A3] text-white px-4 py-2 rounded-lg hover:bg-[#00C48C]">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.total ?? users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.active ?? users.filter(u => u.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Admins</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.is_staff).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">New This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.new ?? users.filter(u => {
                  const joinDate = new Date(u.date_joined);
                  const now = new Date();
                  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                  return joinDate >= monthAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {getDisplayName(user).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {user.email}
                          </div>
                          {user.user_type && (
                            <div className="text-xs text-gray-400 dark:text-gray-400 capitalize">
                              {user.user_type}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleBadge.color}`}>
                        {roleBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>{user.groups?.length || 0} group{(user.groups?.length || 0) === 1 ? '' : 's'}</span>
                      </div>
                      {user.last_active && (
                        <div className="text-xs text-gray-400 dark:text-gray-400">
                          Last active: {new Date(user.last_active).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(user.date_joined).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View user details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          className={`${
                            user.is_active 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {!user.is_superuser && (
                          <button
                            onClick={() => handleToggleStaffStatus(user.id, user.is_staff)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {!user.is_superuser && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ManageUsers;

