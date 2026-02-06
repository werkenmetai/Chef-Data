-- COMM-005: Message Attachments
-- Add support for file attachments in support messages

-- Attachments table - stores metadata for uploaded files
CREATE TABLE IF NOT EXISTS message_attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT REFERENCES support_messages(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES support_conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- File metadata
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,

  -- R2 storage reference
  r2_key TEXT NOT NULL UNIQUE,

  -- Security
  uploaded_by TEXT NOT NULL, -- 'user' or 'admin'
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),

  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id ON message_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON message_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_r2_key ON message_attachments(r2_key);

-- Add attachment_count column to support_messages for quick reference
-- Note: Using ALTER TABLE which may not work in all SQLite versions
-- If this fails, the column can be added manually
-- ALTER TABLE support_messages ADD COLUMN attachment_count INTEGER DEFAULT 0;
