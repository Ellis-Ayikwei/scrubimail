# Google OAuth Troubleshooting Guide

## Error: "Failed to initialize OAuth for google"

This error occurs when the Google OAuth client cannot be initialized. Here are the most common causes and solutions:

## 1. Missing Environment Variables

**Symptom**: `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is `None` or empty.

**Solution**:
1. Check your `.env` file has these variables:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```
2. Verify the values are not empty (no quotes needed)
3. Restart your Django server after adding/updating environment variables

**Check**: Look at backend logs - it will print `GOOGLE_CLIENT_ID: None` if missing.

## 2. Redirect URI Mismatch

**Symptom**: Error mentions "redirect_uri" or "redirect URI mismatch"

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials** → Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   - For production: `https://scrubimail.com/api/auth/oauth/google/callback/`
   - For development: `http://localhost:8000/api/auth/oauth/google/callback/` or `http://192.168.0.103:8000/api/auth/oauth/google/callback/`
4. The redirect URI must match **exactly** (including trailing slash, http vs https, port number)

## 3. Google Cloud Console Configuration Issues

**Common Issues**:
- OAuth consent screen not configured
- Required APIs not enabled
- OAuth client type is wrong (should be "Web application")

**Solution**:
1. **OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Complete all required fields
   - Add your email as a test user if in testing mode

2. **Enable Required APIs**:
   - Go to **APIs & Services** → **Library**
   - Enable: **Google+ API** (or **People API** for newer setups)

3. **OAuth Client Type**:
   - Ensure you created a **Web application** (not Desktop or other types)
   - Application type should be "Web application"

## 4. Network/Firewall Issues

**Symptom**: Error fetching OpenID configuration metadata

**Solution**:
1. Verify your server can reach `https://accounts.google.com/.well-known/openid_configuration`
2. Check firewall/proxy settings
3. Test with: `curl https://accounts.google.com/.well-known/openid_configuration`

## 5. Authlib Library Issues

**Symptom**: Import errors or version compatibility issues

**Solution**:
1. Ensure authlib is installed: `pip install authlib`
2. Check version: `pip show authlib` (should be >= 1.0.0)
3. Update if needed: `pip install --upgrade authlib`

## 6. Client ID/Secret Format Issues

**Symptom**: Credentials look correct but still fail

**Solution**:
1. Ensure no extra spaces or quotes in `.env` file:
   ```env
   # ❌ Wrong
   GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
   GOOGLE_CLIENT_ID= 123456789.apps.googleusercontent.com
   
   # ✅ Correct
   GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
   ```
2. Google Client IDs should end with `.apps.googleusercontent.com`
3. Client secrets should be long alphanumeric strings

## 7. Development vs Production Configuration

**Issue**: Different redirect URIs for dev and production

**Solution**:
- Use environment-specific redirect URIs
- Update Google Cloud Console with all possible redirect URIs
- Consider using Django settings to switch based on `DEBUG` mode

## Debugging Steps

1. **Check Backend Logs**:
   ```bash
   # Look for these debug messages:
   === OAuth Configuration Debug ===
   GOOGLE_CLIENT_ID: <your_id>
   GOOGLE_CLIENT_SECRET: ********
   ```

2. **Test OAuth Endpoint Directly**:
   ```bash
   curl http://localhost:8000/api/auth/oauth/google/login/
   ```

3. **Check Google Cloud Console**:
   - Verify OAuth client exists
   - Check redirect URIs match exactly
   - Verify APIs are enabled

4. **Test OpenID Configuration**:
   ```bash
   curl https://accounts.google.com/.well-known/openid_configuration
   ```

## Quick Checklist

- [ ] `GOOGLE_CLIENT_ID` is set in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` is set in `.env`
- [ ] No quotes around values in `.env`
- [ ] Django server restarted after `.env` changes
- [ ] OAuth consent screen configured in Google Cloud Console
- [ ] Redirect URI matches exactly in Google Cloud Console
- [ ] OAuth client type is "Web application"
- [ ] Required APIs are enabled (Google+ API or People API)
- [ ] Network can reach Google's servers
- [ ] Authlib library is installed and up-to-date

## Still Having Issues?

1. Check the full error traceback in Django logs
2. Verify the exact error message from the API response
3. Test with a fresh OAuth client in Google Cloud Console
4. Ensure you're using the correct Google account that created the OAuth client

