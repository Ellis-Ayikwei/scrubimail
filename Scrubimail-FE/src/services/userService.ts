import axiosInstance from './axiosInstance';

export interface NotificationPreferences {
  email_notifications: boolean;
  credit_alerts: boolean;
  api_usage_reports: boolean;
  marketing_emails: boolean;
  security_alerts: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_picture: string | null;
  user_type: 'customer' | 'admin';
  account_status: 'active' | 'inactive' | 'suspended';
  last_active: string | null;
  date_joined: string;
  notification_preferences?: NotificationPreferences;
  groups: Array<{
    id: number;
    name: string;
    user_count: number;
  }>;
  user_permissions: Array<{
    id: number;
    name: string;
    codename: string;
    content_type: number;
  }>;
  roles: string[];
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: File;
}

export interface ComprehensiveProfile {
  user: UserProfile;
  billing: {
    credits_remaining: number;
    credits_used_this_month: number;
    current_plan: {
      name: string;
      price: number;
      credits: number;
    };
  } | null;
  usage: {
    total_validations: number;
    valid_emails: number;
    invalid_emails: number;
    risky_emails: number;
    success_rate: number;
    credits_used: number;
    credits_remaining: number;
    cost_per_validation: number;
    daily_usage: Array<{
      date: string;
      validations: number;
    }>;
    weekly_usage: Array<{
      date: string;
      validations: number;
    }>;
    monthly_usage: Array<{
      date: string;
      validations: number;
    }>;
  } | null;
  stats: {
    total_validations: number;
    valid_emails: number;
    invalid_emails: number;
    risky_emails: number;
    success_rate: number;
  } | null;
  error?: string;
}

class UserService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      console.log('Fetching user profile...');
      const response = await axiosInstance.get('/auth/user/');
      console.log('Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Get comprehensive user profile with billing and usage data
   */
  async getComprehensiveProfile(): Promise<ComprehensiveProfile> {
    try {
      console.log('Fetching comprehensive profile...');
      const response = await axiosInstance.get('/auth/my-profile/');
      console.log('Comprehensive profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive profile:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error('Failed to load comprehensive profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      const formData = new FormData();
      
      if (data.first_name) formData.append('first_name', data.first_name);
      if (data.last_name) formData.append('last_name', data.last_name);
      if (data.phone_number) formData.append('phone_number', data.phone_number);
      if (data.profile_picture) formData.append('profile_picture', data.profile_picture);

      const response = await axiosInstance.patch('/auth/user/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeRequest): Promise<{ detail: string }> {
    try {
      const response = await axiosInstance.post('/auth/change-password/', data);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('Failed to change password');
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<{ detail: string }> {
    try {
      const response = await axiosInstance.patch('/auth/notification-preferences/', preferences);
      return { detail: 'Notification preferences updated successfully' };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ detail: string }> {
    try {
      const response = await axiosInstance.delete('/auth/delete-account/');
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File): Promise<{ profile_picture: string }> {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await axiosInstance.patch('/auth/user/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture');
    }
  }

  /**
   * Get user's full name
   */
  getFullName(user: UserProfile): string {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  }

  /**
   * Get user's initials for avatar
   */
  getInitials(user: UserProfile): string {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get user type display name
   */
  getUserTypeDisplay(userType: string): string {
    switch (userType) {
      case 'customer':
        return 'Customer';
      case 'admin':
        return 'Administrator';
      default:
        return userType;
    }
  }

  /**
   * Get account status display
   */
  getAccountStatusDisplay(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'suspended':
        return 'Suspended';
      default:
        return status;
    }
  }
}

export const userService = new UserService();
export default userService;
