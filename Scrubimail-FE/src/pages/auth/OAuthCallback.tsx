import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import ssoService, {
  OAUTH_ERROR_MESSAGES,
  TwoFactorRequiredError,
} from '../../services/ssoService';

type Status = 'loading' | 'success' | 'error' | 'twofactor';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Completing sign-in...');
  const [totpToken, setTotpToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // The one-time code is held so the 2FA form can re-submit it. The challenge
  // does not consume it server-side, so it stays valid for the rest of its TTL.
  const pendingCode = useRef<string | null>(null);
  const wasLinking = useRef(false);

  const fail = (msg: string) => {
    setStatus('error');
    setMessage(msg);
    ssoService.clearCallbackFromUrl();
    setTimeout(() => navigate('/login', { replace: true }), 3500);
  };

  const finish = (data: any, provider?: string | null) => {
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
    if (wasLinking.current) {
      setMessage(
        provider ? `${provider} linked to your account.` : 'Provider linked to your account.'
      );
      setTimeout(() => navigate('/settings/security', { replace: true }), 1500);
      return;
    }
    setMessage(provider ? `Successfully signed in with ${provider}!` : 'Successfully signed in!');
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
  };

  useEffect(() => {
    const handleCallback = async () => {
      // The browser lands here with only a single-use `code` (or an `error`) —
      // never tokens. We exchange the code for tokens over POST.
      const { code, error, provider, linked } = ssoService.getCallbackParams();
      wasLinking.current = linked;

      if (error) {
        return fail(OAUTH_ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.');
      }
      if (!code) {
        return fail('No sign-in code found. Please try logging in again.');
      }

      pendingCode.current = code;

      try {
        finish(await ssoService.exchangeCode(code), provider);
      } catch (err: any) {
        if (err instanceof TwoFactorRequiredError) {
          setStatus('twofactor');
          setMessage('Enter the code from your authenticator app to finish signing in.');
          return;
        }
        fail(err?.message || 'Sign-in failed. Please try logging in again.');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, signIn]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCode.current) return;

    setVerifying(true);
    try {
      const { provider } = ssoService.getCallbackParams();
      const data = await ssoService.exchangeCode(pendingCode.current, {
        totpToken: useBackupCode ? undefined : totpToken.trim(),
        backupCode: useBackupCode ? backupCode.trim() : undefined,
      });
      finish(data, provider);
    } catch (err: any) {
      if (err instanceof TwoFactorRequiredError) {
        // Still challenged: the token was wrong. Stay on the form.
        setMessage(err.message || 'That code was not valid. Try again.');
      } else {
        fail(err?.message || 'Verification failed. Please sign in again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      case 'twofactor':
        return <ShieldCheck className="w-8 h-8 text-[#2ED8A3]" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-[#2ED8A3]';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error';
      case 'twofactor':
        return 'Two-Factor Authentication';
      default:
        return 'Processing...';
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
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">Signing you in</h2>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">{getStatusIcon()}</div>

            <h3 className={`text-lg font-semibold ${getStatusColor()}`}>{getStatusTitle()}</h3>

            <p className="text-[#333333]/70 dark:text-gray-400">{message}</p>

            {status === 'loading' && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#2ED8A3] h-2 rounded-full animate-pulse"
                    style={{ width: '60%' }}
                  ></div>
                </div>
              </div>
            )}

            {status === 'twofactor' && (
              <form onSubmit={handleVerify} className="mt-4 space-y-4 text-left">
                {useBackupCode ? (
                  <div>
                    <label
                      htmlFor="oauth-backup-code"
                      className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-1"
                    >
                      Backup code
                    </label>
                    <input
                      id="oauth-backup-code"
                      type="text"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      autoComplete="one-time-code"
                      placeholder="XXXXXXXX"
                      className="w-full px-4 py-3 tracking-widest font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="oauth-totp-token"
                      className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-1"
                    >
                      Authentication code
                    </label>
                    <input
                      id="oauth-totp-token"
                      type="text"
                      inputMode="numeric"
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 tracking-[0.4em] text-center font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying || (useBackupCode ? !backupCode.trim() : totpToken.length < 6)}
                  className="w-full px-6 py-3 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify
                </button>

                <button
                  type="button"
                  onClick={() => setUseBackupCode((v) => !v)}
                  className="w-full text-sm text-[#2ED8A3] hover:text-[#00C48C]"
                >
                  {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
                </button>
              </form>
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
