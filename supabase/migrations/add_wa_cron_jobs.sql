-- Enable pg_net extension for HTTP calls from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job 1: Process pending WA notifications every minute
SELECT cron.schedule(
  'wa-send-job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://arlpgnxtdbtvuxqvcytg.supabase.co/functions/v1/wa-sender',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybHBnbnh0ZGJ0dnV4cXZjeXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgxMzE4NiwiZXhwIjoyMDk0Mzg5MTg2fQ.s5qIakRwfLHRw2Ebh4G-IfTpkCc3kXRqip9KwLIyUyE'
      ),
      body := '{}'
    );
  $$
);

-- Job 2: Booking reminders — every 5 minutes, find bookings 1 hour away
SELECT cron.schedule(
  'wa-reminder-job',
  '*/5 * * * *',
  $$
    INSERT INTO wa_notifications (barbershop_id, customer_phone, customer_name, event_type, message_body)
    SELECT
      b.id,
      bk.phone,
      bk.customer_name,
      'booking_reminder',
      'Halo ' || bk.customer_name || ', reminder: booking Anda di *' || b.name || '* dalam 1 jam lagi. 📅 ' ||
      to_char(bk.scheduled_at, 'Day, DD Month YYYY') || ', ⏰ ' || to_char(bk.scheduled_at, 'HH24:MI') || '. Jangan sampai telat ya!'
    FROM bookings bk
    JOIN barbershops b ON b.id = bk.barbershop_id
    WHERE bk.status = 'confirmed'
      AND bk.scheduled_at BETWEEN NOW() + INTERVAL '59 minutes' AND NOW() + INTERVAL '61 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM wa_notifications wn
        WHERE wn.barbershop_id = b.id
          AND wn.customer_phone = bk.phone
          AND wn.event_type = 'booking_reminder'
          AND wn.created_at > NOW() - INTERVAL '2 hours'
      );
  $$
);

-- NOTE: The service_role key is hardcoded in this migration. For production,
-- consider using a dedicated database role with limited permissions instead.
