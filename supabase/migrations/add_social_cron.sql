-- Schedule social content generation daily at 06:00 WIB (23:00 UTC previous day)
-- Calls the Next.js API route which triggers the social media content generator
SELECT cron.schedule(
  'social-content-generate-job',
  '0 23 * * *',
  $$
    SELECT net.http_post(
      url := 'https://kapster.my.id/api/cron/generate-social-content',
      headers := jsonb_build_object(
        'Authorization', 'Bearer kpBlogGen2026!',
        'Content-Type', 'application/json'
      ),
      body := '{}'
    );
  $$
);
