import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Trash2,
  Eye,
  Filter,
  Search
} from 'lucide-react';

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Bulk validation completed',
      message: 'Your bulk validation of 5,000 emails has been completed successfully.',
      time: '2 minutes ago',
      read: false,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'warning',
      title: 'API rate limit approaching',
      message: 'You have used 85% of your monthly API quota. Consider upgrading your plan.',
      time: '1 hour ago',
      read: false,
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      id: 3,
      type: 'info',
      title: 'New validation features available',
      message: 'We\'ve added new domain reputation checking to improve accuracy.',
      time: '3 hours ago',
      read: true,
      icon: Mail,
      color: 'text-blue-600'
    },
    {
      id: 4,
      type: 'success',
      title: 'Payment processed successfully',
      message: 'Your subscription has been renewed for another month.',
      time: '1 day ago',
      read: true,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 5,
      type: 'warning',
      title: 'Validation failed',
      message: 'Bulk validation job #12345 failed due to invalid file format.',
      time: '2 days ago',
      read: false,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      id: 6,
      type: 'info',
      title: 'API key rotated',
      message: 'Your API key has been successfully rotated for security purposes.',
      time: '3 days ago',
      read: true,
      icon: Settings,
      color: 'text-blue-600'
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'unread') return !notification.read && matchesSearch;
    if (activeTab === 'read') return notification.read && matchesSearch;
    return notification.type === activeTab && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    // Implementation for marking as read
    console.log('Mark as read:', id);
  };

  const deleteNotification = (id: number) => {
    // Implementation for deleting notification
    console.log('Delete notification:', id);
  };

  const markAllAsRead = () => {
    // Implementation for marking all as read
    console.log('Mark all as read');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
              <Bell className="w-8 h-8 mr-3 text-[#10B981]" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-[#333333]/70 dark:text-gray-400">
              Stay updated with your email validation activities
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-[#10B981] border border-[#10B981] rounded-3xl hover:bg-[#10B981] hover:text-white transition-colors"
            >
              Mark all as read
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-[#333333] dark:text-white mb-4">Filter</h3>
              
              <div className="space-y-2">
                {[
                  { key: 'all', label: 'All Notifications', count: notifications.length },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'read', label: 'Read', count: notifications.length - unreadCount },
                  { key: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
                  { key: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length },
                  { key: 'info', label: 'Information', count: notifications.filter(n => n.type === 'info').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-3xl transition-colors ${
                      activeTab === tab.key
                        ? 'bg-[#10B981] text-white'
                        : 'text-[#333333] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{tab.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeTab === tab.key
                        ? 'bg-white/20'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-3xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#333333] dark:text-white mb-2">No notifications found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.map((notification) => {
                    const IconComponent = notification.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          !notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                            notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                            notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/20' :
                            'bg-red-100 dark:bg-red-900/20'
                          }`}>
                            <IconComponent className={`w-5 h-5 ${notification.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`text-base font-medium ${
                                  !notification.read 
                                    ? 'text-[#333333] dark:text-white' 
                                    : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                  {!notification.read && (
                                    <span className="ml-2 w-2 h-2 bg-[#10B981] rounded-full inline-block"></span>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {notification.time}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 text-gray-400 hover:text-[#10B981] transition-colors"
                                    title="Mark as read"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </p>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-3xl text-sm text-[#333333] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-[#10B981] text-white rounded-3xl text-sm hover:bg-[#059669] transition-colors">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-3xl text-sm text-[#333333] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;