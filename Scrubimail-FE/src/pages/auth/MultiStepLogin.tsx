import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Gitlab,
  Home
} from 'lucide-react';
import { LoginUser } from '../../store/authSlice';
import { showMessage } from '../../utils/notifications';
import { getDeviceInfo } from '../../utils/DeviceFingerPrint';
import ssoService, { OAuthProviders } from '../../services/ssoService';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import totpService from '../../services/totpService';
import AuthFooter from '../../components/AuthFooter';
import authAxiosInstance from '../../services/authAxiosInstance';

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
      // Load providers if needed for availability checks
      await ssoService.getProviders();
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
    }
  };

  const handleOAuthCallback = async () => {
    const callbackData = ssoService.handleCallbackFromUrl();
    if (callbackData) {
      try {
        setLoading(true);
        setError(null);
        
        // SSO login bypasses TOTP - directly sign in with tokens
        // Fetch user data using the access token
        const userResponse = await authAxiosInstance.get('/user/', {
          headers: {
            'Authorization': `Bearer ${callbackData.access_token}`
          }
        });

        const userData = userResponse.data;

        if (signIn) {
          const isSignedIn = signIn({
            auth: {
              token: callbackData.access_token,
              type: 'Bearer',
            },
            refresh: callbackData.refresh_token,
            userState: userData,
          });

          if (isSignedIn) {
            showMessage(`Successfully logged in with ${callbackData.provider}!`, 'success');
            setCurrentStep('success');
            
            // Redirect after a short delay
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          } else {
            setError('Failed to sign in with OAuth tokens');
          }
        }
        
        // Clear URL parameters
        ssoService.clearCallbackFromUrl();
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError('Failed to complete OAuth login. Please try again.');
        setLoading(false);
      }
    }
  };
  const ssoProviders = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Sign in with your GitHub account',
      color: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white'
    },
    // {
    //   id: 'gitlab',
    //   name: 'GitLab',
    //   icon: Gitlab,
    //   description: 'Sign in with your GitLab account',
    //   color: 'bg-orange-600 hover:bg-orange-700',
    //   textColor: 'text-white'
    // },
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      description: 'Sign in with your Google account',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    }
  ];

  const handleSSO = async (providerId: string) => {
    try {
      setError(null);
      setSsoLoading(providerId);
      
      // Call the backend OAuth login endpoint
      const response = await authAxiosInstance.get(`/oauth/${providerId}/login/?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}`);
      
      const data = await response.data;
      
      if (data.authorization_url) {
        // Redirect to the OAuth provider's authorization URL
        window.location.href = data.authorization_url;
      } else {
        setError('Failed to initiate OAuth login');
        setSsoLoading(null);
      }
    } catch (err: any) {
      console.error('OAuth login error:', err);
      setError('OAuth login failed. Please try again.');
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
      const response = await totpService.loginWithTOTP(
        email, 
        password, 
        totpToken,
        useBackupCode ? backupCode : undefined, 
        rememberMe); 


      if (response.status === 200 || response.status === 201) {
        console.log("the response....", response);
        if (response.data?.requires_2fa) {
          setRequires2FA(true);
          setCurrentStep('totp');
        } else {
          // Login successful without 2FA
          handleSuccessfulLogin(response);
        }
      } else {
        setError(response.data?.detail || 'Login failed. Please check your credentials.');
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

      

        if (response.status === 200 || response.status === 201) {
        console.log("the response ...", response);
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
    console.log("the response", response);
    // Extract tokens from response headers
    const accessToken = response?.headers?.get('authorization');
    const refreshToken = response?.headers?.get('x-refresh-token');
    const userData = response?.data?.user;
    
    if (!accessToken || !refreshToken || !userData) {
        console.error('Invalid response from server');
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
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] dark:bg-gray-900 relative overflow-hidden">
      {/* Background Mail Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Mail 
          className="w-[900px] h-[900px] md:w-[1200px] md:h-[1200px] lg:w-[1500px] lg:h-[1500px] text-primary/5 dark:text-primary/10"
          strokeWidth={1}
        />
      </div>

      {/* Home Button */}
      <Link 
        to="/" 
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
      >
        <Home className="w-4 h-4 text-[#333333] dark:text-white" />
        <span className="text-sm font-medium text-[#333333] dark:text-white">Home</span>
      </Link>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center">
              <img 
                src="/assets/images/scrubi mail full.png" 
                alt="Scrubimail Logo" 
                className="h-12 md:h-12 w-auto"
              />
            </Link>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
            {steps[currentStep].title}
          </h2>
          <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Progress Indicator */}
        {/* <div className="flex items-center justify-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'credentials' ? 'bg-primary text-white' : 
            currentStep === 'totp' ? 'bg-primary text-white' : 'bg-green-500 text-white'
          }`}>
            {currentStep === 'credentials' ? '1' : currentStep === 'totp' ? '2' : <CheckCircle className="w-5 h-5" />}
          </div>
          <div className={`w-16 h-1 ${currentStep === 'totp' || currentStep === 'success' ? 'bg-primary' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'totp' ? 'bg-primary text-white' : 
            currentStep === 'success' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            {currentStep === 'totp' ? '2' : currentStep === 'success' ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
        </div> */}

        {/* Login Form */}
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
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
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
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
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
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
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                      ? 'bg-primary text-white'
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
                      ? 'bg-primary text-white'
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
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200 text-center text-2xl tracking-widest"
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
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
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
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-[#333333] dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
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
                <Loader2 className="animate-spin h-5 w-5 text-primary mr-2" />
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
                className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80"
              >
                Forgot your password?
              </a>
              <span className="text-[#333333]/50 dark:text-gray-400">•</span>
              <a
                href="/register"
                className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80"
              >
                Create an account
              </a>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Thin Footer */}
      <AuthFooter />
    </div>
  );
};

export default MultiStepLogin;
