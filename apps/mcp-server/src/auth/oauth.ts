/**
 * OAuth 2.1 Implementation for MCP Server
 *
 * Implements the MCP Authorization specification including:
 * - OAuth 2.0 Authorization Server Metadata (RFC 8414)
 * - OAuth 2.0 Protected Resource Metadata (RFC 9728)
 * - OAuth 2.0 Dynamic Client Registration (RFC 7591)
 * - PKCE (RFC 7636) with S256 method
 */

import { Env } from '../types';
import { getOAuthCorsHeaders } from '../lib/cors';
import { logger } from '../lib/logger';

// Server configuration
// Default to production URLs - only use staging if explicitly set
const getServerConfig = (env: Env) => {
  const isStaging = env.ENVIRONMENT === 'staging' || env.ENVIRONMENT === 'development';

  const baseUrl = isStaging
    ? 'https://exact-mcp-api.matthijs-9b9.workers.dev'
    : 'https://api.praatmetjeboekhouding.nl';

  const authPortalUrl = isStaging
    ? 'https://exact-online-mcp.pages.dev'
    : 'https://praatmetjeboekhouding.nl';

  return { baseUrl, authPortalUrl };
};

/**
 * Generate a cryptographically secure random string
 */
function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hash a string using SHA-256
 */
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Verify PKCE code challenge (S256 method)
 */
async function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const computed = base64UrlEncode(String.fromCharCode(...hashArray));
  return computed === codeChallenge;
}

// SEC-002: CORS headers are now obtained via getOAuthCorsHeaders() from lib/cors.ts
// This restricts origins to known domains instead of using wildcard (*)

/**
 * OAuth Authorization Server Metadata (RFC 8414)
 * Endpoint: /.well-known/oauth-authorization-server
 */
export function handleAuthorizationServerMetadata(env: Env, request?: Request): Response {
  const { baseUrl } = getServerConfig(env);

  const metadata = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none', // For public clients
    ],
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    code_challenge_methods_supported: ['S256'],
    // MCP specific
    service_documentation: 'https://praatmetjeboekhouding.nl/docs',
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...getOAuthCorsHeaders(request, env),
    },
  });
}

/**
 * OAuth Protected Resource Metadata (RFC 9728)
 * Endpoint: /.well-known/oauth-protected-resource
 */
export function handleProtectedResourceMetadata(env: Env, request?: Request): Response {
  const { baseUrl } = getServerConfig(env);

  const metadata = {
    resource: baseUrl,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp:tools', 'mcp:resources', 'openid', 'profile'],
    resource_signing_alg_values_supported: ['RS256'],
    resource_documentation: 'https://praatmetjeboekhouding.nl/docs',
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...getOAuthCorsHeaders(request, env),
    },
  });
}

/**
 * MCP Protocol Version Header (HEAD request)
 * Endpoint: / (HEAD)
 */
export function handleMCPVersionHead(request?: Request, env?: Env): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'MCP-Protocol-Version': '2025-11-25',
      ...getOAuthCorsHeaders(request, env),
    },
  });
}

/**
 * Dynamic Client Registration (RFC 7591)
 * Endpoint: POST /oauth/register
 */
