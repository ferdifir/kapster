-- Schedule demo session cleanup every 60 seconds
SELECT cron.schedule(
  'demo-cleanup-job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://kapster.my.id/api/cron/demo-cleanup',
      headers := jsonb_build_object(
        'Authorization', 'Bearer kpBlogGen2026!',
        'Content-Type', 'application/json'
      ),
      body := '{}'
    );
  $$
);
