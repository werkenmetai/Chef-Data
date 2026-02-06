/**
 * Structured Logger for Cloudflare Workers
 *
 * Provides JSON-formatted logs with request context, PII masking,
 * and GDPR-compliant data handling.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId: string;
  userId?: string;
  apiKeyId?: string;
  tool?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  environment?: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  apiKeyId?: string;
  tool?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  environment?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  data?: Record<string, unknown>;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `req_${timestamp}_${random}`;
}

/**
 * Mask sensitive data for GDPR compliance
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : '***';
  return `${maskedLocal}@${domain}`;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

export function maskToken(token: string): string {
  if (token.length <= 12) return '****';
  return `${token.slice(0, 8)}****`;
}

/**
 * Sanitize data object, removing sensitive fields
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'apiKey',
    'api_key',
    'password',
    'secret',
    'authorization',
    'cookie',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Skip sensitive fields entirely
    if (sensitiveFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Mask email-like strings
    if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
      sanitized[key] = maskEmail(value);
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Structured Logger class with context support
 */
export class Logger {
  private context: Partial<LogContext>;
  private service: string;
  private debugEnabled: boolean;

  constructor(
    service = 'mcp-server',
    context: Partial<LogContext> = {},
    debugEnabled = false
  ) {
    this.service = service;
    this.context = context;
    this.debugEnabled = debugEnabled;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): Logger {
    return new Logger(this.service, { ...this.context, ...additionalContext }, this.debugEnabled);
  }

  /**
   * Update the logger's context
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    // Skip debug logs in production unless explicitly enabled
    if (level === 'debug' && !this.debugEnabled) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...this.context,
    };

    if (data) {
      entry.data = sanitizeData(data);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        // Only include stack in non-production for security
        stack: this.context.environment !== 'production' ? error.stack : undefined,
      };
    }

    // Output as JSON for Cloudflare Workers logs
    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, data, error);
  }

  /**
   * Log a request start (for timing)
   */
  requestStart(method: string, path: string): void {
    this.setContext({ method, endpoint: path });
    this.info('Request started', { method, path });
  }

  /**
   * Log a request completion with timing
   */
  requestEnd(statusCode: number, durationMs: number): void {
    this.setContext({ statusCode, duration: durationMs });
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, 'Request completed', { statusCode, durationMs });
  }

  /**
   * Log tool execution
   */
  toolExecution(tool: string, success: boolean, durationMs: number, errorType?: string): void {
    this.setContext({ tool, duration: durationMs });
    if (success) {
      this.info('Tool executed successfully', { tool, durationMs });
    } else {
      this.warn('Tool execution failed', { tool, durationMs, errorType });
    }
  }
}

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(
  request: Request,
  environment: string = 'development'
): Logger {
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const url = new URL(request.url);

  return new Logger('mcp-server', {
    requestId,
    method: request.method,
    endpoint: url.pathname,
    environment,
  });
}

/**
 * Extract request ID from request or generate new one
 */
export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || generateRequestId();
}

/**
 * Global singleton for simple logging (use sparingly, prefer request-scoped)
 */
export const logger = new Logger('mcp-server');
