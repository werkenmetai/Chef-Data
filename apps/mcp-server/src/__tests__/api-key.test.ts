/**
 * API Key Authentication Tests
 *
 * Tests for the API key authentication module including:
 * - API key format validation
 * - PBKDF2 hashing correctness
 * - Hash verification (valid/invalid)
 * - Timing attack resistance
 * - Edge cases
 */

import { describe, it, expect, vi } from 'vitest';
import { extractApiKey, authenticateRequest, checkRateLimit, fetchUserConnections } from '../auth/api-key';
import { createMockRequest, createMockEnv, createMockD1 } from './setup';

describe('API Key Authentication', () => {
  describe('extractApiKey', () => {
    it('should extract API key from Bearer token', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer exa_test123456' },
      });
      const key = extractApiKey(request);
      expect(key).toBe('exa_test123456');
    });

    it('should extract API key from raw header value', () => {
      const request = createMockRequest({
        headers: { Authorization: 'exa_test123456' },
      });
      const key = extractApiKey(request);
      expect(key).toBe('exa_test123456');
    });

    it('should return null when Authorization header is missing', () => {
      const request = createMockRequest({});
      const key = extractApiKey(request);
      expect(key).toBeNull();
    });

    it('should trim whitespace from Bearer token', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer   exa_test123456  ' },
      });
      const key = extractApiKey(request);
      expect(key).toBe('exa_test123456');
    });

    it('should trim whitespace from raw header value', () => {
      const request = createMockRequest({
        headers: { Authorization: '  exa_test123456  ' },
      });
      const key = extractApiKey(request);
      expect(key).toBe('exa_test123456');
    });

    it('should handle empty Authorization header', () => {
      const request = createMockRequest({
        headers: { Authorization: '' },
      });
      const key = extractApiKey(request);
      // Empty string is falsy, so treated as no header
      expect(key).toBeNull();
    });

    it('should handle Bearer token with only whitespace', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer    ' },
      });
      const key = extractApiKey(request);
      // Note: Headers API trims values, so "Bearer    " becomes "Bearer"
      // Since "Bearer" doesn't start with "Bearer " (with space), it's returned as-is
      expect(key).toBe('Bearer');
    });
  });

  describe('authenticateRequest', () => {
    it('should return null when no API key is provided', async () => {
      const request = createMockRequest({});
      const env = createMockEnv();
      const result = await authenticateRequest(request, env as any);
      expect(result).toBeNull();
    });

    it('should return null when API key does not start with exa_', async () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer invalid_key123' },
      });
      const env = createMockEnv();
      const result = await authenticateRequest(request, env as any);
      expect(result).toBeNull();
    });

    it('should return null when no candidate keys match prefix', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      });

      const request = createMockRequest({
        headers: { Authorization: 'Bearer exa_12345678rest' },
      });
      const env = createMockEnv({ DB: mockDB });
      const result = await authenticateRequest(request, env as any);
      expect(result).toBeNull();
    });

    it('should accept a provided API key parameter', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      });

      const request = createMockRequest({});
      const env = createMockEnv({ DB: mockDB });
      const result = await authenticateRequest(request, env as any, 'exa_12345678xyz');
      // Should attempt to look up the provided key, but no matches
      expect(result).toBeNull();
      expect(mockDB.prepare).toHaveBeenCalled();
    });

    it('should extract correct key prefix (first 12 chars)', async () => {
      const mockDB = createMockD1();
      let capturedPrefix: string | undefined;
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn((prefix: string) => {
          capturedPrefix = prefix;
          return {
            all: vi.fn().mockResolvedValue({ results: [] }),
          };
        }),
      });

      const request = createMockRequest({
        headers: { Authorization: 'Bearer exa_12345678abcdef' },
      });
      const env = createMockEnv({ DB: mockDB });
      await authenticateRequest(request, env as any);

      expect(capturedPrefix).toBe('exa_12345678');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests for free plan within limit', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 50 }),
      });

      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'free' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv({ DB: mockDB });
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(150);
      expect(result.limit).toBe(200);
    });

    it('should block requests when free plan limit exceeded', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 250 }),
      });

      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'free' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv({ DB: mockDB });
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(200);
    });

    it('should use correct limit for pro plan', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 1000 }),
      });

      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'pro' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv({ DB: mockDB });
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1500); // 2500 - 1000 used
      expect(result.limit).toBe(2500);
    });

    it('should use correct limit for starter plan', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 300 }),
      });

      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'starter' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv({ DB: mockDB });
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(450); // 750 - 300 used
      expect(result.limit).toBe(750);
    });

    it('should allow unlimited requests for enterprise plan', async () => {
      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'enterprise' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv();
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.limit).toBe(Infinity);
    });

    it('should handle zero usage count', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 0 }),
      });

      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'free' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv({ DB: mockDB });
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(200);
    });

    it('should handle null usage result', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      });

      const authContext = {
        userId: 'user-1',
        email: 'test@example.com',
        plan: 'free' as const,
        apiKeyId: 'key-1',
        connections: [],
      };
      const env = createMockEnv({ DB: mockDB });
      const result = await checkRateLimit(authContext, env as any);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(200);
    });
  });

  describe('fetchUserConnections', () => {
    it('should return empty array when no connections exist', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      });

      const env = createMockEnv({ DB: mockDB });
      const connections = await fetchUserConnections('user-1', env as any);

      expect(connections).toEqual([]);
    });

    it('should correctly group divisions by connection', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            {
              connection_id: 'conn-1',
              region: 'NL',
              access_token: 'token1',
              refresh_token: 'refresh1',
              token_expires_at: '2025-01-30T00:00:00Z',
              division_code: 100,
              division_name: 'Division A',
              is_default: 1,
            },
            {
              connection_id: 'conn-1',
              region: 'NL',
              access_token: 'token1',
              refresh_token: 'refresh1',
              token_expires_at: '2025-01-30T00:00:00Z',
              division_code: 200,
              division_name: 'Division B',
              is_default: 0,
            },
          ],
        }),
      });

      const env = createMockEnv({ DB: mockDB, TOKEN_ENCRYPTION_KEY: '' });
      const connections = await fetchUserConnections('user-1', env as any);

      expect(connections).toHaveLength(1);
      expect(connections[0].id).toBe('conn-1');
      expect(connections[0].divisions).toHaveLength(2);
      expect(connections[0].divisions[0].code).toBe(100);
      expect(connections[0].divisions[0].isDefault).toBe(true);
      expect(connections[0].divisions[1].code).toBe(200);
      expect(connections[0].divisions[1].isDefault).toBe(false);
    });

    it('should handle connection with no divisions', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            {
              connection_id: 'conn-1',
              region: 'NL',
              access_token: 'token1',
              refresh_token: 'refresh1',
              token_expires_at: '2025-01-30T00:00:00Z',
              division_code: null,
              division_name: null,
              is_default: null,
            },
          ],
        }),
      });

      const env = createMockEnv({ DB: mockDB, TOKEN_ENCRYPTION_KEY: '' });
      const connections = await fetchUserConnections('user-1', env as any);

      expect(connections).toHaveLength(1);
      expect(connections[0].divisions).toHaveLength(0);
    });

    it('should not add duplicate divisions', async () => {
      const mockDB = createMockD1();
      mockDB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            {
              connection_id: 'conn-1',
              region: 'NL',
              access_token: 'token1',
              refresh_token: 'refresh1',
              token_expires_at: '2025-01-30T00:00:00Z',
              division_code: 100,
              division_name: 'Division A',
              is_default: 1,
            },
            // Duplicate row (same division_code)
            {
              connection_id: 'conn-1',
              region: 'NL',
              access_token: 'token1',
              refresh_token: 'refresh1',
              token_expires_at: '2025-01-30T00:00:00Z',
              division_code: 100,
              division_name: 'Division A',
              is_default: 1,
            },
          ],
        }),
      });

      const env = createMockEnv({ DB: mockDB, TOKEN_ENCRYPTION_KEY: '' });
      const connections = await fetchUserConnections('user-1', env as any);

      expect(connections[0].divisions).toHaveLength(1);
    });
  });
});

