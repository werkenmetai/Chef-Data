/**
 * Test Setup File
 *
 * Configures Vitest for the MCP Server tests.
 * Provides mock implementations for Cloudflare Workers environment.
 */

import { vi } from 'vitest';

// Mock crypto.subtle for Node.js environment (Cloudflare Workers API)
// In Vitest/Node, we need to use the Web Crypto API
// @ts-expect-error - polyfill for Node.js globalThis.crypto
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error - polyfill for Node.js
  globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
}

// Ensure crypto.getRandomValues is available
// @ts-expect-error - polyfill for Node.js globalThis.crypto
if (typeof globalThis.crypto?.getRandomValues === 'undefined') {
  const nodeCrypto = await import('node:crypto');
  // @ts-expect-error - polyfill for Node.js
  globalThis.crypto.getRandomValues = (array: Uint8Array): Uint8Array => {
    return nodeCrypto.webcrypto.getRandomValues(array);
  };
}

// Ensure crypto.randomUUID is available
// @ts-expect-error - polyfill for Node.js globalThis.crypto
if (typeof globalThis.crypto?.randomUUID === 'undefined') {
  const nodeCrypto = await import('node:crypto');
  // @ts-expect-error - polyfill for Node.js
  globalThis.crypto.randomUUID = () => nodeCrypto.randomUUID();
}

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console output in tests:
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});

/**
 * Create a mock D1 database for testing
 */
export function createMockD1() {
  const mockPrepare = vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  });

  return {
    prepare: mockPrepare,
  };
}

/**
 * Create a mock environment for testing
 */
export function createMockEnv(overrides: Partial<{
  TOKEN_ENCRYPTION_KEY: string;
  ENVIRONMENT: string;
  DB: ReturnType<typeof createMockD1>;
}> = {}) {
  return {
    DB: overrides.DB || createMockD1(),
    TOKEN_ENCRYPTION_KEY: overrides.TOKEN_ENCRYPTION_KEY || 'test-encryption-key-32-chars!!!',
    ENVIRONMENT: overrides.ENVIRONMENT || 'test',
    ...overrides,
  };
}

/**
 * Create a mock Request object
 */
export function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
} = {}): Request {
  return new Request(options.url || 'https://api.example.com/', {
    method: options.method || 'GET',
    headers: new Headers(options.headers || {}),
    body: options.body,
  });
}
