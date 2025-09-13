import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Solutions Inc.',
    location: 'San Francisco, CA',
    bio: 'Full-stack developer with 5+ years of experience in email validation and API development.'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  const handleProfileSave = () => {
    // TODO: Implement profile save logic
    console.log('Saving profile:', profileData);
  };

  const handlePasswordSubmit = () => {
    // TODO: Implement password change logic
    console.log('Changing password:', passwordData);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-[#2ED8A3] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profileData.firstName[0]}{profileData.lastName[0]}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#004E8A] rounded-full flex items-center justify-center text-white hover:bg-[#2ED8A3] transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#333333] dark:text-white">
              {profileData.firstName} {profileData.lastName}
            </h1>
            <p className="text-[#333333]/70 dark:text-gray-400">{profileData.email}</p>
            <p className="text-sm text-[#333333]/50 dark:text-gray-500">Member since January 2024</p>
          </div>
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
                  className="px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
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
                  className="px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-colors flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Update Password</span>
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
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">Credit Alerts</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Get notified when your credits are running low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#333333] dark:text-white">API Usage Reports</h3>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Weekly reports on your API usage and performance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
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
                  <span className="px-3 py-1 bg-[#2ED8A3] text-white text-sm font-medium rounded-full">Professional</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Monthly Cost</p>
                    <p className="text-lg font-semibold text-[#333333] dark:text-white">$99.00</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Credits Used</p>
                    <p className="text-lg font-semibold text-[#333333] dark:text-white">32,847 / 50,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Next Billing</p>
                    <p className="text-lg font-semibold text-[#333333] dark:text-white">March 15, 2024</p>
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
          <button className="px-4 py-2 bg-[#FF4C4C] text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 