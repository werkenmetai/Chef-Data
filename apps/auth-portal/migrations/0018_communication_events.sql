-- COMM-001: Communication Events - Unified communications tracking
-- Creates a unified table to track all customer communications (emails, support, feedback)
-- This consolidates the fragmented communication views into a single source of truth

CREATE TABLE IF NOT EXISTS communication_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'support', 'feedback')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT,
  content TEXT NOT NULL,
  metadata TEXT, -- JSON: type-specific data (email headers, NPS score, etc.)
  related_id TEXT, -- Links to: conversation_id, feedback_id, email_log_id, etc.
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_communication_events_user_id ON communication_events(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_type ON communication_events(type);
CREATE INDEX IF NOT EXISTS idx_communication_events_created_at ON communication_events(created_at);
CREATE INDEX IF NOT EXISTS idx_communication_events_related_id ON communication_events(related_id);

-- Combined index for customer timeline queries (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_communication_events_user_timeline ON communication_events(user_id, created_at DESC);
