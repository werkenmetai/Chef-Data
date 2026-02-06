/**
 * Server-Sent Events (SSE) Streaming Support
 *
 * MCP-004: Implements SSE transport for long-running tool responses.
 * This enables real-time streaming of MCP responses to clients.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
 */

import { getCorsHeaders } from './cors';
import { Env, MCPResponse } from '../types';

/**
 * SSE Event Types for MCP Protocol
 */
export type SSEEventType =
  | 'message'      // Standard MCP JSON-RPC response
  | 'progress'     // Progress update for long-running operations
  | 'error'        // Error event
  | 'ping'         // Keep-alive ping
  | 'endpoint';    // Endpoint notification (MCP spec)

/**
 * SSE Event data structure
 */
export interface SSEEvent {
  type: SSEEventType;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Options for creating an SSE response
 */
export interface SSEResponseOptions {
  /** Keep-alive interval in milliseconds (default: 15000) */
  keepAliveInterval?: number;
  /** Custom headers to include */
  headers?: Record<string, string>;
  /** Request for CORS headers */
  request?: Request;
  /** Environment for CORS configuration */
  env?: Env;
}

/**
 * Format an SSE event according to the spec
 *
 * @param event - The event to format
 * @returns Formatted SSE string with proper line endings
 */
export function formatSSEEvent(event: SSEEvent): string {
  const lines: string[] = [];

  // Event type (optional for 'message' type)
  if (event.type !== 'message') {
    lines.push(`event: ${event.type}`);
  }

  // Event ID (optional)
  if (event.id) {
    lines.push(`id: ${event.id}`);
  }

  // Retry interval (optional)
  if (event.retry !== undefined) {
    lines.push(`retry: ${event.retry}`);
  }

  // Data (required, can be multi-line)
  // Split data by newlines and prefix each line with 'data: '
  const dataLines = event.data.split('\n');
  for (const line of dataLines) {
    lines.push(`data: ${line}`);
  }

  // SSE events are terminated by double newline
  return lines.join('\n') + '\n\n';
}

/**
 * Format an MCP response as an SSE event
 *
 * @param response - The MCP JSON-RPC response
 * @param eventId - Optional event ID
 * @returns Formatted SSE event
 */
export function formatMCPResponseAsSSE(response: MCPResponse, eventId?: string): string {
  return formatSSEEvent({
    type: 'message',
    data: JSON.stringify(response),
    id: eventId,
  });
}

/**
 * Format a progress update as an SSE event
 *
 * @param progress - Progress information
 * @param eventId - Optional event ID
 * @returns Formatted SSE event
 */
export function formatProgressAsSSE(
  progress: { percent?: number; message?: string; stage?: string },
  eventId?: string
): string {
  return formatSSEEvent({
    type: 'progress',
    data: JSON.stringify(progress),
    id: eventId,
  });
}

/**
 * Format a keep-alive ping as an SSE event
 *
 * @returns Formatted ping event
 */
export function formatPingAsSSE(): string {
  return formatSSEEvent({
    type: 'ping',
    data: new Date().toISOString(),
  });
}

/**
 * Format an error as an SSE event
 *
 * @param error - Error information
 * @param eventId - Optional event ID
 * @returns Formatted SSE event
 */
export function formatErrorAsSSE(
  error: { code: number; message: string; data?: unknown },
  eventId?: string
): string {
  return formatSSEEvent({
    type: 'error',
    data: JSON.stringify(error),
    id: eventId,
  });
}

/**
 * Get SSE-specific headers
 *
 * @param request - Optional request for CORS headers
 * @param env - Optional environment for CORS configuration
 * @returns Headers object for SSE response
 */
export function getSSEHeaders(request?: Request, env?: Env): Record<string, string> {
  const corsHeaders = request && env ? getCorsHeaders(request, env) : {};

  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    ...corsHeaders,
  };
}

/**
 * Create an SSE response from an async generator
 *
 * This is the main function for creating streaming SSE responses.
 * It handles:
 * - Proper SSE formatting
 * - Keep-alive pings
 * - Stream cleanup
 *
 * @param eventGenerator - Async generator yielding SSE events
 * @param options - SSE response options
 * @returns Response object with SSE stream
 */
