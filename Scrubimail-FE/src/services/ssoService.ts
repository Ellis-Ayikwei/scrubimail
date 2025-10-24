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
  provider: string;
}

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
   * Handle OAuth callback (usually called by the backend)
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    state?: string
  ): Promise<OAuthCallbackResponse> {
    const response = await axiosInstance.get(
      `/auth/oauth/${provider}/callback/?code=${code}${state ? `&state=${state}` : ''}`
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
   * Handle OAuth callback from URL parameters
   */
  handleCallbackFromUrl(): OAuthCallbackResponse | null {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const provider = urlParams.get('provider');

    if (accessToken && refreshToken && provider) {
      return {
        user: null, // Will be populated by the backend
        access_token: accessToken,
        refresh_token: refreshToken,
        provider: provider,
      };
    }

    return null;
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
    window.history.replaceState({}, '', url.toString());
  }
}

const ssoService = new SSOService();
export default ssoService;
