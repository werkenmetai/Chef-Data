-- Add 'spam' and 'archived' status options to support_conversations
-- SQLite requires recreating the table to change CHECK constraints

-- Step 1: Create new table with updated constraint
CREATE TABLE IF NOT EXISTS support_conversations_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Conversation metadata
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting_user', 'waiting_support', 'resolved', 'closed', 'spam', 'archived', 'replied')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT CHECK (category IN ('connection', 'billing', 'bug', 'feature', 'account', 'other', 'general')),

  -- Assignment & handling
  assigned_to TEXT REFERENCES users(id),
  handled_by TEXT CHECK (handled_by IN ('ai', 'human', 'hybrid')),

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  first_response_at TEXT,
  resolved_at TEXT,

  -- Resolution
  resolution_type TEXT CHECK (resolution_type IN ('auto_resolved', 'user_resolved', 'admin_resolved', 'closed_inactive')),
  resolution_notes TEXT,

  -- Feedback
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,

  -- AI tracking
  ai_confidence_score REAL,
  matched_pattern_id TEXT
);

-- Step 2: Copy existing data
INSERT INTO support_conversations_new
SELECT * FROM support_conversations;

-- Step 3: Drop old table
DROP TABLE support_conversations;

-- Step 4: Rename new table
ALTER TABLE support_conversations_new RENAME TO support_conversations;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON support_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON support_conversations(assigned_to);
