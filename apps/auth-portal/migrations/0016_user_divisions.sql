-- Migration: 0016_user_divisions.sql
-- Purpose: Link OAuth users to Exact Online divisions for P22 Single URL + OAuth
--
-- This enables the mapping:
--   OAuth access token -> oauth_tokens.user_id -> user_divisions -> connections -> divisions
--
-- When an MCP client (ChatGPT/Claude) authenticates via OAuth, we can look up
-- which Exact Online division(s) they have access to via this table.

-- Create user_divisions table
-- Links OAuth users to their connected Exact Online divisions
CREATE TABLE IF NOT EXISTS user_divisions (
  id TEXT PRIMARY KEY,
  oauth_user_id TEXT NOT NULL,           -- User ID from oauth_tokens (our OAuth system)
  connection_id TEXT NOT NULL,            -- FK to connections table (Exact OAuth connection)
  division_code TEXT NOT NULL,            -- Division code for fast lookup (denormalized from divisions)
  division_name TEXT,                     -- Display name for division selector
  is_default BOOLEAN DEFAULT true,        -- Which division to use by default
  created_at TEXT DEFAULT (datetime('now')),

  -- Foreign keys
  FOREIGN KEY (oauth_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- Indexes for efficient lookups
-- Primary lookup: find divisions for an OAuth user
CREATE INDEX IF NOT EXISTS idx_user_divisions_oauth_user_id ON user_divisions(oauth_user_id);

-- Lookup by connection (useful for cleanup when connection is removed)
CREATE INDEX IF NOT EXISTS idx_user_divisions_connection_id ON user_divisions(connection_id);

-- Composite index for finding user's default division quickly
CREATE INDEX IF NOT EXISTS idx_user_divisions_user_default ON user_divisions(oauth_user_id, is_default);

-- Division code lookup (for direct division access if needed)
CREATE INDEX IF NOT EXISTS idx_user_divisions_division_code ON user_divisions(division_code);
