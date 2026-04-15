-- Função para limpar todas as mensagens
CREATE OR REPLACE FUNCTION public.clear_all_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM messages;
END;
$$;

-- Executar a função para limpar todas as mensagens agora
SELECT clear_all_messages();