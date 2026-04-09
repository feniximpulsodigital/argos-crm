
SELECT cron.schedule(
  'delete-old-messages-daily',
  '0 3 * * *',
  $$SELECT public.delete_old_messages();$$
);
