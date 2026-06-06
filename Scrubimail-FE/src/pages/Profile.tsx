import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  CheckCircle,
  Key,
  Lock
} from 'lucide-react';
import { userService, UserProfile, PasswordChangeRequest, NotificationPreferences, ComprehensiveProfile } from '../services/userService';
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
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveProfile | null>(null);
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
        
        // Try to get comprehensive profile first
        try {
          const comprehensive = await userService.getComprehensiveProfile();
          console.log('Comprehensive profile fetched:', comprehensive);
          setComprehensiveProfile(comprehensive);
          
          // Extract user data from comprehensive profile
          const profile = comprehensive.user;
          setUserProfile(profile);
          
          // Extract billing data from comprehensive profile
          if (comprehensive.billing) {
            setBillingProfile({
              id: 1, // Default ID since we don't have it in the response
              credits_remaining: comprehensive.billing.credits_remaining,
              credits_used_this_month: comprehensive.billing.credits_used_this_month,
              current_plan: comprehensive.billing.current_plan
            });
          }
          
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
          
        } catch (comprehensiveError) {
          console.log('Comprehensive profile failed, falling back to individual calls:', comprehensiveError);
          
          // Fallback to individual API calls
          const [profile, billing] = await Promise.all([
            userService.getProfile(),
            billingService.getBillingProfile().catch(() => null)
          ]);
          
          console.log('Fallback profile data fetched:', { profile, billing });
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
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#31353a] rounded-sm animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-40 bg-[#31353a] rounded animate-pulse" />
              <div className="h-2 w-56 bg-[#31353a] rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 font-mono">

      {/* Error/Success */}
      {error && (
        <div className="bg-[#ff4c4c]/10 border border-[#ff4c4c]/30 rounded-sm p-3 flex items-center gap-2 text-[#ff4c4c] text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#6effc0]/10 border border-[#6effc0]/30 rounded-sm p-3 flex items-center gap-2 text-[#6effc0] text-xs">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Header card */}
      <div className="bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#6effc0] rounded-sm flex items-center justify-center text-[#003824] font-bold text-xl flex-shrink-0" style={{ fontFamily: 'Epilogue, sans-serif' }}>
              {userProfile ? userService.getInitials(userProfile) : 'U'}
            </div>
            <div>
              <h1 className="font-bold text-[#e0e3e8] text-base tracking-tight" style={{ fontFamily: 'Epilogue, sans-serif' }}>
                {userProfile ? userService.getFullName(userProfile) : '—'}
              </h1>
              <p className="text-[10px] text-[#bacbbf] mt-0.5">{userProfile?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-[#6effc0]" />
                <span className="uppercase tracking-[0.1em] text-[9px] text-[#3b4a41]">
                  Member since {userProfile ? userService.formatDate(userProfile.date_joined) : '—'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="p-1.5 text-[#3b4a41] hover:text-[#6effc0] hover:bg-[#31353a] rounded-sm transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm">
        {/* Tab bar */}
        <div className="flex border-b border-[#3b4a41]/40">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 uppercase tracking-[0.1em] text-[10px] transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#6effc0] text-[#6effc0]'
                    : 'border-transparent text-[#bacbbf]/50 hover:text-[#bacbbf]'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <p className="uppercase tracking-[0.12em] text-[9px] text-[#3b4a41]">Personal Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'First Name', name: 'firstName', type: 'text' },
                  { label: 'Last Name', name: 'lastName', type: 'text' },
                  { label: 'Email Address', name: 'email', type: 'email' },
                  { label: 'Phone Number', name: 'phone', type: 'tel' },
                  { label: 'Company', name: 'company', type: 'text' },
                  { label: 'Location', name: 'location', type: 'text' },
                ].map(({ label, name, type }) => (
                  <div key={name}>
                    <label className="block uppercase tracking-[0.1em] text-[9px] text-[#bacbbf] mb-1.5">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={(profileData as any)[name]}
                      onChange={handleProfileChange}
                      className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-3 py-2 text-[#e0e3e8] font-mono text-xs focus:border-[#6effc0]/50 focus:outline-none w-full"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block uppercase tracking-[0.1em] text-[9px] text-[#bacbbf] mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  rows={3}
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-3 py-2 text-[#e0e3e8] font-mono text-xs focus:border-[#6effc0]/50 focus:outline-none w-full resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#6effc0] text-[#003824] px-4 py-2 rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] transition-colors disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="uppercase tracking-[0.12em] text-[9px] text-[#3b4a41]">Security Settings</p>
                <Link
                  to="/security"
                  className="flex items-center gap-1.5 bg-[#6effc0]/10 border border-[#6effc0]/20 text-[#6effc0] px-3 py-1.5 rounded-sm uppercase tracking-[0.1em] text-[9px] hover:bg-[#6effc0]/20 transition-colors"
                >
                  <Key className="w-3 h-3" />
                  2FA Setup
                </Link>
              </div>

              <div className="bg-[#101418] border border-[#6effc0]/15 rounded-sm p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-[#6effc0] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="uppercase tracking-[0.1em] text-[10px] text-[#6effc0] font-bold">Enhanced Security Available</p>
                  <p className="text-[10px] text-[#bacbbf]/70 mt-1">Enable two-factor authentication to add an extra layer of security.</p>
                </div>
              </div>

              <p className="uppercase tracking-[0.12em] text-[9px] text-[#3b4a41] pt-2">Change Password</p>
              <div className="space-y-3">
                {[
                  { label: 'Current Password', name: 'currentPassword', show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
                  { label: 'New Password', name: 'newPassword', show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                  { label: 'Confirm New Password', name: 'confirmPassword', show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
                ].map(({ label, name, show, toggle }) => (
                  <div key={name}>
                    <label className="block uppercase tracking-[0.1em] text-[9px] text-[#bacbbf] mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'}
                        name={name}
                        value={(passwordData as any)[name]}
                        onChange={handlePasswordInputChange}
                        className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-3 py-2 pr-10 text-[#e0e3e8] font-mono text-xs focus:border-[#6effc0]/50 focus:outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={toggle}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#3b4a41] hover:text-[#6effc0]"
                      >
                        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePasswordSubmit}
                  disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex items-center gap-2 bg-[#6effc0] text-[#003824] px-4 py-2 rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] transition-colors disabled:opacity-40"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <p className="uppercase tracking-[0.12em] text-[9px] text-[#3b4a41]">Notification Preferences</p>
              <div className="space-y-2">
                {[
                  { key: 'email_notifications' as const, label: 'Email Notifications', desc: 'Updates about your account and validation results' },
                  { key: 'credit_alerts' as const, label: 'Credit Alerts', desc: 'Get notified when your credits are running low' },
                  { key: 'api_usage_reports' as const, label: 'API Usage Reports', desc: 'Weekly reports on your API usage and performance' },
                  { key: 'marketing_emails' as const, label: 'Marketing Emails', desc: 'Updates about new features and promotions' },
                  { key: 'security_alerts' as const, label: 'Security Alerts', desc: 'Important security updates and alerts' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-[#101418] border border-[#3b4a41]/20 rounded-sm">
                    <div>
                      <p className="uppercase tracking-[0.08em] text-[11px] text-[#e0e3e8]">{label}</p>
                      <p className="text-[10px] text-[#bacbbf]/60 mt-0.5">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationPreferences[key]}
                        onChange={() => handleNotificationChange(key)}
                      />
                      <div className="w-9 h-5 bg-[#31353a] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6effc0]" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleNotificationSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#6effc0] text-[#003824] px-4 py-2 rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] transition-colors disabled:opacity-40"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              <p className="uppercase tracking-[0.12em] text-[9px] text-[#3b4a41]">Billing Information</p>
              <div className="bg-[#101418] border border-[#3b4a41]/30 rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="uppercase tracking-[0.1em] text-[10px] text-[#bacbbf]">Current Plan</p>
                  <span className="bg-[#6effc0]/10 border border-[#6effc0]/20 text-[#6effc0] px-2 py-1 rounded-sm uppercase tracking-[0.1em] text-[9px] font-bold">
                    {billingProfile?.current_plan?.name || 'Free Plan'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Monthly Cost', value: `$${billingProfile?.current_plan?.price || '0.00'}` },
                    { label: 'Credits Used', value: billingProfile ? `${(billingProfile.credits_used_this_month || 0).toLocaleString()} / ${((billingProfile.credits_remaining || 0) + (billingProfile.credits_used_this_month || 0)).toLocaleString()}` : '0 / 0' },
                    { label: 'Credits Remaining', value: (billingProfile?.credits_remaining || 0).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="uppercase tracking-[0.1em] text-[9px] text-[#3b4a41] mb-1">{label}</p>
                      <p className="text-[#e0e3e8] text-base font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Link to="/billing" className="bg-[#6effc0] text-[#003824] px-4 py-2 rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] transition-colors">
                    Upgrade Plan
                  </Link>
                  <Link to="/billing" className="border border-[#3b4a41]/40 text-[#bacbbf] px-4 py-2 rounded-sm uppercase tracking-[0.1em] text-[10px] hover:border-[#6effc0]/40 hover:text-[#6effc0] transition-colors">
                    View Invoice
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1c2024] border border-[#ff4c4c]/20 rounded-sm p-5">
        <p className="uppercase tracking-[0.12em] text-[9px] text-[#ff4c4c] mb-4">Danger Zone</p>
        <div className="flex items-center justify-between p-4 bg-[#ff4c4c]/5 border border-[#ff4c4c]/10 rounded-sm">
          <div>
            <p className="uppercase tracking-[0.08em] text-[11px] text-[#e0e3e8]">Delete Account</p>
            <p className="text-[10px] text-[#bacbbf]/60 mt-0.5">Permanently delete your account and all associated data</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="flex items-center gap-2 bg-[#ff4c4c]/10 border border-[#ff4c4c]/30 text-[#ff4c4c] px-4 py-2 rounded-sm uppercase tracking-[0.1em] text-[10px] hover:bg-[#ff4c4c]/20 transition-colors disabled:opacity-40 flex-shrink-0 ml-4"
          >
            <LogOut className="w-3.5 h-3.5" />
            {saving ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Profile; 