export function createSSEResponse(
  eventGenerator: AsyncGenerator<string, void, unknown>,
  options: SSEResponseOptions = {}
): Response {
  const {
    keepAliveInterval = 15000,
    headers = {},
    request,
    env,
  } = options;

  const encoder = new TextEncoder();
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Set up keep-alive ping interval
      keepAliveTimer = setInterval(() => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(formatPingAsSSE()));
          } catch {
            // Stream may have closed
            if (keepAliveTimer) {
              clearInterval(keepAliveTimer);
              keepAliveTimer = null;
            }
          }
        }
      }, keepAliveInterval);

      try {
        // Yield all events from the generator
        for await (const event of eventGenerator) {
          if (isClosed) break;
          controller.enqueue(encoder.encode(event));
        }
      } catch (error) {
        // Send error event before closing
        const errorEvent = formatErrorAsSSE({
          code: -32603,
          message: error instanceof Error ? error.message : 'Stream error',
        });
        controller.enqueue(encoder.encode(errorEvent));
      } finally {
        isClosed = true;
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        controller.close();
      }
    },

    cancel() {
      isClosed = true;
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...getSSEHeaders(request, env),
      ...headers,
    },
  });
}

/**
 * Create a simple SSE response with a single message
 *
 * Useful for sending a single MCP response via SSE transport.
 *
 * @param response - The MCP response to send
 * @param request - Optional request for CORS headers
 * @param env - Optional environment for CORS configuration
 * @returns Response with single SSE message
 */
export function createSingleEventSSEResponse(
  response: MCPResponse,
  request?: Request,
  env?: Env
): Response {
  const encoder = new TextEncoder();
  const eventData = formatMCPResponseAsSSE(response);

  // Create a stream that sends the event and then closes
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(eventData));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: getSSEHeaders(request, env),
  });
}

/**
 * SSE Stream Writer for progressive responses
 *
 * This class provides a more ergonomic way to write SSE events
 * when you have control over the response lifecycle.
 */
export class SSEStreamWriter {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private eventId = 0;
  private isClosed = false;

  /**
   * Create a ReadableStream for this writer
   */
  createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.isClosed = true;
        this.controller = null;
      },
    });
  }

  /**
   * Write an MCP response event
   */
  writeResponse(response: MCPResponse): void {
    if (this.isClosed || !this.controller) return;
    const event = formatMCPResponseAsSSE(response, String(++this.eventId));
    this.controller.enqueue(this.encoder.encode(event));
  }

  /**
   * Write a progress event
   */
  writeProgress(progress: { percent?: number; message?: string; stage?: string }): void {
    if (this.isClosed || !this.controller) return;
    const event = formatProgressAsSSE(progress, String(++this.eventId));
    this.controller.enqueue(this.encoder.encode(event));
  }

  /**
   * Write a ping event
   */
  writePing(): void {
    if (this.isClosed || !this.controller) return;
    this.controller.enqueue(this.encoder.encode(formatPingAsSSE()));
  }

  /**
   * Write an error event
   */
  writeError(error: { code: number; message: string; data?: unknown }): void {
    if (this.isClosed || !this.controller) return;
    const event = formatErrorAsSSE(error, String(++this.eventId));
    this.controller.enqueue(this.encoder.encode(event));
  }

  /**
   * Write a raw SSE event
   */
  writeEvent(event: SSEEvent): void {
    if (this.isClosed || !this.controller) return;
    this.controller.enqueue(this.encoder.encode(formatSSEEvent(event)));
  }

  /**
   * Close the stream
   */
  close(): void {
    if (this.isClosed || !this.controller) return;
    this.isClosed = true;
    this.controller.close();
    this.controller = null;
  }
}

/**
 * Create an MCP-compatible SSE handler that wraps the existing handler
 *
 * This function transforms a standard MCP response into an SSE stream,
 * adding proper formatting and keep-alive support.
 *
 * @param mcpResponse - The original MCP Response
 * @param request - Request for CORS headers
 * @param env - Environment for CORS configuration
 * @returns SSE-formatted Response
 */
export async function wrapMCPResponseAsSSE(
  mcpResponse: Response,
  request: Request,
  env: Env
): Promise<Response> {
  // If the response is already streaming, pass through with SSE headers
  const contentType = mcpResponse.headers.get('Content-Type') || '';
  if (contentType.includes('text/event-stream')) {
    // Already SSE, just add our headers
    const newHeaders = new Headers(mcpResponse.headers);
    Object.entries(getCorsHeaders(request, env)).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    return new Response(mcpResponse.body, {
      status: mcpResponse.status,
      headers: newHeaders,
    });
  }

  // For JSON responses, wrap in SSE format
  if (contentType.includes('application/json')) {
    try {
      const jsonResponse = await mcpResponse.json() as MCPResponse;
      return createSingleEventSSEResponse(jsonResponse, request, env);
    } catch {
      // If we can't parse as JSON, return error
      return createSingleEventSSEResponse(
        {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: -32603,
            message: 'Failed to parse MCP response',
          },
        },
        request,
        env
      );
    }
  }

  // For other content types, wrap the body as-is
  const body = await mcpResponse.text();
  return createSingleEventSSEResponse(
    {
      jsonrpc: '2.0',
      id: 0,
      result: { raw: body },
    },
    request,
    env
  );
}
