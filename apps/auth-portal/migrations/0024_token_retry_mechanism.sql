-- Migration: Token Retry Mechanism
-- Created: 2026-02-01
-- Author: Daan (Backend Infrastructure) via Piet (Orchestrator)
-- Purpose: Add retry mechanism for failed token refreshes
-- Issue: #123 - OAuth token refresh werkt niet betrouwbaar

-- New columns for retry tracking
-- retry_count: Number of refresh attempts (0-5)
-- next_retry_at: When to attempt next retry (with exponential backoff)
-- last_retry_error: Error message from last failed attempt

ALTER TABLE connections ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE connections ADD COLUMN next_retry_at TEXT;
ALTER TABLE connections ADD COLUMN last_retry_error TEXT;

-- Index for retry-eligible connections query
-- Used by token-retry cron job to find connections needing retry
CREATE INDEX IF NOT EXISTS idx_connections_retry_eligible
  ON connections(status, next_retry_at, refresh_token_expires_at);

-- Index for monitoring: connections per status and retry count
CREATE INDEX IF NOT EXISTS idx_connections_retry_status
  ON connections(status, retry_count);

-- Fix existing failed connections:
-- Move from 'refresh_failed' to 'retry_pending' if refresh token is still valid
-- This gives them a chance to recover automatically
UPDATE connections
SET
  status = 'retry_pending',
  retry_count = 0,
  next_retry_at = datetime('now', '+5 minutes'),
  last_retry_error = 'Migrated from refresh_failed - retry initiated'
WHERE
  status = 'refresh_failed'
  AND datetime(refresh_token_expires_at) > datetime('now');
