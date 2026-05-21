-- Add sent_via_system column to wa_notifications to track fallback usage
ALTER TABLE wa_notifications
ADD COLUMN IF NOT EXISTS sent_via_system BOOLEAN DEFAULT false;