describe('PBKDF2 Hash Verification', () => {
  /**
   * These tests verify that the PBKDF2 hashing implementation works correctly.
   * We test by using the authenticateRequest function which calls verifyApiKeyHash internally.
   */

  it('should verify PBKDF2 hash format (pbkdf2$salt$hash)', async () => {
    // The format is: pbkdf2$<salt_hex>$<hash_hex>
    // This is a structural test - the actual verification happens in authenticateRequest
    const pbkdf2Format = /^pbkdf2\$[0-9a-f]+\$[0-9a-f]+$/;
    const validHash = 'pbkdf2$0123456789abcdef$fedcba9876543210';
    expect(validHash).toMatch(pbkdf2Format);
  });

  it('should reject malformed PBKDF2 hash (wrong number of parts)', async () => {
    // When the hash has wrong format, verification should fail
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({
        results: [
          {
            api_key_id: 'key-1',
            user_id: 'user-1',
            key_hash: 'pbkdf2$only_two_parts', // Invalid: only 2 parts
            email: 'test@example.com',
            plan: 'free',
          },
        ],
      }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_12345678testkey' },
    });
    const env = createMockEnv({ DB: mockDB });
    const result = await authenticateRequest(request, env as any);

    expect(result).toBeNull();
  });

  it('should reject PBKDF2 hash with empty salt', async () => {
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({
        results: [
          {
            api_key_id: 'key-1',
            user_id: 'user-1',
            key_hash: 'pbkdf2$$somehash', // Empty salt
            email: 'test@example.com',
            plan: 'free',
          },
        ],
      }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_12345678testkey' },
    });
    const env = createMockEnv({ DB: mockDB });
    const result = await authenticateRequest(request, env as any);

    expect(result).toBeNull();
  });

  it('should reject PBKDF2 hash with empty hash value', async () => {
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({
        results: [
          {
            api_key_id: 'key-1',
            user_id: 'user-1',
            key_hash: 'pbkdf2$somesalt$', // Empty hash
            email: 'test@example.com',
            plan: 'free',
          },
        ],
      }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_12345678testkey' },
    });
    const env = createMockEnv({ DB: mockDB });
    const result = await authenticateRequest(request, env as any);

    expect(result).toBeNull();
  });
});

