import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ssoService, { OAUTH_ERROR_MESSAGES } from '../../services/ssoService';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    const handleCallback = async () => {
      // The browser lands here with only a single-use `code` (or an `error`) —
      // never tokens. We exchange the code for tokens over POST.
      const { code, error, provider } = ssoService.getCallbackParams();

      const fail = (msg: string) => {
        setStatus('error');
        setMessage(msg);
        ssoService.clearCallbackFromUrl();
        setTimeout(() => navigate('/login', { replace: true }), 3500);
      };

      if (error) {
        return fail(OAUTH_ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.');
      }
      if (!code) {
        return fail('No sign-in code found. Please try logging in again.');
      }

      try {
        const data = await ssoService.exchangeCode(code);
        const isSignedIn = signIn({
          auth: { token: data.access_token, type: 'Bearer' },
          refresh: data.refresh_token,
          userState: data.user,
        });
        ssoService.clearCallbackFromUrl();

        if (!isSignedIn) {
          return fail('Could not complete sign-in on this device. Please try again.');
        }

        setStatus('success');
        setMessage(
          provider
            ? `Successfully signed in with ${provider}!`
            : 'Successfully signed in!'
        );
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } catch (err: any) {
        fail(err?.message || 'Sign-in failed. Please try logging in again.');
      }
    };

    handleCallback();
  }, [navigate, signIn]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-[#2ED8A3]';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-[#2ED8A3]';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
            OAuth Callback
          </h2>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            
            <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </h3>
            
            <p className="text-[#333333]/70 dark:text-gray-400">
              {message}
            </p>
            
            {status === 'loading' && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-[#2ED8A3] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="mt-4">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Redirecting to dashboard...
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="mt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;