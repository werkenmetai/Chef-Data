-- Support System Migration
-- Creates tables for support conversations, knowledge base, AI patterns, and system settings

-- ============================================
-- System Settings (key-value store)
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id)
);

-- Default settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
  ('support_enabled', 'true', 'Support systeem aan/uit'),
  ('support_paused', 'false', 'Support tijdelijk gepauzeerd'),
  ('support_pause_message', 'Het support systeem is tijdelijk niet beschikbaar. Probeer het later opnieuw.', 'Melding bij pauze'),
  ('support_ai_enabled', 'true', 'AI auto-responses aan/uit'),
  ('support_ai_confidence_threshold', '0.8', 'Minimum confidence voor auto-response');

-- ============================================
-- Support Conversations (main container)
-- ============================================
CREATE TABLE IF NOT EXISTS support_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Conversation metadata
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting_user', 'waiting_support', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT CHECK (category IN ('connection', 'billing', 'bug', 'feature', 'account', 'other')),

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

-- ============================================
-- Support Messages
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,

  -- Sender info
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai', 'admin', 'system')),
  sender_id TEXT,

  -- Content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'markdown', 'html')),

  -- AI metadata (when sender_type = 'ai')
  ai_confidence REAL,
  ai_pattern_used TEXT,
  ai_suggested_articles TEXT,

  -- Message metadata
  is_internal BOOLEAN DEFAULT FALSE,
  metadata TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  read_at TEXT
);

-- ============================================
-- Knowledge Base Articles
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,

  -- Content (multilingual)
  title_nl TEXT NOT NULL,
  title_en TEXT,
  content_nl TEXT NOT NULL,
  content_en TEXT,

  -- Organization
  category TEXT NOT NULL,
  tags TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Status
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  published_at TEXT
);

-- ============================================
-- AI Response Patterns
-- ============================================
CREATE TABLE IF NOT EXISTS support_patterns (
  id TEXT PRIMARY KEY,

  -- Matching criteria
  name TEXT NOT NULL,
  trigger_keywords TEXT NOT NULL,
  trigger_regex TEXT,
  error_codes TEXT,
  category TEXT NOT NULL,

  -- Response template
  response_template_nl TEXT NOT NULL,
  response_template_en TEXT,

  -- Solution steps
  solution_steps TEXT,
  related_articles TEXT,

  -- Effectiveness tracking
  times_triggered INTEGER DEFAULT 0,
  times_resolved INTEGER DEFAULT 0,
  times_escalated INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN DEFAULT TRUE,
  min_confidence REAL DEFAULT 0.7,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Lessons Learned
-- ============================================
CREATE TABLE IF NOT EXISTS support_lessons (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES support_conversations(id),

  -- Lesson content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  solution TEXT,
  prevention TEXT,

  -- Categorization
  category TEXT,
  tags TEXT,

  -- Actions taken
  created_pattern_id TEXT REFERENCES support_patterns(id),
  created_article_id TEXT REFERENCES knowledge_articles(id),
  code_fix_pr TEXT,

  -- Metadata
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Error Log (for pattern detection)
-- ============================================
CREATE TABLE IF NOT EXISTS support_error_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  conversation_id TEXT REFERENCES support_conversations(id),

  -- Error details
  error_type TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_context TEXT,
  stack_trace TEXT,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  pattern_id TEXT REFERENCES support_patterns(id),

  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Indexes
-- ============================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON support_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON support_conversations(assigned_to);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON support_messages(created_at);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON knowledge_articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON knowledge_articles(published);

-- Patterns indexes
CREATE INDEX IF NOT EXISTS idx_patterns_category ON support_patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON support_patterns(active);

-- Errors indexes
CREATE INDEX IF NOT EXISTS idx_errors_user_id ON support_error_log(user_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON support_error_log(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON support_error_log(created_at);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_conversation_id ON support_lessons(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON support_lessons(created_at);
