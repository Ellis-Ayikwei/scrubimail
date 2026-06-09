import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';
import {
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Key,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import authAxiosInstance from '../../services/authAxiosInstance';
import AuthFooter from '../../components/AuthFooter';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'backup'>('email');
  const [backupPhrase, setBackupPhrase] = useState('');
  const [showBackupPhrase, setShowBackupPhrase] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let response;
      if (recoveryMethod === 'email') {
        response = await authAxiosInstance.post('/forgot-password/', { email });
      } else {
        response = await authAxiosInstance.post('/forgot-password-backup/', { backup_phrase: backupPhrase });
      }
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to process recovery request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process recovery request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="font-['Epilogue',sans-serif] font-black text-[#e0e3e8] text-2xl tracking-tight mb-2">
              {recoveryMethod === 'email' ? 'Check your inbox' : 'Account Recovered'}
            </h2>
            <p className="font-mono text-xs text-[#bacbbf]/50 mb-6">
              {recoveryMethod === 'email'
                ? `A reset link has been sent to ${email}`
                : 'Your backup phrase was verified successfully.'}
            </p>

            <div className="bg-[#181c20] border border-[#3b4a41]/40 rounded-sm overflow-hidden text-left">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#101418] border-b border-[#3b4a41]/40">
                <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
                <span className="w-2 h-2 rounded-full bg-[#6effc0]/60" />
                <span className="ml-3 font-mono text-[9px] text-[#3b4a41] uppercase tracking-[0.15em]">recovery_sent.sh</span>
              </div>
              <div className="p-6 space-y-4">
                {recoveryMethod === 'email' ? (
                  <>
                    <p className="font-mono text-xs text-[#bacbbf]/60 leading-relaxed">
                      Click the link in the email to reset your password. The link expires in 1 hour.
                    </p>
                    <p className="font-mono text-[9px] text-[#3b4a41]">
                      Didn't receive it? Check your spam folder or resend.
                    </p>
                    <div className="bg-[#101418] border border-[#3b4a41]/30 rounded-sm p-3 font-mono text-[9px] text-[#bacbbf]/40">
                      Redirect target: <span className="text-[#6effc0]/60">/reset-password?token=…</span>
                    </div>
                  </>
                ) : (
                  <p className="font-mono text-xs text-[#bacbbf]/60 leading-relaxed">
                    You will be redirected to the password reset page to create a new password.
                  </p>
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => setSuccess(false)}
                    className="w-full bg-[#6effc0] text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:brightness-105 transition-all shadow-[0_0_20px_rgba(110,255,192,0.15)]"
                  >
                    {recoveryMethod === 'email' ? 'Resend Email' : 'Try Again'}
                  </button>
                  <Link
                    to="/login"
                    className="block w-full text-center py-2.5 bg-transparent border border-[#3b4a41]/40 rounded-sm font-mono text-[10px] text-[#bacbbf]/50 uppercase tracking-[0.2em] hover:border-[#6effc0]/30 hover:text-[#e0e3e8] transition-all"
                  >
                    Back to Sign In
                  </Link>
                </div>
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
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% -10%, rgba(110,255,192,0.10) 0%, transparent 60%)' }} />

      <div className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Logo tone="white" className="h-7 w-auto" />
            </Link>
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-[#6effc0] mb-1">Account Recovery</p>
            <h1 className="font-['Epilogue',sans-serif] font-black text-[#e0e3e8] text-2xl tracking-tight">Forgot your password?</h1>
            <p className="font-mono text-xs text-[#bacbbf]/50 mt-1">Choose a recovery method to re-open your session.</p>
          </div>

          {/* Card */}
          <div className="bg-[#181c20] border border-[#3b4a41]/40 rounded-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#101418] border-b border-[#3b4a41]/40">
              <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
              <span className="w-2 h-2 rounded-full bg-[#6effc0]/60" />
              <span className="ml-3 font-mono text-[9px] text-[#3b4a41] uppercase tracking-[0.15em]">forgot_password.sh</span>
            </div>

            <div className="p-6 space-y-5">
              {/* Method toggle */}
              <div>
                <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-[#bacbbf]/50 mb-2">
                  Recovery Method
                </label>
                <div className="flex bg-[#101418] border border-[#3b4a41]/40 rounded-sm p-0.5">
                  {([
                    { id: 'email' as const,  label: 'Email',         Icon: Mail  },
                    { id: 'backup' as const, label: 'Backup Phrase', Icon: Key   },
                  ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRecoveryMethod(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 font-mono uppercase tracking-[0.1em] text-[10px] rounded-sm transition-all ${
                        recoveryMethod === id
                          ? 'bg-[#6effc0]/15 text-[#6effc0] border border-[#6effc0]/20'
                          : 'text-[#bacbbf]/40 hover:text-[#bacbbf]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email input */}
                {recoveryMethod === 'email' && (
                  <div>
                    <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-[#bacbbf]/50 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b4a41]" />
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@domain.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#101418] border border-[#3b4a41]/40 rounded-sm font-mono text-xs text-[#e0e3e8] placeholder-[#3b4a41] focus:border-[#6effc0]/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Backup phrase input */}
                {recoveryMethod === 'backup' && (
                  <div>
                    <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-[#bacbbf]/50 mb-1.5">
                      Backup Recovery Phrase
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b4a41]" />
                      <input
                        type={showBackupPhrase ? 'text' : 'password'}
                        autoComplete="off"
                        required
                        value={backupPhrase}
                        onChange={(e) => setBackupPhrase(e.target.value)}
                        placeholder="Enter your 12-word backup phrase"
                        className="w-full pl-9 pr-10 py-2.5 bg-[#101418] border border-[#3b4a41]/40 rounded-sm font-mono text-xs text-[#e0e3e8] placeholder-[#3b4a41] focus:border-[#6effc0]/50 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBackupPhrase(!showBackupPhrase)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b4a41] hover:text-[#bacbbf] transition-colors"
                      >
                        {showBackupPhrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="font-mono text-[9px] text-[#3b4a41] mt-1">
                      The 12-word phrase saved during account setup
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 bg-[#ff4c4c]/10 border border-[#ff4c4c]/30 rounded-sm p-3">
                    <AlertCircle className="w-3.5 h-3.5 text-[#ff4c4c] flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-[10px] text-[#ff4c4c] leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#6effc0] text-[#003824] font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(110,255,192,0.15)]"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {recoveryMethod === 'email' ? 'Sending…' : 'Verifying…'}
                    </>
                  ) : (
                    recoveryMethod === 'email' ? 'Send Reset Link' : 'Verify Phrase'
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
            <span className="font-mono text-[8px] text-[#3b4a41] uppercase tracking-[0.15em]">Secure recovery flow</span>
            <span className="font-mono text-[8px] text-[#3b4a41] uppercase tracking-[0.15em]">TLS 1.3 Encrypted</span>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default ForgotPassword;
