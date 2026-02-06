-- Migration: Performance Indexes
-- Created: 2026-02-01
-- Author: Daan (Backend Infrastructure)
-- Purpose: Improve query performance for common operations

-- Index voor token refresh cron job
-- Query: SELECT * FROM connections WHERE status = 'active' AND token_expires_at < datetime('now', '+1 hour')
CREATE INDEX IF NOT EXISTS idx_connections_expiring
ON connections(status, token_expires_at);

-- Index voor monthly usage queries
-- Query: SELECT COUNT(*) FROM api_usage WHERE user_id = ? AND timestamp > date('now', 'start of month')
CREATE INDEX IF NOT EXISTS idx_api_usage_user_month
ON api_usage(user_id, timestamp);

-- Index voor daily stats queries
CREATE INDEX IF NOT EXISTS idx_api_usage_date
ON api_usage(date(timestamp));

-- Index voor user lookups by email (common in auth flows)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Index for sessions cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expires
ON sessions(expires_at);
