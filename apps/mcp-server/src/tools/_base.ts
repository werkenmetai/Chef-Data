/**
 * Base Tool Class
 *
 * All MCP tools extend this base class which provides:
 * - Consistent error handling
 * - Input validation
 * - Output sanitization (masks sensitive data like IBANs, BSNs)
 * - Monitoring hooks
 * - Exact API client access
 * - Rate limit handling with Retry-After support
 *
 * @see docs/knowledge/exact/VERSION.md for rate limits
 */

const MAX_RATE_LIMIT_RETRIES = 3;
const DEFAULT_RETRY_WAIT_MS = 60000; // 60 seconds fallback

/**
 * Sleep utility for rate limit backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse dates from Exact Online API responses.
 *
 * Exact Online can return dates in multiple formats:
 * - Microsoft JSON: "/Date(1661904000000)/" (timestamp in milliseconds)
 * - ISO 8601: "2022-08-31T00:00:00" (standard format)
 * - null/undefined
 *
 * This helper handles all formats and returns a JavaScript Date object.
 *
 * @see QA Finance testing - days_overdue was always 0 because Microsoft JSON wasn't parsed
 */
export function parseExactDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) {
    return null;
  }

  // Microsoft JSON Date format: "/Date(1661904000000)/"
  const msDateMatch = dateValue.match(/^\/Date\((\d+)\)\/$/);
  if (msDateMatch) {
    const timestamp = parseInt(msDateMatch[1], 10);
    return new Date(timestamp);
  }

  // Try standard ISO 8601 format
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

/**
 * Format a date value from Exact Online API to human-readable format.
 * Handles both Microsoft JSON and ISO 8601 formats.
 *
 * @returns Date string in YYYY-MM-DD format, or undefined if invalid
 */
export function formatExactDate(dateValue: string | null | undefined): string | undefined {
  const date = parseExactDate(dateValue);
  if (!date) {
    return undefined;
  }

  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

/**
 * Extract results array from Exact Online OData response.
 *
 * Exact Online returns a NON-STANDARD response format:
 * - Standard OData: {d: {results: [item1, item2, ...]}}
 * - Exact Online:   {d: {0: item1, 1: item2, ...}}
 *
 * This helper handles both formats.
 *
 * @see P20 in operations/ROADMAP.md
 * @see LESSONS-LEARNED.md - "Exact Online retourneert GEEN standaard OData response formaat"
 */
export function extractODataResults<T>(responseD: Record<string, unknown> | undefined): T[] {
  if (!responseD) {
    return [];
  }

  // Standard OData format: {results: [...]}
  if (Array.isArray(responseD.results)) {
    return responseD.results as T[];
  }

  // Exact Online format: {0: item1, 1: item2, ...} (object with numeric keys)
  const numericKeys = Object.keys(responseD)
    .filter(key => !isNaN(Number(key)) && key !== '__next' && key !== '__count');

  if (numericKeys.length > 0) {
    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map(key => responseD[key] as T);
  }

  return [];
}

import { Env, ToolDefinition, ToolResult } from '../types';
import { ToolAnnotations } from '@exact-mcp/shared';
import { Tool } from '../mcp/tools';
import { AuthContext, ConnectionInfo } from '../auth/api-key';
import { financialSanitizer } from '../lib/sanitizer';
import { encryptToken, decryptToken, isEncrypted } from '../lib/crypto';
import { logger } from '../lib/logger';

/**
 * Default tool annotations for all Exact Online MCP tools.
 * All tools are read-only and interact with the Exact Online API.
 * @see https://modelcontextprotocol.io/specification/2024-11-05/server/tools#tool-annotations
 */
export const DEFAULT_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,      // We only read data, never write
  destructiveHint: false,  // We don't delete or overwrite anything
  idempotentHint: true,    // Same call = same result (no side effects)
  openWorldHint: true,     // We interact with external Exact Online API
};

