import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import authAxiosInstance from '../../services/authAxiosInstance';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();

  // Backend emails a link shaped `/reset-password/<uidb64>/<token>`; also accept
  // a query-string fallback (`?uidb64=&token=`).
  const uidb64 = params.uidb64 ?? searchParams.get('uidb64') ?? '';
  const token = params.token ?? searchParams.get('token') ?? '';

  useEffect(() => {
    // No server-side token pre-validation endpoint exists; the token is verified
    // on submit by the password-reset-confirm endpoint. Just check presence here.
    if (!uidb64 || !token) {
      setError('Reset link is invalid or incomplete');
    }
    setValidating(false);
  }, [uidb64, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!uidb64 || !token) {
      setError('Reset link is invalid or incomplete');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend: POST /auth/password-reset-confirm/<uidb64>/<token>/
      // body { password, uidb64, token } -> { detail } on 2xx
      await authAxiosInstance.post(`/password-reset-confirm/${uidb64}/${token}/`, {
        password,
        uidb64,
        token,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const serverData = err.response?.data;
      setError(serverData?.detail || serverData?.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
    if (error) setError('');
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              Validating Reset Link
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
              Please wait while we verify your password reset link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              Password Reset Successfully
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center space-y-4">
              <p className="text-[#333333] dark:text-gray-300">
                For security reasons, you have been signed out of all devices. Please sign in again.
              </p>
              
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
              >
                Sign In
              </Link>
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
            <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Form */}
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

            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#333333]/70" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-[#333333]/70 hover:text-[#333333]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[#333333]/70 hover:text-[#333333]" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#333333]/70 dark:text-gray-300">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#333333]/70" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-[#333333]/70 hover:text-[#333333]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[#333333]/70 hover:text-[#333333]" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Updating password...
                  </div>
                ) : (
                  'Update password'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="text-center">
          <p className="text-xs text-[#333333]/70 dark:text-gray-300">
            This link will expire in 1 hour for security
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 