-- Migration: Proactive Outreach System
-- Created: 2026-01-31
-- Author: Sophie (Customer Success)
-- Purpose: Automated customer engagement based on usage patterns

-- Outreach campaigns table
-- Defines campaign types and their configuration
CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,

    -- Trigger configuration
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'limit_80',      -- User reached 80% of plan limit
        'limit_100',     -- User reached 100% of plan limit
        'inactive_14d',  -- No API calls in 14 days
        'nps_high',      -- NPS score >= 9 AND active 30+ days
        'milestone',     -- Query milestones (10, 50, 100, etc.)
        'error_pattern'  -- 3+ errors in 24h
    )),

    -- Template reference (for future use)
    template_id TEXT,

    -- Campaign settings
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0, -- Higher = more important

    -- Configuration (JSON)
    -- Example: {"cooldown_days": 7, "conditions": {"min_queries": 10}}
    config TEXT,

    -- Email content (can be overridden by template)
    email_subject TEXT,
    email_template TEXT, -- HTML template with {{placeholders}}

    -- Stats (denormalized for quick dashboard)
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0, -- e.g., upgrades after limit email

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    created_by TEXT
);

-- Outreach log table
-- Tracks individual outreach attempts and their outcomes
CREATE TABLE IF NOT EXISTS outreach_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    campaign_id TEXT NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Trigger details
    trigger_type TEXT NOT NULL,
    trigger_data TEXT, -- JSON: {"usage_percent": 85, "errors_24h": 3}

    -- Email tracking
    email_sent INTEGER DEFAULT 0,
    email_sent_at TEXT,
    email_opened INTEGER DEFAULT 0,
    email_opened_at TEXT,
    email_clicked INTEGER DEFAULT 0,
    email_clicked_at TEXT,

    -- Outcome tracking
    converted INTEGER DEFAULT 0,
    converted_at TEXT,
    conversion_type TEXT, -- 'upgrade', 'reactivation', 'testimonial'

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT -- If email failed
);

-- Outreach cooldowns table
-- Prevents spam by tracking last outreach per user per campaign type
CREATE TABLE IF NOT EXISTS outreach_cooldowns (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_type TEXT NOT NULL, -- Maps to trigger_type for global cooldowns
    last_sent_at TEXT NOT NULL,
    next_allowed_at TEXT NOT NULL,

    PRIMARY KEY (user_id, campaign_type)
);

-- Response templates table
-- Pre-defined email templates for various triggers
CREATE TABLE IF NOT EXISTS response_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,

    -- Template content
    subject_nl TEXT NOT NULL,
    subject_en TEXT,
    body_nl TEXT NOT NULL, -- HTML with {{placeholders}}
    body_en TEXT,

    -- Template type
    trigger_type TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,

    -- Stats
    times_used INTEGER DEFAULT 0,
    avg_open_rate REAL DEFAULT 0,
    avg_click_rate REAL DEFAULT 0,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    created_by TEXT
);

-- Add tracking columns to users table for outreach
-- These help determine eligibility for various campaigns
ALTER TABLE users ADD COLUMN last_api_call_at TEXT;
ALTER TABLE users ADD COLUMN limit_warning_80_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN limit_warning_100_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN inactive_reminder_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN testimonial_requested INTEGER DEFAULT 0;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_active ON outreach_campaigns(is_active, trigger_type);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_trigger ON outreach_campaigns(trigger_type);

