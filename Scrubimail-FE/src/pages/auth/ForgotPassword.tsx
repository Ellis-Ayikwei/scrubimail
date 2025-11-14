import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
        response = await authAxiosInstance.post('/forgot-password/', {
          email
        });
      } else {
        response = await authAxiosInstance.post('/forgot-password-backup/', {
          backup_phrase: backupPhrase
        });
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
      <div className="min-h-screen flex flex-col bg-[#F4F5F7] dark:bg-gray-900 relative overflow-hidden">
        {/* Background Mail Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Mail 
            className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px] text-primary/5 dark:text-primary/10"
            strokeWidth={1}
          />
        </div>

        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Link to="/" className="flex items-center">
                <img 
                  src="/assets/images/scrubi mail full.png" 
                  alt="Scrubimail Logo" 
                  className="h-12 sm:h-16 w-auto"
                />
              </Link>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
              {recoveryMethod === 'email' ? 'Check your email' : 'Account recovered'}
            </h2>
            <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
              {recoveryMethod === 'email' 
                ? `We've sent a password reset link to ${email}`
                : 'Your account has been successfully recovered using your backup phrase'
              }
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center space-y-4">
              {recoveryMethod === 'email' ? (
                <>
                  <p className="text-[#333333] dark:text-gray-300">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <p className="text-xs text-[#333333]/50 dark:text-gray-400 mt-2">
                    The reset link will redirect you to: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">/reset-password?token=...</code>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[#333333] dark:text-gray-300">
                    You can now set a new password for your account. Your backup phrase has been verified successfully.
                  </p>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">
                    You will be redirected to the password reset page to create a new password.
                  </p>
                </>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-sm"
                >
                  {recoveryMethod === 'email' ? 'Resend email' : 'Try again'}
                </button>
                
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-[#333333] dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ED8A3] transition-all duration-200"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Thin Footer */}
      <AuthFooter />
    </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] dark:bg-gray-900 relative overflow-hidden">
      {/* Background Mail Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Mail 
          className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px] text-primary/5 dark:text-primary/10"
          strokeWidth={1}
        />
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center">
              <img 
                src="/assets/images/scrubi mail full.png" 
                alt="Scrubimail Logo" 
                className="h-12 sm:h-16 w-auto"
              />
            </Link>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-[#333333]/70 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Recovery Method Selection */}
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-3">
                Choose recovery method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRecoveryMethod('email')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    recoveryMethod === 'email'
                      ? 'border-[#2ED8A3] bg-[#2ED8A3]/10 text-[#2ED8A3]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryMethod('backup')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    recoveryMethod === 'backup'
                      ? 'border-[#2ED8A3] bg-[#2ED8A3]/10 text-[#2ED8A3]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span className="text-sm font-medium">Backup Phrase</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Email Input */}
            {recoveryMethod === 'email' && (
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
            )}

            {/* Backup Phrase Input */}
            {recoveryMethod === 'backup' && (
              <div>
                <label htmlFor="backupPhrase" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                  Backup Recovery Phrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-[#333333]/50" />
                  </div>
                  <input
                    id="backupPhrase"
                    name="backupPhrase"
                    type={showBackupPhrase ? 'text' : 'password'}
                    autoComplete="off"
                    required
                    value={backupPhrase}
                    onChange={(e) => setBackupPhrase(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter your 12-word backup phrase"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBackupPhrase(!showBackupPhrase)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showBackupPhrase ? (
                      <EyeOff className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#333333]/50 hover:text-[#333333]/70" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#333333]/60 dark:text-gray-400">
                  Enter the 12-word backup phrase you saved when setting up your account
                </p>
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

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    {recoveryMethod === 'email' ? 'Sending reset link...' : 'Verifying backup phrase...'}
                  </div>
                ) : (
                  recoveryMethod === 'email' ? 'Send reset link' : 'Verify backup phrase'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-[#2ED8A3] hover:text-[#004E8A] dark:text-[#2ED8A3] dark:hover:text-[#00C48C]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-[#333333]/50 dark:text-gray-400">
            Need help? Contact our support team
          </p>
        </div>
        </div>
      </div>
      
      {/* Thin Footer */}
      <AuthFooter />
    </div>
  );
};

export default ForgotPassword; 