export abstract class BaseTool implements Tool {
  abstract definition: ToolDefinition;

  protected env!: Env;
  protected ctx!: ExecutionContext;
  protected authContext!: AuthContext | null;

  /**
   * Execute the tool with the given parameters.
   * Override this in subclasses to implement tool logic.
   */
  abstract run(params: Record<string, unknown>): Promise<unknown>;

  /**
   * Main entry point called by the tool registry.
   * Wraps the tool execution with error handling and monitoring.
   */
  async execute(
    params: Record<string, unknown>,
    env: Env,
    ctx: ExecutionContext,
    authContext: AuthContext | null
  ): Promise<ToolResult> {
    this.env = env;
    this.ctx = ctx;
    this.authContext = authContext;

    try {
      // Validate required parameters
      this.validateParams(params);

      // Execute the tool
      const result = await this.run(params);

      // Format successful response
      return this.formatResult(result);
    } catch (error) {
      // Format error response
      return this.formatError(error);
    }
  }

  /**
   * Validate that required parameters are present.
   */
  protected validateParams(params: Record<string, unknown>): void {
    const required = this.definition.inputSchema.required ?? [];

    for (const param of required) {
      if (!(param in params) || params[param] === undefined) {
        throw new ValidationError(`Missing required parameter: ${param}`);
      }
    }
  }

  /**
   * Format a successful result as a ToolResult.
   * Automatically sanitizes sensitive data (IBANs, BSNs) before output.
   */
  protected formatResult(data: unknown): ToolResult {
    // Sanitize sensitive data before sending to LLM
    const sanitizedData = financialSanitizer.sanitize(data);

    const text =
      typeof sanitizedData === 'string'
        ? sanitizedData
        : JSON.stringify(sanitizedData, null, 2);

    return {
      content: [{ type: 'text', text }],
    };
  }

