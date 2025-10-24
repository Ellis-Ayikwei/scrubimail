# 🔐 TOTP Two-Factor Authentication Setup Guide

## Overview
This guide explains how users can set up and use Time-based One-Time Password (TOTP) authentication with authenticator apps like Google Authenticator, Microsoft Authenticator, or Authy.

## 📱 Supported Authenticator Apps

Users can use any of these popular authenticator apps:
- **Google Authenticator** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (with authenticator feature)
- **LastPass Authenticator** (iOS/Android)
- **Bitwarden** (with authenticator feature)

## 🚀 User Setup Flow

### Step 1: Navigate to Security Settings
1. User logs into their account
2. Goes to **Profile** → **Security** tab
3. Clicks **"Two-Factor Authentication"** button
4. Redirected to `/security` page

### Step 2: Enable Two-Factor Authentication
1. User clicks **"Start Setup"** button
2. System generates QR code and backup codes
3. User sees QR code and backup codes on screen

### Step 3: Scan QR Code with Authenticator App
1. User opens their authenticator app
2. Taps **"Add Account"** or **"+"** button
3. Selects **"Scan QR Code"** or **"Scan Barcode"**
4. Points camera at QR code on website
5. App automatically adds account with 6-digit code

### Step 4: Verify Setup
1. User enters the 6-digit code from their app
2. Clicks **"Enable 2FA"** button
3. System verifies the code
4. 2FA is now enabled for the account

### Step 5: Save Backup Codes
1. User downloads or copies backup codes
2. Stores them in a safe place (password manager, secure note)
3. Backup codes can be used if authenticator app is lost

## 🔑 Login Flow with 2FA

### Normal Login (2FA Enabled)
1. User enters email and password
2. System checks if 2FA is enabled
3. If enabled, user sees 2FA prompt
4. User opens authenticator app
5. User enters 6-digit code
6. System verifies and logs user in

### Trusted Device Login
1. User enters email and password
2. Checks **"Remember this device"** checkbox
3. System creates device fingerprint
4. Next 30 days: User skips 2FA on this device
5. Enhanced security: Device fingerprint prevents unauthorized access

## 🛡️ Security Features

### Device Fingerprinting
- **Browser characteristics**: User agent, screen size, timezone
- **Hardware info**: CPU cores, memory, GPU details
- **Secure hashing**: SHA-256 with salt for fingerprint
- **Automatic expiry**: Trusted devices expire after 30 days

### Backup Codes
- **10 unique codes**: Generated during setup
- **One-time use**: Each code can only be used once
- **Account recovery**: Use if authenticator app is lost
- **Regeneration**: Can generate new codes anytime

### Rate Limiting
- **Login attempts**: Limited failed attempts per IP
- **Account lockout**: Temporary lockout after too many failures
- **2FA attempts**: Limited verification attempts per session

## 🔧 Technical Implementation

### Backend Endpoints
```
GET  /auth/totp/setup/          # Get QR code and backup codes
POST /auth/totp/enable/         # Enable 2FA after verification
POST /auth/totp/disable/        # Disable 2FA (requires password)
GET  /auth/totp/status/         # Check 2FA status
POST /auth/totp/verify/         # Test TOTP token
POST /auth/totp/backup-codes/   # Regenerate backup codes
POST /auth/login-with-totp/     # Login with 2FA + device fingerprinting
GET  /auth/trusted-devices/    # List trusted devices
DELETE /auth/trusted-devices/{id}/ # Revoke specific device
POST /auth/trusted-devices/revoke-all/ # Revoke all devices
```

### Frontend Components
- **TOTPSetup.tsx**: Complete 2FA setup interface
- **LoginWithTOTP.tsx**: Login with 2FA support
- **DeviceFingerPrint.ts**: Device fingerprinting utilities

### Database Models
- **TOTPDevice**: Stores user's secret key and settings
- **TrustedDevice**: Stores trusted device fingerprints

## 📋 User Instructions for Authenticator Apps

### Google Authenticator
1. Download from App Store/Google Play
2. Open app and tap **"+"**
3. Select **"Scan a QR code"**
4. Point camera at QR code
5. Account appears with 6-digit code

### Microsoft Authenticator
1. Download from App Store/Google Play
2. Tap **"Add account"**
3. Select **"Work or school account"**
4. Tap **"Scan QR code"**
5. Point camera at QR code
6. Account appears with 6-digit code

### Authy
1. Download from App Store/Google Play
2. Tap **"Add Account"**
3. Select **"Scan QR Code"**
4. Point camera at QR code
5. Account appears with 6-digit code

## 🚨 Troubleshooting

### Common Issues

#### "Invalid TOTP Code"
- **Cause**: Code expired (30-second window)
- **Solution**: Wait for new code and try again
- **Prevention**: Enter code quickly after generation

#### "QR Code Not Scanning"
- **Cause**: Poor lighting or camera focus
- **Solution**: Ensure good lighting, hold steady
- **Alternative**: Use manual entry with secret key

#### "Backup Code Not Working"
- **Cause**: Code already used or expired
- **Solution**: Use a different backup code
- **Prevention**: Generate new backup codes

#### "Trusted Device Not Recognized"
- **Cause**: Browser changed or fingerprint mismatch
- **Solution**: Complete 2FA verification again
- **Prevention**: Don't clear browser data

### Recovery Options

#### Lost Authenticator App
1. Use backup codes to log in
2. Go to Security Settings
3. Disable and re-enable 2FA
4. Scan new QR code with new app

#### Lost Backup Codes
1. Log in with authenticator app
2. Go to Security Settings
3. Click "Regenerate Backup Codes"
4. Save new codes securely

#### Can't Access Account
1. Contact support with account details
2. Provide identity verification
3. Support can disable 2FA temporarily
4. Re-enable 2FA after account recovery

## 🔒 Security Best Practices

### For Users
- **Use strong passwords**: Even with 2FA enabled
- **Save backup codes**: Store in password manager
- **Keep app updated**: Use latest authenticator app version
- **Secure devices**: Lock phones/tablets with biometrics
- **Monitor activity**: Check trusted devices regularly

### For Administrators
- **Monitor 2FA adoption**: Track user enrollment rates
- **Security alerts**: Notify users of new trusted devices
- **Audit logs**: Track 2FA setup and usage
- **Backup procedures**: Document account recovery process

## 📊 Analytics and Monitoring

### Metrics to Track
- **2FA adoption rate**: Percentage of users with 2FA enabled
- **Trusted device usage**: How often users skip 2FA
- **Failed attempts**: Track suspicious login patterns
- **Recovery usage**: How often backup codes are used

### Security Alerts
- **New trusted device**: Email notification when device is trusted
- **Failed 2FA attempts**: Alert after multiple failures
- **Backup code usage**: Notify when backup codes are used
- **2FA disabled**: Alert when user disables 2FA

## 🎯 Next Steps

1. **Test the setup flow** with different authenticator apps
2. **Train support team** on 2FA troubleshooting
3. **Create user documentation** with screenshots
4. **Monitor adoption metrics** and user feedback
5. **Consider additional 2FA methods** (SMS, email codes)

---

**Need Help?** Contact support if you encounter any issues with 2FA setup or login.
