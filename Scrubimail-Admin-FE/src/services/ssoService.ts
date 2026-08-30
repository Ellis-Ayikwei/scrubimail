import authAxiosInstance from './authAxiosInstance';

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

export interface OAuthCallbackResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  requires_2fa: false;
}

/** Thrown when the account has TOTP enabled: the same one-time code must be
 *  re-submitted with a token. The challenge does not consume the code. */
export class TwoFactorRequiredError extends Error {
  constructor(message = 'Two-factor authentication required') {
    super(message);
    this.name = 'TwoFactorRequiredError';
  }
}

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
  not_admin: 'That account does not have admin access.',
};

// authAxiosInstance is already based at /scrubimail/api/v1/auth.
class SSOService {
  async getProviders(): Promise<OAuthProviders> {
    const response = await authAxiosInstance.get('/oauth/providers/');
    return response.data;
  }

  /** Only render buttons for providers this deployment has credentials for. */
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

  defaultRedirectUri(): string {
    return `${window.location.origin}/oauth/callback`;
  }

  /** Begin the provider round-trip. The redirect target must be on the
   *  backend's OAUTH_ALLOWED_REDIRECT_URIS allowlist — the admin SPA runs on a
   *  different port than the customer app, so it needs its own entry. */
  async startLogin(provider: ProviderId): Promise<void> {
    const response = await authAxiosInstance.get(
      `/oauth/${provider}/login/?redirect_uri=${encodeURIComponent(this.defaultRedirectUri())}`
    );
    const url = response.data?.authorization_url;
    if (!url) throw new Error('The server did not return an authorization URL.');
    window.location.href = url;
  }

  async exchangeCode(
    code: string,
    opts: { totpToken?: string; backupCode?: string } = {}
  ): Promise<OAuthCallbackResponse> {
    try {
      const response = await authAxiosInstance.post('/oauth/exchange/', {
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
      if (code_ && OAUTH_ERROR_MESSAGES[code_]) throw new Error(OAUTH_ERROR_MESSAGES[code_]);
      throw err;
    }
  }
}

const ssoService = new SSOService();
export default ssoService;
