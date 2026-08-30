import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import ssoService, {
  OAUTH_ERROR_MESSAGES,
  TwoFactorRequiredError,
} from '../../services/ssoService';
import { isAdminUser } from '../../components/ProtectedRoute';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'twofactor'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Held so the 2FA form can re-submit it; the challenge does not consume it.
  const pendingCode = useRef<string | null>(null);

  const completeSignIn = (data: any) => {
    const { user, access_token, refresh_token } = data || {};

    if (!access_token || !refresh_token) {
      setError('Invalid token response from server');
      setStatus('error');
      return;
    }

    // This is the admin panel: a provider sign-in proves who you are, not that
    // you are staff. Refuse before storing a session rather than dropping a
    // customer into a shell where every request 403s.
    if (!isAdminUser(user)) {
      setError(OAUTH_ERROR_MESSAGES.not_admin);
      setStatus('error');
      return;
    }

    const isSignedIn = signIn({
      auth: { token: access_token, type: 'Bearer' },
      refresh: refresh_token,
      userState: user,
    });

    if (!isSignedIn) {
      setError('Frontend sign-in failed');
      setStatus('error');
      return;
    }

    if (user?.id) {
      localStorage.setItem('userId', user.id);
    }

    setStatus('success');
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const reportError = (err: any) => {
    console.error('OAuth callback error:', err);
    const serverData = err.response?.data;
    setError(
      serverData?.error?.message || serverData?.detail || err.message || 'Authentication failed'
    );
    setStatus('error');
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Backend redirects here with an opaque one-time `code` (never tokens in the URL).
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(
          OAUTH_ERROR_MESSAGES[errorParam] || `OAuth authentication failed: ${errorParam}`
        );
        setStatus('error');
        return;
      }

      if (!code) {
        setError('Authentication code not found');
        setStatus('error');
        return;
      }

      pendingCode.current = code;

      try {
        completeSignIn(await ssoService.exchangeCode(code));
      } catch (err: any) {
        if (err instanceof TwoFactorRequiredError) {
          setStatus('twofactor');
          return;
        }
        reportError(err);
      }
    };

    handleOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, signIn]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCode.current) return;

    setVerifying(true);
    setError(null);
    try {
      completeSignIn(
        await ssoService.exchangeCode(pendingCode.current, { totpToken: totpToken.trim() })
      );
    } catch (err: any) {
      if (err instanceof TwoFactorRequiredError) {
        setError(err.message || 'That code was not valid. Try again.');
      } else {
        reportError(err);
      }
    } finally {
      setVerifying(false);
    }
  };

  if (status === 'twofactor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <form
            onSubmit={handleVerify}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-4"
          >
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label htmlFor="admin-totp" className="sr-only">
              Authentication code
            </label>
            <input
              id="admin-totp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 tracking-[0.4em] text-center font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
            />

            <button
              type="submit"
              disabled={verifying || totpToken.length < 6}
              className="w-full px-6 py-3 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
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
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
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
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-300">
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