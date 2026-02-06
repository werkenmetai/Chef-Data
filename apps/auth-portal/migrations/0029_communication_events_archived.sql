-- Add archived column to communication_events for inbox management
-- Allows admins to archive emails without deleting them

ALTER TABLE communication_events ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Index for filtering archived items
CREATE INDEX IF NOT EXISTS idx_communication_events_archived ON communication_events(archived);
