import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import totpService from '../../services/totpService';
import { showMessage } from '../../utils/notifications';
import { useDispatch } from 'react-redux';
import { setUser, setTokens } from '../../store/authSlice';

interface LoginWithTOTPProps {
    onLoginSuccess?: (user: any) => void;
}

const LoginWithTOTP: React.FC<LoginWithTOTPProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpToken, setTotpToken] = useState('');
    const [backupCode, setBackupCode] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'credentials' | 'totp' | 'success'>('credentials');
    const [requires2FA, setRequires2FA] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [trustedDevice, setTrustedDevice] = useState(false);
    const [deviceName, setDeviceName] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await totpService.loginWithTOTP(email, password, undefined, undefined, rememberMe);
            
            if (response.trusted_device) {
                // Trusted device login successful
                setTrustedDevice(true);
                setDeviceName(response.device_name);
                setStep('success');
                handleLoginSuccess(response.user, response);
            } else if (response.requires_2fa) {
                // 2FA required
                setRequires2FA(true);
                setUserId(response.user_id);
                setStep('totp');
            } else {
                // Regular login successful
                setStep('success');
                handleLoginSuccess(response.user, response);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!totpToken && !backupCode) {
            showMessage('Please enter either a TOTP token or backup code', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await totpService.loginWithTOTP(
                email, 
                password, 
                totpToken, 
                backupCode, 
                rememberMe
            );
            
            setStep('success');
            handleLoginSuccess(response.user, response);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || '2FA verification failed. Please try again.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (user: any, response: any) => {
        // Store user data in Redux
        dispatch(setUser(user));
        
        // Store tokens from headers
        const authHeader = response.headers?.['authorization'];
        const refreshHeader = response.headers?.['x-refresh-token'];
        
        if (authHeader && refreshHeader) {
            const accessToken = authHeader.replace('Bearer ', '');
            dispatch(setTokens({ accessToken, refreshToken: refreshHeader }));
        }

        showMessage(
            trustedDevice 
                ? `Welcome back! Logged in from trusted device: ${deviceName}`
                : 'Login successful!',
            'success'
        );

        if (onLoginSuccess) {
            onLoginSuccess(user);
        } else {
            navigate('/dashboard');
        }
    };

    const resetForm = () => {
        setStep('credentials');
        setRequires2FA(false);
        setUserId(null);
        setTotpToken('');
        setBackupCode('');
        setTrustedDevice(false);
        setDeviceName('');
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">
                {step === 'credentials' && 'Login'}
                {step === 'totp' && 'Two-Factor Authentication'}
                {step === 'success' && 'Login Successful'}
            </h2>

            {step === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="rememberMe" className="text-sm">
                            Remember this device (skip 2FA for 30 days)
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            )}

            {step === 'totp' && (
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Please enter the 6-digit code from your authenticator app or use a backup code.
                    </p>

                    <form onSubmit={handleTOTPSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">TOTP Code</label>
                            <input
                                type="text"
                                value={totpToken}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setTotpToken(value);
                                    if (value) setBackupCode(''); // Clear backup code if TOTP is entered
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                placeholder="000000"
                                maxLength={6}
                            />
                        </div>

                        <div className="text-center text-sm text-gray-500">OR</div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Backup Code</label>
                            <input
                                type="text"
                                value={backupCode}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                                    setBackupCode(value);
                                    if (value) setTotpToken(''); // Clear TOTP if backup is entered
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                placeholder="ABCD1234"
                                maxLength={8}
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe2FA"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="rememberMe2FA" className="text-sm">
                                Remember this device (skip 2FA for 30 days)
                            </label>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!totpToken && !backupCode)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center">
                    <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✓</div>
                    <h3 className="text-xl font-semibold mb-2">
                        {trustedDevice ? 'Welcome back!' : 'Login successful!'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {trustedDevice 
                            ? `You're logged in from your trusted device: ${deviceName}`
                            : 'You have successfully logged in.'
                        }
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginWithTOTP;
