import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../../components/Logo';
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
  Zap,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RegisterUser } from '../../store/authSlice';
import { RootState } from '../../store/index';
import AuthFooter from '../../components/AuthFooter';

const inputCls =
  'w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#101418] border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm font-mono text-xs text-gray-900 dark:text-[#e0e3e8] placeholder-gray-400 dark:placeholder-[#3b4a41] focus:border-emerald-500/50 dark:focus:border-[#6effc0]/50 focus:outline-none transition-colors disabled:opacity-50';
const inputClsPw =
  'w-full pl-9 pr-10 py-2.5 bg-white dark:bg-[#101418] border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm font-mono text-xs text-gray-900 dark:text-[#e0e3e8] placeholder-gray-400 dark:placeholder-[#3b4a41] focus:border-emerald-500/50 dark:focus:border-[#6effc0]/50 focus:outline-none transition-colors disabled:opacity-50';
const labelCls =
  "block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-500 dark:text-[#bacbbf]/50 mb-1.5";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlanId = searchParams.get('plan');
  const selectedPlanName = searchParams.get('plan_name');

  const dispatch = useDispatch();
  const { loading, error: authError, message } = useSelector((state: RootState) => state.auth);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;
    if (formData.password.length < 8) return;

    try {
      await dispatch(
        RegisterUser({
          userOrEmail: {
            email: formData.email,
            username: `${formData.firstName} ${formData.lastName}`,
          },
          password: formData.password,
          confirm_password: formData.confirmPassword,
        }) as any
      );

      if (message) {
        setSuccess(true);
        const loginUrl = selectedPlanId ? `/login?plan=${selectedPlanId}` : '/login';
        setTimeout(() => navigate(loginUrl), 2000);
      }
    } catch {
      // Error handled by Redux state
    }
  };

  const handleSSO = async (providerId: string) => {
    try {
      const response = await fetch(
        `/api/auth/oauth/${providerId}/login/?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}`,
        { method: 'GET', credentials: 'include' }
      );
      const data = await response.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
    } catch (err) {
      console.error('OAuth error:', err);
    }
  };

  const passwordsMatch =
    formData.password && formData.confirmPassword ? formData.password === formData.confirmPassword : null;

  const cardShell =
    'bg-white dark:bg-[#181c20] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm overflow-hidden shadow-sm dark:shadow-none';
  const chromeBar =
    'flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-[#101418] border-b border-gray-200 dark:border-[#3b4a41]/40';

  if (success) {
    return (
      <div className="app-bg flex flex-col">
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background: 'radial-gradient(circle at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 60%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)',
          }}
        />
        <div className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-6">
                <Logo tone="auto" className="h-7 w-auto" />
              </Link>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-[#6effc0]/10 border border-emerald-200 dark:border-[#6effc0]/30 flex items-center justify-center rounded-sm">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-[#6effc0]" />
                </div>
              </div>
              <h2 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight">
                Account Created
              </h2>
              <p className="font-mono text-xs text-gray-500 dark:text-[#bacbbf]/50 mt-2">Redirecting to sign in…</p>
            </div>

            <div className={cardShell}>
              <div className={chromeBar}>
                <span className="w-2 h-2 rounded-full bg-red-400/80" />
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80 dark:bg-[#6effc0]/60" />
                <span className="ml-3 font-mono text-[9px] text-gray-500 dark:text-[#3b4a41] uppercase tracking-[0.15em]">
                  register_success.sh
                </span>
              </div>
              <div className="p-6 text-center space-y-4">
                <p className="font-mono text-xs text-gray-600 dark:text-[#bacbbf]/70 leading-relaxed">
                  Welcome to ScrubiMail. Your account is ready — you can now sign in and start verifying emails.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:brightness-105 transition-all shadow-md dark:shadow-[0_0_20px_rgba(110,255,192,0.15)]"
                >
                  Continue to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="app-bg flex flex-col">
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 60%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)',
        }}
      />

      <pre
        className="hidden lg:block pointer-events-none absolute top-6 left-6 font-mono text-[9px] text-emerald-600/15 dark:text-[#6effc0]/10 leading-relaxed select-none z-0"
      >{`POST /api/auth/register/
Content-Type: application/json
{
  "email": "user@domain.com",
  "password": "••••••••",
  "confirm": "••••••••"
}`}</pre>

      <div className="flex-1 flex items-center justify-center py-10 px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Logo tone="auto" className="h-7 w-auto" />
            </Link>
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-700 dark:text-[#6effc0] mb-1">
              New Account
            </p>
            <h1 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight">
              Create your account
            </h1>
            <p className="font-mono text-xs text-gray-500 dark:text-[#bacbbf]/50 mt-1">
              Join thousands of developers using ScrubiMail
            </p>
            {selectedPlanName && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-[#6effc0]/10 border border-emerald-200 dark:border-[#6effc0]/30 rounded-sm">
                <Zap className="w-3 h-3 text-emerald-600 dark:text-[#6effc0]" />
                <span className="font-mono text-[10px] text-emerald-800 dark:text-[#6effc0]">
                  Starting free trial of <strong>{decodeURIComponent(selectedPlanName)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className={cardShell}>
            <div className={chromeBar}>
              <span className="w-2 h-2 rounded-full bg-red-400/80" />
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80 dark:bg-[#6effc0]/60" />
              <span className="ml-3 font-mono text-[9px] text-gray-500 dark:text-[#3b4a41] uppercase tracking-[0.15em]">
                register.sh — scrubimail
              </span>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'github', label: 'GitHub', Icon: Github },
                  { id: 'google', label: 'Google', Icon: Chrome },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSSO(id)}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-[#101418] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm font-mono text-[10px] text-gray-600 dark:text-[#bacbbf]/70 hover:border-emerald-300 dark:hover:border-[#6effc0]/30 hover:text-gray-900 dark:hover:text-[#e0e3e8] transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-[0.1em]"
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#3b4a41]/30" />
                <span className="font-mono text-[9px] text-gray-400 dark:text-[#3b4a41] uppercase tracking-[0.15em]">
                  or email
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#3b4a41]/30" />
              </div>

              {authError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-[#ff4c4c]/10 border border-red-200 dark:border-[#ff4c4c]/30 rounded-sm p-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-[#ff4c4c] flex-shrink-0 mt-0.5" />
                  <p className="font-mono text-[10px] text-red-700 dark:text-[#ff4c4c] leading-relaxed">{authError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: 'firstName', label: 'First Name', placeholder: 'First' },
                    { field: 'lastName', label: 'Last Name', placeholder: 'Last' },
                  ].map(({ field, label, placeholder }) => (
                    <div key={field}>
                      <label className={labelCls}>{label}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
                        <input
                          name={field}
                          type="text"
                          required
                          disabled={loading}
                          value={(formData as any)[field]}
                          onChange={handleInputChange}
                          placeholder={placeholder}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className={labelCls}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="user@domain.com"
                      className={`${inputCls} pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min. 8 characters"
                      className={inputClsPw}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#3b4a41] dark:hover:text-[#bacbbf] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Repeat password"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-sm font-mono text-xs bg-white dark:bg-[#101418] text-gray-900 dark:text-[#e0e3e8] placeholder-gray-400 dark:placeholder-[#3b4a41] focus:outline-none transition-colors disabled:opacity-50 border ${
                        passwordsMatch === null
                          ? 'border-gray-300 dark:border-[#3b4a41]/40 focus:border-emerald-500/50 dark:focus:border-[#6effc0]/50'
                          : passwordsMatch
                            ? 'border-emerald-400 dark:border-[#6effc0]/40'
                            : 'border-red-400 dark:border-[#ff4c4c]/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#3b4a41] dark:hover:text-[#bacbbf] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordsMatch === false && (
                    <p className="font-mono text-[9px] text-red-600 dark:text-[#ff4c4c] mt-1">Passwords do not match</p>
                  )}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    disabled={loading}
                    className="mt-0.5 w-3.5 h-3.5 accent-emerald-600 dark:accent-[#6effc0] bg-white dark:bg-[#101418] border-gray-300 dark:border-[#3b4a41]/40 rounded-sm disabled:opacity-50"
                  />
                  <span className="font-mono text-[9px] text-gray-500 dark:text-[#bacbbf]/50 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-emerald-700 dark:text-[#6effc0] hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-emerald-700 dark:text-[#6effc0] hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || passwordsMatch === false}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md dark:shadow-[0_0_20px_rgba(110,255,192,0.15)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="text-center font-mono text-[10px] text-gray-400 dark:text-[#bacbbf]/40">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-700 dark:text-[#6effc0] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between px-1">
            <span className="font-mono text-[8px] text-gray-400 dark:text-[#3b4a41] uppercase tracking-[0.15em]">
              TLS 1.3 · AES-256-GCM
            </span>
            <span className="font-mono text-[8px] text-gray-400 dark:text-[#3b4a41] uppercase tracking-[0.15em]">
              Enterprise Security
            </span>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default Register;
