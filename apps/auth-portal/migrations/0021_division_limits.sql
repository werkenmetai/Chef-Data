-- Migration: 0021_division_limits.sql
-- Purpose: Add support for division limits per plan
--
-- Free: 2 active divisions
-- Starter: 3 active divisions
-- Pro: 10 active divisions
-- Enterprise: unlimited
--
-- Users can toggle which divisions are active, with a 1-hour cooldown

-- Add is_active column to divisions table
-- Defaults to TRUE so existing divisions remain active
ALTER TABLE divisions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Add division_switch_at to users table for cooldown tracking
-- NULL means no cooldown active
ALTER TABLE users ADD COLUMN division_switch_at TEXT;

-- Index for efficient active division queries
CREATE INDEX IF NOT EXISTS idx_divisions_active ON divisions(connection_id, is_active);
