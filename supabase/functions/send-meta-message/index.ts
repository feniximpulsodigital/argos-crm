import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      console.error('send-meta-message auth failed: missing authorization header');
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers });
    }

    // Check if token is service_role by comparing OR by decoding JWT payload
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    let isServiceRole = Boolean(serviceRoleKey && token === serviceRoleKey);

    if (!isServiceRole) {
      try {
        const payloadB64 = token.split('.')[1];
        if (payloadB64) {
          const payload = JSON.parse(atob(payloadB64));
          if (payload.role === 'service_role') {
            isServiceRole = true;
          }
        }
      } catch (_) { /* not a valid JWT, will fall through to user auth */ }
    }

    let userId: string | null = null;
    let senderType = 'ia';
    let defaultSenderName = 'IA';

    if (!isServiceRole) {
      // Authenticated user (human agent)
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
      );

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('send-meta-message auth failed:', authError?.message ?? 'no user');
        return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers });
      }
      userId = user.id;
      senderType = 'human';
      defaultSenderName = 'Atendente';
    }

    const { contact_id, content, sender_name, reply_type } = await req.json();
    if (!contact_id || !content) {
      return new Response(JSON.stringify({ error: 'contact_id e content são obrigatórios' }), { status: 400, headers });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey,
      { auth: { persistSession: false } },
    );

    const { data: contact, error: contactError } = await adminClient
      .from('contacts')
      .select('id, name, phone, id_canal_externo, channel_tag, channel')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: 'Contato não encontrado' }), { status: 404, headers });
    }

    const pageAccessToken = Deno.env.get('META_PAGE_ACCESS_TOKEN');
    if (!pageAccessToken) {
      return new Response(JSON.stringify({ error: 'META_PAGE_ACCESS_TOKEN não configurado' }), { status: 500, headers });
    }

    const recipientId = contact.id_canal_externo;
    if (!recipientId) {
      return new Response(JSON.stringify({ error: 'Contato sem ID externo Meta' }), { status: 400, headers });
    }

    let externalMessageId: string | null = null;
    const channel = contact.channel || contact.channel_tag || 'facebook';
    const channelTag = contact.channel_tag || '';

    // Auto-detect reply_type: check the last client message's canal to determine
    // if the most recent interaction was a comment (even if the contact itself is "messenger")
    let effectiveReplyType = reply_type || null;
    if (!effectiveReplyType) {
      const { data: lastClientMsg } = await adminClient
        .from('messages')
        .select('canal')
        .eq('contact_id', contact_id)
        .eq('sender_type', 'client')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastCanal = (lastClientMsg?.canal || '').toLowerCase();
      const isCommentByLastMsg = lastCanal.includes('comentário') || lastCanal.includes('comentario');
      const isCommentByTag = channelTag.startsWith('comentario_') || channel.toLowerCase().includes('comentário');
      effectiveReplyType = (isCommentByLastMsg || isCommentByTag) ? 'comment' : 'message';
      console.log(`Auto-detected reply_type: ${effectiveReplyType} (lastCanal: ${lastCanal}, channelTag: ${channelTag})`);
    }

    if (effectiveReplyType === 'comment') {
      const { data: lastMsg } = await adminClient
        .from('messages')
        .select('id_mensagem_externa, parent_id_mensagem_externa, canal')
        .eq('contact_id', contact_id)
        .eq('sender_type', 'client')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const commentId = lastMsg?.id_mensagem_externa;
      if (!commentId) {
        return new Response(JSON.stringify({ error: 'Comentário original não encontrado para responder' }), { status: 400, headers });
      }

      // Instagram uses /replies, Facebook uses /comments
      const lastCanal = (lastMsg?.canal || '').toLowerCase();
      const isInstagramComment = lastCanal.includes('instagram') || channelTag.includes('instagram');
      const replyEndpoint = isInstagramComment ? 'replies' : 'comments';
      console.log(`Comment reply: using /${replyEndpoint} (canal: ${lastCanal}, channelTag: ${channelTag})`);

      const commentRes = await fetch(`${GRAPH_API}/${commentId}/${replyEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, access_token: pageAccessToken }),
      });

      if (!commentRes.ok) {
        const errBody = await commentRes.text();
        console.error('Meta comment reply error:', commentRes.status, errBody);
        return new Response(JSON.stringify({ error: 'Erro ao responder comentário via Meta' }), { status: 502, headers });
      }

      const commentResult = await commentRes.json();
      externalMessageId = commentResult.id || null;
    } else {
      const endpoint = `${GRAPH_API}/me/messages`;
      const msgRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: content },
          access_token: pageAccessToken,
        }),
      });

      if (!msgRes.ok) {
        const errBody = await msgRes.text();
        console.error('Meta message error:', msgRes.status, errBody);
        return new Response(JSON.stringify({ error: 'Erro ao enviar mensagem via Meta' }), { status: 502, headers });
      }

      const msgResult = await msgRes.json();
      externalMessageId = msgResult.message_id || null;
    }

    // Save outgoing message
    const { error: insertError } = await adminClient.from('messages').insert({
      contact_id,
      content,
      sender_type: senderType,
      sender_name: sender_name || defaultSenderName,
      sender_user_id: userId,
      type: 'text',
      status: 'delivered',
      canal: channel,
      id_mensagem_externa: externalMessageId,
    });

    if (insertError) {
      console.error('Erro ao salvar mensagem Meta:', insertError);
    }

    await adminClient.from('contacts').update({ last_message_at: new Date().toISOString() }).eq('id', contact_id);

    return new Response(JSON.stringify({ success: true, external_id: externalMessageId }), { status: 200, headers });
  } catch (error) {
    console.error('Erro no send-meta-message:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
