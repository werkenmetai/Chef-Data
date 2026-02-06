-- Email Preferences for Privacy Communications
-- Adds columns to users table for email preferences related to AI provider privacy

-- Email preference for privacy tips and best practices
-- Default TRUE - users will receive these until they opt out
ALTER TABLE users ADD COLUMN email_privacy_tips INTEGER DEFAULT 1;

-- Email preference for AI provider news and policy changes
-- Default TRUE - users will receive these until they opt out
ALTER TABLE users ADD COLUMN email_provider_news INTEGER DEFAULT 1;

-- Email preference for product updates (already exists in some form, adding explicit column)
ALTER TABLE users ADD COLUMN email_product_updates INTEGER DEFAULT 1;

-- Note: Security alerts are mandatory and not opt-out-able, so no column needed
