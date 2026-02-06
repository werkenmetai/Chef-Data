-- OAuth Clients table - stores dynamically registered OAuth clients (RFC 7591)
CREATE TABLE IF NOT EXISTS oauth_clients (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret TEXT, -- NULL for public clients
  client_name TEXT,
  redirect_uris TEXT NOT NULL, -- JSON array of redirect URIs
  grant_types TEXT DEFAULT '["authorization_code","refresh_token"]', -- JSON array
  response_types TEXT DEFAULT '["code"]', -- JSON array
  token_endpoint_auth_method TEXT DEFAULT 'client_secret_basic',
  scope TEXT DEFAULT 'openid profile',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- OAuth Authorization Codes table - temporary codes for authorization flow
CREATE TABLE IF NOT EXISTS oauth_auth_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge TEXT, -- PKCE
  code_challenge_method TEXT DEFAULT 'S256', -- PKCE method
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  used_at TEXT -- Set when code is exchanged for token
);

-- OAuth Tokens table - stores access and refresh tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  access_token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT UNIQUE,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT,
  access_token_expires_at TEXT NOT NULL,
  refresh_token_expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  revoked_at TEXT
);

-- Indexes for OAuth tables
CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON oauth_auth_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client_id ON oauth_auth_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires_at ON oauth_auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access_token_hash ON oauth_tokens(access_token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh_token_hash ON oauth_tokens(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
