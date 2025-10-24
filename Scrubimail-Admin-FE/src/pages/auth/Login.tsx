import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Github,
  Chrome,
  Gitlab
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { LoginUser } from '../../store/authSlice';
import { RootState } from '../../store/index';
import authAxiosInstance from '../../services/authAxiosInstance';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  
  const dispatch = useDispatch();
  const signIn = useSignIn();
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);

  const ssoProviders = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Sign in with your GitHub account',
      color: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: Gitlab,
      description: 'Sign in with your GitLab account',
      color: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-white'
    },
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      description: 'Sign in with your Google account',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const resultAction = await dispatch(
        LoginUser({
          email,
          password,
          extra: {
            signIn: signIn,
          },
        }) as any
      ).unwrap();

      if (resultAction) {
        navigate(from);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleSSO = async (providerId: string) => {
    try {
      setError(null);
      
      // Call the backend OAuth login endpoint
      const response = await authAxiosInstance.get(`/oauth/${providerId}/login/?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}`);
      
      const data = await response.data;
      
      if (data.authorization_url) {
        // Redirect to the OAuth provider's authorization URL
        window.location.href = data.authorization_url;
      } else {
        setError('Failed to initiate OAuth login');
      }
    } catch (err: any) {
      console.error('OAuth login error:', err);
      setError('OAuth login failed. Please try again.');
    }
  };

  // Show auth error from Redux if it exists
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
            Sign in to your Scrubimail account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
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
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  disabled={loading}
                  className="h-4 w-4 text-[#2ED8A3] focus:ring-[#2ED8A3] border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#333333] dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
                >
                  Sign up
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

export default Login; 