-- Add email signature field to users table for admin replies
-- Each admin can customize their own signature

ALTER TABLE users ADD COLUMN email_signature TEXT;
