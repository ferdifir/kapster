SELECT cron.schedule(
  'agent-plan-review-job',
  '0 8 * * *',
  $$SELECT net.http_post(
    url:='https://kapster.my.id/api/cron/agent-plan-review',
    headers:='{"Authorization":"Bearer kpBlogGen2026!","Content-Type":"application/json"}'::jsonb
  )$$
);