CREATE INDEX IF NOT EXISTS idx_outreach_log_campaign ON outreach_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_log_user ON outreach_log(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_log_created ON outreach_log(created_at);
CREATE INDEX IF NOT EXISTS idx_outreach_log_trigger ON outreach_log(trigger_type, created_at);

CREATE INDEX IF NOT EXISTS idx_cooldowns_user ON outreach_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_cooldowns_next ON outreach_cooldowns(next_allowed_at);

CREATE INDEX IF NOT EXISTS idx_templates_trigger ON response_templates(trigger_type, is_active);

CREATE INDEX IF NOT EXISTS idx_users_last_api ON users(last_api_call_at);
CREATE INDEX IF NOT EXISTS idx_users_outreach ON users(limit_warning_80_sent, limit_warning_100_sent);

-- Insert default campaigns
INSERT INTO outreach_campaigns (id, name, description, trigger_type, is_active, config, email_subject, email_template, priority) VALUES
(
    'camp_limit_80',
    'Limiet 80% Waarschuwing',
    'Soft upgrade nudge wanneer gebruiker 80% van limiet bereikt',
    'limit_80',
    1,
    '{"cooldown_days": 30}',
    'Je hebt {{percent}}% van je limiet gebruikt',
    NULL,
    100
),
(
    'camp_limit_100',
    'Limiet Bereikt',
    'Upgrade prompt wanneer gebruiker 100% limiet bereikt',
    'limit_100',
    1,
    '{"cooldown_days": 30}',
    'Je limiet is bereikt',
    NULL,
    200
),
(
    'camp_inactive_14d',
    'Inactiviteit Check-in',
    'We miss you email na 14 dagen inactiviteit',
    'inactive_14d',
    1,
    '{"cooldown_days": 30, "min_total_queries": 5}',
    'We missen je vragen',
    NULL,
    50
),
(
    'camp_nps_high',
    'Testimonial Verzoek',
    'Vraag om testimonial bij hoge NPS score',
    'nps_high',
    1,
    '{"cooldown_days": 90, "min_days_active": 30, "min_nps_score": 9}',
    'Mogen we je ervaring delen?',
    NULL,
    75
),
(
    'camp_error_pattern',
    'Error Ondersteuning',
    'Proactieve hulp bij herhaalde fouten',
    'error_pattern',
    1,
    '{"cooldown_days": 7, "min_errors_24h": 3}',
    'We zagen dat er iets mis ging',
    NULL,
    150
);

-- Insert default response templates
INSERT INTO response_templates (id, name, description, trigger_type, subject_nl, body_nl, is_default) VALUES
(
    'tmpl_limit_80',
    'Limiet 80% Template',
    'Friendly reminder over naderende limiet',
    'limit_80',
    'Je hebt {{percent}}% van je limiet gebruikt',
    '<p>Hoi {{userName}},</p>
<p>Je hebt <strong>{{used}}</strong> van je <strong>{{limit}}</strong> opdrachten gebruikt deze maand ({{percent}}%).</p>
<p>Als je limiet bereikt is, werkt je AI-integratie niet meer tot volgende maand.</p>
<h3>Opties</h3>
<ul>
<li><strong>Upgrade naar Pro:</strong> 2.500 calls/maand voor slechts EUR 29</li>
<li><strong>Wacht:</strong> Je limiet reset op de 1e van de maand</li>
</ul>
<p><a href="{{upgradeUrl}}" style="background:#0066FF;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Upgrade naar Pro</a></p>',
    1
),
(
    'tmpl_limit_100',
    'Limiet 100% Template',
    'Limiet bereikt, upgrade prompt',
    'limit_100',
    'Je limiet is bereikt',
    '<p>Hoi {{userName}},</p>
<p>Je hebt je maandelijkse opdrachten limiet bereikt. Je AI-assistent kan geen data meer ophalen tot je upgradet of tot volgende maand.</p>
<p><strong>Upgrade nu naar Pro</strong> voor onmiddellijke toegang:</p>
<ul>
<li>2.500 opdrachten per maand</li>
<li>Tot 10 administraties</li>
<li>Priority support</li>
</ul>
<p><a href="{{upgradeUrl}}" style="background:#0066FF;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Upgrade naar Pro</a></p>
<p style="color:#6b7280;font-size:14px;">Of wacht tot {{resetDate}} wanneer je limiet weer reset.</p>',
    1
),
(
    'tmpl_inactive_14d',
    'Inactiviteit Template',
    'We miss you check-in',
    'inactive_14d',
    'We missen je vragen',
    '<p>Hoi {{userName}},</p>
<p>Het is even stil geweest. Je stelde {{daysAgo}} dagen geleden je laatste vraag aan je boekhouding.</p>
<p>Misschien:</p>
<ul>
<li><strong>Technisch probleem?</strong> Reply en we helpen direct</li>
<li><strong>Weet je niet wat je kunt vragen?</strong> <a href="{{docsUrl}}">Bekijk onze use cases</a></li>
<li><strong>Geen tijd gehad?</strong> We staan klaar als je terugkomt</li>
</ul>
<p>Of misschien past het gewoon niet bij hoe jij werkt - ook goed om te weten. Reply gerust met je feedback.</p>',
    1
),
(
    'tmpl_nps_high',
    'Testimonial Template',
    'Vraag om testimonial bij tevreden klant',
    'nps_high',
    'Mogen we je ervaring delen?',
    '<p>Hoi {{userName}},</p>
<p>Je gaf ons een {{npsScore}}/10 - dat doet ons goed!</p>
<p>We zijn een jong product en jouw ervaring kan andere ondernemers helpen om de stap te zetten.</p>
<p><strong>Mogen we een korte quote van je delen op onze website?</strong></p>
<p>Hoe het werkt:</p>
<ol>
<li>Schrijf in 1-2 zinnen wat je het meest waardeert</li>
<li>Geef aan hoe we je mogen noemen</li>
<li>Wij sturen een preview voordat het live gaat</li>
</ol>
<p><a href="{{testimonialUrl}}" style="background:#0066FF;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Deel je ervaring</a></p>',
    1
),
(
    'tmpl_error_pattern',
    'Error Pattern Template',
    'Proactieve hulp bij herhaalde fouten',
    'error_pattern',
    'We zagen dat er iets mis ging',
    '<p>Hoi {{userName}},</p>
<p>We merkten dat je de afgelopen 24 uur een paar keer tegen fouten aanliep.</p>
<p><strong>Veelvoorkomende oorzaken:</strong></p>
<ul>
<li>Je Exact Online sessie is verlopen - <a href="{{reconnectUrl}}">opnieuw verbinden</a></li>
<li>De gevraagde data bestaat niet in je administratie</li>
<li>Tijdelijke storing bij Exact Online</li>
</ul>
<p>Kun je het nog steeds niet oplossen? Reply op deze email en we helpen je persoonlijk.</p>
<p style="color:#6b7280;font-size:14px;">Dit is een automatisch bericht. We sturen dit maximaal 1x per week.</p>',
    1
);

-- Trigger to update updated_at on outreach_campaigns
CREATE TRIGGER IF NOT EXISTS update_outreach_campaign_timestamp
AFTER UPDATE ON outreach_campaigns
BEGIN
    UPDATE outreach_campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at on response_templates
CREATE TRIGGER IF NOT EXISTS update_response_template_timestamp
AFTER UPDATE ON response_templates
BEGIN
    UPDATE response_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
