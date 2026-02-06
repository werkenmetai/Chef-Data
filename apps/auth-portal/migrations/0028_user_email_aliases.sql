-- User Email Aliases
-- Allows matching inbound emails from alternative addresses to the same user

CREATE TABLE IF NOT EXISTS user_email_aliases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT, -- admin who added it
  UNIQUE(email) -- each email can only belong to one user
);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_email ON user_email_aliases(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_user_id ON user_email_aliases(user_id);
