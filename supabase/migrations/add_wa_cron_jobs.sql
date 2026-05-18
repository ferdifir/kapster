-- Enable pg_net extension for HTTP calls from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job 1: Process pending WA notifications every minute
SELECT cron.schedule(
  'wa-send-job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/wa-sender',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
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

-- NOTE: The cron jobs above require these database-level GUC settings to be configured
-- in Supabase Dashboard → Database → Settings → Custom GUC (or via SQL):
--
--   ALTER DATABASE postgres SET app.settings.supabase_url TO 'https://<your-project>.supabase.co';
--   ALTER DATABASE postgres SET app.settings.supabase_service_role_key TO '<your_service_role_key>';
--
-- Without these settings, the wa-send-job will fail with "unrecognized configuration parameter".
