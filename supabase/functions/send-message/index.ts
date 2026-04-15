import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    // Validate auth — accept both user JWT and service_role key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers });
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const isServiceRole = token === serviceRoleKey;

    let userId: string | null = null;

    if (!isServiceRole) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
      );
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers });
      }
      userId = user.id;
    }

    const { contact_id, content, sender_name } = await req.json();
    if (!contact_id || !content) {
      return new Response(JSON.stringify({ error: 'contact_id e content são obrigatórios' }), { status: 400, headers });
    }

    // Use service role to read contact
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data: contact, error: contactError } = await adminClient
      .from('contacts')
      .select('id, phone, id_canal_externo, channel_tag')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: 'Contato não encontrado' }), { status: 404, headers });
    }

    // Block non-WhatsApp contacts — they should use send-meta-message instead
    const metaChannels = ['messenger', 'instagram', 'facebook'];
    if (metaChannels.includes((contact.channel_tag || '').toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Este contato é do canal ' + contact.channel_tag + '. Use a função send-meta-message.' }), { status: 400, headers });
    }

    // Determine destination number
    const destination = contact.id_canal_externo || contact.phone;
    if (!destination) {
      return new Response(JSON.stringify({ error: 'Contato sem número de telefone' }), { status: 400, headers });
    }

    // Format number for Evolution API
    let number = destination.split('@')[0]?.replace(/\D/g, '') || destination;

    // Send via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')!;
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME')!;

    if (!evolutionUrl || !evolutionKey || !instanceName) {
      console.error('Missing Evolution API secrets');
      return new Response(JSON.stringify({ error: 'Configuração da Evolution API incompleta' }), { status: 500, headers });
    }

    // Build URL: strip trailing slash and any existing path segments to get base URL
    const baseUrl = evolutionUrl.replace(/\/+$/, '').replace(/\/message\/send\w+\/.*$/, '').replace(/\/message\/send\w+$/, '');
    const sendUrl = `${baseUrl}/message/sendText/${instanceName}`;
    console.log('Evolution send URL:', sendUrl);

    const evolutionResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number,
        text: content,
      }),
    });

    if (!evolutionResponse.ok) {
      const errBody = await evolutionResponse.text();
      console.error('Evolution API error:', evolutionResponse.status, errBody);
      return new Response(JSON.stringify({ error: 'Erro ao enviar mensagem via WhatsApp' }), { status: 502, headers });
    }

    const evolutionResult = await evolutionResponse.json();
    const externalMessageId = evolutionResult?.key?.id || null;

    // Save message in DB
    const { error: insertError } = await adminClient.from('messages').insert({
      contact_id,
      content,
      sender_type: isServiceRole ? 'ia' : 'human',
      sender_name: sender_name || (isServiceRole ? 'IA' : 'Atendente'),
      sender_user_id: userId,
      type: 'text',
      status: 'delivered',
      canal: 'WhatsApp',
      id_mensagem_externa: externalMessageId,
    });

    if (insertError) {
      console.error('Erro ao salvar mensagem:', insertError);
    }

    // Update last_message_at
    await adminClient.from('contacts').update({ last_message_at: new Date().toISOString() }).eq('id', contact_id);

    return new Response(JSON.stringify({ success: true, external_id: externalMessageId }), { status: 200, headers });
  } catch (error) {
    console.error('Erro no send-message:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
