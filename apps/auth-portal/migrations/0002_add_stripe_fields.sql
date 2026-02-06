-- Migration: Add Stripe subscription fields to users table
-- Run this in Cloudflare D1 Console

-- Add Stripe customer and subscription fields
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_status TEXT;
ALTER TABLE users ADD COLUMN stripe_cancel_at_period_end INTEGER DEFAULT 0;

-- Add index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
