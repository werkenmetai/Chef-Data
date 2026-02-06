-- Migration 0015: Email Log Table
-- Logs all sent emails for admin visibility

CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  sent_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_email_log_user ON email_log(user_id);
CREATE INDEX idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX idx_email_log_status ON email_log(status);
