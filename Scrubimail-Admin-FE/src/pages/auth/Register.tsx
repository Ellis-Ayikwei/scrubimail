import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Github,
  Chrome,
  Gitlab
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RegisterUser } from '../../store/authSlice';
import { RootState } from '../../store/index';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const dispatch = useDispatch();
  const { loading, error: authError, message } = useSelector((state: RootState) => state.auth);

  const ssoProviders = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Sign up with your GitHub account',
      color: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: Gitlab,
      description: 'Sign up with your GitLab account',
      color: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-white'
    },
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      description: 'Sign up with your Google account',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (formData.password.length < 8) {
      return;
    }

    try {
      await dispatch(RegisterUser({
        userOrEmail: {
          email: formData.email,
          username: `${formData.firstName} ${formData.lastName}`
        },
        password: formData.password,
        confirm_password: formData.confirmPassword
      }) as any);

      if (message) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      // Error is handled by Redux state
    }
  };

  const handleSSO = async (providerId: string) => {
    try {
      // Call the backend OAuth login endpoint
      const response = await fetch(`/api/auth/oauth/${providerId}/login/?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.authorization_url) {
        // Redirect to the OAuth provider's authorization URL
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      console.error('OAuth login error:', err);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">

            <img src='/assets/images/scrubi.png' alt="Logo" className='w-10' />
              
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              Account Created Successfully!
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
              Welcome to Scrubimail! Your account has been created successfully.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center space-y-4">
              <p className="text-[#333333] dark:text-gray-300">
                You can now sign in to your account and start using our email validation services.
              </p>
              
              <button
                onClick={() => setSuccess(false)}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
              >
                Continue to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center">
          <Link to="/dashboard" className="flex items-center space-x-2">
              <img src='/assets/images/scrubi.png' alt="Logo" className='w-10' />
                
              </Link>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
            Join thousands of developers using Scrubimail
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* SSO Providers */}
          <div className="mb-6">
            <div className="flex justify-center space-x-3">
              {ssoProviders.map((provider) => {
                const IconComponent = provider.icon;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleSSO(provider.id)}
                    disabled={loading}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${provider.color} ${provider.textColor} hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{provider.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-[#333333]/70 dark:text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {authError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#333333]/50" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="First name"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#333333]/50" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#333333]/50" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#333333]/50" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#333333]/50 dark:text-gray-400">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#333333]/50" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                disabled={loading}
                className="h-4 w-4 text-[#2ED8A3] focus:ring-[#2ED8A3] border-gray-300 rounded mt-1 disabled:opacity-50"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-[#333333] dark:text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-[#2ED8A3] hover:text-[#004E8A]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#2ED8A3] hover:text-[#004E8A]">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Sign Up Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="text-center">
          <p className="text-xs text-[#333333]/50 dark:text-gray-400">
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 