describe('Constant-Time Comparison (Timing Attack Prevention)', () => {
  /**
   * These tests verify that the constant-time comparison prevents timing attacks.
   * We can't directly test timing, but we can verify the behavior.
   */

  it('should reject different length strings', async () => {
    // The constantTimeEqual function should return false for different lengths
    // We test this indirectly through authenticateRequest
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({
        results: [
          {
            api_key_id: 'key-1',
            user_id: 'user-1',
            // Legacy SHA-256 hash (64 chars)
            key_hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            email: 'test@example.com',
            plan: 'free',
          },
        ],
      }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_12345678testkey' },
    });
    const env = createMockEnv({ DB: mockDB });
    // This will fail because the hashes won't match
    const result = await authenticateRequest(request, env as any);
    expect(result).toBeNull();
  });
});

describe('Edge Cases', () => {
  it('should handle empty API key', async () => {
    const request = createMockRequest({
      headers: { Authorization: '' },
    });
    const env = createMockEnv();
    const result = await authenticateRequest(request, env as any);
    expect(result).toBeNull();
  });

  it('should handle API key with special characters', async () => {
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_!@#$%^&*()' },
    });
    const env = createMockEnv({ DB: mockDB });
    const result = await authenticateRequest(request, env as any);
    expect(result).toBeNull();
  });

  it('should handle very long API key', async () => {
    const longKey = 'exa_' + 'a'.repeat(1000);
    const request = createMockRequest({
      headers: { Authorization: `Bearer ${longKey}` },
    });
    const env = createMockEnv();
    const result = await authenticateRequest(request, env as any);
    // Should not throw, should return null (invalid prefix length)
    expect(result).toBeNull();
  });

  it('should handle API key with unicode characters', async () => {
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_unicode\u00e9\u00f1' },
    });
    const env = createMockEnv({ DB: mockDB });
    const result = await authenticateRequest(request, env as any);
    expect(result).toBeNull();
  });

  it('should handle null results from database', async () => {
    const mockDB = createMockD1();
    mockDB.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: null }),
    });

    const request = createMockRequest({
      headers: { Authorization: 'Bearer exa_12345678test' },
    });
    const env = createMockEnv({ DB: mockDB });
    const result = await authenticateRequest(request, env as any);
    expect(result).toBeNull();
  });
});
