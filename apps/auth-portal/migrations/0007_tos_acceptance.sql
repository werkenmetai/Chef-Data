-- Migration: ToS Acceptance Tracking
-- Adds table and fields for tracking Terms of Service acceptance

-- Create tos_acceptances table for audit trail
CREATE TABLE IF NOT EXISTS tos_acceptances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tos_version TEXT NOT NULL,
  accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT
);

-- Index for efficient user lookups
CREATE INDEX IF NOT EXISTS idx_tos_user ON tos_acceptances(user_id);

-- Index for version queries
CREATE INDEX IF NOT EXISTS idx_tos_version ON tos_acceptances(tos_version);

-- Add ToS acceptance fields to users table
ALTER TABLE users ADD COLUMN tos_accepted_version TEXT;
ALTER TABLE users ADD COLUMN tos_accepted_at TEXT;
