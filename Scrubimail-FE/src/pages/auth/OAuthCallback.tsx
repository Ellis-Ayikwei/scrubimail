import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { LoginUser } from '../../store/authSlice';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get tokens from URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const provider = searchParams.get('provider');
        const errorParam = searchParams.get('error');

        // Check for OAuth errors
        if (errorParam) {
          setError(`OAuth authentication failed: ${errorParam}`);
          setStatus('error');
          return;
        }

        // Check if we have the required tokens
        if (!accessToken || !refreshToken) {
          setError('Authentication tokens not found');
          setStatus('error');
          return;
        }

        // Use the auth slice to handle the login
        await dispatch(LoginUser({ 
          password: '', // Not needed for OAuth
          extra: {}
        }) as any);

        setStatus('success');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, dispatch]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              Completing Authentication
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
              Please wait while we complete your sign-in...
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="animate-spin h-6 w-6 text-[#2ED8A3]" />
              <span className="text-[#333333] dark:text-gray-300">Processing authentication...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900">
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
              Authentication Successful!
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
              Welcome to Scrubimail! Redirecting to your dashboard...
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center space-y-4">
              <p className="text-[#333333] dark:text-gray-300">
                You have successfully signed in with your OAuth provider.
              </p>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              Authentication Failed
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
              We couldn't complete your sign-in
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-[#333333] dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback; 