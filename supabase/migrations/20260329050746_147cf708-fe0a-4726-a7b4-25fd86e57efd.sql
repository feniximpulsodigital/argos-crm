
-- Contacts: add multichannel ID and ad tracking
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS id_canal_externo TEXT UNIQUE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS anuncio_origem TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_id_canal_externo ON public.contacts (id_canal_externo) WHERE id_canal_externo IS NOT NULL;

-- Messages: add channel, external message ID, and parent message ID
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS canal TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS id_mensagem_externa TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS parent_id_mensagem_externa TEXT;
