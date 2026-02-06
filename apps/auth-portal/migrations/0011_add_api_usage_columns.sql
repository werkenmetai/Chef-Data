-- Migration: Add missing columns to api_usage table for enhanced tracking
-- Run: wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0011_add_api_usage_columns.sql

-- Add client IP for tracking
ALTER TABLE api_usage ADD COLUMN client_ip TEXT;

-- Add user agent for provider detection
ALTER TABLE api_usage ADD COLUMN user_agent TEXT;

-- Add request ID for tracing
ALTER TABLE api_usage ADD COLUMN request_id TEXT;

-- Add response time in milliseconds
ALTER TABLE api_usage ADD COLUMN response_time_ms INTEGER;

-- Add index for user agent (for provider stats)
CREATE INDEX IF NOT EXISTS idx_api_usage_user_agent ON api_usage(user_agent);
