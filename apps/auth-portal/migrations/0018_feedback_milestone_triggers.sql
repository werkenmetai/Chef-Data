-- Migration: Feedback Milestone Triggers
-- Created: 2026-01-31
-- Task: #7 - FeedbackWidget uitbreiden met milestone triggers

-- Add milestone tracking columns to users table
ALTER TABLE users ADD COLUMN milestone_10_shown INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN milestone_50_shown INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN milestone_80pct_shown INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN milestone_30d_shown INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN milestone_80pct_month TEXT; -- YYYY-MM format to track per month

-- Approved quotes table for testimonials with detailed permissions
CREATE TABLE IF NOT EXISTS approved_quotes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    feedback_id TEXT REFERENCES feedback(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Quote content
    quote_text TEXT NOT NULL,
    user_name TEXT,
    user_title TEXT, -- 'ZZP''er', 'Accountant', 'MKB eigenaar', etc.
    company_name TEXT,

    -- Placement permissions
    placement_website INTEGER DEFAULT 0,
    placement_pricing INTEGER DEFAULT 0,
    placement_linkedin INTEGER DEFAULT 0,
    placement_email INTEGER DEFAULT 0,

    -- Timestamps
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'archived')),

    -- Admin
    approved_by TEXT,
    notes TEXT
);

-- Indexes for approved_quotes
CREATE INDEX IF NOT EXISTS idx_approved_quotes_user ON approved_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_approved_quotes_status ON approved_quotes(status);
CREATE INDEX IF NOT EXISTS idx_approved_quotes_feedback ON approved_quotes(feedback_id);

-- Add feedback trigger types for milestones
-- Update existing check constraint (SQLite doesn't support ALTER CHECK, but we document it)
-- Valid trigger_event values now include:
-- 'milestone_10', 'milestone_50', 'upgrade_prompt_80pct', 'retention_30d'
-- 'day_7', 'query_25', 'query_100', 'day_30', 'inactive_14', 'manual'

-- Index for milestone tracking
CREATE INDEX IF NOT EXISTS idx_feedback_trigger_milestone ON feedback(trigger_event) WHERE trigger_event LIKE 'milestone_%' OR trigger_event LIKE 'upgrade_prompt_%' OR trigger_event LIKE 'retention_%';
