import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import authAxiosInstance from '../../services/authAxiosInstance';
import AuthFooter from '../../components/AuthFooter';


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

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Reset token is missing');
        setValidating(false);
        return;
      }
      try {
        await authAxiosInstance.post('/validate-reset-token/', { token });
        setValidating(false);
      } catch {
        setError('Invalid or expired reset token');
        setValidating(false);
      }
    };
    validateToken();
  }, [token]);

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
    setLoading(true);
    setError(null);
    try {
      const response = await authAxiosInstance.post('/reset-password/', { token, password });
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.message || 'Password reset failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'password') setPassword(value);
    else if (name === 'confirmPassword') setConfirmPassword(value);
    if (error) setError('');
  };

  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  // Loading state
  if (validating) {
    return (
      <div className="app-bg flex flex-col">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)' }} />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-[#6effc0] animate-spin" />
            </div>
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-[#6effc0]">Validating Token</p>
            <p className="font-mono text-xs text-[#bacbbf]/40">Verifying your reset link…</p>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="app-bg flex flex-col">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)' }} />
        <div className="flex-1 flex items-center justify-center px-4 relative z-10">
          <div className="w-full max-w-md text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <Logo tone="white" className="h-7 w-auto" />
            </Link>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#6effc0]/10 border border-[#6effc0]/30 flex items-center justify-center rounded-sm">
                <CheckCircle className="w-6 h-6 text-[#6effc0]" />
              </div>
            </div>
            <h2 className="font-['Epilogue',sans-serif] font-black text-[#e0e3e8] text-2xl tracking-tight mb-2">Password Updated</h2>
            <p className="font-mono text-xs text-[#bacbbf]/50 mb-6">Redirecting to sign in…</p>

            <div className="bg-[#181c20] border border-[#3b4a41]/40 rounded-sm overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#101418] border-b border-[#3b4a41]/40">
                <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
                <span className="w-2 h-2 rounded-full bg-[#6effc0]/60" />
                <span className="ml-3 font-mono text-[9px] text-[#3b4a41] uppercase tracking-[0.15em]">reset_success.sh</span>
              </div>
              <div className="p-6 space-y-4">
                <p className="font-mono text-xs text-[#bacbbf]/60 leading-relaxed">
                  All sessions have been invalidated for security. Please sign in with your new password.
                </p>
                <Link
                  to="/login"
                  className="block w-full text-center bg-[#6effc0] text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:brightness-105 transition-all shadow-[0_0_20px_rgba(110,255,192,0.15)]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Error state (invalid token)
  if (error && !loading && validating === false && !token) {
    return (
      <div className="app-bg flex flex-col">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)' }} />
        <div className="flex-1 flex items-center justify-center px-4 relative z-10">
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#ff4c4c]/10 border border-[#ff4c4c]/30 flex items-center justify-center rounded-sm">
                <AlertCircle className="w-6 h-6 text-[#ff4c4c]" />
              </div>
            </div>
            <h2 className="font-['Epilogue',sans-serif] font-black text-[#e0e3e8] text-2xl tracking-tight mb-2">Invalid Link</h2>
            <p className="font-mono text-xs text-[#bacbbf]/50 mb-6">{error}</p>
            <Link to="/forgot-password" className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#6effc0] hover:underline uppercase tracking-[0.1em]">
              <ArrowLeft className="w-3 h-3" /> Request a new link
            </Link>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="app-bg flex flex-col">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)' }} />

      <div className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Logo tone="white" className="h-7 w-auto" />
            </Link>
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-[#6effc0] mb-1">Security Reset</p>
            <h1 className="font-['Epilogue',sans-serif] font-black text-[#e0e3e8] text-2xl tracking-tight">Reset your password</h1>
            <p className="font-mono text-xs text-[#bacbbf]/50 mt-1">Define a new credential for your terminal session.</p>
          </div>

          {/* Card */}
          <div className="bg-[#181c20] border border-[#3b4a41]/40 rounded-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#101418] border-b border-[#3b4a41]/40">
              <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
              <span className="w-2 h-2 rounded-full bg-[#6effc0]/60" />
              <span className="ml-3 font-mono text-[9px] text-[#3b4a41] uppercase tracking-[0.15em]">reset_password.sh</span>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 bg-[#ff4c4c]/10 border border-[#ff4c4c]/30 rounded-sm p-3">
                    <AlertCircle className="w-3.5 h-3.5 text-[#ff4c4c] flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-[10px] text-[#ff4c4c] leading-relaxed">{error}</p>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-[#bacbbf]/50 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b4a41]" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#101418] border border-[#3b4a41]/40 rounded-sm font-mono text-xs text-[#e0e3e8] placeholder-[#3b4a41] focus:border-[#6effc0]/50 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b4a41] hover:text-[#bacbbf] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="font-mono text-[9px] text-[#3b4a41] mt-1">Must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-[#bacbbf]/50 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b4a41]" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className={`w-full pl-9 pr-10 py-2.5 bg-[#101418] rounded-sm font-mono text-xs text-[#e0e3e8] placeholder-[#3b4a41] focus:outline-none transition-colors border ${
                        passwordsMatch === null
                          ? 'border-[#3b4a41]/40 focus:border-[#6effc0]/50'
                          : passwordsMatch
                          ? 'border-[#6effc0]/40'
                          : 'border-[#ff4c4c]/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b4a41] hover:text-[#bacbbf] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordsMatch === false && (
                    <p className="font-mono text-[9px] text-[#ff4c4c] mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || passwordsMatch === false}
                  className="w-full flex items-center justify-center gap-2 bg-[#6effc0] text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(110,255,192,0.15)]"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</>
                  ) : (
                    'Update Password'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-[#bacbbf]/40 hover:text-[#6effc0] transition-colors uppercase tracking-[0.1em]"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="font-mono text-[8px] text-[#3b4a41] uppercase tracking-[0.15em]">Link expires in 1 hour</span>
            <span className="font-mono text-[8px] text-[#3b4a41] uppercase tracking-[0.15em]">TLS 1.3 Encrypted</span>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default ResetPassword;
