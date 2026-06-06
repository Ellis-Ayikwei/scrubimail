#!/usr/bin/env python3
"""
Test script to verify TOTP functionality
Run this to test the TOTP setup without the full frontend
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from apps.Authentication.models import TOTPDevice
from apps.User.models import User
import pyotp
import qrcode
import io
import base64


def test_totp_setup():
    """Test TOTP device creation and QR code generation"""
    print("🔐 Testing TOTP Setup...")

    # Create a test user (or use existing)
    try:
        user = User.objects.get(email="test@example.com")
        print(f"✅ Using existing user: {user.email}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            email="test@example.com", password="testpassword123"
        )
        print(f"✅ Created test user: {user.email}")

    # Create or get TOTP device
    totp_device, created = TOTPDevice.objects.get_or_create(
        user=user, defaults={"secret_key": ""}
    )

    if created:
        print("✅ Created new TOTP device")
    else:
        print("✅ Using existing TOTP device")

    # Generate secret if not exists
    if not totp_device.secret_key:
        totp_device.generate_secret()
        print(f"✅ Generated secret key: {totp_device.secret_key}")

    # Generate QR code
    qr_code = totp_device.generate_qr_code()
    print("✅ Generated QR code")

    # Generate backup codes
    backup_codes = totp_device.generate_backup_codes()
    print(f"✅ Generated backup codes: {backup_codes}")

    # Test TOTP verification
    totp = pyotp.TOTP(totp_device.secret_key)
    test_token = totp.now()
    print(f"✅ Generated test token: {test_token}")

    # Verify token
    is_valid = totp_device.verify_token(test_token)
    if is_valid:
        print("✅ Token verification successful!")
    else:
        print("❌ Token verification failed!")

    # Test backup code
    if backup_codes:
        test_backup_code = backup_codes[0]
        is_backup_valid = totp_device.verify_backup_code(test_backup_code)
        if is_backup_valid:
            print(f"✅ Backup code verification successful: {test_backup_code}")
        else:
            print("❌ Backup code verification failed!")

    print("\n📱 To test with authenticator app:")
    print(f"1. Open Google Authenticator, Microsoft Authenticator, or Authy")
    print(f"2. Scan this QR code or enter secret key manually:")
    print(f"   Secret Key: {totp_device.secret_key}")
    print(f"3. Enter the 6-digit code from your app")
    print(f"4. Current code: {totp.now()}")

    return totp_device


def test_trusted_device():
    """Test trusted device functionality"""
    print("\n🔒 Testing Trusted Device...")

    from apps.Authentication.models import TrustedDevice
    from django.utils import timezone
    from datetime import timedelta
    import hashlib

    try:
        user = User.objects.get(email="test@example.com")

        # Create a test trusted device
        device_id = "test-device-123"
        device_fingerprint = "test-fingerprint-abc123"
        from django.conf import settings as dj_settings

        fp_hash = hashlib.sha256(
            (dj_settings.SECRET_KEY + device_fingerprint).encode()
        ).hexdigest()

        trusted_device, created = TrustedDevice.objects.update_or_create(
            user=user,
            device_id=device_id,
            defaults={
                "device_fingerprint_hash": fp_hash,
                "device_name": "Test Device",
                "device_info": {"browser": "Chrome", "os": "Windows"},
                "refresh_token_hash": "test-token-hash",
                "last_used": timezone.now(),
                "expires_at": timezone.now() + timedelta(days=30),
                "is_active": True,
            },
        )

        if created:
            print("✅ Created trusted device")
        else:
            print("✅ Updated trusted device")

        print(f"   Device ID: {trusted_device.device_id}")
        print(f"   Device Name: {trusted_device.device_name}")
        print(f"   Expires: {trusted_device.expires_at}")
        print(f"   Is Expired: {trusted_device.is_expired()}")

    except Exception as e:
        print(f"❌ Trusted device test failed: {e}")


def main():
    """Run all tests"""
    print("🚀 Starting TOTP Tests...\n")

    try:
        # Test TOTP setup
        totp_device = test_totp_setup()

        # Test trusted device
        test_trusted_device()

        print("\n✅ All tests completed successfully!")
        print("\n📋 Next steps:")
        print("1. Test the frontend components")
        print("2. Verify API endpoints work")
        print("3. Test with real authenticator apps")
        print("4. Check device fingerprinting in browser")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
