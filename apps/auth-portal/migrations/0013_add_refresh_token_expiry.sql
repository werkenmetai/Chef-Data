-- Migration: Add refresh_token_expires_at for proactive token monitoring
-- @see EXACT-003 in operations/ROADMAP.md
-- Exact Online refresh tokens are valid for 30 days from issuance
-- This allows us to warn users 7 days before expiry
-- Run: wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0013_add_refresh_token_expiry.sql

-- Add refresh_token_expires_at to track when the refresh token itself expires
-- Different from token_expires_at which tracks the access token (10 minutes)
ALTER TABLE connections ADD COLUMN refresh_token_expires_at TEXT;

-- Initialize existing connections: assume 30 days from last update
-- This is a safe default; actual expiry will be set on next token refresh
UPDATE connections
SET refresh_token_expires_at = datetime(COALESCE(updated_at, created_at), '+30 days')
WHERE refresh_token_expires_at IS NULL;

-- Add index for querying connections with expiring refresh tokens
CREATE INDEX IF NOT EXISTS idx_connections_refresh_token_expires_at ON connections(refresh_token_expires_at);