export async function handleClientRegistration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as {
      client_name?: string;
      redirect_uris: string[];
      grant_types?: string[];
      response_types?: string[];
      token_endpoint_auth_method?: string;
      scope?: string;
    };

    // Validate required fields
    if (!body.redirect_uris || !Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'invalid_client_metadata',
          error_description: 'redirect_uris is required and must be a non-empty array',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
        }
      );
    }

    // Validate redirect URIs (must be HTTPS or localhost for development)
    for (const uri of body.redirect_uris) {
      try {
        const url = new URL(uri);
        if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          return new Response(
            JSON.stringify({
              error: 'invalid_redirect_uri',
              error_description: 'redirect_uris must use HTTPS (except localhost)',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
            }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({
            error: 'invalid_redirect_uri',
            error_description: 'Invalid redirect_uri format',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
          }
        );
      }
    }

    // Generate client credentials
    const clientId = `mcp_${generateSecureToken(16)}`;
    const clientSecret = generateSecureToken(32);
    const id = generateUUID();

    // Determine if this is a public or confidential client
    const authMethod = body.token_endpoint_auth_method || 'client_secret_basic';
    const isPublicClient = authMethod === 'none';

    // Store client in database
    await env.DB.prepare(`
      INSERT INTO oauth_clients (
        id, client_id, client_secret, client_name, redirect_uris,
        grant_types, response_types, token_endpoint_auth_method, scope
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      clientId,
      isPublicClient ? null : await sha256(clientSecret),
      body.client_name || 'Unknown Client',
      JSON.stringify(body.redirect_uris),
      JSON.stringify(body.grant_types || ['authorization_code', 'refresh_token']),
      JSON.stringify(body.response_types || ['code']),
      authMethod,
      body.scope || 'openid profile'
    ).run();

    // Return client credentials
    const response: Record<string, unknown> = {
      client_id: clientId,
      client_name: body.client_name || 'Unknown Client',
      redirect_uris: body.redirect_uris,
      grant_types: body.grant_types || ['authorization_code', 'refresh_token'],
      response_types: body.response_types || ['code'],
      token_endpoint_auth_method: authMethod,
      scope: body.scope || 'openid profile',
    };

    // Only include client_secret for confidential clients
    if (!isPublicClient) {
      response.client_secret = clientSecret;
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
    });
  } catch (error) {
    logger.error('Client registration error', error instanceof Error ? error : undefined);
    return new Response(
      JSON.stringify({
        error: 'server_error',
        error_description: 'Failed to register client',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }
}

/**
 * Authorization Endpoint
 * Endpoint: GET /oauth/authorize
 *
 * This redirects to the auth portal for user authentication,
 * then the auth portal redirects back with an authorization code.
 */
export async function handleAuthorization(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const { authPortalUrl } = getServerConfig(env);

  // Extract OAuth parameters
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const responseType = url.searchParams.get('response_type');
  const scope = url.searchParams.get('scope') || 'openid profile';
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');
  const codeChallengeMethod = url.searchParams.get('code_challenge_method');

  // Validate required parameters
  if (!clientId || !redirectUri || !responseType) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing required parameters: client_id, redirect_uri, response_type',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Validate response_type
  if (responseType !== 'code') {
    return new Response(
      JSON.stringify({
        error: 'unsupported_response_type',
        error_description: 'Only response_type=code is supported',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // PKCE is required
  if (!codeChallenge) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'PKCE code_challenge is required',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Only S256 is supported
  if (codeChallengeMethod && codeChallengeMethod !== 'S256') {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Only S256 code_challenge_method is supported',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Verify client exists
  const client = await env.DB.prepare(`
    SELECT id, redirect_uris FROM oauth_clients WHERE client_id = ?
  `).bind(clientId).first<{ id: string; redirect_uris: string }>();

  if (!client) {
    return new Response(
      JSON.stringify({
        error: 'invalid_client',
        error_description: 'Unknown client_id',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Verify redirect_uri matches registered URIs
  const registeredUris = JSON.parse(client.redirect_uris) as string[];
  if (!registeredUris.includes(redirectUri)) {
    return new Response(
      JSON.stringify({
        error: 'invalid_redirect_uri',
        error_description: 'redirect_uri does not match registered URIs',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Store authorization request in a temporary session
  const authRequestId = generateSecureToken(32);

  // Redirect to auth portal with all necessary params
  const authPortalLoginUrl = new URL(`${authPortalUrl}/oauth/login`);
  authPortalLoginUrl.searchParams.set('auth_request_id', authRequestId);
  authPortalLoginUrl.searchParams.set('client_id', clientId);
  authPortalLoginUrl.searchParams.set('redirect_uri', redirectUri);
  authPortalLoginUrl.searchParams.set('scope', scope);
  authPortalLoginUrl.searchParams.set('state', state || '');
  authPortalLoginUrl.searchParams.set('code_challenge', codeChallenge);
  authPortalLoginUrl.searchParams.set('code_challenge_method', codeChallengeMethod || 'S256');

  return Response.redirect(authPortalLoginUrl.toString(), 302);
}

/**
 * Token Endpoint
 * Endpoint: POST /oauth/token
 */
export async function handleTokenExchange(
  request: Request,
  env: Env
): Promise<Response> {
  // Log all token exchange attempts for debugging
  const origin = request.headers.get('Origin') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  logger.info('Token exchange request received', {
    origin,
    userAgent: userAgent.substring(0, 100),
    contentType: request.headers.get('Content-Type'),
  });

  try {
    // Parse request body (application/x-www-form-urlencoded)
    const contentType = request.headers.get('Content-Type') || '';
    let body: Record<string, string>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else if (contentType.includes('application/json')) {
      body = await request.json() as Record<string, string>;
    } else {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          error_description: 'Content-Type must be application/x-www-form-urlencoded or application/json',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
        }
      );
    }

    const grantType = body.grant_type;

    if (grantType === 'authorization_code') {
      return handleAuthorizationCodeGrant(body, request, env);
    } else if (grantType === 'refresh_token') {
      return handleRefreshTokenGrant(body, request, env);
    } else {
      return new Response(
        JSON.stringify({
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code and refresh_token grants are supported',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
        }
      );
    }
  } catch (error) {
    logger.error('Token endpoint error', error instanceof Error ? error : undefined);
    return new Response(
      JSON.stringify({
        error: 'server_error',
        error_description: 'Failed to process token request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }
}

/**
 * Handle authorization_code grant
 */
async function handleAuthorizationCodeGrant(
  body: Record<string, string>,
  request: Request,
  env: Env
): Promise<Response> {
  const { code, redirect_uri, client_id, code_verifier } = body;

  logger.info('Authorization code grant attempt', {
    client_id,
    redirect_uri,
    hasCode: !!code,
    hasCodeVerifier: !!code_verifier,
  });

  if (!code || !redirect_uri || !client_id) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing required parameters: code, redirect_uri, client_id',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Look up the authorization code
  const authCode = await env.DB.prepare(`
    SELECT
      ac.id, ac.user_id, ac.redirect_uri, ac.scope,
      ac.code_challenge, ac.code_challenge_method, ac.expires_at, ac.used_at,
      oc.client_id, oc.client_secret, oc.token_endpoint_auth_method
    FROM oauth_auth_codes ac
    JOIN oauth_clients oc ON ac.client_id = oc.client_id
    WHERE ac.code = ? AND ac.client_id = ?
  `).bind(code, client_id).first<{
    id: string;
    user_id: string;
    redirect_uri: string;
    scope: string;
    code_challenge: string;
    code_challenge_method: string;
    expires_at: string;
    used_at: string | null;
    client_id: string;
    client_secret: string | null;
    token_endpoint_auth_method: string;
  }>();

  if (!authCode) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Check if code has been used
  if (authCode.used_at) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Authorization code has already been used',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Check if code has expired
  if (new Date(authCode.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Authorization code has expired',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Verify redirect_uri matches
  if (authCode.redirect_uri !== redirect_uri) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'redirect_uri does not match',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Verify PKCE code_verifier
  if (authCode.code_challenge) {
    if (!code_verifier) {
      return new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: 'code_verifier is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
        }
      );
    }

    const valid = await verifyCodeChallenge(code_verifier, authCode.code_challenge);
    if (!valid) {
      return new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid code_verifier',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
        }
      );
    }
  }

  // Authenticate client for confidential clients
  if (authCode.token_endpoint_auth_method !== 'none' && authCode.client_secret) {
    const authenticated = await authenticateClient(request, client_id, authCode.client_secret, body);
    if (!authenticated) {
      return new Response(
        JSON.stringify({
          error: 'invalid_client',
          error_description: 'Client authentication failed',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Basic realm="MCP OAuth"',
            ...getOAuthCorsHeaders(request, env),
          },
        }
      );
    }
  }

  // Mark code as used
  await env.DB.prepare(`
    UPDATE oauth_auth_codes SET used_at = datetime('now') WHERE id = ?
  `).bind(authCode.id).run();

  // Generate tokens
  const accessToken = `mcp_at_${generateSecureToken(32)}`;
  const refreshToken = `mcp_rt_${generateSecureToken(32)}`;
  const accessTokenExpiresIn = 3600; // 1 hour (refresh token = 30 days, set in SQL)

  // Store tokens
  await env.DB.prepare(`
    INSERT INTO oauth_tokens (
      id, access_token_hash, refresh_token_hash, client_id, user_id, scope,
      access_token_expires_at, refresh_token_expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'), datetime('now', '+30 days'))
  `).bind(
    generateUUID(),
    await sha256(accessToken),
    await sha256(refreshToken),
    client_id,
    authCode.user_id,
    authCode.scope
  ).run();

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: accessTokenExpiresIn,
      refresh_token: refreshToken,
      scope: authCode.scope,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        ...getOAuthCorsHeaders(request, env),
      },
    }
  );
}

/**
 * Handle refresh_token grant
 */
async function handleRefreshTokenGrant(
  body: Record<string, string>,
  request: Request,
  env: Env
): Promise<Response> {
  const { refresh_token, client_id } = body;

  if (!refresh_token || !client_id) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing required parameters: refresh_token, client_id',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  const refreshTokenHash = await sha256(refresh_token);

  // Look up the refresh token
  const token = await env.DB.prepare(`
    SELECT
      ot.id, ot.user_id, ot.scope, ot.refresh_token_expires_at, ot.revoked_at,
      oc.client_id, oc.client_secret, oc.token_endpoint_auth_method
    FROM oauth_tokens ot
    JOIN oauth_clients oc ON ot.client_id = oc.client_id
    WHERE ot.refresh_token_hash = ? AND ot.client_id = ?
  `).bind(refreshTokenHash, client_id).first<{
    id: string;
    user_id: string;
    scope: string;
    refresh_token_expires_at: string;
    revoked_at: string | null;
    client_id: string;
    client_secret: string | null;
    token_endpoint_auth_method: string;
  }>();

  if (!token) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Invalid refresh token',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Check if token is revoked
  if (token.revoked_at) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Refresh token has been revoked',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Check if token has expired
  if (new Date(token.refresh_token_expires_at) < new Date()) {
    return new Response(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Refresh token has expired',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
      }
    );
  }

  // Authenticate client for confidential clients
  if (token.token_endpoint_auth_method !== 'none' && token.client_secret) {
    const authenticated = await authenticateClient(request, client_id, token.client_secret, body);
    if (!authenticated) {
      return new Response(
        JSON.stringify({
          error: 'invalid_client',
          error_description: 'Client authentication failed',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Basic realm="MCP OAuth"',
            ...getOAuthCorsHeaders(request, env),
          },
        }
      );
    }
  }

  // Revoke old token
  await env.DB.prepare(`
    UPDATE oauth_tokens SET revoked_at = datetime('now') WHERE id = ?
  `).bind(token.id).run();

  // Generate new tokens
  const newAccessToken = `mcp_at_${generateSecureToken(32)}`;
  const newRefreshToken = `mcp_rt_${generateSecureToken(32)}`;
  const accessTokenExpiresIn = 3600; // 1 hour

  // Store new tokens
  await env.DB.prepare(`
    INSERT INTO oauth_tokens (
      id, access_token_hash, refresh_token_hash, client_id, user_id, scope,
      access_token_expires_at, refresh_token_expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'), datetime('now', '+30 days'))
  `).bind(
    generateUUID(),
    await sha256(newAccessToken),
    await sha256(newRefreshToken),
    client_id,
    token.user_id,
    token.scope
  ).run();

  return new Response(
    JSON.stringify({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: accessTokenExpiresIn,
      refresh_token: newRefreshToken,
      scope: token.scope,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        ...getOAuthCorsHeaders(request, env),
      },
    }
  );
}

/**
 * Authenticate OAuth client using Basic auth or client_secret_post
 *
 * @param request - The HTTP request (for Basic auth header)
 * @param clientId - The client_id to authenticate
 * @param storedSecretHash - The SHA-256 hash of the stored client_secret
 * @param body - The already-parsed request body (for client_secret_post)
 */
async function authenticateClient(
  request: Request,
  clientId: string,
  storedSecretHash: string,
  body: Record<string, string>
): Promise<boolean> {
  // Try Basic authentication first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const credentials = atob(authHeader.slice(6));
      const [headerClientId, clientSecret] = credentials.split(':');

      if (headerClientId !== clientId) return false;
      if (!clientSecret) return false;

      const secretHash = await sha256(clientSecret);
      // Use constant-time comparison to prevent timing attacks
      return constantTimeEqual(secretHash, storedSecretHash);
    } catch {
      return false;
    }
  }

  // Try client_secret_post (from body)
  // The client_secret must be present in the body and must match
  const bodyClientSecret = body.client_secret;
  if (bodyClientSecret) {
    const secretHash = await sha256(bodyClientSecret);
    // Use constant-time comparison to prevent timing attacks
    return constantTimeEqual(secretHash, storedSecretHash);
  }

  // No valid authentication method provided
  return false;
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
 * Token Revocation Endpoint
 * Endpoint: POST /oauth/revoke
 */
export async function handleTokenRevocation(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const tokenTypeHint = formData.get('token_type_hint') as string | null;

    if (!token) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          error_description: 'token parameter is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getOAuthCorsHeaders(request, env) },
        }
      );
    }

    const tokenHash = await sha256(token);

    // Try to revoke as access token or refresh token
    if (tokenTypeHint === 'refresh_token' || !tokenTypeHint) {
      await env.DB.prepare(`
        UPDATE oauth_tokens SET revoked_at = datetime('now')
        WHERE refresh_token_hash = ? AND revoked_at IS NULL
      `).bind(tokenHash).run();
    }

    if (tokenTypeHint === 'access_token' || !tokenTypeHint) {
      await env.DB.prepare(`
        UPDATE oauth_tokens SET revoked_at = datetime('now')
        WHERE access_token_hash = ? AND revoked_at IS NULL
      `).bind(tokenHash).run();
    }

    // Always return 200 OK for security (don't reveal if token existed)
    return new Response(null, {
      status: 200,
      headers: getOAuthCorsHeaders(request, env),
    });
  } catch (error) {
    logger.error('Token revocation error', error instanceof Error ? error : undefined);
    return new Response(null, {
      status: 200, // Still return 200 for security
      headers: getOAuthCorsHeaders(request, env),
    });
  }
}

/**
 * Validate OAuth access token and return user context
 */
export async function validateOAuthToken(
  token: string,
  env: Env
): Promise<{ userId: string; scope: string } | null> {
  if (!token.startsWith('mcp_at_')) {
    return null;
  }

  const tokenHash = await sha256(token);

  const result = await env.DB.prepare(`
    SELECT user_id, scope, access_token_expires_at, revoked_at
    FROM oauth_tokens
    WHERE access_token_hash = ?
  `).bind(tokenHash).first<{
    user_id: string;
    scope: string;
    access_token_expires_at: string;
    revoked_at: string | null;
  }>();

  if (!result) return null;
  if (result.revoked_at) return null;
  if (new Date(result.access_token_expires_at) < new Date()) return null;

  return {
    userId: result.user_id,
    scope: result.scope,
  };
}

/**
 * Generate WWW-Authenticate header for unauthorized requests
 * Per RFC 9728 Section 5.1, includes resource_metadata for OAuth discovery
 */
export function getWWWAuthenticateHeader(env: Env): string {
  const { baseUrl } = getServerConfig(env);
  return `Bearer realm="${baseUrl}", resource="${baseUrl}", resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;
}
