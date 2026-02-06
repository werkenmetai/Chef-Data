/**
 * API Key Authentication
 *
 * Validates API keys and returns the associated user context.
 * Handles decryption of tokens stored encrypted in the database.
 *
 * Security features:
 * - PBKDF2 with salt for new API keys (100,000 iterations)
 * - Backward compatible with legacy SHA-256 hashes
 * - Constant-time comparison to prevent timing attacks
 */

import { Env } from '../types';
import { decryptToken, isEncrypted } from '../lib/crypto';
import { logger } from '../lib/logger';
import { PLAN_LIMITS, type PlanType } from '@exact-mcp/shared';

export interface AuthContext {
  userId: string;
  email: string;
  plan: PlanType;
  apiKeyId: string;
  connections: ConnectionInfo[];
  isDemoMode?: boolean; // True when using demo API key (exa_demo*)
}

export interface ConnectionInfo {
  id: string;
  region: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  divisions: DivisionInfo[];
}

export interface DivisionInfo {
  code: number;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Legacy SHA-256 hash (for backward compatibility with existing keys)
 */
async function hashApiKeyLegacy(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify API key against stored hash (supports both legacy SHA-256 and secure PBKDF2 formats)
 * Legacy format: 64-char hex string (SHA-256)
 * Secure format: pbkdf2$<salt_hex>$<hash_hex> (PBKDF2 with salt)
 */
async function verifyApiKeyHash(key: string, storedHash: string): Promise<boolean> {
  // Check if it's a PBKDF2 hash (new secure format)
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;

    const [, saltHex, expectedHashHex] = parts;
    if (!saltHex || !expectedHashHex) return false;

    // Reconstruct salt from hex
    const saltMatch = saltHex.match(/.{2}/g);
    if (!saltMatch) return false;
    const salt = new Uint8Array(saltMatch.map(byte => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Constant-time comparison to prevent timing attacks
    return constantTimeEqual(hashHex, expectedHashHex);
  }

  // Legacy SHA-256 format (backward compatibility)
  const legacyHash = await hashApiKeyLegacy(key);
  return constantTimeEqual(legacyHash, storedHash);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extract API key from Authorization header
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  // Support "Bearer <key>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // Support raw key format
  return authHeader.trim();
}

/**
 * Result from authenticateRequest including optional background task
 */
export interface AuthResult {
  authContext: AuthContext;
  backgroundTask?: () => Promise<D1Result>;
}

/**
 * Authenticate request and return user context
 * Uses optimized queries while supporting both legacy and PBKDF2 hashed keys
 * @param request - The HTTP request
 * @param env - Environment bindings
 * @param providedKey - Optional pre-extracted API key (from URL path or query)
 * @returns AuthResult with authContext and optional background task for non-blocking updates
 */
export async function authenticateRequest(
  request: Request,
  env: Env,
  providedKey?: string
): Promise<AuthResult | null> {
  const apiKey = providedKey || extractApiKey(request);
  if (!apiKey) return null;

  // Validate API key format (exa_...)
  if (!apiKey.startsWith('exa_')) return null;

  // Extract prefix from key (first 12 chars: "exa_" + 8 chars)
  const keyPrefix = apiKey.substring(0, 12);

  // Step 1: Find candidate keys by prefix (for PBKDF2 we can't search by hash directly)
  const candidates = await env.DB.prepare(`
    SELECT
      ak.id as api_key_id,
      ak.user_id,
      ak.key_hash,
      u.email,
      u.plan
    FROM api_keys ak
    JOIN users u ON ak.user_id = u.id
    WHERE ak.key_prefix = ? AND ak.revoked_at IS NULL
  `).bind(keyPrefix).all<{
    api_key_id: string;
    user_id: string;
    key_hash: string;
    email: string;
    plan: PlanType;
  }>();

  if (!candidates.results || candidates.results.length === 0) return null;

  // Step 2: Verify the key against each candidate hash (supports both legacy SHA-256 and PBKDF2)
  let validatedKey: {
    api_key_id: string;
    user_id: string;
    email: string;
    plan: PlanType;
  } | null = null;

  for (const candidate of candidates.results) {
    const isValid = await verifyApiKeyHash(apiKey, candidate.key_hash);
    if (isValid) {
      validatedKey = {
        api_key_id: candidate.api_key_id,
        user_id: candidate.user_id,
        email: candidate.email,
        plan: candidate.plan,
      };
      break;
    }
  }

  if (!validatedKey) return null;

  // Step 3: Fetch connections with divisions using optimized JOIN query
  const connections = await fetchUserConnections(validatedKey.user_id, env);

  const authContext: AuthContext = {
    userId: validatedKey.user_id,
    email: validatedKey.email,
    plan: validatedKey.plan,
    apiKeyId: validatedKey.api_key_id,
    connections,
  };

  // Return background task for non-blocking last_used_at update
  // Caller should use ctx.waitUntil(backgroundTask()) for fire-and-forget execution
  return {
    authContext,
    backgroundTask: () => env.DB.prepare(
      `UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`
    ).bind(validatedKey!.api_key_id).run(),
  };
}

/**
 * Check if user has exceeded their rate limit
 */
export async function checkRateLimit(
  authContext: AuthContext,
  env: Env
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Use shared PLAN_LIMITS as single source of truth
  const limit = PLAN_LIMITS[authContext.plan as PlanType].apiCalls;
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  // Get current month's usage
  const usageResult = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM api_usage
    WHERE user_id = ?
    AND timestamp > date('now', 'start of month')
  `).bind(authContext.userId).first<{ count: number }>();

  const used = usageResult?.count || 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    remaining,
    limit,
  };
}

/**
 * Track API usage with enhanced audit logging
 */
export async function trackApiUsage(
  authContext: AuthContext,
  endpoint: string,
  divisionCode: number | null,
  responseStatus: number,
  env: Env,
  request?: Request,
  responseTimeMs?: number
): Promise<void> {
  // Extract client IP and user-agent for audit logging
  const clientIp = request?.headers.get('CF-Connecting-IP') ||
                   request?.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                   null;
  const userAgent = request?.headers.get('User-Agent') || null;
  const requestId = request?.headers.get('CF-Ray') || crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO api_usage (
      user_id, api_key_id, endpoint, division_code, response_status,
      client_ip, user_agent, request_id, response_time_ms, timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    authContext.userId,
    authContext.apiKeyId,
    endpoint,
    divisionCode,
    responseStatus,
    clientIp,
    userAgent,
    requestId,
    responseTimeMs || null
  ).run();
}

/**
 * Fetch user connections with divisions using a single JOIN query
 * Shared helper to avoid N+1 queries in both API key and OAuth authentication
 * @param userId - The user ID to fetch connections for
 * @param env - Environment bindings
 * @returns Array of ConnectionInfo with decrypted tokens
 */
export async function fetchUserConnections(
  userId: string,
  env: Env
): Promise<ConnectionInfo[]> {
  // SINGLE QUERY - fetch connections and ACTIVE divisions with JOINs
  // Only active divisions (is_active = 1) are returned to the MCP server
  const result = await env.DB.prepare(`
    SELECT
      c.id as connection_id,
      c.region,
      c.access_token,
      c.refresh_token,
      c.token_expires_at,
      d.division_code,
      d.division_name,
      d.is_default,
      d.is_active
    FROM connections c
    LEFT JOIN divisions d ON d.connection_id = c.id AND d.is_active = 1
    WHERE c.user_id = ?
    ORDER BY c.id, d.division_code
  `).bind(userId).all<{
    connection_id: string;
    region: string;
    access_token: string;
    refresh_token: string;
    token_expires_at: string;
    division_code: number | null;
    division_name: string | null;
    is_default: number | null;
    is_active: number | null;
  }>();

  // Build connections map from flat results (in-memory grouping)
  const connectionsMap = new Map<string, {
    id: string;
    region: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: string;
    divisions: DivisionInfo[];
  }>();

  for (const row of result.results || []) {
    if (!connectionsMap.has(row.connection_id)) {
      connectionsMap.set(row.connection_id, {
        id: row.connection_id,
        region: row.region,
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        tokenExpiresAt: row.token_expires_at,
        divisions: [],
      });
    }

    if (row.division_code !== null) {
      const conn = connectionsMap.get(row.connection_id)!;
      if (!conn.divisions.some(d => d.code === row.division_code)) {
        conn.divisions.push({
          code: row.division_code,
          name: row.division_name || '',
          isDefault: Boolean(row.is_default),
          isActive: Boolean(row.is_active),
        });
      }
    }
  }

  // Decrypt tokens if encryption is enabled
  const connections: ConnectionInfo[] = [];
  for (const conn of connectionsMap.values()) {
    let accessToken = conn.accessToken;
    let refreshToken = conn.refreshToken;

    if (env.TOKEN_ENCRYPTION_KEY) {
      try {
        if (isEncrypted(conn.accessToken)) {
          accessToken = await decryptToken(conn.accessToken, env.TOKEN_ENCRYPTION_KEY);
        }
        if (isEncrypted(conn.refreshToken)) {
          refreshToken = await decryptToken(conn.refreshToken, env.TOKEN_ENCRYPTION_KEY);
        }
      } catch (error) {
        logger.error('Failed to decrypt tokens for connection', error instanceof Error ? error : undefined, { connectionId: conn.id });
        continue;
      }
    }

    connections.push({
      id: conn.id,
      region: conn.region,
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(conn.tokenExpiresAt),
      divisions: conn.divisions,
    });
  }

  return connections;
}

/**
 * Log a security event (failed auth, rate limiting, etc.)
 */
export async function logSecurityEvent(
  eventType: 'invalid_api_key' | 'rate_limit_exceeded' | 'token_refresh_failed' |
             'suspicious_activity' | 'auth_failure' | 'permission_denied',
  env: Env,
  request?: Request,
  details?: {
    userId?: string;
    apiKeyId?: string;
    message?: string;
    [key: string]: unknown;
  }
): Promise<void> {
  const clientIp = request?.headers.get('CF-Connecting-IP') ||
                   request?.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                   null;
  const userAgent = request?.headers.get('User-Agent') || null;

  try {
    await env.DB.prepare(`
      INSERT INTO security_events (
        event_type, user_id, api_key_id, client_ip, user_agent, details, timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      eventType,
      details?.userId || null,
      details?.apiKeyId || null,
      clientIp,
      userAgent,
      details ? JSON.stringify(details) : null
    ).run();
  } catch (error) {
    // Don't let logging errors break the main flow
    logger.error('Failed to log security event', error instanceof Error ? error : undefined, { eventType });
  }
}
