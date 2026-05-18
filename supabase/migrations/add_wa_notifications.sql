-- Add WhatsApp connection columns to barbershops
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS wuzapi_user_id BIGINT,
ADD COLUMN IF NOT EXISTS wuzapi_token TEXT,
ADD COLUMN IF NOT EXISTS wa_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wa_phone_number TEXT,
ADD COLUMN IF NOT EXISTS wa_pairing_code TEXT;

-- Create wa_notifications table
CREATE TABLE IF NOT EXISTS wa_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  event_type TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  wuzapi_message_id TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Index for efficient polling of pending notifications
CREATE INDEX IF NOT EXISTS idx_wa_notifications_pending
  ON wa_notifications(status, retry_count, created_at)
  WHERE status IN ('pending', 'retrying');

-- Index for filtering by barbershop
CREATE INDEX IF NOT EXISTS idx_wa_notifications_barbershop
  ON wa_notifications(barbershop_id);

-- Enable RLS
ALTER TABLE wa_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: barbershop owners can view their own notifications
CREATE POLICY "Barbershop owners can view their notifications"
  ON wa_notifications FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE owner_id = auth.uid()
  ));

-- Note: Service role key bypasses RLS entirely, so no policy is needed
-- for server-side code (Edge Functions, server actions using service_role key).
