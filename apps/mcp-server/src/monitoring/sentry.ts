/**
 * Sentry Error Tracking for Cloudflare Workers
 *
 * Provides error tracking with GDPR-compliant data handling.
 * Uses @sentry/cloudflare when SENTRY_DSN is configured.
 *
 * Installation: pnpm add @sentry/cloudflare
 */

import { Env } from '../types';
import { maskEmail } from '../lib/logger';

// Sentry types for dynamic import (package is optional)
interface SentryModule {
  init: (options: Record<string, unknown>) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
  captureException: (error: Error) => void;
  captureMessage: (message: string, level?: string) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  startInactiveSpan: (options: Record<string, unknown>) => { end: () => void } | null;
  flush: (timeout: number) => Promise<void>;
}

interface SentryScope {
  setTag: (key: string, value: string | undefined) => void;
  setUser: (user: Record<string, unknown>) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  setTags: (tags: Record<string, string | undefined>) => void;
}

interface SentryEvent {
  request?: {
    data?: string;
    cookies?: Record<string, string>;
    query_string?: string;
    headers?: Record<string, string>;
  };
}

// Track initialization state
let isInitialized = false;
let sentryModule: SentryModule | null = null;

/**
 * Sentry context for error enrichment
 */
export interface SentryContext {
  requestId?: string;
  userId?: string;
  email?: string;
  plan?: string;
  tool?: string;
  endpoint?: string;
}

/**
 * Initialize Sentry with proper configuration
 * Call this once at worker startup
 */
export async function initSentry(env: Env): Promise<void> {
  if (isInitialized) return;

  if (!env.SENTRY_DSN) {
    console.log('[Sentry] No SENTRY_DSN configured, error tracking disabled');
    return;
  }

  try {
    // Dynamic import to avoid bundling issues when Sentry isn't installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imported = await import('@sentry/cloudflare' as any) as SentryModule;
    sentryModule = imported;

    sentryModule.init({
      dsn: env.SENTRY_DSN,
      environment: env.ENVIRONMENT || 'development',

      // Sample 10% of transactions for performance monitoring
      tracesSampleRate: env.ENVIRONMENT === 'production' ? 0.1 : 1.0,

      // Only send errors, not info/warning
      beforeSend(event: SentryEvent) {
        // Remove any PII from request data
        if (event.request?.data) {
          event.request.data = '[REDACTED]';
        }

        // Remove cookies
        if (event.request?.cookies) {
          event.request.cookies = {};
        }

        // Remove query strings that might contain tokens
        if (event.request?.query_string) {
          event.request.query_string = '[REDACTED]';
        }

        // Sanitize headers
        if (event.request?.headers) {
          const sanitizedHeaders: Record<string, string> = {};
          const allowedHeaders = ['content-type', 'accept', 'user-agent', 'x-request-id'];

          for (const [key, value] of Object.entries(event.request.headers)) {
            if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
              sanitizedHeaders[key] = value;
            }
          }
          event.request.headers = sanitizedHeaders;
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Network errors that aren't our fault
        'NetworkError',
        'Failed to fetch',
        // Rate limiting (expected behavior)
        'Rate limit exceeded',
        // Invalid API keys (not bugs)
        'Invalid API key',
      ],
    });

    isInitialized = true;
    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    // Sentry package not installed - that's okay, we'll use fallback logging
    console.log('[Sentry] Package not installed, using fallback logging');
    sentryModule = null;
  }
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: SentryContext
): void {
  // Always log to console for Cloudflare logs
  console.error('[Error]', JSON.stringify({
    name: error.name,
    message: error.message,
    ...context,
  }));

  if (!sentryModule || !isInitialized) {
    return;
  }

  sentryModule.withScope((scope: SentryScope) => {
    if (context) {
      if (context.requestId) {
        scope.setTag('request_id', context.requestId);
      }
      if (context.tool) {
        scope.setTag('tool', context.tool);
      }
      if (context.endpoint) {
        scope.setTag('endpoint', context.endpoint);
      }
      if (context.plan) {
        scope.setTag('plan', context.plan);
      }

      // Set user with masked data
      if (context.userId) {
        scope.setUser({
          id: context.userId,
          email: context.email ? maskEmail(context.email) : undefined,
        });
      }

      scope.setContext('request', {
        requestId: context.requestId,
        tool: context.tool,
        endpoint: context.endpoint,
      });
    }

    sentryModule!.captureException(error);
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: SentryContext
): void {
  // Always log to console
  const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
  logFn(`[Sentry:${level}] ${message}`, context ? JSON.stringify(context) : '');

  if (!sentryModule || !isInitialized) {
    return;
  }

  sentryModule.withScope((scope: SentryScope) => {
    if (context) {
      scope.setTags({
        request_id: context.requestId,
        tool: context.tool,
        endpoint: context.endpoint,
      });
    }
    sentryModule!.captureMessage(message, level);
  });
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category: string = 'default',
  data?: Record<string, unknown>
): void {
  if (!sentryModule || !isInitialized) {
    return;
  }

  // Sanitize data before adding breadcrumb
  const sanitizedData = data ? sanitizeForSentry(data) : undefined;

  sentryModule.addBreadcrumb({
    message,
    category,
    data: sanitizedData,
    level: 'info',
  });
}

/**
 * Set user context for the current scope
 */
export function setUser(userId: string, email?: string, plan?: string): void {
  if (!sentryModule || !isInitialized) {
    return;
  }

  sentryModule.setUser({
    id: userId,
    email: email ? maskEmail(email) : undefined,
    // Use custom data for plan
    data: plan ? { plan } : undefined,
  } as { id: string; email?: string; data?: Record<string, unknown> });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser(): void {
  if (!sentryModule || !isInitialized) {
    return;
  }

  sentryModule.setUser(null);
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): { finish: () => void } | null {
  if (!sentryModule || !isInitialized) {
    // Return a no-op transaction
    return { finish: () => {} };
  }

  const transaction = sentryModule.startInactiveSpan({
    name,
    op,
  });

  return {
    finish: () => transaction?.end(),
  };
}

/**
 * Sanitize data for Sentry (remove PII)
 */
function sanitizeForSentry(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['token', 'key', 'secret', 'password', 'authorization', 'cookie'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.includes('@')) {
      sanitized[key] = maskEmail(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForSentry(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Wrapper for request handlers with automatic error capture
 */
export function withSentry<T>(
  fn: () => Promise<T>,
  context?: SentryContext
): Promise<T> {
  return fn().catch((error) => {
    if (error instanceof Error) {
      captureException(error, context);
    }
    throw error;
  });
}

/**
 * Flush pending Sentry events (call before worker terminates)
 */
export async function flushSentry(timeout = 2000): Promise<void> {
  if (!sentryModule || !isInitialized) {
    return;
  }

  try {
    await sentryModule.flush(timeout);
  } catch {
    // Ignore flush errors
  }
}
