import authAxiosInstance from './authAxiosInstance';

export interface TOTPSetupResponse {
    secret_key: string;
    qr_code: string;
    backup_codes: string[];
    is_enabled: boolean;
}

export interface TOTPStatusResponse {
    is_enabled: boolean;
    has_backup_codes: boolean;
    created_at: string | null;
    last_used: string | null;
}

class TOTPService {
    /**
     * Get TOTP setup data (QR code, secret key, backup codes)
     */
    async setupTOTP(): Promise<TOTPSetupResponse> {
        const response = await authAxiosInstance.get('/totp/setup/');
        return response.data;
    }

    /**
     * Enable TOTP 2FA after verifying the setup token
     */
    async enableTOTP(verificationToken: string): Promise<{ detail: string; is_enabled: boolean }> {
        const response = await authAxiosInstance.post('/totp/enable/', {
            verification_token: verificationToken,
        });
        return response.data;
    }

    /**
     * Disable TOTP 2FA (requires password)
     */
    async disableTOTP(password: string): Promise<{ detail: string }> {
        const response = await authAxiosInstance.post('/totp/disable/', {
            password,
        });
        return response.data;
    }

    /**
     * Get TOTP 2FA status
     */
    async getTOTPStatus(): Promise<TOTPStatusResponse> {
        const response = await authAxiosInstance.get('/totp/status/');
        return response.data;
    }

    /**
     * Verify a TOTP token
     */
    async verifyToken(token: string): Promise<{ detail: string }> {
        const response = await authAxiosInstance.post('/totp/verify/', {
            token,
        });
        return response.data;
    }

    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(): Promise<{ detail: string; backup_codes: string[] }> {
        const response = await authAxiosInstance.post('/totp/backup-codes/');
        return response.data;
    }

    /**
     * Login with TOTP 2FA and device fingerprinting
     */
    async loginWithTOTP(
        email: string,
        password: string,
        totpToken?: string,
        backupCode?: string,
        rememberMe?: boolean
    ): Promise<any> {
        // Import device fingerprinting utilities
        const { getDeviceInfo } = await import('../utils/DeviceFingerPrint');
        const deviceInfo = getDeviceInfo();
        console.log("the  topt verify");
        
        const axiosResponse = await authAxiosInstance.post('/login-with-totp/', {
            email,
            password,
            totp_token: totpToken,
            backup_code: backupCode,
            device_id: deviceInfo.device_id,
            device_name: deviceInfo.device_name,
            fingerprint: deviceInfo.fingerprint,
            device_info: deviceInfo.device_info,
            trust_device: rememberMe,
            remember_device: rememberMe,
            remember_me: rememberMe,
        });

        // Expose JSON body + headers (tokens are on response headers)
        return axiosResponse;
    }
}

export default new TOTPService();

