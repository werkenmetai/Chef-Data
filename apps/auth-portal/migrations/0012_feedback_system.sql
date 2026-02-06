-- Migration: Feedback & Testimonial Collection System
-- Created: 2026-01-27

-- Feedback responses table
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Type & trigger
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('nps', 'widget', 'testimonial', 'churn', 'support')),
    trigger_event TEXT, -- 'day_7', 'query_25', 'day_30', 'inactive_14', 'manual'

    -- Scores
    nps_score INTEGER CHECK (nps_score >= 1 AND nps_score <= 10),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

    -- Content
    feedback_text TEXT,
    improvement_category TEXT, -- 'setup', 'accuracy', 'features', 'speed', 'price', 'other'

    -- Testimonial specific fields
    testimonial_quote TEXT,
    testimonial_approved INTEGER DEFAULT 0, -- boolean
    testimonial_display_name TEXT, -- "Matthijs, CFO bij Chef Data"
    testimonial_company TEXT,
    testimonial_role TEXT,
    permission_website INTEGER DEFAULT 0, -- boolean
    permission_marketing INTEGER DEFAULT 0, -- boolean

    -- Meta
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'email' CHECK (source IN ('email', 'widget', 'manual', 'support')),
    email_campaign_id TEXT,
    ip_address TEXT,
    user_agent TEXT,

    -- Status
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'reviewed', 'published', 'archived', 'spam')),
    reviewed_at DATETIME,
    reviewed_by TEXT,
    admin_notes TEXT
);

-- Email campaign tracking table
CREATE TABLE IF NOT EXISTS feedback_campaigns (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('welcome', 'day_7', 'day_30', 'churn_14', 'testimonial_request', 'review_request')),

    -- Scheduling
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME,

    -- Email details
    email_subject TEXT,
    email_template TEXT,

    -- Response tracking
    opened_at DATETIME,
    clicked_at DATETIME,
    responded_at DATETIME,
    unsubscribed_at DATETIME,

    -- Tracking tokens
    tracking_token TEXT UNIQUE,
    response_token TEXT UNIQUE,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'opened', 'clicked', 'responded', 'cancelled', 'failed', 'unsubscribed')),
    failure_reason TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Published testimonials view (for easy website display)
CREATE VIEW IF NOT EXISTS published_testimonials AS
SELECT
    f.id,
    f.testimonial_quote,
    f.testimonial_display_name,
    f.testimonial_company,
    f.testimonial_role,
    f.nps_score,
    f.created_at,
    f.reviewed_at as published_at
FROM feedback f
WHERE f.testimonial_approved = 1
  AND f.permission_website = 1
  AND f.status = 'published'
  AND f.testimonial_quote IS NOT NULL
ORDER BY f.reviewed_at DESC;

-- User feedback preferences (opt-out tracking)
ALTER TABLE users ADD COLUMN feedback_opt_out INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_feedback_request DATETIME;
ALTER TABLE users ADD COLUMN total_queries_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN first_query_at DATETIME;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_testimonial ON feedback(testimonial_approved, permission_website, status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_nps ON feedback(nps_score);

CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON feedback_campaigns(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON feedback_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON feedback_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_tracking ON feedback_campaigns(tracking_token);
CREATE INDEX IF NOT EXISTS idx_campaigns_response ON feedback_campaigns(response_token);

-- Trigger to update updated_at on feedback_campaigns
CREATE TRIGGER IF NOT EXISTS update_campaign_timestamp
AFTER UPDATE ON feedback_campaigns
BEGIN
    UPDATE feedback_campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