  /**
   * Format an error as a ToolResult.
   */
  protected formatError(error: unknown): ToolResult {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';

    // Log for monitoring
    logger.error(`Tool ${this.definition.name} error`, error instanceof Error ? error : undefined, { tool: this.definition.name });

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Get a connection for a specific region, or the first available one.
   */
  protected getConnection(region?: string): ConnectionInfo | null {
    if (!this.authContext || this.authContext.connections.length === 0) {
      return null;
    }

    if (region) {
      return this.authContext.connections.find(c => c.region === region) || null;
    }

    return this.authContext.connections[0];
  }

  /**
   * Get the default division from the user's connections.
   * FEATURE-001: Smart division resolution:
   * - If 1 active division: use it automatically
   * - If multiple active: prefer one marked as default, otherwise first
   *
   * Note: Only active divisions are returned from the database, so all
   * divisions in connection.divisions are already filtered to is_active=1
   */
  protected getDefaultDivision(connection: ConnectionInfo): number | null {
    if (!connection.divisions || connection.divisions.length === 0) {
      return null;
    }

    // If only one division, use it
    if (connection.divisions.length === 1) {
      return connection.divisions[0].code;
    }

    // Multiple divisions: prefer the one marked as default
    const defaultDivision = connection.divisions.find(d => d.isDefault);
    if (defaultDivision) {
      return defaultDivision.code;
    }

    // Fall back to the first division
    return connection.divisions[0].code;
  }

  /**
   * Get info about available divisions for smart resolution.
   * Used to provide context when multiple divisions are available.
   */
  protected getDivisionInfo(connection: ConnectionInfo): {
    count: number;
    divisions: Array<{ code: number; name: string; isDefault: boolean }>;
    hasDefault: boolean;
  } {
    const divisions = connection.divisions || [];
    return {
      count: divisions.length,
      divisions: divisions.map(d => ({ code: d.code, name: d.name, isDefault: d.isDefault })),
      hasDefault: divisions.some(d => d.isDefault),
    };
  }

  /**
   * Resolve the division to use: either the specified one or the default.
   * FEATURE-001: Tools can use this to automatically fall back to the default division.
   *
   * @param connection - The connection containing division info
   * @param specifiedDivision - The division specified in the tool parameters (optional)
   * @returns The division code to use, or null if none available
   */
  protected resolveDivision(connection: ConnectionInfo, specifiedDivision?: number): number | null {
    // If a division was explicitly specified, use it
    if (specifiedDivision !== undefined && specifiedDivision !== null) {
      return specifiedDivision;
    }

    // Otherwise, use the default division
    return this.getDefaultDivision(connection);
  }

  /**
   * Resolve division with context - returns division code and helpful context.
   * Use this when you want to provide feedback about automatic division selection.
   */
  protected resolveDivisionWithContext(
    connection: ConnectionInfo,
    specifiedDivision?: number
  ): { division: number | null; autoSelected: boolean; hint?: string } {
    // If a division was explicitly specified, use it
    if (specifiedDivision !== undefined && specifiedDivision !== null) {
      return { division: specifiedDivision, autoSelected: false };
    }

    const info = this.getDivisionInfo(connection);

    if (info.count === 0) {
      return { division: null, autoSelected: false, hint: 'Geen actieve administraties gevonden.' };
    }

    if (info.count === 1) {
      return {
        division: info.divisions[0].code,
        autoSelected: true,
        hint: `Automatisch geselecteerd: ${info.divisions[0].name}`
      };
    }

    // Multiple divisions available
    const defaultDiv = info.divisions.find(d => d.isDefault);
    if (defaultDiv) {
      return {
        division: defaultDiv.code,
        autoSelected: true,
        hint: `Standaard administratie gebruikt: ${defaultDiv.name}. Andere opties: ${info.divisions.filter(d => !d.isDefault).map(d => d.name).join(', ')}`
      };
    }

    // No default set, use first but hint that user can specify
    return {
      division: info.divisions[0].code,
      autoSelected: true,
      hint: `Geen standaard ingesteld. Gebruikte: ${info.divisions[0].name}. Tip: specificeer 'division' parameter of stel een standaard in. Beschikbaar: ${info.divisions.map(d => `${d.name} (${d.code})`).join(', ')}`
    };
  }

  /**
   * Get token status info for the given connection.
   * BUG-006: Added to provide token expiry feedback to users.
   * Can be included in tool responses to warn about expiring tokens.
   */
  protected getTokenStatus(connection: ConnectionInfo): {
    token_expires_in_seconds: number;
    token_is_healthy: boolean;
    token_warning?: string;
  } {
    const now = Date.now();
    const expiresAt = connection.tokenExpiresAt.getTime();
    const expiresInMs = expiresAt - now;
    const expiresInSeconds = Math.round(expiresInMs / 1000);

    // Token is healthy if we have more than the 3-minute refresh buffer
    const bufferMs = 3 * 60 * 1000;
    const isHealthy = expiresInMs > bufferMs;

    // Add warning if token is expiring soon (within 5 minutes)
    const warningThresholdMs = 5 * 60 * 1000;
    let warning: string | undefined;

    if (expiresInMs <= 0) {
      warning = 'Token verlopen. Herauthenticatie vereist.';
    } else if (expiresInMs <= warningThresholdMs && !isHealthy) {
      warning = `Token verloopt over ${expiresInSeconds} seconden. Wordt automatisch vernieuwd.`;
    }

    return {
      token_expires_in_seconds: Math.max(0, expiresInSeconds),
      token_is_healthy: isHealthy,
      ...(warning && { token_warning: warning }),
    };
  }

  /**
   * Get the Exact Online API base URL for a region.
   */
  protected getExactApiUrl(region: string): string {
    const domains: Record<string, string> = {
      NL: 'start.exactonline.nl',
      BE: 'start.exactonline.be',
      DE: 'start.exactonline.de',
      UK: 'start.exactonline.co.uk',
      US: 'start.exactonline.com',
      ES: 'start.exactonline.es',
      FR: 'start.exactonline.fr',
    };

    const domain = domains[region] || domains.NL;
    return `https://${domain}/api/v1`;
  }

  /**
   * Make an authenticated request to the Exact Online API.
   * Automatically refreshes expired tokens using the refresh token.
   * Handles rate limits (429) with Retry-After header support.
   *
   * @see EXACT-002 in operations/ROADMAP.md
   */
  protected async exactRequest<T>(
    connection: ConnectionInfo,
    endpoint: string,
    options?: RequestInit,
    rateLimitRetryCount = 0
  ): Promise<T> {
    // Get a valid access token (refresh if needed)
    let accessToken = connection.accessToken;

    // BUG-006: Check if token is expired or about to expire (within 3 minutes)
    // Increased from 2 to 3 minutes to give more buffer for long-running MCP conversations
    const now = new Date();
    const bufferMs = 3 * 60 * 1000; // 3 minutes buffer
    const needsRefresh = now.getTime() >= connection.tokenExpiresAt.getTime() - bufferMs;

    if (needsRefresh) {
      logger.info('Token expired or expiring soon, fetching fresh tokens from DB', { connectionId: connection.id });

      // P22 FIX: Fetch fresh tokens from DB to avoid stale token issues
      // The cron job may have already refreshed the tokens, so we check DB first
      const freshTokens = await this.getFreshTokens(connection.id);

      if (freshTokens) {
        // Check if DB tokens are still valid (not expired)
        const dbTokenStillValid = freshTokens.tokenExpiresAt.getTime() > now.getTime() + bufferMs;

        if (dbTokenStillValid) {
          // DB has fresh tokens (cron already refreshed), use those
          logger.info('Using fresh tokens from DB (cron already refreshed)', { connectionId: connection.id });
          connection.accessToken = freshTokens.accessToken;
          connection.refreshToken = freshTokens.refreshToken;
          connection.tokenExpiresAt = freshTokens.tokenExpiresAt;
          accessToken = freshTokens.accessToken;
        } else {
          // DB tokens also expired, need to refresh using DB's refresh_token
          logger.info('DB tokens also expired, attempting refresh with fresh refresh_token', { connectionId: connection.id });

          // Update connection with fresh tokens from DB before refreshing
          connection.accessToken = freshTokens.accessToken;
          connection.refreshToken = freshTokens.refreshToken;
          connection.tokenExpiresAt = freshTokens.tokenExpiresAt;

          try {
            accessToken = await this.refreshToken(connection);
          } catch (error) {
            logger.error('Token refresh failed', error instanceof Error ? error : undefined, { connectionId: connection.id });
            await this.markConnectionFailed(connection.id);
            throw new TokenExpiredError();
          }
        }
      } else {
        // Could not fetch from DB, try refresh with current tokens
        logger.warn('Could not fetch fresh tokens from DB, trying with current tokens', { connectionId: connection.id });
        try {
          accessToken = await this.refreshToken(connection);
        } catch (error) {
          logger.error('Token refresh failed', error instanceof Error ? error : undefined, { connectionId: connection.id });
          await this.markConnectionFailed(connection.id);
          throw new TokenExpiredError();
        }
      }
    }

    const apiUrl = this.getExactApiUrl(connection.region);
    const url = `${apiUrl}${endpoint}`;

    // TASK-003: Measure response time for error logging
    const startTime = Date.now();

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Handle rate limiting (429) with Retry-After header
      // @see EXACT-002 in operations/ROADMAP.md
      if (response.status === 429) {
        if (rateLimitRetryCount < MAX_RATE_LIMIT_RETRIES) {
          const retryAfterHeader = response.headers.get('Retry-After');
          // Retry-After can be seconds (integer) or HTTP-date
          // Exact Online typically returns seconds
          let waitMs = DEFAULT_RETRY_WAIT_MS;

          if (retryAfterHeader) {
            const retryAfterSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(retryAfterSeconds)) {
              waitMs = retryAfterSeconds * 1000;
            }
          }

          logger.warn('Rate limited (429), waiting before retry', {
            waitMs,
            retry: rateLimitRetryCount + 1,
            maxRetries: MAX_RATE_LIMIT_RETRIES,
          });

          await sleep(waitMs);
          return this.exactRequest<T>(connection, endpoint, options, rateLimitRetryCount + 1);
        }

        // Max retries exceeded
        logger.error('Rate limit max retries exceeded', undefined, { maxRetries: MAX_RATE_LIMIT_RETRIES, endpoint });
        throw new RateLimitExceededError();
      }

      const errorText = await response.text();

      // TASK-003: Log API errors with timing for debugging
      // Security: NO tokens or personal data logged
      logger.warn('Exact API error', {
        endpoint,
        status: response.status,
        durationMs: Date.now() - startTime,
        error: errorText.substring(0, 200),
      });

      // Check for auth errors (401) - token might be revoked or refresh token expired
      if (response.status === 401) {
        // Try one more refresh in case token was just expired
        if (!needsRefresh) {
          logger.info('Got 401, attempting token refresh');
          try {
            accessToken = await this.refreshToken(connection);

            // Retry the request with new token
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...options?.headers,
              },
            });

            if (retryResponse.ok) {
              this.ctx.waitUntil(this.updateConnectionLastUsed(connection.id));
              return retryResponse.json();
            }
          } catch {
            // Refresh failed, fall through to mark as failed
          }
        }

        await this.markConnectionFailed(connection.id);
        throw new TokenExpiredError();
      }

      // Security: Log detailed error server-side, return generic message to client
      logger.error('Exact API error', undefined, { status: response.status, endpoint, error: errorText.substring(0, 500) });

      // Map common status codes to user-friendly messages (pass endpoint for context-aware messages)
      const userMessage = this.getGenericErrorMessage(response.status, endpoint);
      throw new ExactAPIError(userMessage, response.status);
    }

    // Update last_used_at for successful requests
    this.ctx.waitUntil(this.updateConnectionLastUsed(connection.id));

    return response.json();
  }

  /**
   * Make an authenticated request to the Exact Online API and fetch ALL pages.
   * Automatically follows __next links to retrieve complete datasets.
   * Use this method when you need all results without truncation.
   *
   * @see EXACT-005 in operations/ROADMAP.md - Cursor-based pagination
   */
  protected async fetchAllPages<T>(
    connection: ConnectionInfo,
    endpoint: string,
    options?: RequestInit
  ): Promise<T[]> {
    const results: T[] = [];
    let nextLink: string | undefined = endpoint;

    while (nextLink) {
      // For __next URLs, they are full URLs, not relative endpoints
      const isFullUrl = nextLink.startsWith('http');
      let response: ODataResponse<T>;

      if (isFullUrl) {
        // Direct fetch for __next URLs (already includes auth from exactRequest pattern)
        response = await this.fetchNextPage<T>(connection, nextLink, options);
      } else {
        // Use exactRequest for initial/relative endpoints
        response = await this.exactRequest<ODataResponse<T>>(connection, nextLink, options);
      }

      // Extract results from OData response (handles both standard and Exact Online format)
      // @see P20 in operations/ROADMAP.md
      const pageResults = extractODataResults<T>(response.d as Record<string, unknown> | undefined);
      if (pageResults.length > 0) {
        results.push(...pageResults);
      } else if (response.d && typeof response.d === 'object' && !Array.isArray(response.d)) {
        // Single entity response (not an array, no numeric keys)
        const d = response.d as Record<string, unknown>;
        const hasOnlyMetaKeys = Object.keys(d).every(k => k.startsWith('__'));
        if (!hasOnlyMetaKeys) {
          results.push(response.d as T);
        }
      }

      // Get next page URL if available
      nextLink = response.d?.__next;
    }

    return results;
  }

  /**
   * Fetch a specific page using a full __next URL.
   * Internal helper for fetchAllPages.
   */
  private async fetchNextPage<T>(
    connection: ConnectionInfo,
    fullUrl: string,
    options?: RequestInit
  ): Promise<ODataResponse<T>> {
    // Get a valid access token (refresh if needed)
    let accessToken = connection.accessToken;

    // BUG-006: Check if token is expired or about to expire (within 3 minutes)
    // Increased from 2 to 3 minutes to give more buffer for long-running MCP conversations
    const now = new Date();
    const bufferMs = 3 * 60 * 1000; // 3 minutes buffer
    const needsRefresh = now.getTime() >= connection.tokenExpiresAt.getTime() - bufferMs;

    if (needsRefresh) {
      accessToken = await this.refreshToken(connection);
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Handle rate limiting with retry
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        let waitMs = DEFAULT_RETRY_WAIT_MS;

        if (retryAfterHeader) {
          const retryAfterSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(retryAfterSeconds)) {
            waitMs = retryAfterSeconds * 1000;
          }
        }

        logger.warn('Rate limited on pagination, waiting', { waitMs });
        await sleep(waitMs);
        return this.fetchNextPage<T>(connection, fullUrl, options);
      }

      const errorText = await response.text();
      logger.error('Pagination fetch error', undefined, { status: response.status, url: fullUrl, error: errorText.substring(0, 200) });
      throw new ExactAPIError(this.getGenericErrorMessage(response.status, fullUrl), response.status);
    }

    return response.json();
  }

  /**
   * Refresh the access token using the refresh token
   */
  protected async refreshToken(connection: ConnectionInfo): Promise<string> {
    const tokenUrls: Record<string, string> = {
      NL: 'https://start.exactonline.nl/api/oauth2/token',
      BE: 'https://start.exactonline.be/api/oauth2/token',
      DE: 'https://start.exactonline.de/api/oauth2/token',
      UK: 'https://start.exactonline.co.uk/api/oauth2/token',
      US: 'https://start.exactonline.com/api/oauth2/token',
      ES: 'https://start.exactonline.es/api/oauth2/token',
      FR: 'https://start.exactonline.fr/api/oauth2/token',
    };

    const tokenUrl = tokenUrls[connection.region] || tokenUrls.NL;

    if (!this.env.EXACT_CLIENT_ID || !this.env.EXACT_CLIENT_SECRET) {
      throw new Error('EXACT_CLIENT_ID or EXACT_CLIENT_SECRET not configured');
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
        client_id: this.env.EXACT_CLIENT_ID,
        client_secret: this.env.EXACT_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Token refresh API error', undefined, { status: response.status, error: errorText.substring(0, 200) });
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Calculate new expiry time for access token
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Calculate refresh token expiry (30 days from now)
    // @see EXACT-003 in operations/ROADMAP.md
    // @see docs/knowledge/exact/VERSION.md - Refresh token validity: 30 days
    const REFRESH_TOKEN_VALIDITY_DAYS = 30;
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    // Encrypt tokens before storing (if encryption key is available)
    let accessTokenToStore = data.access_token;
    let refreshTokenToStore = data.refresh_token;

    if (this.env.TOKEN_ENCRYPTION_KEY) {
      accessTokenToStore = await encryptToken(data.access_token, this.env.TOKEN_ENCRYPTION_KEY);
      refreshTokenToStore = await encryptToken(data.refresh_token, this.env.TOKEN_ENCRYPTION_KEY);
    }

    // Update tokens in database including refresh token expiry
    await this.env.DB.prepare(`
      UPDATE connections
      SET access_token = ?,
          refresh_token = ?,
          token_expires_at = ?,
          refresh_token_expires_at = ?,
          status = 'active',
          expiry_alert_sent = 0
      WHERE id = ?
    `).bind(
      accessTokenToStore,
      refreshTokenToStore,
      expiresAt.toISOString(),
      refreshTokenExpiresAt.toISOString(),
      connection.id
    ).run();

    logger.info('Token refreshed successfully', { connectionId: connection.id });

    // Update the connection object in memory too
    connection.accessToken = data.access_token;
    connection.refreshToken = data.refresh_token;
    connection.tokenExpiresAt = expiresAt;

    return data.access_token;
  }

  /**
   * Mark a connection as failed (requires re-authentication)
   */
  protected async markConnectionFailed(connectionId: string): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE connections
        SET status = 'refresh_failed', expiry_alert_sent = 0
        WHERE id = ?
      `).bind(connectionId).run();

      logger.warn('Marked connection as refresh_failed', { connectionId });
    } catch (error) {
      logger.error('Failed to mark connection as failed', error instanceof Error ? error : undefined, { connectionId });
    }
  }

  /**
   * Fetch fresh tokens from DB to avoid stale token issues
   *
   * This is crucial when cron has refreshed tokens but the in-memory
   * connection object still has old tokens. Without this, the MCP session
   * would try to use an already-used refresh_token and fail.
   *
   * @see P22 handover - "30-min disconnect issue"
   */
  protected async getFreshTokens(connectionId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
  } | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT access_token, refresh_token, token_expires_at
        FROM connections
        WHERE id = ? AND status = 'active'
      `).bind(connectionId).first<{
        access_token: string;
        refresh_token: string;
        token_expires_at: string;
      }>();

      if (!result) {
        logger.warn('Connection not found or not active', { connectionId });
        return null;
      }

      // Decrypt tokens if encrypted
      let accessToken = result.access_token;
      let refreshToken = result.refresh_token;

      if (this.env.TOKEN_ENCRYPTION_KEY) {
        if (isEncrypted(accessToken)) {
          accessToken = await decryptToken(accessToken, this.env.TOKEN_ENCRYPTION_KEY);
        }
        if (isEncrypted(refreshToken)) {
          refreshToken = await decryptToken(refreshToken, this.env.TOKEN_ENCRYPTION_KEY);
        }
      }

      return {
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(result.token_expires_at),
      };
    } catch (error) {
      logger.error('Failed to fetch fresh tokens', error instanceof Error ? error : undefined, { connectionId });
      return null;
    }
  }

  /**
   * Update the last_used_at timestamp for a connection
   */
  protected async updateConnectionLastUsed(connectionId: string): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE connections
        SET last_used_at = datetime('now'), inactivity_alert_sent = 0
        WHERE id = ?
      `).bind(connectionId).run();
    } catch (error) {
      logger.error('Failed to update last_used_at', error instanceof Error ? error : undefined, { connectionId });
    }
  }

  /**
   * Get a generic, user-friendly error message for an HTTP status code.
   * Security: detailed API errors are logged server-side only.
   */
  protected getGenericErrorMessage(statusCode: number, endpoint?: string): string {
    switch (statusCode) {
      case 400:
        return 'Ongeldige request naar Exact Online API. Controleer de parameters.';
      case 403:
        return this.getAccessDeniedMessage(endpoint);
      case 404:
        return this.getNotFoundMessage(endpoint);
      case 429:
        return 'Rate limit bereikt. Probeer het over enkele minuten opnieuw.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Exact Online is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
      default:
        return `Exact Online API fout (status ${statusCode}). Probeer het opnieuw.`;
    }
  }

  /**
   * Get a helpful error message for Access Denied (403) errors.
   * Maps endpoints to required Exact Online modules.
   */
  protected getAccessDeniedMessage(endpoint?: string): string {
    const baseMessage = 'Toegang geweigerd door Exact Online.';

    if (!endpoint) {
      return `${baseMessage} Controleer of je de juiste rechten hebt in Exact Online.`;
    }

    // Map endpoint patterns to required modules
    const moduleMap: Record<string, { module: string; nl: string }> = {
      '/project/': { module: 'Project Management', nl: 'Projectbeheer' },
      '/salesorder/': { module: 'Sales Orders', nl: 'Verkooporders' },
      '/purchaseorder/': { module: 'Purchase Orders', nl: 'Inkooporders' },
      '/crm/Quotations': { module: 'Quotations', nl: 'Offertes' },
      '/project/TimeTransactions': { module: 'Time & Billing', nl: 'Uren & Facturatie' },
      '/hrm/': { module: 'HRM', nl: 'Personeelsbeheer' },
      '/manufacturing/': { module: 'Manufacturing', nl: 'Productie' },
      '/subscription/': { module: 'Subscription', nl: 'Abonnementen' },
    };

    for (const [pattern, info] of Object.entries(moduleMap)) {
      if (endpoint.includes(pattern)) {
        return `${baseMessage}\n\n` +
          `📋 Mogelijke oorzaak: De module "${info.nl}" (${info.module}) is niet actief in deze Exact Online administratie.\n\n` +
          `💡 Oplossing: Vraag je accountant of Exact Online beheerder om deze module te activeren, ` +
          `of controleer of de app "Praat met je Boekhouding" toegang heeft tot deze module.`;
      }
    }

    return `${baseMessage} Je hebt mogelijk geen rechten voor deze functie. ` +
      `Controleer de app-machtigingen in Exact Online → Mijn Exact → Apps.`;
  }

  /**
   * Get a helpful error message for Not Found (404) errors.
   */
  protected getNotFoundMessage(endpoint?: string): string {
    const baseMessage = 'De gevraagde gegevens zijn niet gevonden in Exact Online.';

    if (!endpoint) {
      return baseMessage;
    }

    // Check for common "not found" scenarios
    if (endpoint.includes('/hrm/Costcenters') || endpoint.includes('/hrm/CostCenters')) {
      return `${baseMessage}\n\n` +
        `📋 Mogelijke oorzaak: Er zijn geen kostenplaatsen ingesteld in deze administratie.\n\n` +
        `💡 Oplossing: Stel kostenplaatsen in via Exact Online → Stamgegevens → Kostenplaatsen.`;
    }

    if (endpoint.includes('/general/Currencies')) {
      return `${baseMessage}\n\n` +
        `📋 Mogelijke oorzaak: Multi-currency is niet geactiveerd of er zijn geen extra valuta ingesteld.\n\n` +
        `💡 Oplossing: Activeer multi-currency in Exact Online indien nodig.`;
    }

    return baseMessage;
  }
}

/**
 * OData response wrapper type for Exact Online API responses.
 * @see EXACT-005 in operations/ROADMAP.md - Cursor-based pagination
 */
interface ODataResponse<T> {
  d?: {
    results?: T[];
    __next?: string;
  } & T;
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

export class ExactAPIError extends Error {
  statusCode: number;
  exactCode?: string;

  constructor(message: string, statusCode: number, exactCode?: string) {
    super(message);
    this.name = 'ExactAPIError';
    this.statusCode = statusCode;
    this.exactCode = exactCode;
  }
}

export class TokenExpiredError extends Error {
  constructor() {
    super(
      'Sessie verlopen. Token vernieuwen is mislukt.\n\n' +
      'Mogelijke oorzaken:\n' +
      '• Refresh token verlopen (na 30 dagen inactiviteit)\n' +
      '• Exact Online autorisatie ingetrokken\n\n' +
      'Oplossing: Ga naar https://praatmetjeboekhouding.nl/connect om opnieuw te verbinden.'
    );
    this.name = 'TokenExpiredError';
  }
}

/**
 * Rate limit exceeded after max retries
 * @see EXACT-002 in operations/ROADMAP.md
 */
export class RateLimitExceededError extends Error {
  constructor() {
    super(
      'Exact Online API rate limit exceeded. The system has automatically retried but the limit persists. Please try again in a few minutes.'
    );
    this.name = 'RateLimitExceededError';
  }
}
