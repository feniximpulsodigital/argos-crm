
SELECT cron.schedule(
  'move-inactive-leads',
  '0 3 * * *',
  $$SELECT public.move_inactive_leads_to_fora_de_funil()$$
);
