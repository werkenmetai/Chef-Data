/**
 * Astro Middleware for Security Headers
 *
 * SEC-P2-002: Adds Content-Security-Policy and other security headers
 * to all responses for defense-in-depth against XSS and other attacks.
 */

import { defineMiddleware } from 'astro:middleware';

/**
 * Content-Security-Policy for Auth Portal
 *
 * Policy breakdown:
 * - default-src 'self': Only allow resources from same origin by default
 * - script-src 'self' 'unsafe-inline': Allow inline scripts (required for Astro hydration)
 * - style-src 'self' 'unsafe-inline': Allow inline styles (required for Tailwind)
 * - img-src 'self' data: https:: Allow images from self, data URIs, and any HTTPS
 * - font-src 'self': Only self-hosted fonts
 * - connect-src: Allow API calls to our backend and Exact Online
 * - frame-ancestors 'none': Prevent clickjacking
 * - base-uri 'self': Prevent base tag injection
 * - form-action 'self': Forms can only submit to same origin
 */
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://api.praatmetjeboekhouding.nl https://start.exactonline.nl https://start.exactonline.be https://start.exactonline.de https://start.exactonline.fr https://start.exactonline.co.uk",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // form-action removed - causes issues with OAuth flow, we use CSRF tokens instead
  "upgrade-insecure-requests",
].join('; ');

/**
 * Security headers to add to all responses
 *
 * Note: X-XSS-Protection is intentionally omitted as it's deprecated
 * in modern browsers and CSP provides better protection.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const onRequest = defineMiddleware(async (_context, next) => {
  // Get the response from the next middleware/route
  const response = await next();

  // Clone the response to modify headers
  const newResponse = new Response(response.body, response);

  // Add security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    newResponse.headers.set(header, value);
  }

  return newResponse;
});
