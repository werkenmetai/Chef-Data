/**
 * Exact Online OAuth Helper Functions
 *
 * Convenience functions for OAuth 2.0 authentication flow.
 * For more advanced usage, use TokenManager directly.
 *
 * @see ./token-manager.ts for the full-featured token management
 * @see docs/exact-online-api/authentication.md
 */

import { Env } from '../types';
import { ExactRegion, getRegionConfig, DEFAULT_REGION } from './regions';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  region?: ExactRegion;
}

/**
 * Build the OAuth authorization URL
 */
export function buildAuthUrl(
  config: AuthConfig | Env,
  state: string,
  region: ExactRegion = DEFAULT_REGION
): string {
  const authConfig = isEnv(config) ? envToConfig(config, region) : config;
  const regionConfig = getRegionConfig(authConfig.region || region);

  const params = new URLSearchParams({
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    response_type: 'code',
    state,
  });

  return `${regionConfig.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  config: AuthConfig | Env,
  region: ExactRegion = DEFAULT_REGION
): Promise<TokenResponse> {
  const authConfig = isEnv(config) ? envToConfig(config, region) : config;
  const regionConfig = getRegionConfig(authConfig.region || region);

  const response = await fetch(regionConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: authConfig.clientId,
      client_secret: authConfig.clientSecret,
      redirect_uri: authConfig.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AuthError(`Token exchange failed: ${error}`, response.status);
  }

  return response.json() as Promise<TokenResponse>;
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: AuthConfig | Env,
  region: ExactRegion = DEFAULT_REGION
): Promise<TokenResponse> {
  const authConfig = isEnv(config) ? envToConfig(config, region) : config;
  const regionConfig = getRegionConfig(authConfig.region || region);

  const response = await fetch(regionConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: authConfig.clientId,
      client_secret: authConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    const isInvalidGrant = error.includes('invalid_grant');
    throw new AuthError(
      `Token refresh failed: ${error}`,
      response.status,
      isInvalidGrant
    );
  }

  return response.json() as Promise<TokenResponse>;
}

/**
 * Check if a token is expired or about to expire
 * @param expiresAt - Token expiration date
 * @param bufferMinutes - Buffer before expiration to consider expired (default: 2 min)
 */
export function isTokenExpired(expiresAt: Date, bufferMinutes = 2): boolean {
  const now = new Date();
  const buffer = bufferMinutes * 60 * 1000;
  return expiresAt.getTime() - buffer <= now.getTime();
}

/**
 * Calculate token expiration date from expires_in
 */
export function calculateExpiresAt(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Generate a random state string for OAuth CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ===== HELPER FUNCTIONS =====

function isEnv(config: AuthConfig | Env): config is Env {
  return 'EXACT_CLIENT_ID' in config;
}

function envToConfig(env: Env, region: ExactRegion): AuthConfig {
  if (!env.EXACT_CLIENT_ID || !env.EXACT_CLIENT_SECRET || !env.EXACT_REDIRECT_URI) {
    throw new AuthError('Exact OAuth credentials not configured in environment', 0);
  }

  return {
    clientId: env.EXACT_CLIENT_ID,
    clientSecret: env.EXACT_CLIENT_SECRET,
    redirectUri: env.EXACT_REDIRECT_URI,
    region,
  };
}

// ===== ERROR CLASS =====

export class AuthError extends Error {
  statusCode: number;
  requiresReauth: boolean;

  constructor(message: string, statusCode: number, requiresReauth = false) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.requiresReauth = requiresReauth;
  }
}
