/**
 * Exact Online MCP Server
 *
 * Cloudflare Worker entry point for the MCP (Model Context Protocol) server.
 * This server provides Claude with access to Exact Online financial data.
 *
 * Uses @modelcontextprotocol/sdk with Streamable HTTP transport for proper
 * Claude Desktop compatibility.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpHandler } from 'agents/mcp';
import { z } from 'zod';
import { authenticateRequest, trackApiUsage, logSecurityEvent, AuthContext, fetchUserConnections } from './auth/api-key';
import { checkRateLimitCached } from './lib/rate-limit-cache';
import { isDemoApiKey, createDemoAuthContext, parseDemoIndustry, setCurrentDemoIndustry } from './demo';
import { validateOAuthBearerToken } from './auth/oauth-validator';
import { getAuthContextFromOAuth } from './auth/oauth-context';
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
} from './auth/oauth';
import { Env } from './types';
import { ToolRegistry } from './mcp/tools';
import { MCPServer as OurMCPServer } from './mcp/server';
import { handleHealthRoutes } from './routes/health';
import { createRequestLogger, generateRequestId } from './lib/logger';
import { initSentry, captureException, setUser } from './monitoring/sentry';
import { recordRequest, recordError } from './monitoring/metrics';
import { reportError, reportAuthError, reportRateLimitExceeded, createExceptionError } from './lib/error-reporter';
import { getCorsHeaders, handleCorsPreflightRequest } from './lib/cors';
import {
  getSSEHeaders,
  wrapMCPResponseAsSSE,
  SSEStreamWriter,
} from './lib/sse';
import { handleScheduledTokenRefresh } from './scheduled/token-refresh';

/**
 * Get first day of next month as ISO string (for rate limit reset date)
 */
function getFirstOfNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

/**
 * Create standardized rate limit exceeded response with helpful upgrade info
 */
function createRateLimitResponse(
  authContext: AuthContext,
  rateLimit: { limit: number; remaining: number },
  request: Request,
  env: Env
): Response {
  const upgradeMessage = authContext.plan === 'free'
    ? ' Upgrade naar Starter (€9) of Pro (€25) via https://praatmetjeboekhouding.nl/pricing'
    : authContext.plan === 'starter'
    ? ' Upgrade naar Pro (€25) voor meer capaciteit via https://praatmetjeboekhouding.nl/pricing'
    : ' Neem contact op voor Enterprise: support@chefdata.nl';

  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32003,
        message: `Opdrachten limiet bereikt (${rateLimit.limit}/maand op ${authContext.plan} plan). Je limiet reset op de 1e van de maand.${upgradeMessage} Bekijk je gebruik: https://praatmetjeboekhouding.nl/dashboard`,
        data: {
          limit: rateLimit.limit,
          plan: authContext.plan,
          resetDate: getFirstOfNextMonth(),
          dashboardUrl: 'https://praatmetjeboekhouding.nl/dashboard',
          pricingUrl: 'https://praatmetjeboekhouding.nl/pricing',
        },
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        ...getCorsHeaders(request, env),
      },
    }
  );
}

/**
 * Create an MCP server with all tools registered
 */
