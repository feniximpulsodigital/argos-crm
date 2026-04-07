import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'mobiliaurbana2024';

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

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
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
      console.log('Mensagem Meta enviada para N8n com sucesso.');
    }
  } catch (error) {
    console.error('Erro ao conectar com N8n:', error);
  }
}

// ─── Handle webhook verification (GET) ───
function handleVerification(url: URL): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Meta webhook verificado com sucesso.');
    return new Response(challenge, { status: 200 });
  }
  console.error('Falha na verificação do webhook Meta.');
  return new Response('Forbidden', { status: 403 });
}

// ─── Determine channel from webhook entry ───
function detectChannel(messagingOrChange: Record<string, unknown>, entryId: string): { channel: string; channelTag: string } {
  // Instagram webhooks come under "instagram" field or changes with field "comments"/"mentions"
  if ((messagingOrChange as any).field === 'comments' || (messagingOrChange as any).field === 'mentions') {
    return { channel: 'Instagram', channelTag: 'instagram' };
  }
  // If it has instagram_id or comes from instagram entry
  if ((messagingOrChange as any).sender?.id && (messagingOrChange as any).recipient?.id) {
    // Could be Messenger or IG Direct — we'll differentiate by entry object_id later
    return { channel: 'Messenger', channelTag: 'messenger' };
  }
  return { channel: 'Facebook', channelTag: 'facebook' };
}

// ─── Process a messaging event (Messenger / IG Direct) ───
async function processMessaging(entry: any, messaging: any, supabase: ReturnType<typeof createClient>, objectType: string) {
  const senderId = messaging.sender?.id;
  const messageObj = messaging.message;
  const postback = messaging.postback;

  if (!senderId) return;

  // Ignore echo (messages sent by the page itself)
  if (messageObj?.is_echo) {
    console.log('Echo message ignored.');
    return;
  }

  const content = messageObj?.text || postback?.title || messageObj?.attachments?.[0]?.payload?.url || 'Mídia recebida';
  const messageId = messageObj?.mid || `postback_${Date.now()}`;
  const messageType = messageObj?.attachments?.[0]?.type || 'text';

  // Use the top-level "object" field from Meta payload to determine channel
  const isInstagram = objectType === 'instagram';
  const channel = isInstagram ? 'Instagram Direct' : 'Messenger';
  const channelTag = isInstagram ? 'instagram_direct' : 'messenger';

  await upsertContactAndSaveMessage(supabase, {
    externalId: senderId,
    name: senderId, // Will be updated later if we fetch profile
    content,
    messageId,
    messageType,
    channel,
    channelTag,
    senderType: 'client',
    senderName: senderId,
  });
}

// ─── Process a comment event (IG / FB) ───
async function processComment(entry: any, change: any, supabase: ReturnType<typeof createClient>) {
  if (change.field !== 'feed' && change.field !== 'comments') return;

  const value = change.value;
  if (!value) return;

  // For feed (Facebook page comments)
  const commentId = value.comment_id || value.id;
  const senderId = value.from?.id;
  const senderName = value.from?.name || senderId || 'Desconhecido';
  const content = value.message || value.text || 'Comentário sem texto';
  const postId = value.post_id || value.media_id;

  if (!senderId || !commentId) return;

  // Determine channel - differentiate Facebook vs Instagram comments
  const channel = change.field === 'comments' ? 'Comentário Instagram' : 'Comentário Facebook';
  const channelTag = change.field === 'comments' ? 'comentario_instagram' : 'comentario_facebook';

  await upsertContactAndSaveMessage(supabase, {
    externalId: senderId,
    name: senderName,
    content: `[Comentário${postId ? ` no post ${postId}` : ''}]: ${content}`,
    messageId: commentId,
    messageType: 'comment',
    channel,
    channelTag,
    senderType: 'client',
    senderName: senderName,
    parentExternalId: postId || null,
  });
}

