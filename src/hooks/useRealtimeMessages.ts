import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes on the `messages` table and invalidates
 * the relevant TanStack Query caches. Contact list refresh is piggy-backed
 * on message events to avoid broadcasting contact rows (which contain phone
 * numbers and emails) to authenticated users not assigned to those contacts.
 */
export function useRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const contactId = (payload.new as any)?.contact_id || (payload.old as any)?.contact_id;
          if (contactId) {
            qc.invalidateQueries({ queryKey: ['messages', contactId] });
          }
          qc.invalidateQueries({ queryKey: ['contacts'] });
        },
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