function createExactMcpServer(env: Env, ctx: ExecutionContext, authContext: AuthContext): McpServer {
  const server = new McpServer({
    name: 'exact-online-mcp',
    version: '0.2.0',
  });

  const toolRegistry = new ToolRegistry();

  // Register all tools from our registry
  for (const toolDef of toolRegistry.listTools()) {
    // Convert JSON Schema to Zod schema (simplified approach)
    const zodSchema = createZodSchemaFromJsonSchema(toolDef.inputSchema);

    server.tool(
      toolDef.name,
      toolDef.description,
      zodSchema,
      async (args): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> => {
        try {
          const result = await toolRegistry.callTool(
            toolDef.name,
            args as Record<string, unknown>,
            env,
            ctx,
            authContext
          );
          // Ensure we return the expected format
          return {
            content: result.content.map(c => ({
              type: 'text' as const,
              text: c.type === 'text' ? c.text : JSON.stringify(c),
            })),
            isError: result.isError,
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}

/**
 * Convert JSON Schema to Zod schema (basic implementation)
 */
function createZodSchemaFromJsonSchema(jsonSchema: Record<string, unknown>): Record<string, z.ZodTypeAny> {
  const properties = (jsonSchema.properties || {}) as Record<string, { type?: string; description?: string; enum?: (string | number)[] }>;
  const required = (jsonSchema.required || []) as string[];
  const zodProps: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let zodType: z.ZodTypeAny;

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          zodType = z.enum(prop.enum as [string, ...string[]]);
        } else {
          zodType = z.string();
        }
        break;
      case 'number':
      case 'integer':
        if (prop.enum) {
          // Handle numeric enum as union of literals
          const numericEnumValues = prop.enum as number[];
          zodType = z.union(numericEnumValues.map(v => z.literal(v)) as [z.ZodLiteral<number>, z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]);
        } else {
          zodType = z.number();
        }
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        zodType = z.array(z.unknown());
        break;
      default:
        zodType = z.unknown();
    }

    if (prop.description) {
      zodType = zodType.describe(prop.description);
    }

    if (!required.includes(key)) {
      zodType = zodType.optional();
    }

    zodProps[key] = zodType;
  }

  return zodProps;
}

/**
 * Extract and validate authentication from request
 */
async function authenticateAndAuthorize(
  request: Request,
  url: URL,
  env: Env,
  ctx: ExecutionContext
): Promise<{ authContext: AuthContext; rateLimit: { allowed: boolean; limit: number; remaining: number } } | Response> {
  // Extract token from multiple sources (priority order)
  let token: string | null = null;

  // 1. Check URL path first (e.g., /sse/exa_xxxx or /mcp/exa_xxxx) - EASIEST for users
  const pathMatch = url.pathname.match(/^\/(mcp|sse)\/([a-zA-Z0-9_]+)$/);
  if (pathMatch) {
    token = pathMatch[2];
  }

  // 2. Check query parameter (e.g., /sse?key=exa_xxxx)
  if (!token) {
    token = url.searchParams.get('key');
  }

  // 3. Fall back to Authorization header
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  }

  // No authentication provided - return 401 with WWW-Authenticate for OAuth discovery
  if (!token) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32001,
          message: 'Authentication required. Use API key in URL path: /mcp/YOUR_API_KEY',
        },
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': getWWWAuthenticateHeader(env),
          ...getCorsHeaders(request, env),
        },
      }
    );
  }

  // DEMO MODE: Check for demo API key (exa_demo*)
  // Demo keys skip DB lookups, rate limits, and return fake data for App Store demonstrations
  // Supports multiple industries: exa_demo_bakkerij, exa_demo_it, exa_demo_advocaat, exa_demo_aannemer
  if (isDemoApiKey(token)) {
    const industry = parseDemoIndustry(token);
    setCurrentDemoIndustry(industry);
    const demoAuthContext = createDemoAuthContext(token);
    return {
      authContext: demoAuthContext,
      rateLimit: { allowed: true, limit: Infinity, remaining: Infinity },
    };
  }

  // Try OAuth token first (mcp_at_ prefix)
  let authContext: AuthContext | null = null;
  let backgroundTask: (() => Promise<D1Result>) | undefined;
  let oauthUserMissing = false;

  if (token.startsWith('mcp_at_')) {
    const oauthResult = await validateOAuthToken(token, env);
    if (oauthResult) {
      const userResult = await env.DB.prepare(`
        SELECT email, plan FROM users WHERE id = ?
      `).bind(oauthResult.userId).first<{ email: string; plan: 'free' | 'starter' | 'pro' | 'enterprise' }>();

      if (userResult) {
        // Use optimized single-query helper (fixes N+1)
        const connections = await fetchUserConnections(oauthResult.userId, env);

        authContext = {
          userId: oauthResult.userId,
          email: userResult.email,
          plan: userResult.plan,
          apiKeyId: 'oauth',
          connections,
        };
      } else {
        // OAuth token is valid but user doesn't exist in users table
        // This happens when user hasn't connected their Exact Online account yet
        oauthUserMissing = true;
      }
    }
  }

  // Return specific error for OAuth token with missing user
  if (oauthUserMissing) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32003,
          message: 'Account setup incomplete. Please connect your Exact Online account first at https://praatmetjeboekhouding.nl/connect',
        },
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request, env),
        },
      }
    );
  }

  // Fall back to API key authentication
  if (!authContext) {
    // Pass the extracted token if it came from URL path or query (not in Authorization header)
    const authResult = await authenticateRequest(request, env, token || undefined);
    if (authResult) {
      authContext = authResult.authContext;
      backgroundTask = authResult.backgroundTask;
    }
  }

  // Execute non-blocking background task (last_used_at update)
  if (backgroundTask) {
    ctx.waitUntil(backgroundTask());
  }

  if (!authContext) {
    ctx.waitUntil(
      logSecurityEvent('invalid_api_key', env, request, {
        message: 'Invalid or revoked API key',
        keyPrefix: token?.substring(0, 12) || 'unknown',
      })
    );

    // Report auth failure to support system
    reportAuthError(env, ctx, 'Invalid or revoked API key', undefined, token?.substring(0, 12));

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32002,
          message: 'Invalid API key. Generate a new key at https://praatmetjeboekhouding.nl/dashboard',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
      }
    );
  }

  // Check rate limit (uses in-memory cache for 80% D1 query reduction)
  const rateLimit = await checkRateLimitCached(authContext, env, ctx);
  if (!rateLimit.allowed) {
    ctx.waitUntil(
      logSecurityEvent('rate_limit_exceeded', env, request, {
        userId: authContext.userId,
        apiKeyId: authContext.apiKeyId,
        plan: authContext.plan,
        limit: rateLimit.limit,
      })
    );

    // Report rate limit to support system for tracking
    reportRateLimitExceeded(env, ctx, authContext.userId, rateLimit.limit, authContext.plan);

    return createRateLimitResponse(authContext, rateLimit, request, env);
  }

  // Check if user has any connections
  if (authContext.connections.length === 0) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32004,
          message: 'No Exact Online connections found. Connect at https://praatmetjeboekhouding.nl/connect',
        },
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
      }
    );
  }

  return { authContext, rateLimit };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const requestId = generateRequestId();
    const logger = createRequestLogger(request, env.ENVIRONMENT);

    // Initialize Sentry (no-op if already initialized or no DSN)
    ctx.waitUntil(initSentry(env));

    // Handle CORS preflight - SEC-002: Use origin-specific CORS headers
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(request, env);
    }

    // HEAD request for MCP protocol version (OAuth discovery)
    // Demo keys (exa_demo*) skip OAuth - return version without WWW-Authenticate
    if (request.method === 'HEAD') {
      const headPathMatch = url.pathname.match(/^\/(mcp|sse)\/([a-zA-Z0-9_]+)$/);
      const isHeadMcpPath = url.pathname === '/' || url.pathname === '/mcp' || url.pathname === '/sse' || headPathMatch;

      if (isHeadMcpPath) {
        // Check if this is a demo key path - if so, skip OAuth header
        const tokenInPath = headPathMatch ? headPathMatch[2] : null;
        if (tokenInPath && isDemoApiKey(tokenInPath)) {
          // Demo mode: return MCP version without WWW-Authenticate (no OAuth needed)
          return new Response(null, {
            status: 200,
            headers: {
              'MCP-Protocol-Version': '2025-11-25',
              ...getCorsHeaders(request, env),
            },
          });
        }
        return handleMCPVersionHead(request, env);
      }
    }

    // =================================================================
    // RFC 9728: PATH-SPECIFIC Protected Resource Metadata for DEMO MODE
    // =================================================================
    // Claude Desktop follows RFC 9728 discovery flow:
    // 1. First tries: /.well-known/oauth-protected-resource/demo/exa_demo
    // 2. If 404, falls back to: /.well-known/oauth-protected-resource
    //
    // For demo paths, we return metadata WITHOUT authorization_servers,
    // which tells the client that NO OAuth is required for this resource.
    // =================================================================
    // Match both /demo/{key} and /mcp/{key} paths in well-known URI
    const wellKnownDemoMatch = url.pathname.match(/^\/\.well-known\/oauth-protected-resource\/(demo|mcp)\/([a-zA-Z0-9_]+)$/);
    if (wellKnownDemoMatch) {
      const demoToken = wellKnownDemoMatch[2];
      if (isDemoApiKey(demoToken)) {
        // Return Protected Resource Metadata WITHOUT authorization_servers
        // This signals to the client that NO OAuth is required
        const endpointType = wellKnownDemoMatch[1]; // 'demo' or 'mcp'
        const metadata = {
          resource: `${url.origin}/${endpointType}/${demoToken}`,
          // NO authorization_servers field = no OAuth required
          bearer_methods_supported: ['header'],
          scopes_supported: [],
          resource_documentation: 'https://praatmetjeboekhouding.nl/docs',
          // Custom field to indicate demo mode
          demo_mode: true,
          demo_note: 'This is a demo endpoint. No authentication required.',
        };
        return new Response(JSON.stringify(metadata, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            ...getCorsHeaders(request, env),
          },
        });
      }
    }

    // OAuth 2.0 Authorization Server Metadata (RFC 8414)
    if (url.pathname === '/.well-known/oauth-authorization-server') {
      return handleAuthorizationServerMetadata(env, request);
    }

    // OAuth 2.0 Protected Resource Metadata (RFC 9728) - Root endpoint
    // This is used for normal (non-demo) MCP connections
    if (url.pathname === '/.well-known/oauth-protected-resource') {
      return handleProtectedResourceMetadata(env, request);
    }

    // Dynamic Client Registration (RFC 7591)
    if (url.pathname === '/oauth/register' && request.method === 'POST') {
      return handleClientRegistration(request, env);
    }

    // Authorization Endpoint
    if (url.pathname === '/oauth/authorize' && request.method === 'GET') {
      return handleAuthorization(request, env);
    }

    // Token Endpoint
    if (url.pathname === '/oauth/token' && request.method === 'POST') {
      return handleTokenExchange(request, env);
    }

    // Token Revocation Endpoint
    if (url.pathname === '/oauth/revoke' && request.method === 'POST') {
      return handleTokenRevocation(request, env);
    }

    // Health check endpoints (multiple variants)
    const healthResponse = handleHealthRoutes(request, url, env);
    if (healthResponse) {
      return healthResponse;
    }

    // =================================================================
    // DEMO MODE ENDPOINT - NO OAUTH REQUIRED
    // =================================================================
    // This endpoint allows Claude Desktop to connect without OAuth.
    // URL format: /demo/{demo_key} (e.g., /demo/exa_demo_bakkerij)
    // Claude Desktop: Add custom connector with URL:
    //   https://api.praatmetjeboekhouding.nl/demo/exa_demo
    // =================================================================
    const demoPathMatch = url.pathname.match(/^\/demo\/([a-zA-Z0-9_]+)$/);
    if (demoPathMatch) {
      const demoToken = demoPathMatch[1];

      // Validate this is actually a demo key
      if (!isDemoApiKey(demoToken)) {
        return new Response(
          JSON.stringify({
            error: 'Invalid demo key',
            message: 'This endpoint only accepts demo keys (exa_demo*)',
            validKeys: ['exa_demo', 'exa_demo_bakkerij', 'exa_demo_it', 'exa_demo_advocaat', 'exa_demo_aannemer'],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
          }
        );
      }

      // Set up demo context
      const industry = parseDemoIndustry(demoToken);
      setCurrentDemoIndustry(industry);
      const demoAuthContext = createDemoAuthContext(demoToken);
      // Demo mode: no rate limiting

      // HEAD request - return MCP version without OAuth
      if (request.method === 'HEAD') {
        return new Response(null, {
          status: 200,
          headers: {
            'MCP-Protocol-Version': '2025-11-25',
            ...getCorsHeaders(request, env),
          },
        });
      }

      // GET request - return server info (for Claude Desktop to show "connected")
      if (request.method === 'GET') {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 0,
            result: {
              protocolVersion: '2025-06-18',
              serverInfo: {
                name: 'exact-online-mcp-demo',
                version: '0.2.0',
                description: 'Demo MCP server - Bakkerij De Gouden Croissant B.V. (fictief)',
              },
              capabilities: {
                tools: { listChanged: true },
                resources: {},
                prompts: {},
              },
              transport: 'http',
              demo: {
                company: 'Bakkerij De Gouden Croissant B.V.',
                industry: industry,
                note: 'Dit is demo data - geen echte boekhouding',
              },
            },
          }, null, 2),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Demo-Mode': 'true',
              'X-Request-Id': requestId,
              ...getCorsHeaders(request, env),
            },
          }
        );
      }

      // POST request - handle MCP calls with demo data
      if (request.method === 'POST') {
        try {
          setUser('demo-user', 'demo@praatmetjeboekhouding.nl', 'enterprise');

          const server = createExactMcpServer(env, ctx, demoAuthContext);
          const mcpHandler = createMcpHandler(server);

          // Rewrite URL to /mcp for the handler
          const rewrittenUrl = new URL(request.url);
          rewrittenUrl.pathname = '/mcp';
          const handlerRequest = new Request(rewrittenUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });

          const response = await mcpHandler(handlerRequest, env, ctx);

          const newHeaders = new Headers(response.headers);
          Object.entries(getCorsHeaders(request, env)).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          newHeaders.set('X-Demo-Mode', 'true');
          newHeaders.set('X-Request-Id', requestId);

          return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
          });
        } catch (error) {
          logger.error('Demo MCP error', error instanceof Error ? error : undefined);

          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32603,
                message: 'Demo server error',
                data: { requestId },
              },
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'X-Demo-Mode': 'true',
                'X-Request-Id': requestId,
                ...getCorsHeaders(request, env),
              },
            }
          );
        }
      }
    }

    // Tools list endpoint - removed public access (security hardening)
    // Tool discovery happens via MCP protocol (tools/list JSON-RPC) which requires auth
    if (url.pathname === '/tools' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: 'Tool discovery is available via the MCP protocol (tools/list). Connect via /mcp or /sse with a valid API key.',
          documentation: 'https://praatmetjeboekhouding.nl/docs',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
        }
      );
    }

    // MCP protocol endpoints - requires authentication
    // Supports: /mcp, /sse, /mcp/{api_key}, /sse/{api_key}
    const mcpPaths = ['/', '/mcp', '/sse'];
    const pathMatch = url.pathname.match(/^\/(mcp|sse)\/([a-zA-Z0-9_]+)$/);
    const isMcpPath = mcpPaths.includes(url.pathname) || pathMatch;
    // MCP-004: Detect SSE transport for streaming support
    const isSSEEndpoint = url.pathname === '/sse' || (pathMatch && pathMatch[1] === 'sse');

    // P22: New OAuth-based /mcp endpoint (no token in URL)
    // This handles: /mcp without token, using OAuth Bearer token for authentication
    // Transport is determined by Accept header: text/event-stream → SSE, else HTTP
    if ((url.pathname === '/mcp' || url.pathname === '/mcp/') && !pathMatch) {
      // Check for OAuth Bearer token
      const oauthResult = await validateOAuthBearerToken(request, env);

      if (!oauthResult.valid) {
        // Return 401 with WWW-Authenticate header for OAuth discovery
        const errorMessages: Record<string, string> = {
          missing_token: 'No Bearer token provided. Complete OAuth flow first.',
          invalid_format: 'Invalid Authorization header format. Use: Bearer <token>',
          invalid_token: 'Invalid or unknown access token.',
          token_revoked: 'Access token has been revoked.',
          token_expired: 'Access token has expired. Use refresh token to get a new one.',
        };

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32001,
              message: errorMessages[oauthResult.error || 'missing_token'],
            },
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': getWWWAuthenticateHeader(env),
              ...getCorsHeaders(request, env),
            },
          }
        );
      }

      // Get auth context (Exact credentials) from OAuth user
      const contextResult = await getAuthContextFromOAuth(oauthResult.userId!, env);

      if (!contextResult.success) {
        // Return 403 with specific error about missing division
        const errorMessages: Record<string, string> = {
          no_division_linked: 'No Exact Online division linked to this account. Please connect your Exact Online administration at https://praatmetjeboekhouding.nl/connect',
          connection_not_found: 'Exact Online connection not found. Please reconnect at https://praatmetjeboekhouding.nl/connect',
          decryption_failed: 'Failed to decrypt credentials. Please reconnect your Exact Online administration.',
        };

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32003,
              message: contextResult.message || errorMessages[contextResult.error],
            },
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders(request, env),
            },
          }
        );
      }

      const authContext = contextResult.authContext;

      // Check rate limit
      const rateLimit = await checkRateLimitCached(authContext, env, ctx);
      if (!rateLimit.allowed) {
        ctx.waitUntil(
          logSecurityEvent('rate_limit_exceeded', env, request, {
            userId: authContext.userId,
            apiKeyId: authContext.apiKeyId,
            plan: authContext.plan,
            limit: rateLimit.limit,
          })
        );

        reportRateLimitExceeded(env, ctx, authContext.userId, rateLimit.limit, authContext.plan);

        return createRateLimitResponse(authContext, rateLimit, request, env);
      }

      // Determine transport based on Accept header (P22 transport negotiation)
      const acceptHeader = request.headers.get('Accept') || '';
      const useSSE = acceptHeader.includes('text/event-stream');

      // Handle GET requests
      if (request.method === 'GET') {
        if (useSSE) {
          // SSE GET establishes the event stream
          setUser(authContext.userId, authContext.email, authContext.plan);

          const writer = new SSEStreamWriter();
          const stream = writer.createStream();

          writer.writeEvent({
            type: 'endpoint',
            data: JSON.stringify({
              endpoint: `${url.origin}/mcp`,
              sessionId: requestId,
            }),
          });

          writer.writeResponse({
            jsonrpc: '2.0',
            id: 0,
            result: {
              protocolVersion: '2025-06-18',
              serverInfo: {
                name: 'exact-online-mcp',
                version: '0.2.0',
                description: 'MCP server for Exact Online financial data (OAuth + SSE)',
              },
              capabilities: {
                tools: { listChanged: true },
                resources: {},
                prompts: {},
                streaming: true,
              },
              transport: 'sse',
              user: {
                email: authContext.email,
                plan: authContext.plan,
                connections: authContext.connections.length,
              },
            },
          });

          const sseHeaders = getSSEHeaders(request, env);
          return new Response(stream, {
            status: 200,
            headers: {
              ...sseHeaders,
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-Request-Id': requestId,
            },
          });
        }

        // HTTP GET - return proper MCP initialize response for Claude Desktop
        // Claude Desktop expects a JSON-RPC initialize response to mark connection as "connected"
        setUser(authContext.userId, authContext.email, authContext.plan);

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 0,
            result: {
              protocolVersion: '2025-06-18',
              serverInfo: {
                name: 'exact-online-mcp',
                version: '0.2.0',
                description: 'MCP server for Exact Online financial data (OAuth + HTTP)',
              },
              capabilities: {
                tools: { listChanged: true },
                resources: {},
                prompts: {},
              },
              transport: 'http',
              user: {
                email: authContext.email,
                plan: authContext.plan,
                connections: authContext.connections.length,
              },
            },
          }, null, 2),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-Request-Id': requestId,
              ...getCorsHeaders(request, env),
            },
          }
        );
      }

      // Handle POST requests (actual MCP calls)
      try {
        setUser(authContext.userId, authContext.email, authContext.plan);

        const requestBody = await request.clone().text();
        logger.info('MCP OAuth request received', {
          method: request.method,
          path: url.pathname,
          useSSE,
          contentType: request.headers.get('Content-Type'),
          bodyPreview: requestBody?.substring(0, 200),
        });

        const mcpStartTime = Date.now();
        let response: Response;

        if (useSSE) {
          // SSE transport (ChatGPT style)
          const ourServer = new OurMCPServer(env, ctx, authContext);
          response = await ourServer.handleRequest(request);

          const sseResponse = await wrapMCPResponseAsSSE(response, request, env);
          const newHeaders = new Headers(sseResponse.headers);
          newHeaders.set('X-RateLimit-Limit', String(rateLimit.limit));
          newHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          newHeaders.set('X-Request-Id', requestId);

          logger.info('MCP OAuth SSE response', {
            status: response.status,
            duration: Date.now() - mcpStartTime,
          });

          return new Response(sseResponse.body, {
            status: sseResponse.status,
            headers: newHeaders,
          });
        } else {
          // HTTP Streamable transport (Claude style)
          const server = createExactMcpServer(env, ctx, authContext);
          const mcpHandler = createMcpHandler(server);
          response = await mcpHandler(request, env, ctx);

          const responseTimeMs = Date.now() - mcpStartTime;

          ctx.waitUntil(
            trackApiUsage(authContext, url.pathname, null, response.status, env, request, responseTimeMs)
          );

          recordRequest({
            requestId,
            method: request.method,
            path: url.pathname,
            statusCode: response.status,
            duration: responseTimeMs,
            userId: authContext.userId,
            plan: authContext.plan,
          });

          logger.info('MCP OAuth HTTP response', {
            status: response.status,
            duration: responseTimeMs,
          });

          const newHeaders = new Headers(response.headers);
          Object.entries(getCorsHeaders(request, env)).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          newHeaders.set('X-RateLimit-Limit', String(rateLimit.limit));
          newHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          newHeaders.set('X-Request-Id', requestId);

          return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
          });
        }
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;

        logger.error('MCP OAuth Server error', error instanceof Error ? error : undefined, {
          userId: authContext.userId,
        });

        if (error instanceof Error) {
          captureException(error, {
            requestId,
            userId: authContext.userId,
            endpoint: url.pathname,
          });
        }

        recordError({
          requestId,
          errorType: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          endpoint: url.pathname,
          userId: authContext.userId,
        });

        if (error instanceof Error) {
          reportError(
            env,
            createExceptionError(error, authContext.userId, authContext.apiKeyId, url.pathname, {
              requestId,
              endpoint: url.pathname,
            }),
            ctx
          );
        }

        ctx.waitUntil(
          trackApiUsage(authContext, url.pathname, null, 500, env, request, responseTimeMs)
        );

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: 'Internal server error',
              data: { requestId },
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Id': requestId,
              ...getCorsHeaders(request, env),
            },
          }
        );
      }
    }

    // Legacy MCP endpoints with token in URL: /mcp/{token}, /sse/{token}
    // Also handles /sse (without token) which uses the old auth flow
    if (isMcpPath) {
      // Handle GET requests with helpful instructions (e.g., user opens URL in browser)
      // For SSE endpoints, GET establishes the event stream
      if (request.method === 'GET') {
        const apiKey = pathMatch ? pathMatch[2] : null;

        // MCP-004: SSE GET request establishes the event stream
        // ChatGPT and other clients may not send Accept header, so always return SSE for /sse endpoints
        if (isSSEEndpoint) {
          // Authenticate first
          const authResult = await authenticateAndAuthorize(request, url, env, ctx);
          if (authResult instanceof Response) {
            return authResult;
          }

          const { authContext, rateLimit } = authResult;

          // Create SSE stream for long-lived connection
          const writer = new SSEStreamWriter();
          const stream = writer.createStream();

          // Send initial endpoint notification (MCP spec)
          writer.writeEvent({
            type: 'endpoint',
            data: JSON.stringify({
              endpoint: `${url.origin}/sse${apiKey ? `/${apiKey}` : ''}`,
              sessionId: requestId,
            }),
          });

          // Send server info as first message
          writer.writeResponse({
            jsonrpc: '2.0',
            id: 0,
            result: {
              protocolVersion: '2025-06-18',
              serverInfo: {
                name: 'exact-online-mcp',
                version: '0.2.0',
                description: 'MCP server for Exact Online financial data (SSE transport)',
              },
              capabilities: {
                tools: { listChanged: true },
                resources: {},
                prompts: {},
                streaming: true,
              },
              transport: 'sse',
              user: {
                email: authContext.email,
                plan: authContext.plan,
                connections: authContext.connections.length,
              },
            },
          });

          // Return SSE response with proper headers
          const sseHeaders = getSSEHeaders(request, env);
          return new Response(stream, {
            status: 200,
            headers: {
              ...sseHeaders,
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-Request-Id': requestId,
            },
          });
        }

        // DEMO MODE: For demo keys on /mcp/{demo_key}, return MCP response (not instructions)
        // This allows Claude Desktop to connect without OAuth
        if (apiKey && isDemoApiKey(apiKey)) {
          const industry = parseDemoIndustry(apiKey);
          setCurrentDemoIndustry(industry);

          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 0,
              result: {
                protocolVersion: '2025-06-18',
                serverInfo: {
                  name: 'exact-online-mcp-demo',
                  version: '0.2.0',
                  description: 'Demo MCP server - Bakkerij De Gouden Croissant B.V. (fictief)',
                },
                capabilities: {
                  tools: { listChanged: true },
                  resources: {},
                  prompts: {},
                },
                transport: 'http',
                demo: {
                  company: 'Bakkerij De Gouden Croissant B.V.',
                  industry: industry,
                  note: 'Dit is demo data - geen echte boekhouding',
                },
              },
            }, null, 2),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Demo-Mode': 'true',
                'X-Request-Id': requestId,
                ...getCorsHeaders(request, env),
              },
            }
          );
        }

        // Regular GET request - return instructions (for non-demo keys)
        return new Response(
          JSON.stringify({
            status: 'MCP Server Ready',
            message: 'This is an MCP (Model Context Protocol) endpoint. Use Claude Code or Claude Desktop to connect.',
            instructions: {
              claude_code: {
                recommended: true,
                description: 'Works reliably with MCP servers',
                command: `claude mcp add --transport http exact-online "${url.origin}/mcp/${apiKey || 'YOUR_API_KEY'}"`,
                then: 'Run: claude',
              },
              claude_desktop: {
                description: 'Custom connectors have a known bug (Dec 2025)',
                url: `${url.origin}/mcp/${apiKey || 'YOUR_API_KEY'}`,
                steps: ['Settings → Connectors → Add custom connector', 'Paste URL and click Add'],
                warning: 'May not work due to OAuth bug',
              },
              sse_transport: {
                description: 'SSE streaming for long-running operations',
                url: `${url.origin}/sse/${apiKey || 'YOUR_API_KEY'}`,
                headers: { 'Accept': 'text/event-stream' },
                note: 'Send GET with Accept: text/event-stream to establish stream',
              },
              documentation: 'https://praatmetjeboekhouding.nl/docs',
              dashboard: 'https://praatmetjeboekhouding.nl/dashboard',
            },
            api_key_detected: apiKey ? `${apiKey.substring(0, 8)}...` : null,
            version: '0.2.0',
            transport: isSSEEndpoint ? 'sse' : 'http',
          }, null, 2),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
          }
        );
      }

      // Authenticate and authorize
      const authResult = await authenticateAndAuthorize(request, url, env, ctx);
      if (authResult instanceof Response) {
        return authResult;
      }

      const { authContext, rateLimit } = authResult;

      try {
        // Set user context for error tracking
        setUser(authContext.userId, authContext.email, authContext.plan);

        // Debug: Log incoming request details for MCP troubleshooting
        const requestBody = request.method === 'POST' ? await request.clone().text() : null;
        logger.info('MCP request received', {
          method: request.method,
          path: url.pathname,
          isSSE: isSSEEndpoint,
          contentType: request.headers.get('Content-Type'),
          bodyPreview: requestBody?.substring(0, 200),
        });

        const mcpStartTime = Date.now();
        let response: Response;

        // For SSE endpoints, use our own MCP server (compatible with ChatGPT)
        // The agents/mcp handler returns 404 for SSE POST requests
        if (isSSEEndpoint && request.method === 'POST') {
          const ourServer = new OurMCPServer(env, ctx, authContext);
          response = await ourServer.handleRequest(request);

          // Wrap in SSE format
          const sseResponse = await wrapMCPResponseAsSSE(response, request, env);
          const newHeaders = new Headers(sseResponse.headers);
          newHeaders.set('X-RateLimit-Limit', String(rateLimit.limit));
          newHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          newHeaders.set('X-Request-Id', requestId);

          logger.info('SSE MCP response', {
            status: response.status,
            contentType: response.headers.get('Content-Type'),
          });

          return new Response(sseResponse.body, {
            status: sseResponse.status,
            headers: newHeaders,
          });
        }

        // For HTTP transport (/mcp endpoints), use Cloudflare's agents/mcp handler
        const server = createExactMcpServer(env, ctx, authContext);
        const mcpHandler = createMcpHandler(server);

        // FIX: Rewrite /mcp/{api_key} to /mcp for the handler
        // The agents/mcp handler expects requests on /mcp, not /mcp/{token}
        let handlerRequest = request;
        if (pathMatch && pathMatch[1] === 'mcp') {
          const rewrittenUrl = new URL(request.url);
          rewrittenUrl.pathname = '/mcp';
          handlerRequest = new Request(rewrittenUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });
        }

        response = await mcpHandler(handlerRequest, env, ctx);

        // Debug: Log response details
        const responseClone = response.clone();
        const responseBody = await responseClone.text();
        logger.info('MCP response', {
          status: response.status,
          contentType: response.headers.get('Content-Type'),
          bodyPreview: responseBody.substring(0, 200),
        });
        const responseTimeMs = Date.now() - mcpStartTime;

        // Track usage and metrics
        ctx.waitUntil(
          Promise.all([
            trackApiUsage(authContext, url.pathname, null, response.status, env, request, responseTimeMs),
          ])
        );

        // Record request metrics
        recordRequest({
          requestId,
          method: request.method,
          path: url.pathname,
          statusCode: response.status,
          duration: responseTimeMs,
          userId: authContext.userId,
          plan: authContext.plan,
        });

        logger.info('MCP request completed', {
          status: response.status,
          duration: responseTimeMs,
          userId: authContext.userId,
          transport: isSSEEndpoint ? 'sse' : 'http',
        });

        // MCP-004: For SSE endpoints, wrap response in SSE format
        if (isSSEEndpoint) {
          const sseResponse = await wrapMCPResponseAsSSE(response, request, env);
          const newHeaders = new Headers(sseResponse.headers);
          newHeaders.set('X-RateLimit-Limit', String(rateLimit.limit));
          newHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          newHeaders.set('X-Request-Id', requestId);
          return new Response(sseResponse.body, {
            status: sseResponse.status,
            headers: newHeaders,
          });
        }

        // Add CORS and rate limit headers to response
        const newHeaders = new Headers(response.headers);
        Object.entries(getCorsHeaders(request, env)).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        newHeaders.set('X-RateLimit-Limit', String(rateLimit.limit));
        newHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        newHeaders.set('X-Request-Id', requestId);

        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;

        // Log and track the error
        logger.error('MCP Server error', error instanceof Error ? error : undefined, {
          userId: authContext.userId,
        });

        // Capture in Sentry
        if (error instanceof Error) {
          captureException(error, {
            requestId,
            userId: authContext.userId,
            endpoint: url.pathname,
          });
        }

        // Record error metrics
        recordError({
          requestId,
          errorType: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          endpoint: url.pathname,
          userId: authContext.userId,
        });

        // Report error to support system for auto-ticketing
        if (error instanceof Error) {
          reportError(
            env,
            createExceptionError(error, authContext.userId, authContext.apiKeyId, url.pathname, {
              requestId,
              endpoint: url.pathname,
            }),
            ctx
          );
        }

        ctx.waitUntil(
          trackApiUsage(authContext, url.pathname, null, 500, env, request, responseTimeMs)
        );

        // SEC-005: Don't leak internal error details to clients
        // Full error is already logged via recordError() above
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: 'Internal server error',
              // Only include request ID for debugging, not error details
              data: { requestId },
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Id': requestId,
              ...getCorsHeaders(request, env),
            },
          }
        );
      }
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          '/mcp',
          '/sse',
          '/mcp/{api_key}',
          '/sse/{api_key}',
          '/demo/{demo_key}  (no OAuth, for Claude Desktop)',
          '/health',
          '/.well-known/oauth-authorization-server',
          '/.well-known/oauth-protected-resource',
        ],
        demo: {
          description: 'Demo mode without OAuth - works in Claude Desktop',
          url: 'https://api.praatmetjeboekhouding.nl/demo/exa_demo',
          validKeys: ['exa_demo', 'exa_demo_bakkerij', 'exa_demo_it', 'exa_demo_advocaat', 'exa_demo_aannemer'],
        },
        documentation: 'https://praatmetjeboekhouding.nl/docs',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
      }
    );
  },

  /**
   * P15-CRON: Scheduled handler for proactive token refresh
   * Runs every 5 minutes to refresh tokens expiring within 10 minutes
   * for users who have been active within the last 24 hours.
   */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await handleScheduledTokenRefresh(env, ctx);
  },
};
