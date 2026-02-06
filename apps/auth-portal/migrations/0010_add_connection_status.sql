-- Migration: Add status column to connections for tracking token refresh state
-- Run: wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0010_add_connection_status.sql

-- Add status column to connections
-- Values: 'active' (default), 'refresh_failed' (token refresh failed, needs re-auth)
ALTER TABLE connections ADD COLUMN status TEXT DEFAULT 'active';

-- Add last_used_at for tracking inactivity
ALTER TABLE connections ADD COLUMN last_used_at TEXT;

-- Add index for querying connections by status
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Add index for querying expiring tokens
CREATE INDEX IF NOT EXISTS idx_connections_token_expires_at ON connections(token_expires_at);
