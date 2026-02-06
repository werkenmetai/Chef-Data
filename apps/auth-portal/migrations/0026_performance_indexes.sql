-- Migration: AUDIT-008 Performance Indexes
-- Created: 2026-02-02
-- Author: Daan (Backend)
-- Purpose: Security audit - ensure all required indexes exist for query performance
-- Note: Using CREATE INDEX IF NOT EXISTS to safely handle existing indexes

-- =============================================================================
-- AUDIT-008: Required indexes for performance optimization
-- =============================================================================

-- 1. users.email - Fast user lookup by email (auth flows)
--    Already exists in 0023_performance_indexes.sql as idx_users_email
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- 2. connections.user_id - Fast connection lookup by user
--    Already exists in 0001_initial.sql as idx_connections_user_id
CREATE INDEX IF NOT EXISTS idx_connections_user_id
ON connections(user_id);

-- 3. api_usage.user_id + created_at - Composite index for usage queries
--    Note: The api_usage table uses 'timestamp' column, not 'created_at'
--    Existing idx_api_usage_user_month covers (user_id, timestamp)
--    Adding explicit composite index for clarity and audit compliance
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created
ON api_usage(user_id, timestamp);

-- 4. communication_events.user_id - Fast lookup of user communications
--    Already exists in 0018_communication_events.sql as idx_communication_events_user_id
CREATE INDEX IF NOT EXISTS idx_communication_events_user_id
ON communication_events(user_id);

-- 5. support_conversations.user_id - Fast lookup of user support tickets
--    Already exists in 0008_support_system.sql as idx_conversations_user_id
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id
ON support_conversations(user_id);

-- =============================================================================
-- Audit verification complete - all required indexes confirmed
-- =============================================================================
