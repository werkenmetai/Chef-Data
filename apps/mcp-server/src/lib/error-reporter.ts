/**
 * Error Reporter
 *
 * Reports errors to the auth-portal webhook for:
 * 1. Logging to support_error_log
 * 2. Auto-creating support tickets for severe errors
 * 3. Triggering the Support Agent for analysis
 */

export interface ErrorReportPayload {
  user_id?: string;
  api_key_id?: string;
  error_type: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  tool_name?: string;
  request_context?: Record<string, unknown>;
  timestamp?: string;
}

interface Env {
  AUTH_PORTAL_URL?: string;
  WEBHOOK_SECRET?: string;
  ENVIRONMENT?: string;
}

/**
 * Error types for categorization
 */
export const ErrorType = {
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  DIVISION_NOT_FOUND: 'DIVISION_NOT_FOUND',
  EXACT_API_ERROR: 'EXACT_API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

export type ErrorTypeKey = keyof typeof ErrorType;

/**
 * Report an error to the support webhook
 */
export async function reportError(
  env: Env,
  payload: ErrorReportPayload,
  ctx?: ExecutionContext
): Promise<void> {
  // Skip in development unless explicitly enabled
  if (env.ENVIRONMENT === 'development' && !env.WEBHOOK_SECRET) {
    console.log('[ErrorReporter] Skipping in development:', payload.error_type);
    return;
  }

  const webhookUrl = env.AUTH_PORTAL_URL
    ? `${env.AUTH_PORTAL_URL}/api/webhooks/mcp-error`
    : 'https://praatmetjeboekhouding.nl/api/webhooks/mcp-error';

  const report = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  const sendReport = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': env.WEBHOOK_SECRET || '',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        console.error('[ErrorReporter] Failed to report error:', response.status);
      }
    } catch (err) {
      // Don't let error reporting failures break the main flow
      console.error('[ErrorReporter] Error sending report:', err);
    }
  };

  // Use waitUntil if available for non-blocking execution
  if (ctx) {
    ctx.waitUntil(sendReport());
  } else {
    // Fire and forget - don't await to prevent blocking
    sendReport().catch(console.error);
  }
}

/**
 * Create error from Exact API response
 */
export function createExactApiError(
  response: Response,
  body: string,
  userId?: string,
  apiKeyId?: string,
  toolName?: string
): ErrorReportPayload {
  return {
    user_id: userId,
    api_key_id: apiKeyId,
    error_type: response.status === 401 || response.status === 403
      ? ErrorType.AUTH_FAILED
      : response.status === 429
        ? ErrorType.RATE_LIMIT
        : ErrorType.EXACT_API_ERROR,
    error_code: String(response.status),
    error_message: body.substring(0, 500), // Truncate long messages
    tool_name: toolName,
    request_context: {
      status: response.status,
      statusText: response.statusText,
    },
  };
}

/**
 * Create error from caught exception
 */
export function createExceptionError(
  error: Error,
  userId?: string,
  apiKeyId?: string,
  toolName?: string,
  context?: Record<string, unknown>
): ErrorReportPayload {
  const errorType = error.name === 'TimeoutError' || error.message.includes('timeout')
    ? ErrorType.TIMEOUT_ERROR
    : error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')
      ? ErrorType.CONNECTION_FAILED
      : ErrorType.INTERNAL_ERROR;

  return {
    user_id: userId,
    api_key_id: apiKeyId,
    error_type: errorType,
    error_message: error.message,
    stack_trace: error.stack?.substring(0, 2000),
    tool_name: toolName,
    request_context: context,
  };
}

/**
 * Helper to report auth failures
 */
export function reportAuthError(
  env: Env,
  ctx: ExecutionContext | undefined,
  message: string,
  userId?: string,
  apiKeyId?: string
): void {
  reportError(env, {
    user_id: userId,
    api_key_id: apiKeyId,
    error_type: ErrorType.AUTH_FAILED,
    error_message: message,
  }, ctx);
}

/**
 * Helper to report token expiry
 */
export function reportTokenExpired(
  env: Env,
  ctx: ExecutionContext | undefined,
  userId: string,
  connectionId?: string
): void {
  reportError(env, {
    user_id: userId,
    error_type: ErrorType.TOKEN_EXPIRED,
    error_message: 'OAuth token expired and refresh failed',
    request_context: { connection_id: connectionId },
  }, ctx);
}

/**
 * Helper to report rate limit exceeded
 */
export function reportRateLimitExceeded(
  env: Env,
  ctx: ExecutionContext | undefined,
  userId: string,
  limit: number,
  plan: string
): void {
  reportError(env, {
    user_id: userId,
    error_type: ErrorType.RATE_LIMIT,
    error_message: `Rate limit exceeded: ${limit} calls/month on ${plan} plan`,
    request_context: { limit, plan },
  }, ctx);
}

/**
 * Report rate limit warning (80% threshold reached)
 * Triggers email to user if not already sent this month
 */
export function reportRateLimitWarning(
  env: Env,
  ctx: ExecutionContext | undefined,
  userId: string,
  used: number,
  limit: number,
  plan: string
): void {
  const webhookUrl = env.AUTH_PORTAL_URL
    ? `${env.AUTH_PORTAL_URL}/api/webhooks/limit-warning`
    : 'https://praatmetjeboekhouding.nl/api/webhooks/limit-warning';

  const sendWarning = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': env.WEBHOOK_SECRET || '',
        },
        body: JSON.stringify({
          user_id: userId,
          used,
          limit,
          plan,
          percent: Math.round((used / limit) * 100),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('[RateLimitWarning] Failed to send warning:', response.status);
      }
    } catch (err) {
      console.error('[RateLimitWarning] Error sending warning:', err);
    }
  };

  if (ctx) {
    ctx.waitUntil(sendWarning());
  } else {
    sendWarning().catch(console.error);
  }
}

/**
 * Helper to report tool execution errors
 */
export function reportToolError(
  env: Env,
  ctx: ExecutionContext | undefined,
  toolName: string,
  error: Error,
  userId?: string,
  apiKeyId?: string
): void {
  reportError(env, createExceptionError(error, userId, apiKeyId, toolName), ctx);
}
