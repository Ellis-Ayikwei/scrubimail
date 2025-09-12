# OAuth Setup Guide

This guide explains how to set up OAuth authentication with GitHub, GitLab, and Google for the ScrubiMail backend.

## Prerequisites

1. Install the required package:
```bash
pip install authlib
```

2. Add the following environment variables to your `.env` file:

## Environment Variables

Add these to your `.env` file:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab OAuth
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## OAuth Provider Setup

### 1. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: ScrubiMail
   - **Homepage URL**: `http://192.168.0.103:5173` (development)
   - **Authorization callback URL**: `http://192.168.0.103:8000/api/auth/oauth/github/callback/`
4. Click "Register application"
5. Copy the Client ID and Client Secret to your `.env` file

### 2. GitLab OAuth Setup

1. Go to [GitLab Applications](https://gitlab.com/-/profile/applications)
2. Click "New application"
3. Fill in the details:
   - **Name**: ScrubiMail
   - **Redirect URI**: `http://192.168.0.103:8000/api/auth/oauth/gitlab/callback/`
   - **Scopes**: `read_user`
4. Click "Save application"
5. Copy the Application ID and Secret to your `.env` file

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Fill in the details:
   - **Name**: ScrubiMail
   - **Authorized redirect URIs**: `http://192.168.0.103:8000/api/auth/oauth/google/callback/`
7. Click "Create"
8. Copy the Client ID and Client Secret to your `.env` file

## API Endpoints

### Get Available OAuth Providers
```
GET /api/auth/oauth/providers/
```

Response:
```json
{
  "github": {
    "name": "GitHub",
    "client_id": "your_client_id",
    "authorize_url": "/api/auth/oauth/github/login/",
    "available": true
  },
  "gitlab": {
    "name": "GitLab",
    "client_id": "your_client_id",
    "authorize_url": "/api/auth/oauth/gitlab/login/",
    "available": true
  },
  "google": {
    "name": "Google",
    "client_id": "your_client_id",
    "authorize_url": "/api/auth/oauth/google/login/",
    "available": true
  }
}
```

### Initiate OAuth Login
```
GET /api/auth/oauth/{provider}/login/?redirect_uri=http://192.168.0.103:5173/oauth/callback
```

Response:
```json
{
  "authorization_url": "https://github.com/login/oauth/authorize?...",
  "state": "random_state_string"
}
```

### OAuth Callback
```
GET /api/auth/oauth/{provider}/callback/
```

Response (JSON):
```json
{
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "https://..."
  },
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "provider": "github"
}
```

Or redirects to frontend with tokens in URL parameters:
```
http://192.168.0.103:5173/oauth/callback?access_token=...&refresh_token=...&provider=github
```

## Frontend Integration

### 1. Get OAuth Providers
```javascript
const response = await fetch('/api/auth/oauth/providers/');
const providers = await response.json();
```

### 2. Initiate OAuth Login
```javascript
const provider = 'github';
const redirectUri = 'http://192.168.0.103:5173/oauth/callback';

const response = await fetch(`/api/auth/oauth/${provider}/login/?redirect_uri=${encodeURIComponent(redirectUri)}`);
const { authorization_url } = await response.json();

// Redirect user to OAuth provider
window.location.href = authorization_url;
```

### 3. Handle OAuth Callback
```javascript
// In your callback component
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');
const provider = urlParams.get('provider');

if (accessToken) {
  // Store tokens
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  
  // Redirect to dashboard or home
  window.location.href = '/dashboard';
}
```

## Security Considerations

1. **State Parameter**: The OAuth flow includes a state parameter to prevent CSRF attacks
2. **HTTPS in Production**: Always use HTTPS in production for OAuth callbacks
3. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended for production)
4. **Redirect URIs**: Always validate redirect URIs to prevent open redirect attacks

## Testing

1. Start your Django server: `python manage.py runserver`
2. Test the providers endpoint: `http://localhost:8000/api/auth/oauth/providers/`
3. Test OAuth login flow for each provider
4. Verify user creation and JWT token generation

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the callback URL in your OAuth app settings matches exactly
2. **"Client ID not found"**: Verify your environment variables are loaded correctly
3. **"State parameter mismatch"**: This is a security feature - check your session configuration

### Debug Mode

Enable debug logging by adding to your Django settings:
```python
LOGGING = {
    'loggers': {
        'authlib': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
``` 