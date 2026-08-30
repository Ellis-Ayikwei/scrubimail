import axiosInstance from './axiosInstance';

export type ProviderId = 'github' | 'gitlab' | 'google';

export interface OAuthProvider {
  name: string;
  client_id: string | null;
  authorize_url: string;
  available: boolean;
  color?: string;
  icon?: string;
}

export type OAuthProviders = Record<ProviderId, OAuthProvider>;

export interface OAuthLoginResponse {
  authorization_url: string;
  state?: string;
  provider: string;
  redirect_uri: string;
  linking: boolean;
}

export interface OAuthCallbackResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  provider?: string;
  requires_2fa: false;
}

export interface OAuthCallbackParams {
  code: string | null;
  error: string | null;
  provider: string | null;
  linked: boolean;
}

export interface LinkedAccount {
  provider: ProviderId;
  email: string;
  linked_at: string;
}

export interface LinkedAccountsResponse {
  linked: LinkedAccount[];
  available: ProviderId[];
  has_password: boolean;
}

/** Thrown when the account has TOTP enabled: the same one-time code must be
 *  re-submitted together with a token. The code is NOT consumed by the
 *  challenge, so it stays valid for the rest of its (short) TTL. */
export class TwoFactorRequiredError extends Error {
  constructor(message = 'Two-factor authentication required') {
    super(message);
    this.name = 'TwoFactorRequiredError';
  }
}

/** Friendly copy for the backend's OAuth error codes (Issue 11 / envelope). */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  unverified_email:
    "Your email isn't verified with that provider. Verify it there, or sign in another way.",
  link_required:
    'An account with this email already exists. Sign in with your password, then link this provider from your account settings.',
  already_linked: 'That provider account is linked to a different user.',
  invalid_provider: 'That sign-in provider is not supported.',
  provider_unavailable: 'That sign-in provider is not configured on this server.',
  invalid_code: 'Your sign-in link expired or was already used. Please try again.',
  invalid_2fa: 'That verification code is not valid. Please try again.',
  account_suspended: 'Your account has been suspended. Please contact support.',
  oauth_failed: 'Sign-in with the provider failed. Please try again.',
};

class SSOService {
  /** Providers this deployment can actually offer. Render buttons from this
   *  rather than a hardcoded list, so a provider without credentials configured
   *  is never shown as an option that then fails. */
  async getProviders(): Promise<OAuthProviders> {
    const response = await axiosInstance.get('/auth/oauth/providers/');
    return response.data;
  }

  async getAvailableProviders(): Promise<ProviderId[]> {
    try {
      const providers = await this.getProviders();
      return (Object.keys(providers) as ProviderId[]).filter(
        (id) => providers[id]?.available
      );
    } catch {
      return [];
    }
  }

  /**
   * Start the provider round-trip.
   *
   * If the caller is signed in (axiosInstance attaches the JWT), the backend
   * records a linking intent against that account — this is what makes the
   * `link_required` remedy ("sign in, then link it from account settings")
   * actually possible.
   */
  async initiateOAuthLogin(
    provider: ProviderId,
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

  /** The redirect target must be on the backend's OAUTH_ALLOWED_REDIRECT_URIS
   *  allowlist or it is silently replaced with the default one. */
  defaultRedirectUri(): string {
    return `${window.location.origin}/oauth/callback`;
  }

  /** Kick off sign-in (or linking) end to end. */
  async startLogin(provider: ProviderId, redirectUri?: string): Promise<void> {
    const data = await this.initiateOAuthLogin(
      provider,
      redirectUri ?? this.defaultRedirectUri()
    );
    if (!data.authorization_url) {
      throw new Error('The server did not return an authorization URL.');
    }
    window.location.href = data.authorization_url;
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
      linked: params.get('linked') === '1',
    };
  }

  /**
   * Exchange the single-use code from the redirect for JWT tokens (over POST).
   *
   * When the account has 2FA enabled the server answers with a challenge
   * instead of tokens; re-call this with `totpToken` or `backupCode` and the
   * same code.
   */
  async exchangeCode(
    code: string,
    opts: { totpToken?: string; backupCode?: string } = {}
  ): Promise<OAuthCallbackResponse> {
    try {
      const response = await axiosInstance.post('/auth/oauth/exchange/', {
        code,
        ...(opts.totpToken ? { totp_token: opts.totpToken } : {}),
        ...(opts.backupCode ? { backup_code: opts.backupCode } : {}),
      });
      return response.data;
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.requires_2fa) {
        throw new TwoFactorRequiredError(
          data?.error?.code ? OAUTH_ERROR_MESSAGES[data.error.code] : undefined
        );
      }
      const code_ = data?.error?.code;
      if (code_ && OAUTH_ERROR_MESSAGES[code_]) {
        throw new Error(OAUTH_ERROR_MESSAGES[code_]);
      }
      throw err;
    }
  }

  /** Providers linked to the signed-in account, plus what can still be added. */
  async getLinkedAccounts(): Promise<LinkedAccountsResponse> {
    const response = await axiosInstance.get('/auth/oauth/accounts/');
    return response.data;
  }

  /** Link another provider to the signed-in account (same redirect dance). */
  async linkProvider(provider: ProviderId): Promise<void> {
    return this.startLogin(provider);
  }

  /** Refused by the server when it would remove the last way to sign in. */
  async unlinkProvider(provider: ProviderId): Promise<void> {
    await axiosInstance.delete(`/auth/oauth/accounts/${provider}/`);
  }

  /** Clear OAuth callback parameters from URL */
  clearCallbackFromUrl(): void {
    const url = new URL(window.location.href);
    ['access_token', 'refresh_token', 'provider', 'code', 'state', 'error', 'linked'].forEach(
      (key) => url.searchParams.delete(key)
    );
    window.history.replaceState({}, '', url.toString());
  }
}

const ssoService = new SSOService();
export default ssoService;
