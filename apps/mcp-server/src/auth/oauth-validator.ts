/**
 * OAuth Bearer Token Validation for MCP Server
 *
 * Validates OAuth access tokens from the Authorization header and returns
 * user context information. Used for the single /mcp endpoint to identify
 * users authenticated via OAuth instead of token-in-URL.
 *
 * @see P22 handover: operations/handovers/P22-single-url-oauth.md
 */

import { Env } from '../types';
import { logger } from '../lib/logger';

/**
 * Result of OAuth token validation
 */
export interface OAuthValidationResult {
  /** Whether the token is valid */
  valid: boolean;
  /** User ID from oauth_tokens table (if valid) */
  userId?: string;
  /** Client ID that issued the token (if valid) */
  clientId?: string;
  /** Granted scope (if valid) */
  scope?: string;
  /** Error code if validation failed */
  error?: 'missing_token' | 'invalid_format' | 'invalid_token' | 'token_revoked' | 'token_expired';
}

/**
 * Hash a token using SHA-256 for secure lookup in database
 * Tokens are stored as hashes in oauth_tokens table
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate an OAuth Bearer token from the Authorization header
 *
 * @param request - The incoming HTTP request
 * @param env - Cloudflare Worker environment with D1 database
 * @returns Validation result with user info if valid, error code if not
 *
 * @example
 * ```typescript
 * const result = await validateOAuthBearerToken(request, env);
 * if (!result.valid) {
 *   return new Response(JSON.stringify({
 *     error: 'unauthorized',
 *     error_description: result.error,
 *   }), { status: 401 });
 * }
 * // Use result.userId to get auth context
 * ```
 */
export async function validateOAuthBearerToken(
  request: Request,
  env: Env
): Promise<OAuthValidationResult> {
  // Extract Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    logger.info('OAuth validation: No Authorization header');
    return { valid: false, error: 'missing_token' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    logger.info('OAuth validation: Invalid Authorization header format');
    return { valid: false, error: 'invalid_format' };
  }

  // Extract the token
  const token = authHeader.slice(7).trim();

  if (!token) {
    logger.info('OAuth validation: Empty token');
    return { valid: false, error: 'missing_token' };
  }

  // Validate token format (our tokens start with mcp_at_)
  if (!token.startsWith('mcp_at_')) {
    logger.info('OAuth validation: Invalid token format', { prefix: token.substring(0, 7) });
    return { valid: false, error: 'invalid_format' };
  }

  // Hash token for secure lookup
  const tokenHash = await hashToken(token);

  // Look up token in database
  const result = await env.DB.prepare(`
    SELECT user_id, client_id, scope, access_token_expires_at, revoked_at
    FROM oauth_tokens
    WHERE access_token_hash = ?
  `).bind(tokenHash).first<{
    user_id: string;
    client_id: string;
    scope: string | null;
    access_token_expires_at: string;
    revoked_at: string | null;
  }>();

  if (!result) {
    logger.warn('OAuth validation: Token not found in database');
    return { valid: false, error: 'invalid_token' };
  }

  // Check if token has been revoked
  if (result.revoked_at) {
    logger.warn('OAuth validation: Token has been revoked', {
      userId: result.user_id,
      revokedAt: result.revoked_at,
    });
    return { valid: false, error: 'token_revoked' };
  }

  // Check if token has expired
  const expiresAt = new Date(result.access_token_expires_at);
  if (expiresAt < new Date()) {
    logger.info('OAuth validation: Token has expired', {
      userId: result.user_id,
      expiredAt: result.access_token_expires_at,
    });
    return { valid: false, error: 'token_expired' };
  }

  logger.info('OAuth validation: Token valid', {
    userId: result.user_id,
    clientId: result.client_id,
  });

  return {
    valid: true,
    userId: result.user_id,
    clientId: result.client_id,
    scope: result.scope || undefined,
  };
}
