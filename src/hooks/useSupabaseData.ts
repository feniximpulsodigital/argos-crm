// ─── useSupabaseData.ts ─── split into focused hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// ─── Contacts ───
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as Tables<'contacts'>[];
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tables<'contacts'>> & { id: string }) => {
      const { error } = await supabase.from('contacts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// ─── Messages ───
export function useMessages(contactId: string | null) {
  return useQuery({
    queryKey: ['messages', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Tables<'messages'>[];
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { contact_id: string; content: string; sender_type: string; sender_name?: string; sender_user_id?: string }) => {
      const { error } = await supabase.from('messages').insert(msg);
      if (error) throw error;
      await supabase.from('contacts').update({ last_message_at: new Date().toISOString() }).eq('id', msg.contact_id);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.contact_id] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// ─── Pipeline Stages ───
export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline_stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('position');
      if (error) throw error;
      return data as Tables<'pipeline_stages'>[];
    },
  });
}

export function useCreatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stage: { name: string; color: string; position: number }) => {
      const { error } = await supabase.from('pipeline_stages').insert(stage);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_stages'] }),
  });
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; position?: number }) => {
      const { error } = await supabase.from('pipeline_stages').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_stages'] }),
  });
}

export function useDeletePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pipeline_stages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_stages'] }),
  });
}

export function useReorderPipelineStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stages: { id: string; position: number }[]) => {
      for (const s of stages) {
        const { error } = await supabase.from('pipeline_stages').update({ position: s.position }).eq('id', s.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_stages'] }),
  });
}

// ─── Invite User ───
export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; name: string; role: 'admin' | 'atendente' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://cberrojynahjnplaezji.supabase.co/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao convidar usuário');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['user_roles'] });
    },
  });
}

// ─── Delete User ───
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://cberrojynahjnplaezji.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao excluir usuário');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['user_roles'] });
    },
  });
}

// ─── Update Profile (admin) ───
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('profiles').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

// ─── Tags ───
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (error) throw error;
      return data as Tables<'tags'>[];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tag: { name: string; color: string; is_channel_tag?: boolean }) => {
      const { error } = await supabase.from('tags').insert(tag);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string }) => {
      const { error } = await supabase.from('tags').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

// ─── Reengagement Rules ───
export function useReengagementRules() {
  return useQuery({
    queryKey: ['reengagement_rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reengagement_rules').select('*').order('created_at');
      if (error) throw error;
      return data as Tables<'reengagement_rules'>[];
    },
  });
}

export function useUpsertReengagementRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<Tables<'reengagement_rules'>> & { name: string; message: string }) => {
      const { error } = rule.id
        ? await supabase.from('reengagement_rules').update(rule).eq('id', rule.id)
        : await supabase.from('reengagement_rules').insert(rule);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reengagement_rules'] }),
  });
}

export function useDeleteReengagementRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reengagement_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reengagement_rules'] }),
  });
}

// ─── App Settings ───
export function useAppSettings() {
  return useQuery({
    queryKey: ['app_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      return data as Tables<'app_settings'>[];
    },
  });
}

export function useUpdateAppSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('app_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_settings'] }),
  });
}

// ─── Profiles (team) ───
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;
      return data as Tables<'profiles'>[];
    },
  });
}

// ─── User Roles ───
export function useUserRoles() {
  return useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data as Tables<'user_roles'>[];
    },
  });
}
