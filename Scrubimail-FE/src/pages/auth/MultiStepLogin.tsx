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
  Home,
  Zap
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
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('trustDevice') === 'true' ? true : false);
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

        console.log("the response....", response);
        console.log("the response data....", response.status);


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
      const serverData = err.response?.data;
      const message =
        serverData?.detail ||
        serverData?.message ||
        serverData?.error ||
        (typeof serverData === 'string' ? serverData : null) ||
        err.message ||
        'Login failed. Please check your credentials and try again.';
      setError(message);
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
  

  const handleRememberMe = (value: boolean) => {
    setRememberMe(value);
    localStorage.setItem('trustDevice', value.toString());
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: '#101418',
        backgroundImage: 'radial-gradient(rgba(0,229,160,0.12) 0.5px, transparent 0.5px)',
        backgroundSize: '32px 32px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Radial aura */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% -10%, rgba(0,229,160,0.10) 0%, transparent 60%)' }} />

      {/* Floating corner decorations */}
      <pre className="fixed bottom-8 left-8 opacity-[0.07] pointer-events-none hidden lg:block font-mono text-[9px] text-[#6effc0] leading-relaxed">
{`{
  "scrub_action": "sanitize",
  "priority": "high",
  "status": "waiting_auth..."
}`}
      </pre>
      <pre className="fixed top-20 right-10 opacity-[0.07] pointer-events-none hidden lg:block font-mono text-[9px] text-[#6effc0] leading-relaxed">
{`$ sc-auth --verify
Connecting to scrubi-terminal-1...
[OK] Protocol v2.4.1`}
      </pre>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-[#6effc0] flex items-center justify-center rounded-sm">
              <Zap className="w-4 h-4 text-[#003824]" strokeWidth={2.5} />
            </div>
            <span className="font-['Epilogue',sans-serif] font-black tracking-tighter text-[#6effc0] text-xl">Scrubi</span>
          </Link>
          <h1 className="font-['Epilogue',sans-serif] font-bold text-[#e0e3e8] text-2xl tracking-tight mb-1">
            {steps[currentStep].title}
          </h1>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-[#3b4a41]">
            Terminal Session Access
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#181c20] border border-[#3b4a41]/20 rounded-sm shadow-2xl overflow-hidden">
          {/* Terminal chrome bar */}
          <div className="h-1 bg-[#31353a] flex items-center px-3 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b4a41]/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b4a41]/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b4a41]/50" />
          </div>

          <div className="p-8">
            {/* SSO — credentials step only */}
            {currentStep === 'credentials' && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ssoProviders.map((provider) => {
                    const IconComponent = provider.icon;
                    return (
                      <button
                        key={provider.id}
                        onClick={() => handleSSO(provider.id)}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c2024] border border-[#3b4a41]/30 rounded-sm hover:border-[#6effc0]/40 hover:text-[#6effc0] transition-all text-[#bacbbf] disabled:opacity-40"
                      >
                        {ssoLoading === provider.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <IconComponent className="w-3.5 h-3.5" />
                        )}
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em]">{provider.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#3b4a41]/30" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-[#181c20] font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-[#3b4a41]">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="bg-[#ff4c4c]/10 border border-[#ff4c4c]/30 rounded-sm p-3 flex items-center gap-2 text-[#ff4c4c] font-mono text-xs mb-5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Step: Credentials */}
            {currentStep === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-[#bacbbf] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b4a41]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dev@scrubi.io"
                      className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm pl-9 pr-3 py-2.5 text-[#e0e3e8] font-mono text-sm focus:border-[#6effc0]/50 focus:outline-none w-full placeholder-[#3b4a41]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-[#bacbbf]">Password</label>
                    <a href="/forgot-password" className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-[#6effc0] hover:underline">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b4a41]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm pl-9 pr-10 py-2.5 text-[#e0e3e8] font-mono text-sm focus:border-[#6effc0]/50 focus:outline-none w-full placeholder-[#3b4a41]"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b4a41] hover:text-[#6effc0]">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => handleRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-sm border-[#3b4a41] bg-[#101418] accent-[#6effc0]"
                  />
                  <label htmlFor="remember" className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-[#3b4a41]">
                    Keep session alive
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6effc0] text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-3 rounded-sm hover:brightness-105 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                  style={{ boxShadow: '0 8px 24px rgba(110,255,192,0.12)' }}
                >
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Authenticating...</> : 'Sign In'}
                </button>
              </form>
            )}

            {/* Step: TOTP */}
            {currentStep === 'totp' && (
              <form onSubmit={handle2FASubmit} className="space-y-5">
                {/* Method toggle */}
                <div className="flex bg-[#101418] p-0.5 rounded-sm border border-[#3b4a41]/30">
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(false)}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-all rounded-sm flex items-center justify-center gap-1.5 ${!useBackupCode ? 'bg-[#6effc0]/15 text-[#6effc0] border border-[#6effc0]/20' : 'text-[#bacbbf]/50 hover:text-[#bacbbf]'}`}
                  >
                    <Smartphone className="w-3 h-3" /> Authenticator
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(true)}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-all rounded-sm flex items-center justify-center gap-1.5 ${useBackupCode ? 'bg-[#6effc0]/15 text-[#6effc0] border border-[#6effc0]/20' : 'text-[#bacbbf]/50 hover:text-[#bacbbf]'}`}
                  >
                    <Shield className="w-3 h-3" /> Backup Code
                  </button>
                </div>

                {!useBackupCode ? (
                  <div>
                    <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-[#bacbbf] mb-1.5">6-Digit Code</label>
                    <input
                      type={showTotpToken ? 'text' : 'password'}
                      required
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-3 py-3 text-[#6effc0] font-mono text-2xl text-center tracking-[0.5em] focus:border-[#6effc0]/50 focus:outline-none w-full placeholder-[#3b4a41]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-[#bacbbf] mb-1.5">Backup Code</label>
                    <div className="relative">
                      <input
                        type={showBackupCode ? 'text' : 'password'}
                        required
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX"
                        className="bg-[#101418] border border-[#3b4a41]/40 rounded-sm px-3 py-2.5 pr-10 text-[#e0e3e8] font-mono text-sm tracking-[0.2em] focus:border-[#6effc0]/50 focus:outline-none w-full placeholder-[#3b4a41]"
                      />
                      <button type="button" onClick={() => setShowBackupCode(!showBackupCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b4a41] hover:text-[#6effc0]">
                        {showBackupCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!useBackupCode && totpToken.length !== 6) || (useBackupCode && !backupCode)}
                  className="w-full bg-[#6effc0] text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-3 rounded-sm hover:brightness-105 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 8px 24px rgba(110,255,192,0.12)' }}
                >
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</> : 'Verify & Sign In'}
                </button>
                <button type="button" onClick={goBack} className="w-full border border-[#3b4a41]/40 text-[#bacbbf] font-mono text-[10px] uppercase tracking-[0.1em] py-2.5 rounded-sm hover:border-[#6effc0]/40 hover:text-[#6effc0] transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to credentials
                </button>
              </form>
            )}

            {/* Step: Success */}
            {currentStep === 'success' && (
              <div className="text-center space-y-5 py-4">
                <div className="w-14 h-14 bg-[#6effc0]/10 border border-[#6effc0]/20 rounded-sm flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-[#6effc0]" />
                </div>
                <div>
                  <p className="font-['Epilogue',sans-serif] font-bold text-[#e0e3e8] text-lg mb-1">Authentication Complete</p>
                  <p className="font-mono text-xs text-[#bacbbf]/60">Redirecting to dashboard...</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6effc0]" />
                  <span className="font-mono text-xs text-[#3b4a41]">Establishing session...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer links */}
        {currentStep === 'credentials' && (
          <div className="text-center mt-6 space-x-4 font-mono text-[10px] uppercase tracking-[0.1em]">
            <a href="/forgot-password" className="text-[#3b4a41] hover:text-[#6effc0] transition-colors">Forgot Password</a>
            <span className="text-[#3b4a41]">·</span>
            <a href="/register" className="text-[#3b4a41] hover:text-[#6effc0] transition-colors">Create Account</a>
          </div>
        )}

        {/* Status bar */}
        <div className="mt-8 flex items-center justify-center gap-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3b4a41]">
          {[['Auth Service', 'Active'], ['SSL', 'Encrypted'], ['Region', 'US-EAST-1']].map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#6effc0]" />
              {k}: {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiStepLogin;
