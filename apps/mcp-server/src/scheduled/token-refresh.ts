/**
 * Proactive Token Refresh Scheduled Handler
 *
 * P15-CRON: Runs every 5 minutes to proactively refresh tokens that are
 * about to expire. This prevents UX issues where tokens expire during
 * active conversations.
 *
 * Features:
 * - Refreshes tokens expiring within 10 minutes
 * - Only processes active users (used within last 24 hours)
 * - DB-level locking prevents race conditions across worker instances
 * - Encrypted token storage
 *
 * @see docs/knowledge/exact/VERSION.md for token validity periods
 */

import { Env } from '../types';
import { encryptToken, decryptToken, isEncrypted } from '../lib/crypto';
import { Logger } from '../lib/logger';

const logger = new Logger('token-refresh-cron');

/**
 * Connection record from database
 */
interface ConnectionRecord {
  id: string;
  user_id: string;
  region: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  refresh_token_expires_at: string | null;
  last_used_at: string | null;
  status: string;
  retry_count: number;
  next_retry_at: string | null;
}

/**
 * Exponential backoff intervals in minutes for retry attempts
 * Retry 1: 5 min, Retry 2: 15 min, Retry 3: 60 min, Retry 4: 360 min (6h), Retry 5: 1440 min (24h)
 */
const RETRY_BACKOFF_MINUTES = [5, 15, 60, 360, 1440];
const MAX_RETRY_COUNT = 5;

/**
 * Token refresh response from Exact Online OAuth
 */
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Get the OAuth token URL for a region
 */
function getTokenUrl(region: string): string {
  const tokenUrls: Record<string, string> = {
    NL: 'https://start.exactonline.nl/api/oauth2/token',
    BE: 'https://start.exactonline.be/api/oauth2/token',
    DE: 'https://start.exactonline.de/api/oauth2/token',
    UK: 'https://start.exactonline.co.uk/api/oauth2/token',
    US: 'https://start.exactonline.com/api/oauth2/token',
    ES: 'https://start.exactonline.es/api/oauth2/token',
    FR: 'https://start.exactonline.fr/api/oauth2/token',
  };

  return tokenUrls[region] || tokenUrls.NL;
}

/**
 * Refresh a single connection's token
 * Returns true if successful, false otherwise
 */
async function refreshConnectionToken(
  connection: ConnectionRecord,
  env: Env
): Promise<boolean> {
  const tokenUrl = getTokenUrl(connection.region);

  if (!env.EXACT_CLIENT_ID || !env.EXACT_CLIENT_SECRET) {
    logger.error('Missing EXACT_CLIENT_ID or EXACT_CLIENT_SECRET', undefined, {
      connectionId: connection.id,
    });
    return false;
  }

  try {
    // Decrypt refresh token if encrypted
    let refreshToken = connection.refresh_token;
    if (env.TOKEN_ENCRYPTION_KEY && isEncrypted(refreshToken)) {
      refreshToken = await decryptToken(refreshToken, env.TOKEN_ENCRYPTION_KEY);
    }

    // Call Exact Online OAuth to refresh token
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.EXACT_CLIENT_ID,
        client_secret: env.EXACT_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Token refresh API failed', undefined, {
        connectionId: connection.id,
        status: response.status,
        error: errorText.substring(0, 200),
      });

      // Handle failed refresh with retry mechanism
      if (response.status === 400 || response.status === 401) {
        const newRetryCount = (connection.retry_count || 0) + 1;
        const refreshTokenExpired = connection.refresh_token_expires_at
          ? new Date(connection.refresh_token_expires_at) < new Date()
          : false;

        // Terminal failure: max retries exceeded OR refresh token expired
        if (newRetryCount > MAX_RETRY_COUNT || refreshTokenExpired) {
          await env.DB.prepare(`
            UPDATE connections
            SET
              status = 'refresh_failed',
              retry_count = ?,
              last_retry_error = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            newRetryCount,
            `Terminal failure after ${newRetryCount} attempts: ${errorText.substring(0, 100)}`,
            connection.id
          ).run();

          logger.error('Token refresh terminal failure', undefined, {
            connectionId: connection.id,
            retryCount: newRetryCount,
            refreshTokenExpired,
          });
        } else {
          // Schedule retry with exponential backoff
          const backoffMinutes = RETRY_BACKOFF_MINUTES[Math.min(newRetryCount - 1, RETRY_BACKOFF_MINUTES.length - 1)];

          await env.DB.prepare(`
            UPDATE connections
            SET
              status = 'retry_pending',
              retry_count = ?,
              next_retry_at = datetime('now', '+' || ? || ' minutes'),
              last_retry_error = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            newRetryCount,
            backoffMinutes,
            `Attempt ${newRetryCount} failed: ${errorText.substring(0, 100)}`,
            connection.id
          ).run();

          logger.info('Token refresh scheduled for retry', {
            connectionId: connection.id,
            retryCount: newRetryCount,
            nextRetryMinutes: backoffMinutes,
          });
        }
      }

      return false;
    }

    const data = await response.json() as TokenResponse;

    // Calculate expiry times
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    const REFRESH_TOKEN_VALIDITY_DAYS = 30;
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000
    );

    // Encrypt tokens before storing
    let accessTokenToStore = data.access_token;
    let refreshTokenToStore = data.refresh_token;

    if (env.TOKEN_ENCRYPTION_KEY) {
      accessTokenToStore = await encryptToken(data.access_token, env.TOKEN_ENCRYPTION_KEY);
      refreshTokenToStore = await encryptToken(data.refresh_token, env.TOKEN_ENCRYPTION_KEY);
    }

    // DB-level atomic update with optimistic locking
    // Only update if token_expires_at hasn't changed (prevents race conditions)
    // Also reset retry counters on successful refresh
    const updateResult = await env.DB.prepare(`
      UPDATE connections
      SET
        access_token = ?,
        refresh_token = ?,
        token_expires_at = ?,
        refresh_token_expires_at = ?,
        status = 'active',
        updated_at = datetime('now'),
        expiry_alert_sent = 0,
        retry_count = 0,
        next_retry_at = NULL,
        last_retry_error = NULL
      WHERE id = ?
        AND token_expires_at = ?
    `).bind(
      accessTokenToStore,
      refreshTokenToStore,
      expiresAt.toISOString(),
      refreshTokenExpiresAt.toISOString(),
      connection.id,
      connection.token_expires_at
    ).run();

    if (updateResult.meta.changes === 0) {
      // Token was already refreshed by another worker instance
      logger.info('Token already refreshed by another instance', {
        connectionId: connection.id,
      });
      return true;
    }

    logger.info('Token refreshed successfully', {
      connectionId: connection.id,
      userId: connection.user_id,
      region: connection.region,
    });

    return true;
  } catch (error) {
    logger.error(
      'Token refresh exception',
      error instanceof Error ? error : undefined,
      { connectionId: connection.id }
    );
    return false;
  }
}

