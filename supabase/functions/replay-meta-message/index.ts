import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const { message_ids } = await req.json();
    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'message_ids array required' }), { status: 400, headers });
    }

    const n8nUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nUrl) {
      return new Response(JSON.stringify({ error: 'N8N_WEBHOOK_URL not set' }), { status: 500, headers });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const results: any[] = [];

    for (const msgId of message_ids) {
      const { data: msg, error: msgErr } = await supabase
        .from('messages').select('*').eq('id', msgId).maybeSingle();
      if (msgErr || !msg) {
        results.push({ msgId, ok: false, error: 'message not found' });
        continue;
      }

      const { data: contact } = await supabase
        .from('contacts')
        .select('id, name, phone, ai_enabled, pipeline_stage, channel_tag, tags, id_canal_externo')
        .eq('id', msg.contact_id).maybeSingle();
      if (!contact) {
        results.push({ msgId, ok: false, error: 'contact not found' });
        continue;
      }

      const { data: recent } = await supabase
        .from('messages')
        .select('id, content, sender_type, sender_name, type, created_at')
        .eq('contact_id', msg.contact_id)
        .order('created_at', { ascending: false })
        .limit(5);

      try {
        const r = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead: contact, currentMessage: msg, recentMessages: recent || [] }),
        });
        const text = await r.text();
        results.push({ msgId, ok: r.ok, status: r.status, body: text.substring(0, 200) });
      } catch (e) {
        results.push({ msgId, ok: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers });
  }
});
