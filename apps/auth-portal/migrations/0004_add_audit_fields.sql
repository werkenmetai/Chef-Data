-- Add audit logging fields for enhanced security monitoring
-- This migration adds IP address and user-agent tracking to api_usage

-- Add IP address column (stores client IP, supports IPv4 and IPv6)
ALTER TABLE api_usage ADD COLUMN client_ip TEXT;

-- Add user agent column (stores the HTTP User-Agent header)
ALTER TABLE api_usage ADD COLUMN user_agent TEXT;

-- Add request ID for correlation (useful for debugging)
ALTER TABLE api_usage ADD COLUMN request_id TEXT;

-- Add response time in milliseconds (for performance monitoring)
ALTER TABLE api_usage ADD COLUMN response_time_ms INTEGER;

-- Create security_events table for suspicious activity logging
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'invalid_api_key',
    'rate_limit_exceeded',
    'token_refresh_failed',
    'suspicious_activity',
    'auth_failure',
    'permission_denied'
  )),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  client_ip TEXT,
  user_agent TEXT,
  details TEXT, -- JSON blob with event-specific details
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Index for querying security events
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_client_ip ON security_events(client_ip);

-- Index for querying api_usage by IP (useful for abuse detection)
CREATE INDEX IF NOT EXISTS idx_api_usage_client_ip ON api_usage(client_ip);
