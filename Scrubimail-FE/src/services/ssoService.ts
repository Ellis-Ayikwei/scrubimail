import axiosInstance from './axiosInstance';

export interface OAuthProvider {
  name: string;
  client_id: string;
  authorize_url: string;
  available: boolean;
}

export interface OAuthProviders {
  github: OAuthProvider;
  gitlab: OAuthProvider;
  google: OAuthProvider;
}

export interface OAuthLoginResponse {
  authorization_url: string;
  state?: string;
  provider: string;
  redirect_uri: string;
}

export interface OAuthCallbackResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  provider?: string;
}

export interface OAuthCallbackParams {
  code: string | null;
  error: string | null;
  provider: string | null;
}

/** Friendly copy for the backend's OAuth error codes (Issue 11 / envelope). */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  unverified_email:
    "Your email isn't verified with that provider. Verify it there, or sign in another way.",
  link_required:
    'An account with this email already exists. Sign in with your password, then link this provider from your account settings.',
  already_linked: 'That provider account is linked to a different user.',
  invalid_provider: 'That sign-in provider is not supported.',
  invalid_code: 'Your sign-in link expired or was already used. Please try again.',
  oauth_failed: 'Sign-in with the provider failed. Please try again.',
};

class SSOService {
  /**
   * Get available OAuth providers
   */
  async getProviders(): Promise<OAuthProviders> {
    const response = await axiosInstance.get('/auth/oauth/providers/');
    return response.data;
  }

  /**
   * Initiate OAuth login for a provider
   */
  async initiateOAuthLogin(
    provider: 'github' | 'gitlab' | 'google',
    redirectUri?: string
  ): Promise<OAuthLoginResponse> {
    const params = new URLSearchParams();
    if (redirectUri) {
      params.append('redirect_uri', redirectUri);
    }

    const response = await axiosInstance.get(
      `/auth/oauth/${provider}/login/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Redirect to OAuth provider
   */
  redirectToProvider(authorizationUrl: string): void {
    window.location.href = authorizationUrl;
  }

  /**
   * Read the OAuth callback params from the URL.
   *
   * Tokens are NEVER placed in the URL (they leak via history/logs/Referer).
   * The backend redirects here with only a single-use `code` (or an `error`),
   * which is exchanged for tokens over POST — see {@link exchangeCode}.
   */
  getCallbackParams(): OAuthCallbackParams {
    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get('code'),
      error: params.get('error'),
      provider: params.get('provider'),
    };
  }

  /**
   * Exchange the single-use code from the redirect for JWT tokens (over POST).
   * The code is short-lived and can only be redeemed once.
   */
  async exchangeCode(code: string): Promise<OAuthCallbackResponse> {
    const response = await axiosInstance.post('/auth/oauth/exchange/', { code });
    return response.data;
  }

  /**
   * Clear OAuth callback parameters from URL
   */
  clearCallbackFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('access_token');
    url.searchParams.delete('refresh_token');
    url.searchParams.delete('provider');
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url.toString());
  }
}

const ssoService = new SSOService();
export default ssoService;
