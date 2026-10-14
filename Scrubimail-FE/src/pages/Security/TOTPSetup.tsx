import React, { useState, useEffect } from 'react';
import totpService, { TOTPSetupResponse, TOTPStatusResponse } from '../../services/totpService';
import { showMessage } from './notifications';
import OAuthConnections from './OAuthConnections';

const TOTPSetup: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [totpData, setTotpData] = useState<TOTPSetupResponse | null>(null);
    const [totpStatus, setTotpStatus] = useState<TOTPStatusResponse | null>(null);
    const [verificationToken, setVerificationToken] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [activeTab, setActiveTab] = useState<'setup' | 'disable'>('setup');
    useEffect(() => {
        fetchTOTPStatus();
    }, []);

    const fetchTOTPStatus = async () => {
        try {
            const status = await totpService.getTOTPStatus();
            setTotpStatus(status);
        } catch (error: any) {
            console.error('Failed to fetch TOTP status:', error);
        }
    };

    const handleSetup = async () => {
        setLoading(true);
        try {
            const data = await totpService.setupTOTP();
            setTotpData(data);
            setShowBackupCodes(true);
        } catch (error: any) {
            showMessage(error.response?.data?.detail || 'Failed to setup TOTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationToken || verificationToken.length !== 6) {
            showMessage('Please enter a valid 6-digit code', 'error');
            return;
        }

        setLoading(true);
        try {
            await totpService.enableTOTP(verificationToken);
            showMessage('TOTP 2FA enabled successfully!', 'success');
            setVerificationToken('');
            await fetchTOTPStatus();
            setTotpData(null);
        } catch (error: any) {
            console.error('TOTP Enable Error:', error);
            console.error('Error Response:', error.response?.data);
            showMessage(error.response?.data?.detail || 'Failed to enable TOTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disablePassword) {
            showMessage('Please enter your password', 'error');
            return;
        }

        setLoading(true);
        try {
            await totpService.disableTOTP(disablePassword);
            showMessage('TOTP 2FA disabled successfully', 'success');
            setDisablePassword('');
            await fetchTOTPStatus();
        } catch (error: any) {
            showMessage(error.response?.data?.detail || 'Failed to disable TOTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateBackupCodes = async () => {
        setLoading(true);
        try {
            const response = await totpService.regenerateBackupCodes();
            setTotpData((prev) => ({
                ...prev!,
                backup_codes: response.backup_codes,
            }));
            setShowBackupCodes(true);
            showMessage('Backup codes regenerated successfully', 'success');
        } catch (error: any) {
            showMessage(error.response?.data?.detail || 'Failed to regenerate backup codes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showMessage('Copied to clipboard', 'success');
    };

    const downloadBackupCodes = () => {
        if (!totpData?.backup_codes) return;
        
        const text = totpData.backup_codes.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scrubimail-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
            <div>
                <p className="uppercase tracking-[0.16em] text-[9px] text-[#6effc0] font-mono">Account / Security</p>
                <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-[#e0e3e8]">Security settings</h1>
                <p className="mt-1 text-xs text-[#bacbbf]/60 font-mono">Manage sign-in methods and two-factor authentication.</p>
            </div>

            <OAuthConnections />

            {/* Status Badge */}
            <div className="p-4 bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm uppercase tracking-[0.1em] text-[#e0e3e8] font-bold">Two-factor authentication</h3>
                        <p className="text-[10px] text-[#bacbbf]/60 font-mono mt-1">
                            {totpStatus?.is_enabled
                                ? 'Two-factor authentication is currently enabled'
                                : 'Two-factor authentication is currently disabled'}
                        </p>
                    </div>
                    <div
                        className={`px-3 py-1.5 rounded-sm uppercase tracking-[0.1em] text-[9px] font-bold ${
                            totpStatus?.is_enabled
                                ? 'bg-[#6effc0]/10 text-[#6effc0] border border-[#6effc0]/25'
                                : 'bg-[#bacbbf]/10 text-[#bacbbf]/70 border border-[#3b4a41]/40'
                        }`}
                    >
                        {totpStatus?.is_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex border-b border-[#3b4a41]/40">
                    <button
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'setup'
                                ? 'border-b-2 border-[#6effc0] text-[#6effc0]'
                                : 'text-[#bacbbf]/60 hover:text-[#bacbbf]'
                        }`}
                        onClick={() => setActiveTab('setup')}
                    >
                        {totpStatus?.is_enabled ? 'Manage 2FA' : 'Setup 2FA'}
                    </button>
                    {totpStatus?.is_enabled && (
                        <button
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'disable'
                                    ? 'border-b-2 border-red-400 text-red-300'
                                    : 'text-[#bacbbf]/60 hover:text-[#bacbbf]'
                            }`}
                            onClick={() => setActiveTab('disable')}
                        >
                            Disable 2FA
                        </button>
                    )}
                </div>
            </div>

            {/* Setup Tab */}
            {activeTab === 'setup' && (
                <div className="bg-[#1c2024] border border-[#3b4a41]/40 rounded-sm p-6">
                    {!totpStatus?.is_enabled && !totpData && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.1em] text-[#e0e3e8] font-bold mb-4">Enable two-factor authentication</h3>
                            <p className="text-xs text-[#bacbbf]/60 font-mono mb-6">
                                Add an extra layer of security to your account by enabling two-factor authentication.
                                You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
                            </p>
                            <button
                                onClick={handleSetup}
                                disabled={loading}
                                className="px-4 py-2 bg-[#6effc0] text-[#003824] rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Setting up...' : 'Start Setup'}
                            </button>
                        </div>
                    )}

                    {totpData && !totpStatus?.is_enabled && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Scan QR Code</h3>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-xs text-[#bacbbf]/60 font-mono mb-4">
                                        Scan this QR code with your authenticator app:
                                    </p>
                                    <div className="bg-white p-4 rounded-sm inline-block">
                                        <img src={totpData.qr_code} alt="TOTP QR Code" className="w-64 h-64" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-[#bacbbf]/60 font-mono mb-2">
                                        Or enter this secret key manually:
                                    </p>
                                    <div className="flex items-center gap-2 mb-4">
                                        <code className="flex-1 px-3 py-2 bg-[#101418] border border-[#3b4a41]/40 rounded-sm text-xs text-[#e0e3e8] font-mono">
                                            {totpData.secret_key}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(totpData.secret_key)}
                                            className="px-3 py-2 border border-[#3b4a41]/40 text-[#bacbbf] rounded-sm text-[10px] uppercase hover:border-[#6effc0]/40 transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>

                                    <form onSubmit={handleEnable} className="mt-6">
                                        <label className="block text-sm font-medium mb-2">
                                            Enter the 6-digit code from your app:
                                        </label>
                                        <input
                                            type="text"
                                            value={verificationToken}
                                            onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-4 py-2 bg-[#101418] border border-[#3b4a41]/40 rounded-sm text-[#e0e3e8] font-mono text-xs focus:border-[#6effc0]/50 focus:outline-none mb-4"
                                            placeholder="000000"
                                            maxLength={6}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || verificationToken.length !== 6}
                                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? 'Verifying...' : 'Enable 2FA'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {showBackupCodes && totpData.backup_codes && (
                                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                        ⚠️ Save Your Backup Codes
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                                        Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {totpData.backup_codes.map((code, index) => (
                                            <code key={index} className="px-3 py-2 bg-[#101418] border border-[#3b4a41]/40 rounded-sm text-xs text-[#e0e3e8] font-mono">
                                                {code}
                                            </code>
                                        ))}
                                    </div>
                                    <button
                                        onClick={downloadBackupCodes}
                                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                                    >
                                        Download Backup Codes
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {totpStatus?.is_enabled && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.1em] text-[#e0e3e8] font-bold mb-4">Manage two-factor authentication</h3>
                            <p className="text-xs text-[#bacbbf]/60 font-mono mb-6">
                                Two-factor authentication is currently active on your account.
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={handleRegenerateBackupCodes}
                                    disabled={loading}
                                    className="px-4 py-2 bg-[#6effc0] text-[#003824] rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-[#47ffb8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Generating...' : 'Regenerate Backup Codes'}
                                </button>
                                {showBackupCodes && totpData?.backup_codes && (
                                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                            New Backup Codes
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {totpData.backup_codes.map((code, index) => (
                                                <code key={index} className="px-3 py-2 bg-[#101418] border border-[#3b4a41]/40 rounded-sm text-xs text-[#e0e3e8] font-mono">
                                                    {code}
                                                </code>
                                            ))}
                                        </div>
                                        <button
                                            onClick={downloadBackupCodes}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                                        >
                                            Download Backup Codes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Disable Tab */}
            {activeTab === 'disable' && totpStatus?.is_enabled && (
                <div className="bg-[#1c2024] border border-red-400/25 rounded-sm p-6">
                    <h3 className="text-sm uppercase tracking-[0.1em] text-red-300 font-bold mb-4">Disable two-factor authentication</h3>
                    <p className="text-xs text-[#bacbbf]/60 font-mono mb-6">
                        Disabling 2FA will make your account less secure. Enter your password to confirm.
                    </p>
                    <form onSubmit={handleDisable}>
                        <label className="block text-sm font-medium mb-2">Password:</label>
                        <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="w-full px-4 py-2 bg-[#101418] border border-[#3b4a41]/40 rounded-sm text-[#e0e3e8] font-mono text-xs focus:border-red-400/50 focus:outline-none mb-4"
                            placeholder="Enter your password"
                        />
                        <button
                            type="submit"
                            disabled={loading || !disablePassword}
                            className="px-4 py-2 bg-red-500/90 text-white rounded-sm uppercase tracking-[0.1em] text-[10px] font-bold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TOTPSetup;
