/**
 * Database helpers for Cloudflare D1
 * Handles user management, connections, and API keys
 *
 * Security features:
 * - Token encryption (AES-256-GCM) for OAuth tokens at rest
 * - API key hashing with PBKDF2 + salt (100,000 iterations)
 * - Legacy SHA-256 hashes supported but deprecated (with logging)
 * - Constant-time comparison to prevent timing attacks
 */

import type { D1Database } from '@cloudflare/workers-types';
import { encryptToken, decryptToken, isEncrypted } from './crypto';
import { PLAN_LIMITS, type PlanType } from './constants';
import { escapeLikePattern } from './security';

// Generate secure random IDs
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate API key (prefix_random)
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'exa';
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const key = `${prefix}_${randomPart}`;
  return { key, prefix: key.substring(0, 12), hash: '' }; // hash will be computed async
}

// Legacy SHA-256 hash (for backward compatibility with existing keys)
async function hashApiKeyLegacy(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash API key with PBKDF2 and salt (secure method)
 * Format: pbkdf2$<salt_hex>$<hash_hex>
 */
async function hashApiKeySecure(key: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
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
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${saltHex}$${hashHex}`;
}

/**
 * Result of API key verification including security metadata
 */
interface ApiKeyVerifyResult {
  valid: boolean;
  isLegacyFormat: boolean;
}

/**
 * Verify API key against stored hash (supports both legacy and secure formats)
 * Returns both validity and whether legacy format was used
 */
async function verifyApiKeyHash(key: string, storedHash: string): Promise<ApiKeyVerifyResult> {
  // Check if it's a PBKDF2 hash (new secure format)
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return { valid: false, isLegacyFormat: false };

    const [, saltHex, expectedHashHex] = parts;
    if (!saltHex || !expectedHashHex) return { valid: false, isLegacyFormat: false };

    // Reconstruct salt from hex
    const saltMatch = saltHex.match(/.{2}/g);
    if (!saltMatch) return { valid: false, isLegacyFormat: false };
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
    return { valid: constantTimeEqual(hashHex, expectedHashHex), isLegacyFormat: false };
  }

  // Legacy SHA-256 format (backward compatibility) - DEPRECATED
  console.warn('Security: Legacy SHA-256 API key format detected. User should regenerate their API key for improved security.');
  const legacyHash = await hashApiKeyLegacy(key);
  return { valid: constantTimeEqual(legacyHash, storedHash), isLegacyFormat: true };
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

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  api_calls_used: number;
  api_calls_reset_at: string | null;
  // Stripe fields
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  stripe_cancel_at_period_end: boolean;
  // ToS acceptance fields
  tos_accepted_version: string | null;
  tos_accepted_at: string | null;
  // Email preferences
  email_privacy_tips?: boolean;
  email_provider_news?: boolean;
  email_product_updates?: boolean;
}

export interface Connection {
  id: string;
  user_id: string;
  region: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  exact_user_id: string | null;
  exact_user_name: string | null;
  exact_email: string | null;
  created_at: string;
  updated_at: string;
  /** Connection status: 'active' or 'refresh_failed' */
  status?: string;
  /** Last time this connection was used for API calls */
  last_used_at?: string;
}

export interface Division {
  id: string;
  connection_id: string;
  division_code: number;
  division_name: string;
  is_default: boolean;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

// Database operations
export class Database {
  private encryptionKey?: string;

  constructor(private db: D1Database, encryptionKey?: string) {
    this.encryptionKey = encryptionKey;
  }

  // Get raw D1 database instance (for OAuth queries)
  getDb(): D1Database {
    return this.db;
  }

  // Raw query helpers for flexibility
  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const stmt = this.db.prepare(sql);
    const result = await stmt.bind(...params).run();
    return { changes: result.meta.changes };
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    return await stmt.bind(...params).first<T>();
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const result = await stmt.bind(...params).all<T>();
    return result.results || [];
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
    return result;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
    return result;
  }

  async createUser(email: string, name?: string): Promise<User> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO users (id, email, name, created_at, updated_at, plan, api_calls_used)
         VALUES (?, ?, ?, ?, ?, 'free', 0)`
      )
      .bind(id, email, name || null, now, now)
      .run();

    return (await this.findUserById(id))!;
  }

  async getOrCreateUser(email: string, name?: string): Promise<User> {
    const existing = await this.findUserByEmail(email);
    if (existing) return existing;
    return this.createUser(email, name);
  }

  // Connection operations

  /**
   * Decrypt tokens in a connection object if encryption is enabled
   */
  private async decryptConnectionTokens(connection: Connection): Promise<Connection> {
    if (!this.encryptionKey) {
      return connection;
    }

    try {
      // Check if tokens are encrypted (backward compatibility)
      const accessEncrypted = isEncrypted(connection.access_token);
      const refreshEncrypted = isEncrypted(connection.refresh_token);

      return {
        ...connection,
        access_token: accessEncrypted
          ? await decryptToken(connection.access_token, this.encryptionKey)
          : connection.access_token,
        refresh_token: refreshEncrypted
          ? await decryptToken(connection.refresh_token, this.encryptionKey)
          : connection.refresh_token,
      };
    } catch (error) {
      console.error('Failed to decrypt tokens:', error);
      throw new Error('Token decryption failed');
    }
  }

  async findConnectionByUserAndRegion(userId: string, region: string): Promise<Connection | null> {
    const result = await this.db
      .prepare('SELECT * FROM connections WHERE user_id = ? AND region = ?')
      .bind(userId, region)
      .first<Connection>();

    if (!result) return null;
    return this.decryptConnectionTokens(result);
  }

  async getConnectionsByUser(userId: string): Promise<Connection[]> {
    const result = await this.db
      .prepare('SELECT * FROM connections WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all<Connection>();

    const connections = result.results || [];
    // Decrypt tokens for each connection
    return Promise.all(connections.map(c => this.decryptConnectionTokens(c)));
  }

  async upsertConnection(
    userId: string,
    region: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    exactUserInfo?: { id?: string; name?: string; email?: string }
  ): Promise<Connection> {
    // Encrypt tokens if encryption key is available
    let encryptedAccessToken = accessToken;
    let encryptedRefreshToken = refreshToken;

    if (this.encryptionKey) {
      encryptedAccessToken = await encryptToken(accessToken, this.encryptionKey);
      encryptedRefreshToken = await encryptToken(refreshToken, this.encryptionKey);
    }

    // Check for existing connection (use raw query to avoid decryption)
    const existing = await this.db
      .prepare('SELECT id FROM connections WHERE user_id = ? AND region = ?')
      .bind(userId, region)
      .first<{ id: string }>();

    const now = new Date().toISOString();
    const expiresAtStr = expiresAt.toISOString();

    // Calculate refresh token expiry (30 days from now)
    // @see EXACT-003 in operations/ROADMAP.md
    // @see docs/knowledge/exact/VERSION.md - Refresh token validity: 30 days
    const REFRESH_TOKEN_VALIDITY_DAYS = 30;
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    const refreshTokenExpiresAtStr = refreshTokenExpiresAt.toISOString();

    if (existing) {
      // Update existing connection
      await this.db
        .prepare(
          `UPDATE connections
           SET access_token = ?, refresh_token = ?, token_expires_at = ?,
               refresh_token_expires_at = ?,
               exact_user_id = COALESCE(?, exact_user_id),
               exact_user_name = COALESCE(?, exact_user_name),
               exact_email = COALESCE(?, exact_email),
               updated_at = ?,
               status = 'active',
               expiry_alert_sent = 0
           WHERE id = ?`
        )
        .bind(
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAtStr,
          refreshTokenExpiresAtStr,
          exactUserInfo?.id || null,
          exactUserInfo?.name || null,
          exactUserInfo?.email || null,
          now,
          existing.id
        )
        .run();

      return (await this.findConnectionByUserAndRegion(userId, region))!;
    } else {
      // Create new connection
      const id = generateId();
      await this.db
        .prepare(
          `INSERT INTO connections
           (id, user_id, region, access_token, refresh_token, token_expires_at,
            refresh_token_expires_at, exact_user_id, exact_user_name, exact_email,
            created_at, updated_at, status, expiry_alert_sent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)`
        )
        .bind(
          id,
          userId,
          region,
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAtStr,
          refreshTokenExpiresAtStr,
          exactUserInfo?.id || null,
          exactUserInfo?.name || null,
          exactUserInfo?.email || null,
          now,
          now
        )
        .run();

      return (await this.findConnectionByUserAndRegion(userId, region))!;
    }
  }

  // Division operations
  async getDivisionsByConnection(connectionId: string): Promise<Division[]> {
    const result = await this.db
      .prepare('SELECT * FROM divisions WHERE connection_id = ? ORDER BY division_name')
      .bind(connectionId)
      .all<Division>();
    return result.results || [];
  }

  async getDivisionsByUser(userId: string): Promise<(Division & { region: string })[]> {
    const result = await this.db
      .prepare(
        `SELECT d.*, c.region
         FROM divisions d
         JOIN connections c ON d.connection_id = c.id
         WHERE c.user_id = ?
         ORDER BY d.division_name`
      )
      .bind(userId)
      .all<Division & { region: string }>();
    return result.results || [];
  }

  async syncDivisions(
    connectionId: string,
    divisions: Array<{ code: number; name: string; isDefault?: boolean }>
  ): Promise<void> {
    // Delete existing divisions for this connection
    await this.db
      .prepare('DELETE FROM divisions WHERE connection_id = ?')
      .bind(connectionId)
      .run();

    // Insert new divisions
    for (const div of divisions) {
      const id = generateId();
      await this.db
        .prepare(
          `INSERT INTO divisions (id, connection_id, division_code, division_name, is_default, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(id, connectionId, div.code, div.name, div.isDefault ? 1 : 0)
        .run();
    }
  }

  /**
   * Sync user_divisions table for OAuth MCP access (P22)
   *
   * This links an OAuth user to their Exact Online divisions, enabling
   * MCP clients (ChatGPT/Claude) to access the correct division via OAuth.
   *
   * @param userId - The user ID from our users table
   * @param connectionId - The connection ID from connections table
   * @param divisions - Array of divisions to sync
   */
  async syncUserDivisions(
    userId: string,
    connectionId: string,
    divisions: Array<{ code: number; name: string; isDefault?: boolean }>
  ): Promise<void> {
    // Delete existing user_divisions for this connection
    // This handles re-authentication: old records are replaced
    await this.db
      .prepare('DELETE FROM user_divisions WHERE oauth_user_id = ? AND connection_id = ?')
      .bind(userId, connectionId)
      .run();

    // Insert new user_divisions records
    for (const [index, div] of divisions.entries()) {
      const id = generateId();
      // First division with isDefault=true becomes default, or first one if none marked
      const isDefault = div.isDefault ?? (index === 0);

      await this.db
        .prepare(
          `INSERT INTO user_divisions (id, oauth_user_id, connection_id, division_code, division_name, is_default, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(id, userId, connectionId, String(div.code), div.name, isDefault ? 1 : 0)
        .run();
    }

    // Ensure only one default per user (if multiple connections exist)
    // Find the most recently created default and keep only that one
    await this.db
      .prepare(`
        UPDATE user_divisions
        SET is_default = 0
        WHERE oauth_user_id = ?
          AND is_default = 1
          AND id NOT IN (
            SELECT id FROM user_divisions
            WHERE oauth_user_id = ? AND is_default = 1
            ORDER BY created_at DESC
            LIMIT 1
          )
      `)
      .bind(userId, userId)
      .run();
  }

  // API Key operations
  async getApiKeysByUser(userId: string): Promise<ApiKey[]> {
    const result = await this.db
      .prepare(
        'SELECT id, user_id, key_prefix, name, last_used_at, created_at, revoked_at FROM api_keys WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC'
      )
      .bind(userId)
      .all<ApiKey>();
    return result.results || [];
  }

  async createApiKey(userId: string, name?: string): Promise<{ apiKey: ApiKey; plainKey: string }> {
    // AUTH-001: Enforce API key limit based on user's plan
    // First, get the user's plan and count active keys
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const plan = user.plan as PlanType;
    const planLimit = PLAN_LIMITS[plan]?.apiKeys ?? PLAN_LIMITS.free.apiKeys;

    // Count only active keys (WHERE revoked_at IS NULL)
    const activeKeysResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND revoked_at IS NULL')
      .bind(userId)
      .first<{ count: number }>();

    const activeKeyCount = activeKeysResult?.count ?? 0;

    if (planLimit !== Infinity && activeKeyCount >= planLimit) {
      throw new Error(`API key limit reached. Your ${plan} plan allows ${planLimit} active keys.`);
    }

    const { key, prefix } = generateApiKey();
    const hash = await hashApiKeySecure(key); // Use PBKDF2 with salt
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userId, hash, prefix, name || 'Default', now)
      .run();

    const apiKey: ApiKey = {
      id,
      user_id: userId,
      key_prefix: prefix,
      name: name || 'Default',
      last_used_at: null,
      created_at: now,
      revoked_at: null,
    };

    return { apiKey, plainKey: key };
  }

  async validateApiKey(key: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    // Extract prefix from key (first 12 chars: "exa_" + 8 chars)
    const keyPrefix = key.substring(0, 12);

    // Find all non-revoked keys with matching prefix
    const candidates = await this.db
      .prepare(
        `SELECT ak.id as ak_id, ak.user_id as ak_user_id, ak.key_hash, ak.key_prefix,
                ak.name as ak_name, ak.last_used_at, ak.created_at as ak_created_at, ak.revoked_at,
                u.id, u.email, u.name, u.created_at, u.updated_at, u.plan, u.api_calls_used,
                u.api_calls_reset_at, u.stripe_customer_id, u.stripe_subscription_id,
                u.stripe_subscription_status, u.stripe_cancel_at_period_end
         FROM api_keys ak
         JOIN users u ON ak.user_id = u.id
         WHERE ak.key_prefix = ? AND ak.revoked_at IS NULL`
      )
      .bind(keyPrefix)
      .all();

    if (!candidates.results || candidates.results.length === 0) return null;

    // Verify the key against each candidate hash
    let matchedResult: Record<string, unknown> | null = null;
    let usesLegacyFormat = false;
    for (const candidate of candidates.results) {
      const storedHash = candidate.key_hash as string;
      const verifyResult = await verifyApiKeyHash(key, storedHash);
      if (verifyResult.valid) {
        matchedResult = candidate as Record<string, unknown>;
        usesLegacyFormat = verifyResult.isLegacyFormat;
        break;
      }
    }

    // Log if legacy format is being used (for monitoring/migration tracking)
    if (matchedResult && usesLegacyFormat) {
      console.warn(`Security: API key ${keyPrefix}... uses deprecated SHA-256 format. Consider notifying user to regenerate.`);
    }

    if (!matchedResult) return null;

    // Update last used
    await this.db
      .prepare('UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?')
      .bind(matchedResult.ak_id)
      .run();

    // Parse into separate objects
    const apiKey: ApiKey = {
      id: matchedResult.ak_id as string,
      user_id: matchedResult.ak_user_id as string,
      key_prefix: matchedResult.key_prefix as string,
      name: matchedResult.ak_name as string,
      last_used_at: matchedResult.last_used_at as string | null,
      created_at: matchedResult.ak_created_at as string,
      revoked_at: matchedResult.revoked_at as string | null,
    };

    const user: User = {
      id: matchedResult.id as string,
      email: matchedResult.email as string,
      name: matchedResult.name as string | null,
      created_at: matchedResult.created_at as string,
      updated_at: matchedResult.updated_at as string,
      plan: matchedResult.plan as 'free' | 'starter' | 'pro' | 'enterprise',
      api_calls_used: matchedResult.api_calls_used as number,
      api_calls_reset_at: matchedResult.api_calls_reset_at as string | null,
      stripe_customer_id: matchedResult.stripe_customer_id as string | null,
      stripe_subscription_id: matchedResult.stripe_subscription_id as string | null,
      stripe_subscription_status: matchedResult.stripe_subscription_status as string | null,
      stripe_cancel_at_period_end: Boolean(matchedResult.stripe_cancel_at_period_end),
      tos_accepted_version: matchedResult.tos_accepted_version as string | null,
      tos_accepted_at: matchedResult.tos_accepted_at as string | null,
    };

    return { user, apiKey };
  }

  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE api_keys SET revoked_at = datetime("now") WHERE id = ? AND user_id = ?')
      .bind(keyId, userId)
      .run();
    return result.meta.changes > 0;
  }

  async renameApiKey(keyId: string, userId: string, newName: string): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE api_keys SET name = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL')
      .bind(newName, keyId, userId)
      .run();
    return result.meta.changes > 0;
  }

  // Division operations - set default
  async setDefaultDivision(userId: string, divisionCode: number, region: string): Promise<boolean> {
    // First, get the connection for this region
    const connection = await this.db
      .prepare('SELECT id FROM connections WHERE user_id = ? AND region = ?')
      .bind(userId, region)
      .first<{ id: string }>();

    if (!connection) return false;

    // Unset all current defaults for this user's connections
    const connections = await this.db
      .prepare('SELECT id FROM connections WHERE user_id = ?')
      .bind(userId)
      .all<{ id: string }>();

    for (const conn of connections.results || []) {
      await this.db
        .prepare('UPDATE divisions SET is_default = 0 WHERE connection_id = ?')
        .bind(conn.id)
        .run();
    }

    // Set the new default
    const result = await this.db
      .prepare('UPDATE divisions SET is_default = 1 WHERE connection_id = ? AND division_code = ?')
      .bind(connection.id, divisionCode)
      .run();

    return result.meta.changes > 0;
  }

  // ============================================
  // Division Limit Operations
  // ============================================

  /**
   * Get count of active divisions for a user
   */
  async getActiveDivisionsCount(userId: string): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM divisions d
        JOIN connections c ON d.connection_id = c.id
        WHERE c.user_id = ? AND d.is_active = 1
      `)
      .bind(userId)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * Get all divisions for user with active status
   */
  async getUserDivisionsWithStatus(userId: string): Promise<Array<{
    id: string;
    division_code: number;
    division_name: string;
    is_active: boolean;
    is_default: boolean;
  }>> {
    const result = await this.db
      .prepare(`
        SELECT d.id, d.division_code, d.division_name, d.is_active, d.is_default
        FROM divisions d
        JOIN connections c ON d.connection_id = c.id
        WHERE c.user_id = ?
        ORDER BY d.division_name
      `)
      .bind(userId)
      .all<{
        id: string;
        division_code: number;
        division_name: string;
        is_active: number;
        is_default: number;
      }>();

    return (result.results || []).map(row => ({
      id: row.id,
      division_code: row.division_code,
      division_name: row.division_name,
      is_active: Boolean(row.is_active),
      is_default: Boolean(row.is_default),
    }));
  }

  /**
   * Check if user can switch divisions (cooldown = 1 hour)
   */
  async canSwitchDivision(userId: string): Promise<{ canSwitch: boolean; cooldownUntil?: string }> {
    const user = await this.db
      .prepare('SELECT division_switch_at FROM users WHERE id = ?')
      .bind(userId)
      .first<{ division_switch_at: string | null }>();

    if (!user || !user.division_switch_at) {
      return { canSwitch: true };
    }

    const lastSwitch = new Date(user.division_switch_at);
    const cooldownEnd = new Date(lastSwitch.getTime() + 60 * 60 * 1000); // 1 hour
    const now = new Date();

    if (now >= cooldownEnd) {
      return { canSwitch: true };
    }

    return {
      canSwitch: false,
      cooldownUntil: cooldownEnd.toISOString(),
    };
  }

  /**
   * Update division switch timestamp
   */
  async updateDivisionSwitchTime(userId: string): Promise<void> {
    await this.db
      .prepare("UPDATE users SET division_switch_at = datetime('now') WHERE id = ?")
      .bind(userId)
      .run();
  }

  /**
   * Toggle division active status (with cooldown check)
   * Logic:
   * 1. Check cooldown (1 hour since last switch)
   * 2. If activating: check if user would exceed plan limit
   * 3. Update division is_active
   * 4. Update user division_switch_at timestamp
   */
  async toggleDivisionActive(
    userId: string,
    divisionId: string,
    active: boolean
  ): Promise<{ success: boolean; error?: string; cooldownUntil?: string }> {
    // Step 1: Check cooldown
    const cooldownCheck = await this.canSwitchDivision(userId);
    if (!cooldownCheck.canSwitch) {
      return {
        success: false,
        error: 'Je moet 1 uur wachten tussen het wijzigen van actieve administraties.',
        cooldownUntil: cooldownCheck.cooldownUntil,
      };
    }

    // Step 2: If activating, check plan limit
    if (active) {
      const user = await this.findUserById(userId);
      if (!user) {
        return { success: false, error: 'Gebruiker niet gevonden.' };
      }

      const plan = user.plan as PlanType;
      const planLimit = PLAN_LIMITS[plan]?.divisions ?? PLAN_LIMITS.free.divisions;
      const activeCount = await this.getActiveDivisionsCount(userId);

      // Check if this division is already active (no change needed)
      const division = await this.db
        .prepare(`
          SELECT d.is_active
          FROM divisions d
          JOIN connections c ON d.connection_id = c.id
          WHERE d.id = ? AND c.user_id = ?
        `)
        .bind(divisionId, userId)
        .first<{ is_active: number }>();

      if (!division) {
        return { success: false, error: 'Administratie niet gevonden.' };
      }

      // If already active, no change needed
      if (Boolean(division.is_active)) {
        return { success: true };
      }

      // Check if adding would exceed limit
      if (planLimit !== Infinity && activeCount >= planLimit) {
        return {
          success: false,
          error: `Je ${plan} plan staat maximaal ${planLimit} actieve administraties toe. Deactiveer eerst een andere administratie of upgrade je plan.`,
        };
      }
    }

    // Verify the division belongs to the user
    const divisionCheck = await this.db
      .prepare(`
        SELECT d.id
        FROM divisions d
        JOIN connections c ON d.connection_id = c.id
        WHERE d.id = ? AND c.user_id = ?
      `)
      .bind(divisionId, userId)
      .first<{ id: string }>();

    if (!divisionCheck) {
      return { success: false, error: 'Administratie niet gevonden.' };
    }

    // Step 3: Update division is_active
    await this.db
      .prepare('UPDATE divisions SET is_active = ? WHERE id = ?')
      .bind(active ? 1 : 0, divisionId)
      .run();

    // Step 3b: If deactivating a default division, assign new default
    if (!active) {
      // Check if this was the default division
      const wasDefault = await this.db
        .prepare(`
          SELECT is_default, connection_id
          FROM divisions
          WHERE id = ?
        `)
        .bind(divisionId)
        .first<{ is_default: number; connection_id: string }>();

      if (wasDefault && Boolean(wasDefault.is_default)) {
        // Clear the default flag
        await this.db
          .prepare('UPDATE divisions SET is_default = 0 WHERE id = ?')
          .bind(divisionId)
          .run();

        // Find another active division to make default
        const newDefault = await this.db
          .prepare(`
            SELECT id
            FROM divisions
            WHERE connection_id = ? AND is_active = 1 AND id != ?
            ORDER BY division_code
            LIMIT 1
          `)
          .bind(wasDefault.connection_id, divisionId)
          .first<{ id: string }>();

        if (newDefault) {
          await this.db
            .prepare('UPDATE divisions SET is_default = 1 WHERE id = ?')
            .bind(newDefault.id)
            .run();
        }
      }
    }

    // Step 4: Update user division_switch_at timestamp
    await this.updateDivisionSwitchTime(userId);

    return { success: true };
  }

  /**
   * Activate all divisions for a user (within plan limits)
   * Skips cooldown check for bulk operations
   *
   * @returns Number of divisions activated, or error
   */
  async activateAllDivisions(userId: string): Promise<{
    success: boolean;
    activated: number;
    total: number;
    limited?: boolean;
    error?: string;
  }> {
    // Get user's plan limit
    const user = await this.findUserById(userId);
    if (!user) {
      return { success: false, activated: 0, total: 0, error: 'Gebruiker niet gevonden.' };
    }

    const plan = user.plan as PlanType;
    const planLimit = PLAN_LIMITS[plan]?.divisions ?? PLAN_LIMITS.free.divisions;

    // Get all divisions for user
    const divisions = await this.getUserDivisionsWithStatus(userId);
    const total = divisions.length;

    if (total === 0) {
      return { success: true, activated: 0, total: 0 };
    }

    // Check if plan allows activating all
    const canActivateAll = planLimit === Infinity || planLimit >= total;
    const toActivate = canActivateAll ? total : planLimit;

    // Sort divisions: keep currently active ones first, then by name
    const sortedDivisions = [...divisions].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return a.division_name.localeCompare(b.division_name);
    });

    // Activate up to the limit
    let activated = 0;
    for (let i = 0; i < sortedDivisions.length; i++) {
      const div = sortedDivisions[i];
      const shouldBeActive = i < toActivate;

      if (shouldBeActive && !div.is_active) {
        await this.db
          .prepare('UPDATE divisions SET is_active = 1 WHERE id = ?')
          .bind(div.id)
          .run();
        activated++;
      } else if (!shouldBeActive && div.is_active) {
        await this.db
          .prepare('UPDATE divisions SET is_active = 0 WHERE id = ?')
          .bind(div.id)
          .run();
      }
    }

    // Update switch timestamp
    await this.updateDivisionSwitchTime(userId);

    return {
      success: true,
      activated: toActivate,
      total,
      limited: !canActivateAll,
    };
  }

  // Session operations
  async createSession(userId: string, expiresInDays: number = 30): Promise<Session> {
    const id = generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    await this.db
      .prepare(
        `INSERT INTO sessions (id, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(id, userId, expiresAt.toISOString(), now.toISOString())
      .run();

    return {
      id,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    };
  }

  async validateSession(sessionId: string): Promise<{ session: Session; user: User } | null> {
    const result = await this.db
      .prepare(
        `SELECT s.*, u.id as uid, u.email, u.name as uname, u.created_at as ucreated,
                u.updated_at as uupdated, u.plan, u.api_calls_used, u.api_calls_reset_at,
                u.stripe_customer_id, u.stripe_subscription_id, u.stripe_subscription_status,
                u.stripe_cancel_at_period_end, u.tos_accepted_version, u.tos_accepted_at
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.expires_at > datetime('now')`
      )
      .bind(sessionId)
      .first();

    if (!result) return null;

    const session: Session = {
      id: result.id as string,
      user_id: result.user_id as string,
      expires_at: result.expires_at as string,
      created_at: result.created_at as string,
    };

    const user: User = {
      id: result.uid as string,
      email: result.email as string,
      name: result.uname as string | null,
      created_at: result.ucreated as string,
      updated_at: result.uupdated as string,
      plan: result.plan as 'free' | 'starter' | 'pro' | 'enterprise',
      api_calls_used: result.api_calls_used as number,
      api_calls_reset_at: result.api_calls_reset_at as string | null,
      stripe_customer_id: result.stripe_customer_id as string | null,
      stripe_subscription_id: result.stripe_subscription_id as string | null,
      stripe_subscription_status: result.stripe_subscription_status as string | null,
      stripe_cancel_at_period_end: Boolean(result.stripe_cancel_at_period_end),
      tos_accepted_version: result.tos_accepted_version as string | null,
      tos_accepted_at: result.tos_accepted_at as string | null,
    };

    return { session, user };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  /**
   * Check if a session exists but is expired, and if so, delete it.
   * AUTH-002: Fix for dashboard auto-logout - ensures expired sessions are cleaned up
   * @returns true if session was expired and deleted, false otherwise
   */
  async checkAndDeleteExpiredSession(sessionId: string): Promise<boolean> {
    // Fetch session without expiry filter to check if it exists but is expired
    const session = await this.db
      .prepare('SELECT id, expires_at FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first<{ id: string; expires_at: string }>();

    if (!session) {
      return false; // Session doesn't exist at all
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete the expired session
      await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      return true; // Session was expired and deleted
    }

    return false; // Session exists and is still valid
  }

  // Usage tracking
  async trackApiCall(
    userId: string,
    apiKeyId: string | null,
    endpoint: string,
    divisionCode?: number,
    responseStatus?: number
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO api_usage (user_id, api_key_id, endpoint, division_code, response_status, timestamp)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(userId, apiKeyId, endpoint, divisionCode || null, responseStatus || null)
      .run();

    // Increment user's API call counter
    await this.db
      .prepare('UPDATE users SET api_calls_used = api_calls_used + 1 WHERE id = ?')
      .bind(userId)
      .run();
  }

  /**
   * Get API usage stats for the current month (matches rate limit period)
   * @param userId - User ID to get stats for
   * @param _days - DEPRECATED: ignored, always uses current month for consistency with rate limits
   */
  async getApiUsageStats(userId: string, _days?: number): Promise<{ total: number; byEndpoint: Record<string, number> }> {
    // Use "start of month" to match rate limit calculation exactly
    // This ensures dashboard shows same count as rate limit enforcement
    const totalResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM api_usage WHERE user_id = ? AND timestamp > date('now', 'start of month')`)
      .bind(userId)
      .first<{ count: number }>();

    const byEndpointResult = await this.db
      .prepare(
        `SELECT endpoint, COUNT(*) as count FROM api_usage
         WHERE user_id = ? AND timestamp > date('now', 'start of month')
         GROUP BY endpoint`
      )
      .bind(userId)
      .all<{ endpoint: string; count: number }>();

    const byEndpoint: Record<string, number> = {};
    for (const row of byEndpointResult.results || []) {
      byEndpoint[row.endpoint] = row.count;
    }

    return {
      total: totalResult?.count || 0,
      byEndpoint,
    };
  }

  // ============================================
  // Admin operations
  // ============================================

  async getAllUsers(): Promise<User[]> {
    const result = await this.db
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all<User>();
    return result.results || [];
  }

  async updateUserPlan(userId: string, plan: 'free' | 'starter' | 'pro' | 'enterprise'): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE users SET plan = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(plan, userId)
      .run();
    return result.meta.changes > 0;
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(status, userId)
      .run();
    return result.meta.changes > 0;
  }

  async resetUserApiCalls(userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE users SET api_calls_used = 0, api_calls_reset_at = datetime("now"), updated_at = datetime("now") WHERE id = ?')
      .bind(userId)
      .run();
    return result.meta.changes > 0;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Delete in correct order due to foreign keys
    await this.db.prepare('DELETE FROM api_usage WHERE user_id = ?').bind(userId).run();
    await this.db.prepare('DELETE FROM api_keys WHERE user_id = ?').bind(userId).run();
    await this.db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();

    // Delete divisions for user's connections
    const connections = await this.db
      .prepare('SELECT id FROM connections WHERE user_id = ?')
      .bind(userId)
      .all<{ id: string }>();

    for (const conn of connections.results || []) {
      await this.db.prepare('DELETE FROM divisions WHERE connection_id = ?').bind(conn.id).run();
    }

    await this.db.prepare('DELETE FROM connections WHERE user_id = ?').bind(userId).run();

    const result = await this.db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();
    return result.meta.changes > 0;
  }

  async deleteConnection(connectionId: string, userId: string): Promise<boolean> {
    // Verify the connection belongs to the user
    const connection = await this.db
      .prepare('SELECT id FROM connections WHERE id = ? AND user_id = ?')
      .bind(connectionId, userId)
      .first<{ id: string }>();

    if (!connection) return false;

    // Delete divisions for this connection first
    await this.db.prepare('DELETE FROM divisions WHERE connection_id = ?').bind(connectionId).run();

    // Delete the connection
    const result = await this.db
      .prepare('DELETE FROM connections WHERE id = ? AND user_id = ?')
      .bind(connectionId, userId)
      .run();

    return result.meta.changes > 0;
  }

  async deleteAllUserConnections(userId: string): Promise<boolean> {
    // Get all connections for the user
    const connections = await this.db
      .prepare('SELECT id FROM connections WHERE user_id = ?')
      .bind(userId)
      .all<{ id: string }>();

    // Delete divisions for each connection
    for (const conn of connections.results || []) {
      await this.db.prepare('DELETE FROM divisions WHERE connection_id = ?').bind(conn.id).run();
    }

    // Delete all connections
    const result = await this.db
      .prepare('DELETE FROM connections WHERE user_id = ?')
      .bind(userId)
      .run();

    return result.meta.changes > 0;
  }

  async getUserWithDetails(userId: string): Promise<{
    user: User;
    connections: Connection[];
    apiKeys: ApiKey[];
    apiCallsThisMonth: number;
  } | null> {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const connections = await this.getConnectionsByUser(userId);
    const apiKeys = await this.getApiKeysByUser(userId);

    const apiCallsResult = await this.db
      .prepare("SELECT COUNT(*) as count FROM api_usage WHERE user_id = ? AND timestamp > date('now', 'start of month')")
      .bind(userId)
      .first<{ count: number }>();

    return {
      user,
      connections,
      apiKeys,
      apiCallsThisMonth: apiCallsResult?.count || 0,
    };
  }

  // ============================================
  // Provider stats operations
  // ============================================

  /**
   * Get AI provider usage statistics for a user
   * Based on User-Agent header logging in api_usage table
   */
  async getProviderStats(userId: string, days: number = 30): Promise<{
    providers: Array<{
      provider: string;
      displayName: string;
      count: number;
      lastUsed: string | null;
    }>;
    lastProvider: string | null;
  }> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get provider counts from user_agent field
    const result = await this.db
      .prepare(`
        SELECT
          CASE
            WHEN LOWER(user_agent) LIKE '%claude%' OR LOWER(user_agent) LIKE '%anthropic%' THEN 'claude'
            WHEN LOWER(user_agent) LIKE '%openai%' OR LOWER(user_agent) LIKE '%chatgpt%' OR LOWER(user_agent) LIKE '%gpt-%' THEN 'chatgpt'
            WHEN LOWER(user_agent) LIKE '%copilot%' OR LOWER(user_agent) LIKE '%github%' THEN 'copilot'
            WHEN LOWER(user_agent) LIKE '%cursor%' THEN 'cursor'
            ELSE 'unknown'
          END as provider,
          COUNT(*) as count,
          MAX(timestamp) as last_used
        FROM api_usage
        WHERE user_id = ? AND timestamp > ?
        GROUP BY provider
        ORDER BY count DESC
      `)
      .bind(userId, cutoff)
      .all<{ provider: string; count: number; last_used: string }>();

    const providerNames: Record<string, string> = {
      claude: 'Claude',
      chatgpt: 'ChatGPT',
      copilot: 'Copilot',
      cursor: 'Cursor',
      unknown: 'Onbekend',
    };

    const providers = (result.results || []).map(row => ({
      provider: row.provider,
      displayName: providerNames[row.provider] || 'Onbekend',
      count: row.count,
      lastUsed: row.last_used,
    }));

    // Get the most recently used provider
    const lastProviderResult = await this.db
      .prepare(`
        SELECT
          CASE
            WHEN LOWER(user_agent) LIKE '%claude%' OR LOWER(user_agent) LIKE '%anthropic%' THEN 'claude'
            WHEN LOWER(user_agent) LIKE '%openai%' OR LOWER(user_agent) LIKE '%chatgpt%' OR LOWER(user_agent) LIKE '%gpt-%' THEN 'chatgpt'
            WHEN LOWER(user_agent) LIKE '%copilot%' OR LOWER(user_agent) LIKE '%github%' THEN 'copilot'
            WHEN LOWER(user_agent) LIKE '%cursor%' THEN 'cursor'
            ELSE 'unknown'
          END as provider
        FROM api_usage
        WHERE user_id = ? AND user_agent IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 1
      `)
      .bind(userId)
      .first<{ provider: string }>();

    return {
      providers,
      lastProvider: lastProviderResult?.provider || null,
    };
  }

  // ============================================
  // Support System Operations
  // ============================================

  // System Settings
  async getSystemSetting(key: string): Promise<string | null> {
    const result = await this.db
      .prepare('SELECT value FROM system_settings WHERE key = ?')
      .bind(key)
      .first<{ value: string }>();
    return result?.value || null;
  }

  async setSystemSetting(key: string, value: string, updatedBy?: string): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO system_settings (key, value, updated_at, updated_by)
        VALUES (?, ?, datetime('now'), ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now'),
          updated_by = excluded.updated_by
      `)
      .bind(key, value, updatedBy || null)
      .run();
  }

  async getAllSystemSettings(): Promise<Record<string, string>> {
    const result = await this.db
      .prepare('SELECT key, value FROM system_settings')
      .all<{ key: string; value: string }>();

    const settings: Record<string, string> = {};
    for (const row of result.results || []) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  // Support Conversations
  async createConversation(
    userId: string,
    subject: string,
    category?: string,
    priority?: string
  ): Promise<SupportConversation> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO support_conversations (id, user_id, subject, category, priority, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
      `)
      .bind(id, userId, subject, category || null, priority || 'normal', now, now)
      .run();

    return (await this.getConversation(id))!;
  }

  async getConversation(id: string): Promise<SupportConversation | null> {
    return await this.db
      .prepare('SELECT * FROM support_conversations WHERE id = ?')
      .bind(id)
      .first<SupportConversation>();
  }

  async getConversationWithMessages(id: string): Promise<{
    conversation: SupportConversation;
    messages: SupportMessage[];
  } | null> {
    const conversation = await this.getConversation(id);
    if (!conversation) return null;

    const messages = await this.getMessages(id);
    return { conversation, messages };
  }

  async getUserConversations(userId: string, status?: string): Promise<SupportConversation[]> {
    let query = 'SELECT * FROM support_conversations WHERE user_id = ?';
    const params: unknown[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC';

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<SupportConversation>();

    return result.results || [];
  }

  async getAllConversations(filters?: {
    status?: string;
    category?: string;
    assignedTo?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: SupportConversation[]; total: number }> {
    let whereClause = '1=1';
    const params: unknown[] = [];

    if (filters?.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category) {
      whereClause += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.assignedTo) {
      whereClause += ' AND assigned_to = ?';
      params.push(filters.assignedTo);
    }
    if (filters?.priority) {
      whereClause += ' AND priority = ?';
      params.push(filters.priority);
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM support_conversations WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    // Get paginated results
    let query = `SELECT * FROM support_conversations WHERE ${whereClause} ORDER BY
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      updated_at DESC`;

    // MEDIUM security fix: validate and sanitize LIMIT/OFFSET to prevent SQL injection
    // D1 doesn't support bind params for LIMIT/OFFSET, so we use strict integer validation
    if (filters?.limit) {
      const safeLimit = Math.max(1, Math.min(Math.floor(Number(filters.limit) || 50), 500));
      query += ` LIMIT ${safeLimit}`;
      if (filters?.offset) {
        const safeOffset = Math.max(0, Math.floor(Number(filters.offset) || 0));
        query += ` OFFSET ${safeOffset}`;
      }
    }

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<SupportConversation>();

    return {
      conversations: result.results || [],
      total: countResult?.count || 0,
    };
  }

  async updateConversation(id: string, updates: Partial<SupportConversation>): Promise<void> {
    const setClauses: string[] = ['updated_at = datetime(\'now\')'];
    const params: unknown[] = [];

    const allowedFields = [
      'subject', 'status', 'priority', 'category', 'assigned_to', 'handled_by',
      'first_response_at', 'resolved_at', 'resolution_type', 'resolution_notes',
      'satisfaction_rating', 'satisfaction_feedback', 'ai_confidence_score', 'matched_pattern_id'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        setClauses.push(`${field} = ?`);
        params.push((updates as Record<string, unknown>)[field]);
      }
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE support_conversations SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();
  }

  // Support Messages
  async addMessage(
    conversationId: string,
    message: {
      sender_type: 'user' | 'ai' | 'admin' | 'system';
      sender_id?: string;
      content: string;
      content_type?: string;
      ai_confidence?: number;
      ai_pattern_used?: string;
      ai_suggested_articles?: string[];
      is_internal?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SupportMessage> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO support_messages (
          id, conversation_id, sender_type, sender_id, content, content_type,
          ai_confidence, ai_pattern_used, ai_suggested_articles, is_internal, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        conversationId,
        message.sender_type,
        message.sender_id || null,
        message.content,
        message.content_type || 'text',
        message.ai_confidence || null,
        message.ai_pattern_used || null,
        message.ai_suggested_articles ? JSON.stringify(message.ai_suggested_articles) : null,
        message.is_internal ? 1 : 0,
        message.metadata ? JSON.stringify(message.metadata) : null,
        now
      )
      .run();

    // Update conversation timestamp
    await this.db
      .prepare("UPDATE support_conversations SET updated_at = datetime('now') WHERE id = ?")
      .bind(conversationId)
      .run();

    return (await this.db
      .prepare('SELECT * FROM support_messages WHERE id = ?')
      .bind(id)
      .first<SupportMessage>())!;
  }

  async getMessages(conversationId: string, includeInternal: boolean = false): Promise<SupportMessage[]> {
    let query = 'SELECT * FROM support_messages WHERE conversation_id = ?';
    if (!includeInternal) {
      query += ' AND is_internal = 0';
    }
    query += ' ORDER BY created_at ASC';

    const result = await this.db
      .prepare(query)
      .bind(conversationId)
      .all<SupportMessage>();

    return result.results || [];
  }

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE support_messages
        SET read_at = datetime('now')
        WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
      `)
      .bind(conversationId, userId)
      .run();
  }

  // Knowledge Base
  async getArticle(slug: string): Promise<KnowledgeArticle | null> {
    return await this.db
      .prepare('SELECT * FROM knowledge_articles WHERE slug = ?')
      .bind(slug)
      .first<KnowledgeArticle>();
  }

  async getArticleById(id: string): Promise<KnowledgeArticle | null> {
    return await this.db
      .prepare('SELECT * FROM knowledge_articles WHERE id = ?')
      .bind(id)
      .first<KnowledgeArticle>();
  }

  async getPublishedArticles(category?: string): Promise<KnowledgeArticle[]> {
    let query = 'SELECT * FROM knowledge_articles WHERE published = 1';
    const params: unknown[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY sort_order ASC, title_nl ASC';

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<KnowledgeArticle>();

    return result.results || [];
  }

  async getFeaturedArticles(): Promise<KnowledgeArticle[]> {
    const result = await this.db
      .prepare('SELECT * FROM knowledge_articles WHERE published = 1 AND featured = 1 ORDER BY sort_order ASC')
      .all<KnowledgeArticle>();

    return result.results || [];
  }

  async searchArticles(query: string, lang: 'nl' | 'en' = 'nl'): Promise<KnowledgeArticle[]> {
    // SEC-003: Escape LIKE pattern special characters to prevent pattern injection
    const searchTerm = `%${escapeLikePattern(query.toLowerCase())}%`;
    const titleField = lang === 'en' ? 'title_en' : 'title_nl';
    const contentField = lang === 'en' ? 'content_en' : 'content_nl';

    const result = await this.db
      .prepare(`
        SELECT * FROM knowledge_articles
        WHERE published = 1 AND (
          LOWER(${titleField}) LIKE ? ESCAPE '\\' OR
          LOWER(${contentField}) LIKE ? ESCAPE '\\' OR
          LOWER(tags) LIKE ? ESCAPE '\\'
        )
        ORDER BY
          CASE WHEN LOWER(${titleField}) LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
          sort_order ASC
      `)
      .bind(searchTerm, searchTerm, searchTerm, searchTerm)
      .all<KnowledgeArticle>();

    return result.results || [];
  }

  async trackArticleView(slug: string): Promise<void> {
    await this.db
      .prepare('UPDATE knowledge_articles SET view_count = view_count + 1 WHERE slug = ?')
      .bind(slug)
      .run();
  }

  async trackArticleFeedback(slug: string, helpful: boolean): Promise<void> {
    const field = helpful ? 'helpful_count' : 'not_helpful_count';
    await this.db
      .prepare(`UPDATE knowledge_articles SET ${field} = ${field} + 1 WHERE slug = ?`)
      .bind(slug)
      .run();
  }

  async createArticle(article: {
    slug: string;
    title_nl: string;
    title_en?: string;
    content_nl: string;
    content_en?: string;
    category: string;
    tags?: string[];
    published?: boolean;
    featured?: boolean;
  }): Promise<KnowledgeArticle> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO knowledge_articles (
          id, slug, title_nl, title_en, content_nl, content_en,
          category, tags, published, featured, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        article.slug,
        article.title_nl,
        article.title_en || null,
        article.content_nl,
        article.content_en || null,
        article.category,
        article.tags ? JSON.stringify(article.tags) : null,
        article.published ? 1 : 0,
        article.featured ? 1 : 0,
        now,
        now
      )
      .run();

    return (await this.getArticleById(id))!;
  }

  async updateArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<void> {
    const setClauses: string[] = ['updated_at = datetime(\'now\')'];
    const params: unknown[] = [];

    const allowedFields = [
      'slug', 'title_nl', 'title_en', 'content_nl', 'content_en',
      'category', 'tags', 'sort_order', 'published', 'featured', 'published_at'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        setClauses.push(`${field} = ?`);
        let value = (updates as Record<string, unknown>)[field];
        if (field === 'tags' && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        params.push(value);
      }
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE knowledge_articles SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM knowledge_articles WHERE id = ?')
      .bind(id)
      .run();
    return result.meta.changes > 0;
  }

  async getAllArticles(): Promise<KnowledgeArticle[]> {
    const result = await this.db
      .prepare('SELECT * FROM knowledge_articles ORDER BY category, sort_order ASC, title_nl ASC')
      .all<KnowledgeArticle>();
    return result.results || [];
  }

  // Support Patterns
  async getActivePatterns(): Promise<SupportPattern[]> {
    const result = await this.db
      .prepare('SELECT * FROM support_patterns WHERE active = 1 ORDER BY min_confidence DESC')
      .all<SupportPattern>();
    return result.results || [];
  }

  async getAllPatterns(): Promise<SupportPattern[]> {
    const result = await this.db
      .prepare('SELECT * FROM support_patterns ORDER BY category, name')
      .all<SupportPattern>();
    return result.results || [];
  }

  async getPattern(id: string): Promise<SupportPattern | null> {
    return await this.db
      .prepare('SELECT * FROM support_patterns WHERE id = ?')
      .bind(id)
      .first<SupportPattern>();
  }

  async createPattern(pattern: {
    name: string;
    trigger_keywords: string[];
    trigger_regex?: string;
    error_codes?: string[];
    category: string;
    response_template_nl: string;
    response_template_en?: string;
    solution_steps?: string[];
    related_articles?: string[];
    min_confidence?: number;
    active?: boolean;
  }): Promise<SupportPattern> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO support_patterns (
          id, name, trigger_keywords, trigger_regex, error_codes, category,
          response_template_nl, response_template_en, solution_steps, related_articles,
          min_confidence, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        pattern.name,
        JSON.stringify(pattern.trigger_keywords),
        pattern.trigger_regex || null,
        pattern.error_codes ? JSON.stringify(pattern.error_codes) : null,
        pattern.category,
        pattern.response_template_nl,
        pattern.response_template_en || null,
        pattern.solution_steps ? JSON.stringify(pattern.solution_steps) : null,
        pattern.related_articles ? JSON.stringify(pattern.related_articles) : null,
        pattern.min_confidence || 0.7,
        pattern.active !== false ? 1 : 0,
        now,
        now
      )
      .run();

    return (await this.getPattern(id))!;
  }

  async updatePattern(id: string, updates: Partial<SupportPattern>): Promise<void> {
    const setClauses: string[] = ['updated_at = datetime(\'now\')'];
    const params: unknown[] = [];

    const allowedFields = [
      'name', 'trigger_keywords', 'trigger_regex', 'error_codes', 'category',
      'response_template_nl', 'response_template_en', 'solution_steps', 'related_articles',
      'min_confidence', 'active'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        setClauses.push(`${field} = ?`);
        let value = (updates as Record<string, unknown>)[field];
        if (['trigger_keywords', 'error_codes', 'solution_steps', 'related_articles'].includes(field) && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        params.push(value);
      }
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE support_patterns SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();
  }

  async deletePattern(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM support_patterns WHERE id = ?')
      .bind(id)
      .run();
    return result.meta.changes > 0;
  }

  async trackPatternUsage(patternId: string, resolved: boolean): Promise<void> {
    const field = resolved ? 'times_resolved' : 'times_escalated';
    await this.db
      .prepare(`UPDATE support_patterns SET times_triggered = times_triggered + 1, ${field} = ${field} + 1 WHERE id = ?`)
      .bind(patternId)
      .run();
  }

  // Support Lessons
  async createLesson(lesson: {
    conversation_id?: string;
    title: string;
    description: string;
    root_cause?: string;
    solution?: string;
    prevention?: string;
    category?: string;
    tags?: string[];
    created_pattern_id?: string;
    created_article_id?: string;
    code_fix_pr?: string;
    created_by: string;
  }): Promise<SupportLesson> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO support_lessons (
          id, conversation_id, title, description, root_cause, solution, prevention,
          category, tags, created_pattern_id, created_article_id, code_fix_pr, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        lesson.conversation_id || null,
        lesson.title,
        lesson.description,
        lesson.root_cause || null,
        lesson.solution || null,
        lesson.prevention || null,
        lesson.category || null,
        lesson.tags ? JSON.stringify(lesson.tags) : null,
        lesson.created_pattern_id || null,
        lesson.created_article_id || null,
        lesson.code_fix_pr || null,
        lesson.created_by,
        now
      )
      .run();

    return (await this.db
      .prepare('SELECT * FROM support_lessons WHERE id = ?')
      .bind(id)
      .first<SupportLesson>())!;
  }

  async getLessons(limit: number = 50): Promise<SupportLesson[]> {
    const result = await this.db
      .prepare('SELECT * FROM support_lessons ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all<SupportLesson>();
    return result.results || [];
  }

  // Support Error Log
  async logError(error: {
    user_id?: string;
    conversation_id?: string;
    error_type: string;
    error_code?: string;
    error_message: string;
    error_context?: Record<string, unknown>;
    stack_trace?: string;
  }): Promise<void> {
    const id = generateId();

    await this.db
      .prepare(`
        INSERT INTO support_error_log (
          id, user_id, conversation_id, error_type, error_code, error_message, error_context, stack_trace, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        error.user_id || null,
        error.conversation_id || null,
        error.error_type,
        error.error_code || null,
        error.error_message,
        error.error_context ? JSON.stringify(error.error_context) : null,
        error.stack_trace || null
      )
      .run();
  }

  async getRecentErrors(limit: number = 100): Promise<SupportErrorLog[]> {
    const result = await this.db
      .prepare('SELECT * FROM support_error_log ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all<SupportErrorLog>();
    return result.results || [];
  }

  // Support Stats
  async getSupportStats(): Promise<SupportStats> {
    const [
      openCount,
      waitingUserCount,
      waitingSupportCount,
      resolvedTodayCount,
      totalConversations,
      avgRating,
      aiResolutionRate
    ] = await Promise.all([
      this.db.prepare("SELECT COUNT(*) as count FROM support_conversations WHERE status = 'open'").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) as count FROM support_conversations WHERE status = 'waiting_user'").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) as count FROM support_conversations WHERE status = 'waiting_support'").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) as count FROM support_conversations WHERE resolved_at > date('now')").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) as count FROM support_conversations").first<{ count: number }>(),
      this.db.prepare("SELECT AVG(satisfaction_rating) as avg FROM support_conversations WHERE satisfaction_rating IS NOT NULL").first<{ avg: number }>(),
      this.db.prepare(`
        SELECT
          CAST(SUM(CASE WHEN resolution_type = 'auto_resolved' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(COUNT(*), 0) as rate
        FROM support_conversations
        WHERE resolved_at > date('now', '-7 days')
      `).first<{ rate: number }>()
    ]);

    return {
      openConversations: openCount?.count || 0,
      waitingOnUser: waitingUserCount?.count || 0,
      waitingOnSupport: waitingSupportCount?.count || 0,
      resolvedToday: resolvedTodayCount?.count || 0,
      totalConversations: totalConversations?.count || 0,
      averageRating: avgRating?.avg || 0,
      aiResolutionRate: aiResolutionRate?.rate || 0,
    };
  }

  // ============================================
  // Email Log Operations
  // ============================================

  /**
   * Log an email that was sent or attempted
   */
  async logEmail(entry: EmailLogEntry): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO email_log (id, user_id, to_email, subject, template_name, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        entry.id,
        entry.userId || null,
        entry.toEmail,
        entry.subject,
        entry.templateName || null,
        entry.status,
        entry.errorMessage || null
      )
      .run();
  }

  /**
   * Get email logs with filters and pagination
   */
  async getEmailLogs(filters: EmailLogFilters = {}): Promise<{ emails: EmailLogWithUser[]; total: number }> {
    let whereClause = '1=1';
    const params: unknown[] = [];

    if (filters.userId) {
      whereClause += ' AND e.user_id = ?';
      params.push(filters.userId);
    }
    if (filters.status) {
      whereClause += ' AND e.status = ?';
      params.push(filters.status);
    }
    if (filters.startDate) {
      whereClause += ' AND e.sent_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND e.sent_at <= ?';
      params.push(filters.endDate);
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM email_log e WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    // Get paginated results with user info via LEFT JOIN
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT
        e.id, e.user_id, e.to_email, e.subject, e.template_name,
        e.status, e.error_message, e.sent_at,
        u.email as user_email, u.name as user_name
      FROM email_log e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE ${whereClause}
      ORDER BY e.sent_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.db
      .prepare(query)
      .bind(...params, limit, offset)
      .all<EmailLogWithUser>();

    return {
      emails: result.results || [],
      total: countResult?.count || 0,
    };
  }

  // ============================================
  // Communication Events Operations (COMM-001)
  // ============================================

  /**
   * Create a new communication event
   * Used to log all customer communications in a unified way
   */
  async createCommunicationEvent(input: CreateCommunicationEventInput): Promise<CommunicationEvent> {
    const id = generateId();
    const now = new Date().toISOString();
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

    await this.db
      .prepare(`
        INSERT INTO communication_events (id, type, direction, user_id, subject, content, metadata, related_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        input.type,
        input.direction,
        input.userId || null,
        input.subject || null,
        input.content,
        metadataJson,
        input.relatedId || null,
        now
      )
      .run();

    return {
      id,
      type: input.type,
      direction: input.direction,
      user_id: input.userId || null,
      subject: input.subject || null,
      content: input.content,
      metadata: metadataJson,
      related_id: input.relatedId || null,
      created_at: now,
    };
  }

  /**
   * Get communication events for a specific user (customer timeline)
   */
  async getCommunicationEventsByUser(
    userId: string,
    filters: CommunicationEventFilters = {}
  ): Promise<{ events: CommunicationEventWithUser[]; total: number }> {
    let whereClause = 'ce.user_id = ?';
    const params: unknown[] = [userId];

    if (filters.type) {
      whereClause += ' AND ce.type = ?';
      params.push(filters.type);
    }
    if (filters.direction) {
      whereClause += ' AND ce.direction = ?';
      params.push(filters.direction);
    }
    if (filters.startDate) {
      whereClause += ' AND ce.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND ce.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.search) {
      whereClause += " AND (ce.subject LIKE ? ESCAPE '\\' OR ce.content LIKE ? ESCAPE '\\')";
      // SEC-003: Escape LIKE pattern special characters to prevent pattern injection
      const searchTerm = `%${escapeLikePattern(filters.search)}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM communication_events ce WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    // Get paginated results
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT
        ce.*,
        u.email as user_email,
        u.name as user_name
      FROM communication_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ce.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.db
      .prepare(query)
      .bind(...params, limit, offset)
      .all<CommunicationEventWithUser>();

    return {
      events: result.results || [],
      total: countResult?.count || 0,
    };
  }

  /**
   * Get all communication events with filters (for admin overview)
   */
  async getCommunicationEvents(
    filters: CommunicationEventFilters = {}
  ): Promise<{ events: CommunicationEventWithUser[]; total: number }> {
    let whereClause = '1=1';
    const params: unknown[] = [];

    if (filters.userId) {
      whereClause += ' AND ce.user_id = ?';
      params.push(filters.userId);
    }
    if (filters.type) {
      whereClause += ' AND ce.type = ?';
      params.push(filters.type);
    }
    if (filters.direction) {
      whereClause += ' AND ce.direction = ?';
      params.push(filters.direction);
    }
    if (filters.startDate) {
      whereClause += ' AND ce.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND ce.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.search) {
      whereClause += " AND (ce.subject LIKE ? ESCAPE '\\' OR ce.content LIKE ? ESCAPE '\\')";
      // SEC-003: Escape LIKE pattern special characters to prevent pattern injection
      const searchTerm = `%${escapeLikePattern(filters.search)}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM communication_events ce WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    // Get paginated results
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT
        ce.*,
        u.email as user_email,
        u.name as user_name
      FROM communication_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ce.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.db
      .prepare(query)
      .bind(...params, limit, offset)
      .all<CommunicationEventWithUser>();

    return {
      events: result.results || [],
      total: countResult?.count || 0,
    };
  }

  /**
   * Get a single communication event by ID
   */
  async getCommunicationEvent(id: string): Promise<CommunicationEventWithUser | null> {
    const result = await this.db
      .prepare(`
        SELECT
          ce.*,
          u.email as user_email,
          u.name as user_name
        FROM communication_events ce
        LEFT JOIN users u ON ce.user_id = u.id
        WHERE ce.id = ?
      `)
      .bind(id)
      .first<CommunicationEventWithUser>();

    return result || null;
  }

  /**
   * Sync existing email log entry to communication_events
   * Called after sending an email to maintain the unified timeline
   */
  async syncEmailToCommunicationEvent(emailLogId: string, userId: string | null, subject: string, content: string, direction: CommunicationDirection = 'out'): Promise<void> {
    await this.createCommunicationEvent({
      type: 'email',
      direction,
      userId: userId || undefined,
      subject,
      content,
      relatedId: emailLogId,
      metadata: { source: 'email_log' },
    });
  }

  /**
   * Sync support message to communication_events
   */
  async syncSupportToCommunicationEvent(message: SupportMessage, userId: string, conversationSubject: string): Promise<void> {
    const direction: CommunicationDirection = message.sender_type === 'user' ? 'in' : 'out';
    await this.createCommunicationEvent({
      type: 'support',
      direction,
      userId,
      subject: conversationSubject,
      content: message.content,
      relatedId: message.conversation_id,
      metadata: {
        message_id: message.id,
        sender_type: message.sender_type,
        ai_confidence: message.ai_confidence,
      },
    });
  }

  // ============================================
  // Audit Log Operations
  // ============================================

  /**
   * Log an audit event for tracking admin actions
   * Required for security compliance
   */
  async logAuditEvent(event: {
    actorId?: string;
    actorEmail?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const id = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO audit_log (id, actor_id, actor_email, action, resource_type, resource_id, metadata, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      event.actorId || null,
      event.actorEmail || null,
      event.action,
      event.resourceType || null,
      event.resourceId || null,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.ipAddress || null,
      event.userAgent || null
    ).run();
  }
}

// ============================================
// Support System Types
// ============================================

export interface SupportConversation {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'waiting_user' | 'waiting_support' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string | null;
  assigned_to: string | null;
  handled_by: 'ai' | 'human' | 'hybrid' | null;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  resolution_type: 'auto_resolved' | 'user_resolved' | 'admin_resolved' | 'closed_inactive' | null;
  resolution_notes: string | null;
  satisfaction_rating: number | null;
  satisfaction_feedback: string | null;
  ai_confidence_score: number | null;
  matched_pattern_id: string | null;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'admin' | 'system';
  sender_id: string | null;
  content: string;
  content_type: 'text' | 'markdown' | 'html';
  ai_confidence: number | null;
  ai_pattern_used: string | null;
  ai_suggested_articles: string | null;
  is_internal: boolean;
  metadata: string | null;
  created_at: string;
  read_at: string | null;
}

export interface KnowledgeArticle {
  id: string;
  slug: string;
  title_nl: string;
  title_en: string | null;
  content_nl: string;
  content_en: string | null;
  category: string;
  tags: string | null;
  sort_order: number;
  published: boolean;
  featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface SupportPattern {
  id: string;
  name: string;
  trigger_keywords: string;
  trigger_regex: string | null;
  error_codes: string | null;
  category: string;
  response_template_nl: string;
  response_template_en: string | null;
  solution_steps: string | null;
  related_articles: string | null;
  times_triggered: number;
  times_resolved: number;
  times_escalated: number;
  active: boolean;
  min_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface SupportLesson {
  id: string;
  conversation_id: string | null;
  title: string;
  description: string;
  root_cause: string | null;
  solution: string | null;
  prevention: string | null;
  category: string | null;
  tags: string | null;
  created_pattern_id: string | null;
  created_article_id: string | null;
  code_fix_pr: string | null;
  created_by: string;
  created_at: string;
}

export interface SupportErrorLog {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  error_type: string;
  error_code: string | null;
  error_message: string;
  error_context: string | null;
  stack_trace: string | null;
  resolved: boolean;
  resolution_notes: string | null;
  pattern_id: string | null;
  created_at: string;
}

export interface SupportStats {
  openConversations: number;
  waitingOnUser: number;
  waitingOnSupport: number;
  resolvedToday: number;
  totalConversations: number;
  averageRating: number;
  aiResolutionRate: number;
}

// ============================================
// Email Log Types
// ============================================

export interface EmailLogEntry {
  id: string;
  userId?: string;
  toEmail: string;
  subject: string;
  templateName?: string;
  status: 'sent' | 'failed' | 'dev_mode';
  errorMessage?: string;
}

export interface EmailLog {
  id: string;
  user_id: string | null;
  to_email: string;
  subject: string;
  template_name: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export interface EmailLogWithUser extends EmailLog {
  user_email: string | null;
  user_name: string | null;
}

export interface EmailLogFilters {
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Communication Events Types (COMM-001)
// ============================================

export type CommunicationEventType = 'email' | 'support' | 'feedback';
export type CommunicationDirection = 'in' | 'out';

export interface CommunicationEvent {
  id: string;
  type: CommunicationEventType;
  direction: CommunicationDirection;
  user_id: string | null;
  subject: string | null;
  content: string;
  metadata: string | null; // JSON string
  related_id: string | null;
  created_at: string;
}

export interface CommunicationEventWithUser extends CommunicationEvent {
  user_email: string | null;
  user_name: string | null;
}

export interface CommunicationEventFilters {
  userId?: string;
  type?: CommunicationEventType;
  direction?: CommunicationDirection;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCommunicationEventInput {
  type: CommunicationEventType;
  direction: CommunicationDirection;
  userId?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
  relatedId?: string;
}
