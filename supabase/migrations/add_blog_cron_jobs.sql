-- Schedule blog content generation every 12 hours (06:00 & 18:00 UTC = 13:00 & 01:00 WIB)
-- Calls the Next.js API route which triggers the generator script
-- NOTE: Replace __CRON_SECRET__ with the actual CRON_SECRET from .env before running
SELECT cron.schedule(
  'blog-generate-job',
  '0 */12 * * *',
  $$
    SELECT net.http_post(
      url := 'https://kapster.my.id/api/cron/generate-blog',
      headers := jsonb_build_object(
        'Authorization', 'Bearer __CRON_SECRET__',
        'Content-Type', 'application/json'
      ),
      body := '{}'
    );
  $$
);