// ─── Shared: upsert contact + save message + send to n8n ───
async function upsertContactAndSaveMessage(
  supabase: ReturnType<typeof createClient>,
  data: {
    externalId: string;
    name: string;
    content: string;
    messageId: string;
    messageType: string;
    channel: string;
    channelTag: string;
    senderType: string;
    senderName: string;
    parentExternalId?: string | null;
  },
) {
  // Check for duplicate
  if (data.messageId) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('id_mensagem_externa', data.messageId)
      .maybeSingle();
    if (existing) {
      console.log(`Mensagem duplicada ignorada: ${data.messageId}`);
      return;
    }
  }

  // Find or create contact by external id
  let contact: ContactRow | null = null;

  const { data: found } = await supabase
    .from('contacts')
    .select('id, name, phone, ai_enabled, pipeline_stage, channel_tag, tags, id_canal_externo')
    .eq('id_canal_externo', data.externalId)
    .maybeSingle();

  if (found) {
    contact = found as ContactRow;
    // Update channel info if it changed (e.g., same user now commenting instead of messaging)
    if (found.channel_tag !== data.channelTag) {
      await supabase
        .from('contacts')
        .update({ channel: data.channel, channel_tag: data.channelTag })
        .eq('id', found.id);
      console.log(`Contato ${found.id} canal atualizado: ${found.channel_tag} → ${data.channelTag}`);
    }
  } else {
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        name: data.name,
        channel: data.channel,
        channel_tag: data.channelTag,
        id_canal_externo: data.externalId,
        pipeline_stage: 'Novo Lead',
        ai_enabled: true,
        last_message_at: new Date().toISOString(),
        tags: [data.channelTag],
      })
      .select('id, name, phone, ai_enabled, pipeline_stage, channel_tag, tags, id_canal_externo')
      .single();

    if (createError) {
      console.error('Erro ao criar contato Meta:', createError);
      return;
    }
    contact = newContact as ContactRow;
    console.log(`Novo contato criado via ${data.channel}: ${contact.id}`);
  }

  // Save message
  const { data: savedMessage, error: msgError } = await supabase
    .from('messages')
    .insert({
      contact_id: contact.id,
      content: data.content,
      sender_type: data.senderType,
      sender_name: data.senderName,
      type: data.messageType === 'comment' ? 'text' : data.messageType,
      status: 'received',
      canal: data.channel,
      id_mensagem_externa: data.messageId,
      parent_id_mensagem_externa: data.parentExternalId || null,
    })
    .select('*')
    .single();

  if (msgError) {
    console.error('Erro ao salvar mensagem Meta:', msgError);
    return;
  }

  // Update last_message_at
  supabase
    .from('contacts')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', contact.id)
    .then(() => {});

  // Send to n8n (fire-and-forget)
  supabase
    .from('messages')
    .select('id, content, sender_type, sender_name, type, created_at')
    .eq('contact_id', contact.id)
    .order('created_at', { ascending: false })
    .limit(5)
    .then(({ data: recentMessages }) => {
      sendToN8n(
        contact as unknown as Record<string, unknown>,
        savedMessage as Record<string, unknown>,
        recentMessages || [],
      );
    });

  console.log(`Mensagem Meta processada: contact ${contact.id}, canal: ${data.channel}, tipo: ${data.messageType}`);
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // GET = Meta verification challenge
  if (req.method === 'GET') {
    return handleVerification(url);
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    console.log('Meta webhook recebido:', JSON.stringify(body).substring(0, 500));

    const supabase = getSupabase();

    // Meta sends { object: "page" | "instagram", entry: [...] }
    const objectType = body.object || 'page';
    const entries = body.entry || [];

    for (const entry of entries) {
      // Messaging events (Messenger / IG Direct)
      const messagingEvents = entry.messaging || [];
      for (const messaging of messagingEvents) {
        await processMessaging(entry, messaging, supabase, objectType);
      }

      // Changes events (comments, feed)
      const changes = entry.changes || [];
      for (const change of changes) {
        await processComment(entry, change, supabase);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    console.error('Erro no meta-webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
