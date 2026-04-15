CREATE OR REPLACE FUNCTION public.delete_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  retention_days int;
BEGIN
  SELECT COALESCE((value->>'retention_days')::int, 90)
  INTO retention_days
  FROM app_settings
  WHERE key = 'message_cleanup';

  IF retention_days IS NULL THEN
    retention_days := 90;
  END IF;

  DELETE FROM messages
  WHERE created_at < now() - (retention_days || ' days')::interval;
END;
$$;