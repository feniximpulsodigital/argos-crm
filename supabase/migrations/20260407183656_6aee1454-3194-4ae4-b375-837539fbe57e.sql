
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1) Ensure funnel_inactivity setting exists
INSERT INTO public.app_settings (key, value)
VALUES ('funnel_inactivity', '{"enabled": true, "days": 5}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2) Trigger: move contact to "Em Atendimento" when AI replies
CREATE OR REPLACE FUNCTION public.move_contact_on_ai_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_type = 'ia' THEN
    UPDATE contacts
    SET pipeline_stage = 'Em Atendimento', updated_at = now()
    WHERE id = NEW.contact_id
      AND pipeline_stage NOT IN ('Em Atendimento', 'Convertido', 'Fora de Funil');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_move_contact_on_ai_reply ON messages;
CREATE TRIGGER trg_move_contact_on_ai_reply
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.move_contact_on_ai_reply();

-- 3) Function: move inactive leads to "Fora de Funil"
CREATE OR REPLACE FUNCTION public.move_inactive_leads_to_fora_de_funil()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inactivity_days int;
  is_enabled boolean;
BEGIN
  SELECT
    (value->>'enabled')::boolean,
    (value->>'days')::int
  INTO is_enabled, inactivity_days
  FROM app_settings
  WHERE key = 'funnel_inactivity';

  IF is_enabled IS NULL OR NOT is_enabled THEN
    RETURN;
  END IF;

  IF inactivity_days IS NULL OR inactivity_days < 1 THEN
    inactivity_days := 5;
  END IF;

  UPDATE contacts
  SET pipeline_stage = 'Fora de Funil', updated_at = now()
  WHERE pipeline_stage NOT IN ('Fora de Funil', 'Convertido')
    AND last_message_at < now() - (inactivity_days || ' days')::interval;
END;
$$;
