import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string; mimetype: string; url?: string };
    audioMessage?: { mimetype: string; url?: string };
    videoMessage?: { caption?: string; mimetype?: string; url?: string };
    documentMessage?: { caption?: string; mimetype?: string; url?: string; fileName?: string };
  };
  pushName?: string;
  messageTimestamp: number;
}

interface EvolutionWebhookPayload {
  event?: string;
  data?: unknown;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string | null;
  ai_enabled: boolean;
  pipeline_stage: string;
  channel_tag: string;
  tags: string[];
  id_canal_externo: string | null;
}

const SUPPORTED_EVENTS = new Set([
  'messages.upsert',
  'message.upsert',
  'send.message',
  'send-message',
]);

function normalizeJid(jid: string): string {
  return jid.split(':')[0]?.trim() || jid;
}

function buildJidCandidates(remoteJid: string) {
  const normalized = normalizeJid(remoteJid);
  const digits = normalized.split('@')[0]?.replace(/\D/g, '');
  const candidates = new Set<string>([remoteJid, normalized]);

  if (digits) {
    candidates.add(`${digits}@s.whatsapp.net`);
    candidates.add(`${digits}@c.us`);
  }

  return Array.from(candidates).filter(Boolean);
}

function extractEvolutionMessage(data: unknown): EvolutionMessage | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    return (data[0] as EvolutionMessage) || null;
  }

  if (typeof data === 'object' && data !== null) {
    const maybeWrapped = data as Record<string, unknown>;

    if (Array.isArray(maybeWrapped.messages) && maybeWrapped.messages.length > 0) {
      return maybeWrapped.messages[0] as EvolutionMessage;
    }

    if (maybeWrapped.key && maybeWrapped.message) {
      return data as EvolutionMessage;
    }
  }

  return null;
}

function extractMessageType(payload: EvolutionMessage) {
  if (payload.message.imageMessage) return 'image';
  if (payload.message.audioMessage) return 'audio';
  return 'text';
}

function extractMessageContent(payload: EvolutionMessage) {
  return (
    payload.message.conversation ||
    payload.message.extendedTextMessage?.text ||
    payload.message.imageMessage?.url ||
    payload.message.imageMessage?.caption ||
    payload.message.audioMessage?.url ||
    payload.message.videoMessage?.url ||
    payload.message.videoMessage?.caption ||
    payload.message.documentMessage?.url ||
    payload.message.documentMessage?.caption ||
    payload.message.documentMessage?.fileName ||
    'Mensagem sem conteúdo textual'
  );
}

async function findContactByJid(supabase: ReturnType<typeof createClient>, jidCandidates: string[]) {
  const selectFields = 'id, name, phone, ai_enabled, pipeline_stage, channel_tag, tags, id_canal_externo';

  const { data: phoneMatches, error: phoneError } = await supabase
    .from('contacts')
    .select(selectFields)
    .in('phone', jidCandidates)
    .limit(1);

  if (phoneError) throw phoneError;
  if (phoneMatches && phoneMatches.length > 0) {
    return phoneMatches[0] as ContactRow;
  }

  const { data: externalIdMatches, error: externalIdError } = await supabase
    .from('contacts')
    .select(selectFields)
    .in('id_canal_externo', jidCandidates)
    .limit(1);

  if (externalIdError) throw externalIdError;
  if (externalIdMatches && externalIdMatches.length > 0) {
    return externalIdMatches[0] as ContactRow;
  }

  return null;
}

