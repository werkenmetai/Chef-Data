/**
 * OAuth Auth Context Resolution for MCP Server
 *
 * Given an OAuth user ID, retrieves the user's default Exact Online division
 * and associated credentials. Used to convert OAuth authentication into
 * the AuthContext needed for Exact API calls.
 *
 * @see P22 handover: operations/handovers/P22-single-url-oauth.md
 * @see Migration: apps/auth-portal/migrations/0016_user_divisions.sql
 */

import { Env } from '../types';
import { logger } from '../lib/logger';
import { decryptToken, isEncrypted } from '../lib/crypto';
import { AuthContext, fetchUserConnections } from './api-key';

/**
 * Result when no division is linked to the OAuth user
 */
export interface NoDivisionResult {
  success: false;
  error: 'no_division_linked' | 'connection_not_found' | 'decryption_failed';
  message: string;
}

/**
 * Result when auth context is successfully retrieved
 */
export interface AuthContextResult {
  success: true;
  authContext: AuthContext;
}

/**
 * Get AuthContext from an OAuth user ID
 *
 * Looks up the user's default division via the user_divisions table,
 * joins with connections to get the Exact Online access/refresh tokens.
 *
 * @param userId - The OAuth user ID from oauth_tokens table
 * @param env - Cloudflare Worker environment with D1 database
 * @returns AuthContext with Exact credentials or error if not linked
 *
 * @example
 * ```typescript
 * const oauthResult = await validateOAuthBearerToken(request, env);
 * if (!oauthResult.valid) return unauthorized();
 *
 * const contextResult = await getAuthContextFromOAuth(oauthResult.userId!, env);
 * if (!contextResult.success) {
 *   return new Response(JSON.stringify({
 *     error: 'no_division',
 *     error_description: contextResult.message,
 *   }), { status: 403 });
 * }
 *
 * // Use contextResult.authContext for MCP operations
 * ```
 */
