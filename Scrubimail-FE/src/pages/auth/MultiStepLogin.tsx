import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Mail, 
  Lock, 
  Shield, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Smartphone,
  Github,
  Chrome,
  Gitlab
} from 'lucide-react';
import { LoginUser } from '../../store/authSlice';
import { showMessage } from '../../utils/notifications';
import { getDeviceInfo } from '../../utils/DeviceFingerPrint';
import ssoService, { OAuthProviders } from '../../services/ssoService';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import totpService from '../../services/totpService';

interface LoginStep {
  step: 'credentials' | 'totp' | 'success';
  title: string;
  description: string;
}

const MultiStepLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpToken, setShowTotpToken] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  
  // Flow states
  const [currentStep, setCurrentStep] = useState<LoginStep['step']>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useSignIn();
  const [requires2FA, setRequires2FA] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  // Device fingerprinting
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  
  // SSO states
  const [ssoProviders, setSsoProviders] = useState<OAuthProviders | null>(null);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  useEffect(() => {
    // Get device info for fingerprinting
    const device = getDeviceInfo();
    setDeviceInfo(device);
    
    // Load SSO providers
    loadSSOProviders();
    
    // Check for OAuth callback
    handleOAuthCallback();
  }, []);

  const loadSSOProviders = async () => {
    try {
      const providers = await ssoService.getProviders();
      setSsoProviders(providers);
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
    }
  };

  const handleOAuthCallback = () => {
    const callbackData = ssoService.handleCallbackFromUrl();
    if (callbackData) {
      // Handle successful OAuth login
      dispatch(LoginUser({
        email: '', // OAuth users don't need email/password
        password: '',
        trust_device: false,
        device_id: deviceInfo?.device_id,
        device_name: deviceInfo?.device_name,
        fingerprint: deviceInfo?.fingerprint,
        user_id: '', // Will be set by backend
        session_id: '',
        device_info: deviceInfo?.device_info,
        extra: {
          access_token: callbackData.access_token,
          refresh_token: callbackData.refresh_token,
          provider: callbackData.provider
        }
      }));
      
      showMessage(`Successfully logged in with ${callbackData.provider}!`, 'success');
      navigate('/dashboard', { replace: true });
      
      // Clear URL parameters
      ssoService.clearCallbackFromUrl();
    }
  };

  const handleSSOLogin = async (provider: 'github' | 'gitlab' | 'google') => {
    if (!ssoProviders?.[provider]?.available) {
      showMessage(`${provider} SSO is not available`, 'error');
      return;
    }

    setSsoLoading(provider);
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const response = await ssoService.initiateOAuthLogin(provider, redirectUri);
      
      // Redirect to OAuth provider
      ssoService.redirectToProvider(response.authorization_url);
    } catch (error: any) {
      console.error(`${provider} SSO error:`, error);
      showMessage(`Failed to initiate ${provider} login`, 'error');
      setSsoLoading(null);
    }
  };

  const steps: Record<LoginStep['step'], LoginStep> = {
    credentials: {
      step: 'credentials',
      title: 'Sign in to your account',
      description: 'Enter your email and password to continue'
    },
    totp: {
      step: 'totp',
      title: 'Two-Factor Authentication',
      description: 'Enter the 6-digit code from your authenticator app'
    },
    success: {
      step: 'success',
      title: 'Welcome back!',
      description: 'You have successfully signed in'
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}auth/login-with-totp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          device_id: deviceInfo?.device_id,
          device_name: deviceInfo?.device_name,
          fingerprint: deviceInfo?.fingerprint,
          device_info: deviceInfo?.device_info,
          trust_device: rememberMe,
          remember_device: rememberMe,
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setRequires2FA(true);
          setCurrentStep('totp');
        } else {
          // Login successful without 2FA
          handleSuccessfulLogin(response);
        }
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
     
      const response = await totpService.loginWithTOTP(
        email, 
        password, 
        totpToken,
        useBackupCode ? backupCode : undefined, 
        rememberMe); 

      

      console.log("the response", response);
      if (response.status === 200 || response.status === 201) {
        handleSuccessfulLogin(response);
      } else {
        setError(response.data?.detail || 'Invalid 2FA code. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid 2FA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = (response: any) => {

    console.log("handle successful login");
    // Extract tokens from response headers
    const accessToken = response?.headers?.get('authorization');
    const refreshToken = response?.headers?.get('x-refresh-token');
    const userData = response?.data?.user;
    
    if (!accessToken || !refreshToken || !userData) {
        throw new Error('Invalid response from server');
    }

    console.log("the user data", userData);
    console.log("the access token", accessToken);
    console.log("the refresh token", refreshToken);
    
    if (signIn) {
        console.log("signing in");
        const isSignedIn = signIn({
            auth: {
                token: accessToken,
                type: 'Bearer',
            },
            refresh: refreshToken,
            userState: userData,
        });
       
        if (!isSignedIn) {
            console.error('Frontend sign-in failed');
            throw new Error('Frontend sign-in failed');
        }
    }

    setCurrentStep('success');
    showMessage('Login successful!', 'success');
    
    // Redirect after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const goBack = () => {
    if (currentStep === 'totp') {
      setCurrentStep('credentials');
      setRequires2FA(false);
      setTotpToken('');
      setBackupCode('');
    }
  };

  const toggle2FAMethod = () => {
    setUseBackupCode(!useBackupCode);
    setTotpToken('');
    setBackupCode('');
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
            {steps[currentStep].title}
          </h2>
          <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'credentials' ? 'bg-[#2ED8A3] text-white' : 
            currentStep === 'totp' ? 'bg-[#2ED8A3] text-white' : 'bg-green-500 text-white'
          }`}>
            {currentStep === 'credentials' ? '1' : currentStep === 'totp' ? '2' : <CheckCircle className="w-5 h-5" />}
          </div>
          <div className={`w-16 h-1 ${currentStep === 'totp' || currentStep === 'success' ? 'bg-[#2ED8A3]' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'totp' ? 'bg-[#2ED8A3] text-white' : 
            currentStep === 'success' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            {currentStep === 'totp' ? '2' : currentStep === 'success' ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {currentStep === 'credentials' && (
            <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                  Email address
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
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
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#2ED8A3] focus:ring-[#2ED8A3] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#333333] dark:text-gray-300">
                    Remember this device
                  </label>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* GitHub */}
                {ssoProviders?.github?.available && (
                  <button
                    type="button"
                    onClick={() => handleSSOLogin('github')}
                    disabled={!!ssoLoading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ssoLoading === 'github' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                )}

                {/* GitLab */}
                {ssoProviders?.gitlab?.available && (
                  <button
                    type="button"
                    onClick={() => handleSSOLogin('gitlab')}
                    disabled={!!ssoLoading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ssoLoading === 'gitlab' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Gitlab className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                )}

                {/* Google */}
                {ssoProviders?.google?.available && (
                  <button
                    type="button"
                    onClick={() => handleSSOLogin('google')}
                    disabled={!!ssoLoading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ssoLoading === 'google' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Chrome className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                )}
              </div>

              {/* SSO Loading State */}
              {ssoLoading && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Redirecting to {ssoLoading}...
                  </p>
                </div>
              )}
            </form>
          )}

          {currentStep === 'totp' && (
            <form className="space-y-6" onSubmit={handle2FASubmit}>
              {/* 2FA Method Toggle */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setUseBackupCode(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !useBackupCode
                      ? 'bg-[#2ED8A3] text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  Authenticator App
                </button>
                <button
                  type="button"
                  onClick={() => setUseBackupCode(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    useBackupCode
                      ? 'bg-[#2ED8A3] text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Backup Code
                </button>
              </div>

              {/* TOTP Token Input */}
              {!useBackupCode && (
                <div>
                  <label htmlFor="totpToken" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Enter 6-digit code from your authenticator app
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-[#333333]/50" />
                    </div>
                    <input
                      id="totpToken"
                      name="totpToken"
                      type={showTotpToken ? 'text' : 'password'}
                      autoComplete="off"
                      required
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTotpToken(!showTotpToken)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showTotpToken ? (
                        <EyeOff className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                      ) : (
                        <Eye className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Backup Code Input */}
              {useBackupCode && (
                <div>
                  <label htmlFor="backupCode" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    Enter your backup code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-[#333333]/50" />
                    </div>
                    <input
                      id="backupCode"
                      name="backupCode"
                      type={showBackupCode ? 'text' : 'password'}
                      autoComplete="off"
                      required
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
                      placeholder="Enter backup code"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBackupCode(!showBackupCode)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showBackupCode ? (
                        <EyeOff className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                      ) : (
                        <Eye className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || (!useBackupCode && totpToken.length !== 6) || (useBackupCode && !backupCode)}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] hover:from-[#00C48C] hover:to-[#2ED8A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-[#333333] dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to credentials
                </button>
              </div>
            </form>
          )}

          {currentStep === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white">
                  Welcome back!
                </h3>
                <p className="text-sm text-[#333333]/70 dark:text-gray-400 mt-2">
                  You have successfully signed in to your account.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-[#2ED8A3] mr-2" />
                <span className="text-sm text-[#333333]/70 dark:text-gray-400">
                  Redirecting to dashboard...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Links */}
        {currentStep === 'credentials' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <a
                href="/forgot-password"
                className="text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
              >
                Forgot your password?
              </a>
              <span className="text-[#333333]/50 dark:text-gray-400">•</span>
              <a
                href="/register"
                className="text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
              >
                Create an account
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiStepLogin;
