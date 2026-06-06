SELECT cron.schedule(
  'daily-standup-job',
  '5 8 * * *',
  $$SELECT net.http_post(
    url:='https://kapster.my.id/api/cron/daily-standup',
    headers:='{"Authorization":"Bearer kpBlogGen2026!","Content-Type":"application/json"}'::jsonb
  )$$
);