export async function getAuthContextFromOAuth(
  userId: string,
  env: Env
): Promise<AuthContextResult | NoDivisionResult> {
  // First, get user info (email, plan) for the AuthContext
  const user = await env.DB.prepare(`
    SELECT id, email, plan
    FROM users
    WHERE id = ?
  `).bind(userId).first<{
    id: string;
    email: string;
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
  }>();

  if (!user) {
    logger.warn('OAuth context: User not found', { userId });
    return {
      success: false,
      error: 'no_division_linked',
      message: 'User account not found',
    };
  }

  // Query user_divisions to find the default division for this OAuth user
  // Join with connections to get the Exact tokens
  const userDiv = await env.DB.prepare(`
    SELECT
      ud.id as user_division_id,
      ud.connection_id,
      ud.division_code,
      ud.division_name,
      c.access_token,
      c.refresh_token,
      c.token_expires_at,
      c.region
    FROM user_divisions ud
    JOIN connections c ON ud.connection_id = c.id
    WHERE ud.oauth_user_id = ?
      AND ud.is_default = true
    LIMIT 1
  `).bind(userId).first<{
    user_division_id: string;
    connection_id: string;
    division_code: string;
    division_name: string | null;
    access_token: string;
    refresh_token: string;
    token_expires_at: string;
    region: string;
  }>();

  if (!userDiv) {
    // Check if user has ANY divisions (just not a default one)
    const anyDiv = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM user_divisions
      WHERE oauth_user_id = ?
    `).bind(userId).first<{ count: number }>();

    if (anyDiv && anyDiv.count > 0) {
      logger.warn('OAuth context: User has divisions but no default set', {
        userId,
        divisionCount: anyDiv.count,
      });
      return {
        success: false,
        error: 'no_division_linked',
        message: 'No default division set. Please select a default division.',
      };
    }

    logger.warn('OAuth context: No division found for OAuth user', { userId });
    return {
      success: false,
      error: 'no_division_linked',
      message: 'No Exact Online division linked to this account. Please connect your Exact Online administration.',
    };
  }

  // Validate tokens can be decrypted (early failure if corrupted)
  // Note: fetchUserConnections handles actual decryption for the AuthContext
  if (env.TOKEN_ENCRYPTION_KEY) {
    try {
      if (isEncrypted(userDiv.access_token)) {
        await decryptToken(userDiv.access_token, env.TOKEN_ENCRYPTION_KEY);
      }
      if (isEncrypted(userDiv.refresh_token)) {
        await decryptToken(userDiv.refresh_token, env.TOKEN_ENCRYPTION_KEY);
      }
    } catch (error) {
      logger.error('OAuth context: Failed to decrypt tokens', error instanceof Error ? error : undefined, {
        userId,
        connectionId: userDiv.connection_id,
      });
      return {
        success: false,
        error: 'decryption_failed',
        message: 'Failed to decrypt Exact Online credentials. Please reconnect your administration.',
      };
    }
  }

  // Fetch all connections for this user (for full AuthContext compatibility)
  const connections = await fetchUserConnections(userId, env);

  // Build the AuthContext
  // Note: For MCP operations, the primary division is set as the default
  const authContext: AuthContext = {
    userId: user.id,
    email: user.email,
    plan: user.plan,
    apiKeyId: `oauth_${userId}`, // Virtual API key ID for OAuth auth
    connections,
  };

  logger.info('OAuth context: Successfully resolved auth context', {
    userId,
    divisionCode: userDiv.division_code,
    connectionId: userDiv.connection_id,
  });

  return {
    success: true,
    authContext,
  };
}

/**
 * Get all divisions linked to an OAuth user (for division selector)
 *
 * @param userId - The OAuth user ID
 * @param env - Cloudflare Worker environment
 * @returns Array of linked divisions with their details
 */
export async function getOAuthUserDivisions(
  userId: string,
  env: Env
): Promise<Array<{
  id: string;
  divisionCode: string;
  divisionName: string | null;
  isDefault: boolean;
  connectionId: string;
}>> {
  const result = await env.DB.prepare(`
    SELECT
      ud.id,
      ud.division_code,
      ud.division_name,
      ud.is_default,
      ud.connection_id
    FROM user_divisions ud
    WHERE ud.oauth_user_id = ?
    ORDER BY ud.is_default DESC, ud.division_name ASC
  `).bind(userId).all<{
    id: string;
    division_code: string;
    division_name: string | null;
    is_default: number;
    connection_id: string;
  }>();

  return (result.results || []).map((row) => ({
    id: row.id,
    divisionCode: row.division_code,
    divisionName: row.division_name,
    isDefault: Boolean(row.is_default),
    connectionId: row.connection_id,
  }));
}

/**
 * Set the default division for an OAuth user
 *
 * @param userId - The OAuth user ID
 * @param divisionId - The user_divisions.id to set as default
 * @param env - Cloudflare Worker environment
 * @returns True if successful
 */
export async function setOAuthUserDefaultDivision(
  userId: string,
  divisionId: string,
  env: Env
): Promise<boolean> {
  // First, verify the division belongs to this user
  const div = await env.DB.prepare(`
    SELECT id FROM user_divisions
    WHERE id = ? AND oauth_user_id = ?
  `).bind(divisionId, userId).first();

  if (!div) {
    logger.warn('OAuth context: Cannot set default - division not found or not owned', {
      userId,
      divisionId,
    });
    return false;
  }

  // Clear all defaults for this user
  await env.DB.prepare(`
    UPDATE user_divisions
    SET is_default = false
    WHERE oauth_user_id = ?
  `).bind(userId).run();

  // Set the new default
  await env.DB.prepare(`
    UPDATE user_divisions
    SET is_default = true
    WHERE id = ?
  `).bind(divisionId).run();

  logger.info('OAuth context: Default division updated', {
    userId,
    divisionId,
  });

  return true;
}
