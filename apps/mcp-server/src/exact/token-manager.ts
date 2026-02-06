/**
 * Token Manager for Exact Online OAuth
 *
 * Handles automatic token refresh with proactive renewal.
 * Access tokens expire after 10 minutes, so we refresh 2 minutes before expiry
 * to ensure sufficient buffer for long-running MCP conversations.
 *
 * Features:
 * - Mutex/lock to prevent race conditions during concurrent refresh
 * - Retry logic with exponential backoff for refresh failures
 * - Detailed logging for debugging token refresh issues
 *
 * @see docs/exact-online-api/authentication.md
 * @see EXACT-010: Token verloopt midden in gesprek
 */

import { getRegionConfig, ExactRegion, DEFAULT_REGION } from './regions';
import { logger } from '../lib/logger';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  region: ExactRegion;
}

export interface TokenManagerConfig {
  clientId: string;
  clientSecret: string;
  region?: ExactRegion;
  /** How many milliseconds before expiry to refresh (default: 2 minutes) */
  refreshBufferMs?: number;
  /** Maximum number of retry attempts for token refresh (default: 3) */
  maxRetryAttempts?: number;
  /** Callback when tokens are refreshed (for persistence) */
  onTokenRefresh?: (tokens: TokenData) => Promise<void>;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// EXACT-010/BUG-006: Increased from 40 seconds to 3 minutes to prevent token expiry during active MCP conversations
// Exact Online tokens expire after 10 minutes, so refreshing at 7 minutes gives ample buffer
const DEFAULT_REFRESH_BUFFER_MS = 3 * 60 * 1000; // 3 minutes
const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1 second base delay for exponential backoff

export class TokenManager {
  private clientId: string;
  private clientSecret: string;
  private region: ExactRegion;
  private refreshBufferMs: number;
  private maxRetryAttempts: number;
  private onTokenRefresh?: (tokens: TokenData) => Promise<void>;

  private currentTokens: TokenData | null = null;

  // EXACT-010: Mutex to prevent race conditions during concurrent refresh
  private refreshMutex: boolean = false;
  private refreshWaiters: Array<{
    resolve: (value: TokenData) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config: TokenManagerConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.region = config.region || DEFAULT_REGION;
    this.refreshBufferMs = config.refreshBufferMs || DEFAULT_REFRESH_BUFFER_MS;
    this.maxRetryAttempts = config.maxRetryAttempts || DEFAULT_MAX_RETRY_ATTEMPTS;
    this.onTokenRefresh = config.onTokenRefresh;

    logger.debug('TokenManager initialized', { refreshBufferMs: this.refreshBufferMs, refreshBufferSec: this.refreshBufferMs / 1000 });
  }

  /**
   * Initialize with existing tokens (e.g., from database)
   */
  setTokens(tokens: TokenData): void {
    this.currentTokens = tokens;
    this.region = tokens.region;

    const expiresIn = tokens.expiresAt.getTime() - Date.now();
    logger.debug('Tokens set', { expiresInSec: Math.round(expiresIn / 1000), expiresAt: tokens.expiresAt.toISOString() });
  }

  /**
   * Exchange authorization code for tokens (initial auth)
   */
  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const regionConfig = getRegionConfig(this.region);

