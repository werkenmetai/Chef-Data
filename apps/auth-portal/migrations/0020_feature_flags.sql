-- AIOPS-002: Feature Flags
-- System-wide feature toggles for admin control
-- Config field allows feature-specific settings

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 0,
  config TEXT, -- JSON: feature-specific configuration
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Index for quick lookups by key
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);

-- Seed default feature flags
INSERT INTO feature_flags (id, key, name, description, enabled, config)
VALUES
  (
    'ff_proactive_emails',
    'proactive_emails',
    'Proactieve E-mails',
    'Automatisch emails sturen naar klanten gebaseerd op gebruikspatronen (bijv. lage activiteit, expirerende tokens)',
    0,
    '{"min_inactive_days": 14, "max_emails_per_month": 2}'
  ),
  (
    'ff_ai_drafting',
    'ai_drafting',
    'AI Draft Suggesties',
    'AI-gegenereerde concept antwoorden voor klantvragen in het admin panel',
    0,
    '{"model": "claude-sonnet", "max_tokens": 500}'
  ),
  (
    'ff_auto_reply',
    'auto_reply',
    'Automatische Antwoorden',
    'Automatisch antwoorden op veelgestelde vragen zonder menselijke tussenkomst',
    0,
    '{"min_confidence": 0.9, "categories": ["question"]}'
  ),
  (
    'ff_screenshot_capture',
    'screenshot_capture',
    'Screenshot Capture',
    'Klanten toestaan om screenshots te uploaden bij feedback en support vragen',
    1,
    '{"max_size_mb": 5, "allowed_types": ["png", "jpg", "jpeg", "gif"]}'
  ),
  (
    'ff_conversation_threading',
    'conversation_threading',
    'Conversatie Threading',
    'Groepeer gerelateerde berichten in threads voor betere overzichtelijkheid',
    1,
    '{"max_thread_depth": 10}'
  ),
  (
    'ff_customer_health_score',
    'customer_health_score',
    'Klant Health Score',
    'Bereken en toon een health score per klant gebaseerd op activiteit en feedback',
    0,
    '{"factors": ["api_usage", "login_frequency", "nps_score", "support_tickets"]}'
  );