async function sendToN8n(
  lead: Record<string, unknown>,
  currentMessage: Record<string, unknown>,
  recentMessages: Record<string, unknown>[],
) {
  const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
  if (!n8nWebhookUrl) {
    console.error('N8N_WEBHOOK_URL não configurada.');
    return;
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, currentMessage, recentMessages }),
    });

    if (!response.ok) {
      console.error(`Erro ao enviar para N8n: ${response.status} - ${await response.text()}`);
    } else {
      console.log('Mensagem enviada para N8n com sucesso.');
    }
  } catch (error) {
    console.error('Erro ao conectar com N8n:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  // Use SERVICE_ROLE_KEY to bypass RLS — this is a server-to-server webhook
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  try {
    const rawPayload = (await req.json()) as EvolutionWebhookPayload;
    const rawDataForLog = rawPayload.data as { key?: { remoteJid?: string } } | undefined;
    console.log('Evento recebido:', rawPayload.event, 'JID:', rawDataForLog?.key?.remoteJid);

    const eventType = rawPayload.event as string;
    if (!SUPPORTED_EVENTS.has(eventType)) {
      console.log(`Evento '${eventType}' ignorado (não suportado).`);
      return new Response(JSON.stringify({ message: `Evento '${eventType}' ignorado` }), { status: 200, headers });
    }

    const payload = extractEvolutionMessage(rawPayload.data);

    // Validate payload
    if (!payload?.key?.remoteJid || !payload?.key?.id || !payload?.message) {
      console.error('Payload inválido após extração de data:', payload);
      return new Response(JSON.stringify({ error: 'Payload inválido' }), { status: 400, headers });
    }

    const isFromMe = payload.key.fromMe === true;

    const remoteJid = normalizeJid(payload.key.remoteJid);
    const jidCandidates = buildJidCandidates(remoteJid);
    const messageType = extractMessageType(payload);
    const messageContent = extractMessageContent(payload);
    const messageId = payload.key.id;
    const contactDisplayName = payload.pushName || remoteJid.split('@')[0] || remoteJid;
    const senderName = isFromMe ? 'IA' : (payload.pushName || remoteJid);
    const senderType = isFromMe ? 'ia' : 'client';
    const createdAt = payload.messageTimestamp
      ? new Date(payload.messageTimestamp * 1000).toISOString()
      : new Date().toISOString();

    // 1. Find or create contact
    let contact: ContactRow | null = null;

    try {
      contact = await findContactByJid(supabase, jidCandidates);
    } catch (contactLookupError) {
      console.error('Erro ao buscar lead:', contactLookupError);
      return new Response(JSON.stringify({ error: 'Erro ao buscar lead' }), { status: 500, headers });
    }

    if (!contact) {
      console.log(`Lead não encontrado para ${remoteJid}. Criando novo...`);
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          name: contactDisplayName,
          phone: remoteJid,
          channel: 'WhatsApp',
          channel_tag: 'whatsapp',
          id_canal_externo: remoteJid,
          pipeline_stage: 'Novo Lead',
          ai_enabled: true,
          last_message_at: new Date().toISOString(),
          tags: ['WhatsApp'],
        })
        .select('id, name, phone, ai_enabled, pipeline_stage, channel_tag, tags, id_canal_externo')
        .single();

      if (createError) {
        console.error('Erro ao criar lead:', createError);
        return new Response(JSON.stringify({ error: 'Erro ao criar lead' }), { status: 500, headers });
      }

      contact = newContact as ContactRow;
    }

    // Avoid duplicate inserts from webhook retries
    if (messageId) {
      const { data: existingMessage, error: existingMessageError } = await supabase
        .from('messages')
        .select('id')
        .eq('id_mensagem_externa', messageId)
        .maybeSingle();

      if (existingMessageError && existingMessageError.code !== 'PGRST116') {
        console.error('Erro ao verificar duplicidade de mensagem:', existingMessageError);
        return new Response(JSON.stringify({ error: 'Erro ao verificar mensagem existente' }), { status: 500, headers });
      }

      if (existingMessage) {
        console.log(`Mensagem duplicada ignorada: ${messageId}`);
        return new Response(JSON.stringify({ message: 'Mensagem já processada' }), { status: 200, headers });
      }
    }

    // 2. Save message
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        contact_id: contact.id,
        content: messageContent,
        sender_type: senderType,
        sender_name: senderName,
        type: messageType,
        status: isFromMe ? 'delivered' : 'received',
        created_at: createdAt,
        canal: 'WhatsApp',
        id_mensagem_externa: messageId,
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar mensagem' }), { status: 500, headers });
    }

    // 3. Update last_message_at (fire-and-forget)
    supabase
      .from('contacts')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', contact.id)
      .then(() => {});

    // 4. AI logic — only for incoming messages (fire-and-forget n8n call)
    if (!isFromMe) {
      const isMedia = messageType === 'image' || messageType === 'audio';

      if (isMedia) {
        supabase
          .from('contacts')
          .update({ ai_enabled: false })
          .eq('id', contact.id)
          .then(() => console.log(`IA desativada para lead ${contact.id} (mídia) — n8n não será acionado`));
      } else if (contact.ai_enabled) {
        // Only forward to n8n for text messages when AI is still enabled for this lead
        supabase
          .from('messages')
          .select('id, content, sender_type, sender_name, type, created_at')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data: recentMessages }) => {
            sendToN8n(contact as Record<string, unknown>, savedMessage as Record<string, unknown>, recentMessages || []);
          });
      } else {
        console.log(`IA desativada para lead ${contact.id} — mensagem não enviada ao n8n`);
      }
    }

    console.log(`Mensagem processada: contact ${contact.id}, tipo: ${messageType}, fromMe: ${isFromMe}`);

    return new Response(
      JSON.stringify({ message: 'Webhook processado com sucesso' }),
      { status: 200, headers },
    );
  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
