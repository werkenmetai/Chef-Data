/**
 * Token Manager Tests
 *
 * Tests for the TokenManager class including:
 * - Token initialization and configuration
 * - Token refresh logic with proactive renewal
 * - Mutex/locking for concurrent refresh prevention
 * - Retry logic with exponential backoff
 * - Error handling for various failure scenarios
 * - Region configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager, TokenData, TokenError, TokenManagerConfig } from '../exact/token-manager';
import { ExactRegion, REGION_CONFIGS } from '../exact/regions';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TokenManager', () => {
  const defaultConfig: TokenManagerConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    region: 'NL',
    refreshBufferMs: 120000, // 2 minutes
    maxRetryAttempts: 3,
  };

  const createValidTokens = (expiresInMs: number = 600000): TokenData => ({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + expiresInMs),
    region: 'NL',
  });

  const createTokenResponse = () => ({
    access_token: 'new-access-token',
    token_type: 'Bearer',
    expires_in: 600, // 10 minutes
    refresh_token: 'new-refresh-token',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create a TokenManager with default config', () => {
      const manager = new TokenManager({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(manager.getRegion()).toBe('NL'); // Default region
    });

    it('should create a TokenManager with custom region', () => {
      const manager = new TokenManager({
        ...defaultConfig,
        region: 'BE',
      });

      expect(manager.getRegion()).toBe('BE');
    });

    it('should create a TokenManager with custom refresh buffer', () => {
      const manager = new TokenManager({
        ...defaultConfig,
        refreshBufferMs: 300000, // 5 minutes
      });

      // Can't directly test private property, but we can test behavior
      expect(manager).toBeInstanceOf(TokenManager);
    });

    it('should not have tokens initially', () => {
      const manager = new TokenManager(defaultConfig);
      expect(manager.hasValidTokens()).toBe(false);
      expect(manager.getTokenData()).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should set tokens correctly', () => {
      const manager = new TokenManager(defaultConfig);
      const tokens = createValidTokens();

      manager.setTokens(tokens);

      expect(manager.hasValidTokens()).toBe(true);
      expect(manager.getTokenData()).toEqual(tokens);
    });

    it('should update region from tokens', () => {
      const manager = new TokenManager({ ...defaultConfig, region: 'NL' });
      const tokens = createValidTokens();
      tokens.region = 'BE';

      manager.setTokens(tokens);

      expect(manager.getRegion()).toBe('BE');
    });

    it('should handle expired tokens in setTokens', () => {
      const manager = new TokenManager(defaultConfig);
      const expiredTokens: TokenData = {
        ...createValidTokens(),
        expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
      };

      manager.setTokens(expiredTokens);

      // Tokens are set but not valid
      expect(manager.getTokenData()).toEqual(expiredTokens);
      expect(manager.hasValidTokens()).toBe(false);
    });
  });

  describe('hasValidTokens', () => {
    it('should return false when no tokens are set', () => {
      const manager = new TokenManager(defaultConfig);
      expect(manager.hasValidTokens()).toBe(false);
    });

    it('should return true for valid non-expired tokens', () => {
      const manager = new TokenManager(defaultConfig);
      manager.setTokens(createValidTokens(600000)); // Expires in 10 minutes

      expect(manager.hasValidTokens()).toBe(true);
    });

    it('should return false for expired tokens', () => {
      const manager = new TokenManager(defaultConfig);
      const expiredTokens: TokenData = {
        ...createValidTokens(),
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      manager.setTokens(expiredTokens);

      expect(manager.hasValidTokens()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should throw when no tokens are available', async () => {
      const manager = new TokenManager(defaultConfig);

      await expect(manager.getAccessToken()).rejects.toThrow(TokenError);
      await expect(manager.getAccessToken()).rejects.toThrow(
        'No tokens available. Call exchangeCode() or setTokens() first.'
      );
    });

    it('should return access token when not expired', async () => {
      const manager = new TokenManager(defaultConfig);
      const tokens = createValidTokens(600000); // Expires in 10 minutes
      manager.setTokens(tokens);

      const accessToken = await manager.getAccessToken();

      expect(accessToken).toBe(tokens.accessToken);
      expect(mockFetch).not.toHaveBeenCalled(); // No refresh needed
    });

    it('should trigger refresh when token is within refresh buffer', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        refreshBufferMs: 120000, // 2 minutes
      });
      const tokens = createValidTokens(60000); // Expires in 1 minute (within buffer)
      manager.setTokens(tokens);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      const accessToken = await manager.getAccessToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(accessToken).toBe('new-access-token');
    });

    it('should trigger refresh when token is expired', async () => {
      const manager = new TokenManager(defaultConfig);
      const expiredTokens: TokenData = {
        ...createValidTokens(),
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      manager.setTokens(expiredTokens);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      const accessToken = await manager.getAccessToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(accessToken).toBe('new-access-token');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange authorization code for tokens', async () => {
      const manager = new TokenManager(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      const tokens = await manager.exchangeCode('auth-code', 'https://redirect.test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        REGION_CONFIGS.NL.tokenUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      expect(tokens.accessToken).toBe('new-access-token');
      expect(tokens.refreshToken).toBe('new-refresh-token');
    });

    it('should throw TokenError on exchange failure', async () => {
      const manager = new TokenManager(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant',
      });

      await expect(manager.exchangeCode('bad-code', 'https://redirect.test')).rejects.toThrow(
        TokenError
      );
    });

    it('should call onTokenRefresh callback after exchange', async () => {
      const onTokenRefresh = vi.fn().mockResolvedValue(undefined);
      const manager = new TokenManager({ ...defaultConfig, onTokenRefresh });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      await manager.exchangeCode('auth-code', 'https://redirect.test');

      expect(onTokenRefresh).toHaveBeenCalledTimes(1);
      expect(onTokenRefresh).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        })
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const manager = new TokenManager(defaultConfig);
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      const tokens = await manager.refreshTokens();

      expect(tokens.accessToken).toBe('new-access-token');
      expect(tokens.refreshToken).toBe('new-refresh-token');
    });

    it('should throw TokenError when no tokens to refresh', async () => {
      const manager = new TokenManager(defaultConfig);

      await expect(manager.refreshTokens()).rejects.toThrow(TokenError);
    });

    it('should include correct message when no tokens to refresh', async () => {
      const manager = new TokenManager(defaultConfig);

      await expect(manager.refreshTokens()).rejects.toThrow('No tokens to refresh');
    });

    it('should call onTokenRefresh callback after refresh', async () => {
      const onTokenRefresh = vi.fn().mockResolvedValue(undefined);
      const manager = new TokenManager({ ...defaultConfig, onTokenRefresh });
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      await manager.refreshTokens();

      expect(onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle onTokenRefresh callback errors gracefully', async () => {
      const onTokenRefresh = vi.fn().mockRejectedValue(new Error('Callback error'));
      const manager = new TokenManager({ ...defaultConfig, onTokenRefresh });
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      // Should not throw even if callback fails
      const tokens = await manager.refreshTokens();
      expect(tokens.accessToken).toBe('new-access-token');
    });
  });

  describe('Mutex Protection (EXACT-010)', () => {
    it('should prevent concurrent refresh calls', async () => {
      const manager = new TokenManager(defaultConfig);
      manager.setTokens(createValidTokens());

      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      mockFetch.mockImplementationOnce(async () => {
        await firstPromise;
        return {
          ok: true,
          json: async () => createTokenResponse(),
        };
      });

      // Start two concurrent refreshes
      const refresh1 = manager.refreshTokens();
      const refresh2 = manager.refreshTokens();

      // Resolve the first call
      resolveFirst!();

      const [result1, result2] = await Promise.all([refresh1, refresh2]);

      // Both should get the same result
      expect(result1).toEqual(result2);
      // Fetch should only be called once due to mutex
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors to all waiters', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        maxRetryAttempts: 1, // No retries
      });
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant',
      });

      // Start two concurrent refreshes
      const refresh1 = manager.refreshTokens();
      const refresh2 = manager.refreshTokens();

      // Both should fail
      await expect(refresh1).rejects.toThrow(TokenError);
      await expect(refresh2).rejects.toThrow(TokenError);
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('should retry failed refresh attempts', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        maxRetryAttempts: 3,
      });
      manager.setTokens(createValidTokens());

      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createTokenResponse(),
        });

      const tokens = await manager.refreshTokens();

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(tokens.accessToken).toBe('new-access-token');
    });

    it('should not retry on invalid_grant (re-authentication required)', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        maxRetryAttempts: 3,
      });
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant',
      });

      try {
        await manager.refreshTokens();
        expect.fail('Should have thrown TokenError');
      } catch (error) {
        expect(error).toBeInstanceOf(TokenError);
        expect((error as TokenError).message).toContain('re-authenticate');
        expect((error as TokenError).requiresReauth).toBe(true);
      }

      // Should only call once (no retry for invalid_grant)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw after all retry attempts exhausted', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        maxRetryAttempts: 2,
      });
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

      await expect(manager.refreshTokens()).rejects.toThrow(TokenError);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should mark TokenError with requiresReauth for invalid_grant', async () => {
      const manager = new TokenManager(defaultConfig);
      manager.setTokens(createValidTokens());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant',
      });

      try {
        await manager.refreshTokens();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TokenError);
        expect((error as TokenError).requiresReauth).toBe(true);
      }
    });
  });

  describe('Proactive Refresh (2 minutes before expiry)', () => {
    it('should refresh when within 2 minute buffer', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        refreshBufferMs: 120000, // 2 minutes
      });
      // Token expires in 90 seconds (within 2 minute buffer)
      manager.setTokens(createValidTokens(90000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      await manager.getAccessToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not refresh when outside buffer', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        refreshBufferMs: 120000, // 2 minutes
      });
      // Token expires in 5 minutes (outside 2 minute buffer)
      manager.setTokens(createValidTokens(300000));

      const token = await manager.getAccessToken();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(token).toBe('test-access-token');
    });

    it('should handle custom refresh buffer', async () => {
      const manager = new TokenManager({
        ...defaultConfig,
        refreshBufferMs: 300000, // 5 minutes
      });
      // Token expires in 4 minutes (within 5 minute buffer)
      manager.setTokens(createValidTokens(240000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      await manager.getAccessToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Region Management', () => {
    it('should get region correctly', () => {
      const manager = new TokenManager({ ...defaultConfig, region: 'UK' });
      expect(manager.getRegion()).toBe('UK');
    });

    it('should set region correctly', () => {
      const manager = new TokenManager(defaultConfig);
      manager.setRegion('DE');
      expect(manager.getRegion()).toBe('DE');
    });

    it('should update token region when setRegion is called with existing tokens', () => {
      const manager = new TokenManager(defaultConfig);
      manager.setTokens(createValidTokens());

      manager.setRegion('FR');

      expect(manager.getRegion()).toBe('FR');
      expect(manager.getTokenData()?.region).toBe('FR');
    });

    it('should use correct token URL for each region', async () => {
      const regions: ExactRegion[] = ['NL', 'BE', 'UK', 'DE', 'US', 'ES', 'FR'];

      for (const region of regions) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createTokenResponse(),
        });

        const manager = new TokenManager({ ...defaultConfig, region });
        manager.setTokens({ ...createValidTokens(), region });

        await manager.refreshTokens();

        expect(mockFetch).toHaveBeenLastCalledWith(
          REGION_CONFIGS[region].tokenUrl,
          expect.any(Object)
        );
      }
    });
  });

  describe('buildAuthUrl', () => {
    it('should build correct authorization URL', () => {
      const manager = new TokenManager(defaultConfig);
      const redirectUri = 'https://app.test/callback';
      const state = 'random-state-123';

      const authUrl = manager.buildAuthUrl(redirectUri, state);

      expect(authUrl).toContain(REGION_CONFIGS.NL.authUrl);
      expect(authUrl).toContain(`client_id=${defaultConfig.clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain(`state=${state}`);
    });

    it('should use correct auth URL for different regions', () => {
      const regions: ExactRegion[] = ['NL', 'BE', 'UK', 'DE'];

      for (const region of regions) {
        const manager = new TokenManager({ ...defaultConfig, region });
        const authUrl = manager.buildAuthUrl('https://app.test', 'state');

        expect(authUrl).toContain(REGION_CONFIGS[region].authUrl);
      }
    });

    it('should encode redirect URI properly', () => {
      const manager = new TokenManager(defaultConfig);
      const redirectUri = 'https://app.test/callback?param=value&other=test';

      const authUrl = manager.buildAuthUrl(redirectUri, 'state');

      expect(authUrl).toContain(encodeURIComponent(redirectUri));
    });
  });

  describe('getTokenData', () => {
    it('should return null when no tokens set', () => {
      const manager = new TokenManager(defaultConfig);
      expect(manager.getTokenData()).toBeNull();
    });

    it('should return token data when tokens are set', () => {
      const manager = new TokenManager(defaultConfig);
      const tokens = createValidTokens();
      manager.setTokens(tokens);

      expect(manager.getTokenData()).toEqual(tokens);
    });
  });

  describe('TokenError', () => {
    it('should create TokenError with message', () => {
      const error = new TokenError('Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TokenError);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('TokenError');
      expect(error.requiresReauth).toBe(false);
    });

    it('should create TokenError with requiresReauth flag', () => {
      const error = new TokenError('Re-authentication needed', true);

      expect(error.requiresReauth).toBe(true);
    });

    it('should default requiresReauth to false', () => {
      const error = new TokenError('Some error');
      expect(error.requiresReauth).toBe(false);
    });
  });

  describe('Token Expiration Calculation', () => {
    it('should parse expires_in correctly from token response', async () => {
      const manager = new TokenManager(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          token_type: 'Bearer',
          expires_in: 600, // 10 minutes
          refresh_token: 'new-refresh',
        }),
      });

      const tokens = await manager.exchangeCode('code', 'https://redirect.test');

      // Token should expire approximately 10 minutes from now
      const expectedExpiry = Date.now() + 600 * 1000;
      const actualExpiry = tokens.expiresAt.getTime();

      // Allow 1 second tolerance
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('Request Body Formatting', () => {
    it('should send correct body for authorization code exchange', async () => {
      const manager = new TokenManager(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      await manager.exchangeCode('test-code', 'https://redirect.test');

      const [, options] = mockFetch.mock.calls[0];
      const body = new URLSearchParams(options.body);

      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('test-code');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('client_secret')).toBe('test-client-secret');
      expect(body.get('redirect_uri')).toBe('https://redirect.test');
    });

    it('should send correct body for token refresh', async () => {
      const manager = new TokenManager(defaultConfig);
      const tokens = createValidTokens();
      manager.setTokens(tokens);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createTokenResponse(),
      });

      await manager.refreshTokens();

      const [, options] = mockFetch.mock.calls[0];
      const body = new URLSearchParams(options.body);

      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe(tokens.refreshToken);
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('client_secret')).toBe('test-client-secret');
    });
  });
});
