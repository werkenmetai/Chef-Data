-- Migration: Add automation fields for email system and error tracking
-- Run: wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0003_add_automation_fields.sql

-- Add onboarding tracking to users
ALTER TABLE users ADD COLUMN onboarding_email_sent INTEGER DEFAULT 0;
-- 0 = geen, 1 = dag 1 gestuurd, 3 = dag 3 gestuurd, 7 = dag 7 gestuurd

-- Add rate limit warning tracking
ALTER TABLE users ADD COLUMN rate_limit_warning_sent INTEGER DEFAULT 0;
-- 0 = geen, 1 = 80% warning, 2 = 100% reached

-- Add expiry alert tracking to connections
ALTER TABLE connections ADD COLUMN expiry_alert_sent INTEGER DEFAULT 0;

-- Add inactivity alert tracking (for 30+ days no usage)
ALTER TABLE connections ADD COLUMN inactivity_alert_sent INTEGER DEFAULT 0;

-- Error log table for tracking issues
CREATE TABLE IF NOT EXISTS error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- auth_failure, token_refresh_failure, api_error, db_error, rate_limit, unknown
  message TEXT NOT NULL,
  user_id TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for querying recent errors
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at);
CREATE INDEX IF NOT EXISTS idx_error_log_type ON error_log(type);

-- Scheduled emails queue (for retry logic)
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  attempts INTEGER DEFAULT 0,
  last_attempt_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
