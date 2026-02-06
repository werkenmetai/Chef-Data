/**
 * Re-export MCP types from shared package
 * @see MCP-002 in operations/ROADMAP.md for outputSchema requirement
 */
export type {
  MCPRequest,
  MCPResponse,
  MCPError,
  ToolDefinition,
  PropertySchema,
  ToolResult,
  PromptDefinition,
  PromptArgument,
  PromptMessage,
  GetPromptResult,
} from '@exact-mcp/shared';

/**
 * Cloudflare Worker Environment bindings
 */
export interface Env {
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';

  // D1 Database
  DB: D1Database;

  // KV Namespace for token caching
  TOKEN_CACHE?: KVNamespace;

  // Secrets (set via wrangler secret)
  EXACT_CLIENT_ID?: string;
  EXACT_CLIENT_SECRET?: string;
  EXACT_REDIRECT_URI?: string;
  SENTRY_DSN?: string;
  ANTHROPIC_API_KEY?: string;

  // Token encryption key (AES-256-GCM)
  TOKEN_ENCRYPTION_KEY?: string;

  // Support system integration
  AUTH_PORTAL_URL?: string;
  WEBHOOK_SECRET?: string;
}

/**
 * Customer and Connection Types
 */
export interface Customer {
  id: string;
  email: string;
  name: string | null;
  company_name: string | null;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  customer_id: string;
  division_id: number;
  division_code: string | null;
  division_name: string | null;
  country: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  last_used_at: string | null;
}
