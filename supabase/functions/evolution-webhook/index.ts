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
    imageMessage?: { caption?: string; mimetype: string; url?: string };
    audioMessage?: { mimetype: string; url?: string };
  };
  pushName?: string;
  messageTimestamp: number;
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
    const rawPayload = await req.json();
    console.log('Payload bruto recebido:', JSON.stringify(rawPayload, null, 2));

    // Evolution API wraps the message inside { event, data }
    const eventType = rawPayload.event as string;
    if (eventType !== 'messages.upsert') {
      console.log(`Evento '${eventType}' ignorado (não é messages.upsert).`);
      return new Response(JSON.stringify({ message: `Evento '${eventType}' ignorado` }), { status: 200, headers });
    }

    const payload = rawPayload.data as EvolutionMessage;

    // Validate payload
    if (!payload?.key?.remoteJid || !payload?.key?.id || !payload?.message) {
      console.error('Payload inválido após extração de data:', payload);
      return new Response(JSON.stringify({ error: 'Payload inválido' }), { status: 400, headers });
    }

    // Ignore messages sent by our own bot to prevent loops
    if (payload.key.fromMe === true) {
      console.log('Mensagem do próprio bot ignorada.');
      return new Response(JSON.stringify({ message: 'Mensagem do próprio bot ignorada' }), { status: 200, headers });
    }

    const remoteJid = payload.key.remoteJid;
    const messageType = payload.message.imageMessage
      ? 'image'
      : payload.message.audioMessage
        ? 'audio'
        : 'text';
    // For media, try to save the URL; fallback to caption or placeholder
    const messageContent =
      payload.message.conversation ||
      (payload.message.imageMessage?.url ? payload.message.imageMessage.url : payload.message.imageMessage?.caption) ||
      (payload.message.audioMessage?.url ? payload.message.audioMessage.url : null) ||
      'Mensagem de mídia';
    const messageId = payload.key.id;
    const senderName = payload.pushName || remoteJid;

    // 1. Find or create contact
    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', remoteJid)
      .single();

    if (contactError && contactError.code === 'PGRST116') {
      console.log(`Lead não encontrado para ${remoteJid}. Criando novo...`);
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          name: senderName,
          phone: remoteJid,
          channel: 'WhatsApp',
          channel_tag: 'whatsapp',
          id_canal_externo: remoteJid,
          pipeline_stage: 'Novo Lead',
          ai_enabled: true,
          last_message_at: new Date().toISOString(),
          tags: ['WhatsApp'],
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Erro ao criar lead:', createError);
        return new Response(JSON.stringify({ error: 'Erro ao criar lead' }), { status: 500, headers });
      }
      contact = newContact;
    } else if (contactError) {
      console.error('Erro ao buscar lead:', contactError);
      return new Response(JSON.stringify({ error: 'Erro ao buscar lead' }), { status: 500, headers });
    }

    // 2. Save message
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        contact_id: contact!.id,
        content: messageContent,
        sender_type: 'client',
        sender_name: senderName,
        type: messageType,
        status: 'received',
        created_at: new Date(payload.messageTimestamp * 1000).toISOString(),
        canal: 'WhatsApp',
        id_mensagem_externa: messageId,
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar mensagem' }), { status: 500, headers });
    }

    // 3. Update last_message_at
    await supabase
      .from('contacts')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', contact!.id);

    // 4. AI logic — disable auto-reply for media, but ALWAYS forward to n8n
    if (messageType === 'image' || messageType === 'audio') {
      console.log(`Mensagem de ${messageType}. Desativando IA para lead ${contact!.id}.`);
      await supabase
        .from('contacts')
        .update({ ai_enabled: false })
        .eq('id', contact!.id);
    }

    // Always send to n8n so all messages are tracked
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', contact!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    await sendToN8n(contact!, savedMessage!, recentMessages || []);
    console.log(`Mensagem processada com sucesso para contact ${contact!.id}. Tipo: ${messageType}`);

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
