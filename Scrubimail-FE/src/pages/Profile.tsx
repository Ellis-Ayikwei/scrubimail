import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Save, 
  Eye, 
  EyeOff,
  Camera,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { userService, UserProfile, PasswordChangeRequest, NotificationPreferences } from '../services/userService';
import { billingService, BillingProfile } from '../services/billingService';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    credit_alerts: true,
    api_usage_reports: false,
    marketing_emails: false,
    security_alerts: true
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [profile, billing] = await Promise.all([
          userService.getProfile(),
          billingService.getBillingProfile().catch(() => null)
        ]);
        
        setUserProfile(profile);
        setBillingProfile(billing);
        
        // Update profile data with real user data
        setProfileData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone_number || '',
          company: '', // Not available in user model
          location: '', // Not available in user model
          bio: '' // Not available in user model
        });

        // Update notification preferences if available
        if (profile.notification_preferences) {
          setNotificationPreferences(profile.notification_preferences);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await userService.updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone_number: profileData.phone
      });

      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await userService.changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });

      setSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationPreferences) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNotificationSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await userService.updateNotificationPreferences(notificationPreferences);
      setSuccess('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setError('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setSaving(true);
        setError(null);
        
        await userService.deleteAccount();
        // Redirect to login or home page
        window.location.href = '/';
      } catch (error) {
        console.error('Error deleting account:', error);
        setError('Failed to delete account');
        setSaving(false);
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700 dark:text-green-300">{success}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-[#2ED8A3] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userProfile ? userService.getInitials(userProfile) : 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#004E8A] rounded-full flex items-center justify-center text-white hover:bg-[#2ED8A3] transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#333333] dark:text-white">
                {userProfile ? userService.getFullName(userProfile) : 'Loading...'}
            </h1>
              <p className="text-[#333333]/70 dark:text-gray-400">{userProfile?.email || 'Loading...'}</p>
              <p className="text-sm text-[#333333]/50 dark:text-gray-500">
                Member since {userProfile ? userService.formatDate(userProfile.date_joined) : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-[#2ED8A3] transition-colors duration-200 disabled:opacity-50"
            title="Refresh profile"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#2ED8A3] text-[#2ED8A3]'
                      : 'border-transparent text-[#333333]/70 dark:text-gray-400 hover:text-[#333333] dark:hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#333333] dark:text-white">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={profileData.company}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white resize-none"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#333333] dark:text-white">Change Password</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5 text-[#333333]/50" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#333333]/50" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5 text-[#333333]/50" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#333333]/50" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-[#333333]/50" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#333333]/50" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handlePasswordSubmit}
                  disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  <span>{saving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#333333] dark:text-white">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Receive updates about your account and validation results</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationPreferences.email_notifications}
                      onChange={() => handleNotificationChange('email_notifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">Credit Alerts</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Get notified when your credits are running low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationPreferences.credit_alerts}
                      onChange={() => handleNotificationChange('credit_alerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">API Usage Reports</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Weekly reports on your API usage and performance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationPreferences.api_usage_reports}
                      onChange={() => handleNotificationChange('api_usage_reports')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">Marketing Emails</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Receive updates about new features and promotions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationPreferences.marketing_emails}
                      onChange={() => handleNotificationChange('marketing_emails')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">Security Alerts</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Get notified about important security updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationPreferences.security_alerts}
                      onChange={() => handleNotificationChange('security_alerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNotificationSave}
                  disabled={saving}
                  className="px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Bell className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#333333] dark:text-white">Billing Information</h2>
              
              <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-[#333333] dark:text-white">Current Plan</h3>
                  <span className="px-3 py-1 bg-[#2ED8A3] text-white text-sm font-medium rounded-full">
                    {billingProfile?.current_plan?.name || 'Free Plan'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Monthly Cost</p>
                    <p className="text-lg font-semibold text-[#333333] dark:text-white">
                      ${billingProfile?.current_plan?.price || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Credits Used</p>
                    <p className="text-lg font-semibold text-[#333333] dark:text-white">
                      {billingProfile ? `${billingProfile.credits_used_this_month.toLocaleString()} / ${(billingProfile.credits_remaining + billingProfile.credits_used_this_month).toLocaleString()}` : '0 / 0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Credits Remaining</p>
                    <p className="text-lg font-semibold text-[#333333] dark:text-white">
                      {billingProfile?.credits_remaining.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button className="px-4 py-2 bg-[#2ED8A3] text-white font-medium rounded-lg hover:bg-[#00C48C] transition-colors">
                    Upgrade Plan
                  </button>
                  <button className="px-4 py-2 border border-[#2ED8A3] text-[#2ED8A3] font-medium rounded-lg hover:bg-[#2ED8A3] hover:text-white transition-colors">
                    View Invoice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-[#FF4C4C] mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div>
            <h3 className="font-medium text-[#333333] dark:text-white">Delete Account</h3>
            <p className="text-sm text-[#333333]/70 dark:text-gray-400">Permanently delete your account and all associated data</p>
          </div>
          <button 
            onClick={handleDeleteAccount}
            disabled={saving}
            className="px-4 py-2 bg-[#FF4C4C] text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span>{saving ? 'Deleting...' : 'Delete Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 