    const response = await fetch(regionConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new TokenError(`Token exchange failed: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as TokenResponse;
    const tokens = this.parseTokenResponse(data);

    this.currentTokens = tokens;
    await this.notifyTokenRefresh(tokens);

    return tokens;
  }

  /**
   * Get a valid access token, refreshing if necessary.
   * This is the main method to call before making API requests.
   */
  async getAccessToken(): Promise<string> {
    if (!this.currentTokens) {
      throw new TokenError('No tokens available. Call exchangeCode() or setTokens() first.');
    }

    // Check if refresh is needed
    if (this.shouldRefresh()) {
      const expiresIn = this.currentTokens.expiresAt.getTime() - Date.now();
      logger.info('Token refresh needed', { expiresInSec: Math.round(expiresIn / 1000) });
      await this.refreshTokens();
    }

    return this.currentTokens.accessToken;
  }

  /**
   * Force a token refresh with mutex protection.
   * Uses a proper mutex pattern to prevent race conditions when multiple
   * concurrent requests try to refresh at the same time.
   */
  async refreshTokens(): Promise<TokenData> {
    // EXACT-010: Proper mutex implementation to prevent race conditions
    if (this.refreshMutex) {
      logger.debug('Refresh already in progress, waiting');
      // Another refresh is in progress, wait for it to complete
      return new Promise<TokenData>((resolve, reject) => {
        this.refreshWaiters.push({ resolve, reject });
      });
    }

    // Acquire the mutex
    this.refreshMutex = true;
    logger.debug('Acquired refresh mutex, starting token refresh');

    try {
      const tokens = await this.doRefreshWithRetry();

      // Notify all waiters of success
      const waiters = [...this.refreshWaiters];
      this.refreshWaiters = [];
      for (const waiter of waiters) {
        waiter.resolve(tokens);
      }

      return tokens;
    } catch (error) {
      // Notify all waiters of failure
      const waiters = [...this.refreshWaiters];
      this.refreshWaiters = [];
      for (const waiter of waiters) {
        waiter.reject(error as Error);
      }

      throw error;
    } finally {
      // Release the mutex
      this.refreshMutex = false;
      logger.debug('Released refresh mutex');
    }
  }

  /**
   * Perform token refresh with retry logic and exponential backoff.
   */
  private async doRefreshWithRetry(): Promise<TokenData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        logger.debug('Token refresh attempt', { attempt, maxAttempts: this.maxRetryAttempts });
        return await this.doRefresh();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if user needs to re-authenticate
        if (error instanceof TokenError && error.requiresReauth) {
          logger.error('Refresh token invalid, re-authentication required', error);
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetryAttempts) {
          logger.error('All refresh attempts failed', undefined, { maxRetryAttempts: this.maxRetryAttempts });
          break;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn('Refresh attempt failed, retrying', { attempt, delayMs: delay, errorMessage: (error as Error).message });

        await this.sleep(delay);
      }
    }

    throw lastError || new TokenError('Token refresh failed after all retry attempts');
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if we have valid tokens
   */
  hasValidTokens(): boolean {
    return this.currentTokens !== null && !this.isExpired();
  }

  /**
   * Get current token data (for persistence)
   */
  getTokenData(): TokenData | null {
    return this.currentTokens;
  }

  /**
   * Build the authorization URL for initial OAuth flow
   */
  buildAuthUrl(redirectUri: string, state: string): string {
    const regionConfig = getRegionConfig(this.region);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });

    return `${regionConfig.authUrl}?${params}`;
  }

  /**
   * Get token status info for including in API responses.
   * Helps users understand when they might need to re-authenticate.
   * BUG-006: Added to provide token expiry feedback to users.
   */
  getTokenStatus(): {
    expires_in_seconds: number;
    expires_at: string;
    is_healthy: boolean;
    warning?: string;
  } | null {
    if (!this.currentTokens) {
      return null;
    }

    const now = Date.now();
    const expiresAt = this.currentTokens.expiresAt.getTime();
    const expiresInMs = expiresAt - now;
    const expiresInSeconds = Math.round(expiresInMs / 1000);

    // Token is considered healthy if we have more than the refresh buffer remaining
    const isHealthy = expiresInMs > this.refreshBufferMs;

    // Add warning if token is expiring soon (within 5 minutes)
    const warningThresholdMs = 5 * 60 * 1000;
    let warning: string | undefined;

    if (expiresInMs <= 0) {
      warning = 'Token expired. Re-authentication required.';
    } else if (expiresInMs <= warningThresholdMs && !isHealthy) {
      warning = `Token expires in ${expiresInSeconds} seconds. Will be refreshed automatically.`;
    }

    return {
      expires_in_seconds: Math.max(0, expiresInSeconds),
      expires_at: this.currentTokens.expiresAt.toISOString(),
      is_healthy: isHealthy,
      ...(warning && { warning }),
    };
  }

  /**
   * Get the current region
   */
  getRegion(): ExactRegion {
    return this.region;
  }

  /**
   * Set the region (for multi-region support)
   */
  setRegion(region: ExactRegion): void {
    this.region = region;
    if (this.currentTokens) {
      this.currentTokens = { ...this.currentTokens, region };
    }
  }

  private shouldRefresh(): boolean {
    if (!this.currentTokens) return false;

    const now = Date.now();
    const expiresAt = this.currentTokens.expiresAt.getTime();
    const timeUntilExpiry = expiresAt - now;
    const shouldRefresh = timeUntilExpiry <= this.refreshBufferMs;

    // Log token status periodically (only when close to refresh time)
    if (timeUntilExpiry <= this.refreshBufferMs * 1.5) {
      logger.debug('Token status check', { expiresInSec: Math.round(timeUntilExpiry / 1000), bufferSec: this.refreshBufferMs / 1000, refreshNeeded: shouldRefresh });
    }

    // Refresh if within buffer period or already expired
    return shouldRefresh;
  }

  private isExpired(): boolean {
    if (!this.currentTokens) return true;
    return Date.now() >= this.currentTokens.expiresAt.getTime();
  }

  private async doRefresh(): Promise<TokenData> {
    if (!this.currentTokens) {
      throw new TokenError('No tokens to refresh');
    }

    const regionConfig = getRegionConfig(this.region);
    const refreshStartTime = Date.now();

    logger.info('Initiating token refresh', { region: this.region });

    const response = await fetch(regionConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.currentTokens.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    const refreshDuration = Date.now() - refreshStartTime;

    if (!response.ok) {
      const error = await response.text();
      logger.error('Token refresh failed', undefined, { durationMs: refreshDuration, statusCode: response.status, errorPreview: error.substring(0, 200) });

      // Check for invalid_grant (refresh token expired)
      if (response.status === 400 && error.includes('invalid_grant')) {
        throw new TokenError(
          'Refresh token expired or invalid. User needs to re-authenticate.',
          true
        );
      }

      throw new TokenError(`Token refresh failed: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as TokenResponse;
    const tokens = this.parseTokenResponse(data);

    this.currentTokens = tokens;
    await this.notifyTokenRefresh(tokens);

    const expiresIn = tokens.expiresAt.getTime() - Date.now();
    logger.info('Tokens refreshed successfully', { durationMs: refreshDuration, expiresInSec: Math.round(expiresIn / 1000), expiresAt: tokens.expiresAt.toISOString() });
    return tokens;
  }

  private parseTokenResponse(data: TokenResponse): TokenData {
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      region: this.region,
    };
  }

  private async notifyTokenRefresh(tokens: TokenData): Promise<void> {
    if (this.onTokenRefresh) {
      try {
        await this.onTokenRefresh(tokens);
      } catch (error) {
        logger.error('Error in onTokenRefresh callback', error instanceof Error ? error : undefined);
      }
    }
  }
}

export class TokenError extends Error {
  /** True if the user needs to re-authenticate */
  requiresReauth: boolean;

  constructor(message: string, requiresReauth = false) {
    super(message);
    this.name = 'TokenError';
    this.requiresReauth = requiresReauth;
  }
}
