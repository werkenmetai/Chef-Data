-- Users table - stores customer accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  api_calls_used INTEGER DEFAULT 0,
  api_calls_reset_at TEXT
);

-- Connections table - stores Exact Online OAuth connections
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region TEXT NOT NULL CHECK (region IN ('NL', 'BE', 'DE', 'UK', 'US', 'ES', 'FR')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TEXT NOT NULL,
  exact_user_id TEXT,
  exact_user_name TEXT,
  exact_email TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, region)
);

-- Divisions table - stores accessible Exact Online divisions/administraties
CREATE TABLE IF NOT EXISTS divisions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  division_code INTEGER NOT NULL,
  division_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- API Keys table - stores API keys for MCP server access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT DEFAULT 'Default',
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  revoked_at TEXT
);

-- API Usage log - tracks API calls per user
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  division_code INTEGER,
  timestamp TEXT DEFAULT (datetime('now')),
  response_status INTEGER
);

-- Sessions table - for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_divisions_connection_id ON divisions(connection_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
