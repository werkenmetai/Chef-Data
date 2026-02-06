/**
 * CORS Configuration for MCP Server
 *
 * SEC-002: Restricts Access-Control-Allow-Origin to known origins
 * instead of using wildcard (*) which allows any origin.
 *
 * Whitelist:
 * - praatmetjeboekhouding.nl (production)
 * - localhost:* (development only)
 * - *.pages.dev (Cloudflare Pages staging)
 */

import { Env } from '../types';

/**
 * Allowed origins for CORS
 */
const ALLOWED_ORIGINS = [
  'https://praatmetjeboekhouding.nl',
  'https://www.praatmetjeboekhouding.nl',
  'https://api.praatmetjeboekhouding.nl',
  // MCP Clients (AI assistants that need OAuth token exchange)
  'https://chatgpt.com',
  'https://chat.openai.com',
  // Claude AI (Anthropic)
  'https://claude.ai',
];

/**
 * Development origins (only allowed in non-production)
 */
const DEV_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/.*\.pages\.dev$/,
  /^https:\/\/.*\.workers\.dev$/,
];

/**
 * Check if an origin is allowed
 *
 * @param origin - The Origin header from the request
 * @param env - Environment variables to check if we're in production
 * @returns true if the origin is allowed
 */
export function isOriginAllowed(origin: string | null, env?: Env): boolean {
  if (!origin) {
    // No origin header - could be same-origin or server-to-server
    // Allow for backwards compatibility with API clients
    return true;
  }

  // Check exact matches first (production origins)
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check development origins only in non-production environments
  const isProduction = env?.ENVIRONMENT === 'production';
  if (!isProduction) {
    for (const pattern of DEV_ORIGINS) {
      if (pattern.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Content-Security-Policy for MCP Server (API responses)
 *
 * SEC-P2-002: Defense-in-depth against XSS
 * - Restrictive policy for JSON API responses
 * - Prevents any script execution if response is somehow rendered as HTML
 */
const MCP_CSP_POLICY = [
  "default-src 'none'",          // Block everything by default
  "frame-ancestors 'none'",      // Prevent clickjacking
  "base-uri 'none'",             // Prevent base tag injection
  "form-action 'none'",          // Prevent form submissions
].join('; ');

/**
 * Get CORS headers for a request
 *
 * SEC-002: Returns origin-specific headers instead of wildcard
 * SEC-P2-002: Includes Content-Security-Policy header
 *
 * @param request - The incoming request (to read Origin header)
 * @param env - Environment variables
 * @returns CORS headers object
 */
export function getCorsHeaders(
  request?: Request,
  env?: Env
): Record<string, string> {
  const origin = request?.headers.get('Origin') ?? null;

  // If origin is allowed, reflect it back; otherwise use the primary domain
  const allowedOrigin = isOriginAllowed(origin, env) && origin
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Accept',
    'Access-Control-Max-Age': '86400', // 24 hours preflight cache
    'Vary': 'Origin', // Important for caching with multiple origins
    'Content-Security-Policy': MCP_CSP_POLICY, // SEC-P2-002: CSP header
    'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
    'X-Frame-Options': 'DENY', // Legacy clickjacking protection
  };
}

/**
 * Get CORS headers for health endpoints
 * More restrictive - only GET/HEAD/OPTIONS
 *
 * @param request - The incoming request
 * @param env - Environment variables
 * @returns CORS headers for health endpoints
 */
export function getHealthCorsHeaders(
  request?: Request,
  env?: Env
): Record<string, string> {
  const origin = request?.headers.get('Origin') ?? null;

  const allowedOrigin = isOriginAllowed(origin, env) && origin
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Vary': 'Origin',
  };
}

/**
 * Get CORS headers for OAuth endpoints
 *
 * @param request - The incoming request
 * @param env - Environment variables
 * @returns CORS headers for OAuth endpoints
 */
export function getOAuthCorsHeaders(
  request?: Request,
  env?: Env
): Record<string, string> {
  const origin = request?.headers.get('Origin') ?? null;

  const allowedOrigin = isOriginAllowed(origin, env) && origin
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

/**
 * Create a preflight response for CORS OPTIONS requests
 *
 * @param request - The incoming OPTIONS request
 * @param env - Environment variables
 * @returns Response with appropriate CORS headers
 */
export function handleCorsPreflightRequest(
  request: Request,
  env?: Env
): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  });
}