/**
 * Main scheduled handler for proactive token refresh
 *
 * Queries for connections where:
 * 1. Token expires within 10 minutes (proactive refresh window)
 * 2. Connection was used within last 24 hours (active users only)
 * 3. Status is 'active' (not already failed)
 */
export async function handleScheduledTokenRefresh(
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const startTime = Date.now();

  logger.info('Starting scheduled token refresh');

  try {
    // Query connections that need refresh:
    // 1. Active connections with token expiring within 10 minutes
    // 2. Retry-pending connections where next_retry_at has passed
    const connectionsResult = await env.DB.prepare(`
      SELECT
        id,
        user_id,
        region,
        access_token,
        refresh_token,
        token_expires_at,
        refresh_token_expires_at,
        last_used_at,
        status,
        COALESCE(retry_count, 0) as retry_count,
        next_retry_at
      FROM connections
      WHERE
        -- Active connections expiring soon (proactive refresh)
        (
          status = 'active'
          AND datetime(token_expires_at) < datetime('now', '+10 minutes')
          AND datetime(token_expires_at) > datetime('now')
          AND (
            last_used_at IS NULL
            OR datetime(last_used_at) > datetime('now', '-24 hours')
          )
        )
        OR
        -- Retry-pending connections ready for next attempt
        (
          status = 'retry_pending'
          AND datetime(next_retry_at) <= datetime('now')
          AND datetime(refresh_token_expires_at) > datetime('now')
        )
      ORDER BY
        CASE WHEN status = 'retry_pending' THEN 0 ELSE 1 END,
        token_expires_at ASC
      LIMIT 50
    `).all<ConnectionRecord>();

    const connections = connectionsResult.results || [];

    if (connections.length === 0) {
      logger.info('No tokens need proactive refresh', {
        durationMs: Date.now() - startTime,
      });
      return;
    }

    const activeConnections = connections.filter(c => c.status === 'active');
    const retryConnections = connections.filter(c => c.status === 'retry_pending');

    logger.info(`Found ${connections.length} connections to refresh`, {
      active: activeConnections.length,
      retry: retryConnections.length,
    });

    // Process each connection
    let successCount = 0;
    let failCount = 0;

    for (const connection of connections) {
      const success = await refreshConnectionToken(connection, env);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    logger.info('Scheduled token refresh completed', {
      total: connections.length,
      success: successCount,
      failed: failCount,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    logger.error(
      'Scheduled token refresh failed',
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

/**
 * Export for use in index.ts
 */
export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await handleScheduledTokenRefresh(env, ctx);
  },
};
