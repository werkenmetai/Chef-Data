-- Migration: Email Support Notifications
-- Adds column for customer support email notification preference
-- When enabled, customers receive email when admin replies to their support conversation

-- Email preference for support conversation replies
-- Default TRUE - customers will receive email notifications for admin replies
ALTER TABLE users ADD COLUMN email_support_replies INTEGER DEFAULT 1;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_email_support_replies ON users(email_support_replies);
