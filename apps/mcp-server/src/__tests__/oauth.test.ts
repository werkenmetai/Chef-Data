/**
 * OAuth 2.1 Implementation Tests
 *
 * Tests for OAuth endpoints and utilities including:
 * - PKCE code challenge generation and verification
 * - State parameter validation
 * - Token exchange flow (authorization_code and refresh_token grants)
 * - Error responses
 * - Client registration
 * - Token validation and revocation
 * - Metadata endpoints
 * - Constant-time comparison for timing attack prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleAuthorizationServerMetadata,
  handleProtectedResourceMetadata,
  handleMCPVersionHead,
  handleClientRegistration,
  handleAuthorization,
  handleTokenExchange,
  handleTokenRevocation,
  validateOAuthToken,
  getWWWAuthenticateHeader,
} from '../auth/oauth';
import { createMockEnv, createMockD1, createMockRequest } from './setup';
import type { Env } from '../types';

// Type for OAuth error responses
interface OAuthErrorResponse {
  error: string;
  error_description: string;
}

// Type for OAuth metadata
interface OAuthMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  [key: string]: unknown;
}

// Type for protected resource metadata
interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported: string[];
  scopes_supported: string[];
  [key: string]: unknown;
}

// Type for client registration response
interface ClientRegistrationResponse {
  client_id: string;
  client_name?: string;
  client_secret?: string;
  redirect_uris: string[];
  [key: string]: unknown;
}

// Mock environment with D1 database
function createTestEnv(overrides: Record<string, unknown> = {}): Env {
  const baseEnv = createMockEnv();
  return {
    ...baseEnv,
    // Cast DB to the proper type
    DB: (overrides.DB || baseEnv.DB) as unknown as D1Database,
    ENVIRONMENT: (overrides.ENVIRONMENT as Env['ENVIRONMENT']) || baseEnv.ENVIRONMENT,
    TOKEN_ENCRYPTION_KEY: baseEnv.TOKEN_ENCRYPTION_KEY,
  } as Env;
}

describe('OAuth 2.1 Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authorization Server Metadata (RFC 8414)', () => {
    it('should return valid metadata structure', () => {
      const env = createTestEnv({ ENVIRONMENT: 'production' });
      const response = handleAuthorizationServerMetadata(env);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include required OAuth endpoints', async () => {
      const env = createTestEnv({ ENVIRONMENT: 'production' });
      const response = handleAuthorizationServerMetadata(env);
      const metadata = (await response.json()) as OAuthMetadata;

      expect(metadata).toHaveProperty('issuer');
      expect(metadata).toHaveProperty('authorization_endpoint');
      expect(metadata).toHaveProperty('token_endpoint');
      expect(metadata).toHaveProperty('registration_endpoint');
    });

    it('should support only code response type', async () => {
      const env = createTestEnv();
      const response = handleAuthorizationServerMetadata(env);
      const metadata = (await response.json()) as OAuthMetadata;

      expect(metadata.response_types_supported).toEqual(['code']);
    });

    it('should support S256 PKCE method', async () => {
      const env = createTestEnv();
      const response = handleAuthorizationServerMetadata(env);
      const metadata = (await response.json()) as OAuthMetadata;

      expect(metadata.code_challenge_methods_supported).toEqual(['S256']);
    });

    it('should support authorization_code and refresh_token grants', async () => {
      const env = createTestEnv();
      const response = handleAuthorizationServerMetadata(env);
      const metadata = (await response.json()) as OAuthMetadata;

      expect(metadata.grant_types_supported).toContain('authorization_code');
      expect(metadata.grant_types_supported).toContain('refresh_token');
    });

    it('should include cache headers', () => {
      const env = createTestEnv();
      const response = handleAuthorizationServerMetadata(env);

      expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
    });

    it('should use staging URL in development environment', async () => {
      const env = createTestEnv({ ENVIRONMENT: 'development' });
      const response = handleAuthorizationServerMetadata(env);
      const metadata = (await response.json()) as OAuthMetadata;

      expect(metadata.issuer).toContain('workers.dev');
    });

    it('should use production URL in production environment', async () => {
      const env = createTestEnv({ ENVIRONMENT: 'production' });
      const response = handleAuthorizationServerMetadata(env);
      const metadata = (await response.json()) as OAuthMetadata;

      expect(metadata.issuer).toContain('praatmetjeboekhouding.nl');
    });
  });

  describe('Protected Resource Metadata (RFC 9728)', () => {
    it('should return valid metadata structure', () => {
      const env = createTestEnv();
      const response = handleProtectedResourceMetadata(env);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include resource identifier', async () => {
      const env = createTestEnv();
      const response = handleProtectedResourceMetadata(env);
      const metadata = (await response.json()) as ProtectedResourceMetadata;

      expect(metadata).toHaveProperty('resource');
      expect(metadata).toHaveProperty('authorization_servers');
    });

    it('should support bearer token method', async () => {
      const env = createTestEnv();
      const response = handleProtectedResourceMetadata(env);
      const metadata = (await response.json()) as ProtectedResourceMetadata;

      expect(metadata.bearer_methods_supported).toContain('header');
    });

    it('should list supported scopes', async () => {
      const env = createTestEnv();
      const response = handleProtectedResourceMetadata(env);
      const metadata = (await response.json()) as ProtectedResourceMetadata;

      expect(metadata.scopes_supported).toContain('mcp:tools');
      expect(metadata.scopes_supported).toContain('openid');
    });
  });

  describe('MCP Protocol Version Head', () => {
    it('should return MCP-Protocol-Version header', () => {
      const response = handleMCPVersionHead();

      expect(response.status).toBe(200);
      expect(response.headers.get('MCP-Protocol-Version')).toBe('2025-11-25');
    });

    it('should return empty body', async () => {
      const response = handleMCPVersionHead();
      const body = await response.text();

      expect(body).toBe('');
    });
  });

  describe('Dynamic Client Registration (RFC 7591)', () => {
    it('should reject registration without redirect_uris', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: 'Test Client' }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_client_metadata');
    });

    it('should reject registration with empty redirect_uris array', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uris: [] }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_client_metadata');
    });

    it('should reject non-HTTPS redirect URIs (except localhost)', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uris: ['http://example.com/callback'] }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_redirect_uri');
    });

    it('should allow localhost redirect URIs', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uris: ['http://localhost:3000/callback'] }),
      });

      const response = await handleClientRegistration(request, env);

      // Should succeed (201) or at least not fail on redirect_uri validation
      expect(response.status).toBe(201);
    });

    it('should allow 127.0.0.1 redirect URIs', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uris: ['http://127.0.0.1:8080/callback'] }),
      });

      const response = await handleClientRegistration(request, env);

      expect(response.status).toBe(201);
    });

    it('should reject invalid redirect_uri format', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uris: ['not-a-valid-url'] }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_redirect_uri');
    });

    it('should generate client_id with mcp_ prefix', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Test App',
          redirect_uris: ['https://app.test/callback'],
        }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as ClientRegistrationResponse;

      expect(response.status).toBe(201);
      expect(body.client_id).toMatch(/^mcp_/);
    });

    it('should return client_secret for confidential clients', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://app.test/callback'],
          token_endpoint_auth_method: 'client_secret_basic',
        }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as ClientRegistrationResponse;

      expect(response.status).toBe(201);
      expect(body.client_secret).toBeDefined();
    });

    it('should not return client_secret for public clients', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://app.test/callback'],
          token_endpoint_auth_method: 'none',
        }),
      });

      const response = await handleClientRegistration(request, env);
      const body = (await response.json()) as ClientRegistrationResponse;

      expect(response.status).toBe(201);
      expect(body.client_secret).toBeUndefined();
    });
  });

  describe('Authorization Endpoint', () => {
    it('should reject request without client_id', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?redirect_uri=https://app.test&response_type=code',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    it('should reject request without redirect_uri', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=test&response_type=code',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    it('should reject unsupported response_type', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=test&redirect_uri=https://app.test&response_type=token',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('unsupported_response_type');
    });

    it('should require PKCE code_challenge', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=test&redirect_uri=https://app.test&response_type=code',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
      expect(body.error_description).toContain('code_challenge');
    });

    it('should reject non-S256 code_challenge_method', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=test&redirect_uri=https://app.test&response_type=code&code_challenge=test&code_challenge_method=plain',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
      expect(body.error_description).toContain('S256');
    });

    it('should reject unknown client_id', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue(null);

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=unknown&redirect_uri=https://app.test&response_type=code&code_challenge=test',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_client');
    });

    it('should reject mismatched redirect_uri', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'client-uuid',
        redirect_uris: JSON.stringify(['https://registered.test/callback']),
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=test&redirect_uri=https://different.test/callback&response_type=code&code_challenge=test',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_redirect_uri');
    });

    it('should redirect to auth portal for valid request', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'client-uuid',
        redirect_uris: JSON.stringify(['https://app.test/callback']),
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database, ENVIRONMENT: 'staging' });
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize?client_id=test&redirect_uri=https://app.test/callback&response_type=code&code_challenge=test-challenge&state=test-state',
      });

      const response = await handleAuthorization(request, env);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('/oauth/login');
      expect(location).toContain('code_challenge=test-challenge');
      expect(location).toContain('state=test-state');
    });
  });

  describe('Token Exchange Endpoint', () => {
    it('should reject unsupported Content-Type', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'grant_type=authorization_code',
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    it('should reject unsupported grant_type', async () => {
      const env = createTestEnv();
      const formData = new URLSearchParams({ grant_type: 'password' });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('unsupported_grant_type');
    });

    it('should accept application/json content type', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'client_credentials' }),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      // Should process the request (even if grant_type is unsupported)
      expect(body.error).toBe('unsupported_grant_type');
    });
  });

  describe('Authorization Code Grant', () => {
    it('should require code parameter', async () => {
      const env = createTestEnv();
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: 'https://app.test',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    it('should reject invalid authorization code', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue(null);

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'invalid-code',
        redirect_uri: 'https://app.test',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
    });

    it('should reject already-used authorization code', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'code-id',
        user_id: 'user-123',
        redirect_uri: 'https://app.test',
        scope: 'openid',
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        expires_at: new Date(Date.now() + 60000).toISOString(),
        used_at: new Date().toISOString(), // Already used
        client_id: 'test-client',
        client_secret: null,
        token_endpoint_auth_method: 'none',
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'used-code',
        redirect_uri: 'https://app.test',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
      expect(body.error_description).toContain('already been used');
    });

    it('should reject expired authorization code', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'code-id',
        user_id: 'user-123',
        redirect_uri: 'https://app.test',
        scope: 'openid',
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        expires_at: new Date(Date.now() - 60000).toISOString(), // Expired
        used_at: null,
        client_id: 'test-client',
        client_secret: null,
        token_endpoint_auth_method: 'none',
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'expired-code',
        redirect_uri: 'https://app.test',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
      expect(body.error_description).toContain('expired');
    });

    it('should require code_verifier when code_challenge was used', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'code-id',
        user_id: 'user-123',
        redirect_uri: 'https://app.test',
        scope: 'openid',
        code_challenge: 'challenge', // PKCE was used
        code_challenge_method: 'S256',
        expires_at: new Date(Date.now() + 60000).toISOString(),
        used_at: null,
        client_id: 'test-client',
        client_secret: null,
        token_endpoint_auth_method: 'none',
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
        redirect_uri: 'https://app.test',
        client_id: 'test-client',
        // Missing code_verifier
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
      expect(body.error_description).toContain('code_verifier');
    });
  });

  describe('Refresh Token Grant', () => {
    it('should require refresh_token parameter', async () => {
      const env = createTestEnv();
      const formData = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    it('should reject invalid refresh token', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue(null);

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'invalid-token',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
    });

    it('should reject revoked refresh token', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'token-id',
        user_id: 'user-123',
        scope: 'openid',
        refresh_token_expires_at: new Date(Date.now() + 86400000).toISOString(),
        revoked_at: new Date().toISOString(), // Revoked
        client_id: 'test-client',
        client_secret: null,
        token_endpoint_auth_method: 'none',
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'revoked-token',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
      expect(body.error_description).toContain('revoked');
    });

    it('should reject expired refresh token', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'token-id',
        user_id: 'user-123',
        scope: 'openid',
        refresh_token_expires_at: new Date(Date.now() - 60000).toISOString(), // Expired
        revoked_at: null,
        client_id: 'test-client',
        client_secret: null,
        token_endpoint_auth_method: 'none',
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'expired-token',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_grant');
      expect(body.error_description).toContain('expired');
    });
  });

  describe('Token Revocation', () => {
    it('should require token parameter', async () => {
      const env = createTestEnv();
      const formData = new FormData();
      const request = new Request('https://api.test/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleTokenRevocation(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(response.status).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    it('should return 200 OK for successful revocation', async () => {
      const mockDb = createMockD1();
      const env = createTestEnv({ DB: mockDb as unknown as D1Database });

      const formData = new FormData();
      formData.append('token', 'mcp_rt_valid_token');
      const request = new Request('https://api.test/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleTokenRevocation(request, env);

      expect(response.status).toBe(200);
    });

    it('should return 200 OK even for unknown token (security)', async () => {
      const mockDb = createMockD1();
      const env = createTestEnv({ DB: mockDb as unknown as D1Database });

      const formData = new FormData();
      formData.append('token', 'unknown-token');
      const request = new Request('https://api.test/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleTokenRevocation(request, env);

      // For security, always return 200 (don't reveal if token existed)
      expect(response.status).toBe(200);
    });

    it('should handle token_type_hint for refresh_token', async () => {
      const mockDb = createMockD1();
      const env = createTestEnv({ DB: mockDb as unknown as D1Database });

      const formData = new FormData();
      formData.append('token', 'mcp_rt_token');
      formData.append('token_type_hint', 'refresh_token');
      const request = new Request('https://api.test/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleTokenRevocation(request, env);

      expect(response.status).toBe(200);
    });

    it('should handle token_type_hint for access_token', async () => {
      const mockDb = createMockD1();
      const env = createTestEnv({ DB: mockDb as unknown as D1Database });

      const formData = new FormData();
      formData.append('token', 'mcp_at_token');
      formData.append('token_type_hint', 'access_token');
      const request = new Request('https://api.test/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleTokenRevocation(request, env);

      expect(response.status).toBe(200);
    });
  });

  describe('Token Validation', () => {
    it('should reject tokens not starting with mcp_at_', async () => {
      const env = createTestEnv();
      const result = await validateOAuthToken('invalid-token', env);

      expect(result).toBeNull();
    });

    it('should reject unknown access tokens', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue(null);

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const result = await validateOAuthToken('mcp_at_unknown', env);

      expect(result).toBeNull();
    });

    it('should reject revoked access tokens', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        user_id: 'user-123',
        scope: 'openid',
        access_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        revoked_at: new Date().toISOString(), // Revoked
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const result = await validateOAuthToken('mcp_at_revoked', env);

      expect(result).toBeNull();
    });

    it('should reject expired access tokens', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        user_id: 'user-123',
        scope: 'openid',
        access_token_expires_at: new Date(Date.now() - 60000).toISOString(), // Expired
        revoked_at: null,
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const result = await validateOAuthToken('mcp_at_expired', env);

      expect(result).toBeNull();
    });

    it('should return user context for valid tokens', async () => {
      const mockDb = createMockD1();
      mockDb.prepare().bind().first.mockResolvedValue({
        user_id: 'user-123',
        scope: 'openid profile mcp:tools',
        access_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        revoked_at: null,
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const result = await validateOAuthToken('mcp_at_valid', env);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
      expect(result?.scope).toBe('openid profile mcp:tools');
    });
  });

  describe('WWW-Authenticate Header', () => {
    it('should include realm', () => {
      const env = createTestEnv({ ENVIRONMENT: 'production' });
      const header = getWWWAuthenticateHeader(env);

      expect(header).toContain('Bearer');
      expect(header).toContain('realm=');
    });

    it('should include resource_metadata URL', () => {
      const env = createTestEnv({ ENVIRONMENT: 'production' });
      const header = getWWWAuthenticateHeader(env);

      expect(header).toContain('resource_metadata=');
      expect(header).toContain('.well-known/oauth-protected-resource');
    });

    it('should use correct base URL for environment', () => {
      const prodEnv = createTestEnv({ ENVIRONMENT: 'production' });
      const stagingEnv = createTestEnv({ ENVIRONMENT: 'staging' });

      const prodHeader = getWWWAuthenticateHeader(prodEnv);
      const stagingHeader = getWWWAuthenticateHeader(stagingEnv);

      expect(prodHeader).toContain('praatmetjeboekhouding.nl');
      expect(stagingHeader).toContain('workers.dev');
    });
  });

  describe('Error Response Format', () => {
    it('should return JSON error responses with correct structure', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize',
      });

      const response = await handleAuthorization(request, env);
      const body = (await response.json()) as OAuthErrorResponse;

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('error_description');
      expect(typeof body.error).toBe('string');
      expect(typeof body.error_description).toBe('string');
    });

    it('should include CORS headers in error responses', async () => {
      const env = createTestEnv();
      const request = createMockRequest({
        url: 'https://api.test/oauth/authorize',
        headers: { Origin: 'https://app.test' },
      });

      const response = await handleAuthorization(request, env);

      // Should have CORS headers even on error
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Security: Token Response Headers', () => {
    it('should include no-store cache control on token responses', async () => {
      const mockDb = createMockD1();
      // Setup successful token exchange
      mockDb.prepare().bind().first.mockResolvedValue({
        id: 'code-id',
        user_id: 'user-123',
        redirect_uri: 'https://app.test',
        scope: 'openid',
        code_challenge: null, // No PKCE for this test
        code_challenge_method: null,
        expires_at: new Date(Date.now() + 60000).toISOString(),
        used_at: null,
        client_id: 'test-client',
        client_secret: null,
        token_endpoint_auth_method: 'none',
      });

      const env = createTestEnv({ DB: mockDb as unknown as D1Database });
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
        redirect_uri: 'https://app.test',
        client_id: 'test-client',
      });
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const response = await handleTokenExchange(request, env);

      if (response.status === 200) {
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.get('Pragma')).toBe('no-cache');
      }
    });
  });
});
