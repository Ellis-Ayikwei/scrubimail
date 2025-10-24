import React, { useEffect, useState } from 'react';
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

interface User {
  id: number;
  email: string;
  name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  profile?: {
    phone?: string;
    company?: string;
    location?: string;
  };
  billing?: {
    plan: string;
    credits_remaining: number;
    total_credits: number;
  };
  stats?: {
    total_validations: number;
    api_keys_count: number;
    last_activity: string;
  };
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/admin/users/');
      setUsers(response.data);
    } catch (err: any) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
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

  const handleToggleStaffStatus = async (userId: number, isStaff: boolean) => {
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

  const handleDeleteUser = async (userId: number) => {
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
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all users and their permissions</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.is_active).length}
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Admins</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => {
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
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          {user.profile?.company && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {user.profile.company}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>{user.stats?.total_validations || 0} validations</span>
                      </div>
                      {user.last_login && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Last login: {new Date(user.last_login).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(user.date_joined).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Details
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedUser.name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedUser.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Role:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {getRoleBadge(selectedUser).text}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 text-sm ${
                      selectedUser.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Activity</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Validations:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedUser.stats?.total_validations || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">API Keys:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedUser.stats?.api_keys_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Activity:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {selectedUser.stats?.last_activity || 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Joined:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedUser.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedUser.billing && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Billing Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Plan</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.billing.plan}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Credits Remaining</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.billing.credits_remaining.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Credits</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.billing.total_credits.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

