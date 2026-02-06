-- Track when rate limit warning emails were sent
-- This prevents sending multiple 80% warnings in the same month

ALTER TABLE users ADD COLUMN limit_warning_sent_at TEXT;

-- Index for efficient lookups when checking if warning was sent this month
CREATE INDEX IF NOT EXISTS idx_users_limit_warning ON users(limit_warning_sent_at);
