import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes on `messages` and `contacts` tables,
 * automatically invalidating the relevant TanStack Query caches.
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          qc.invalidateQueries({ queryKey: ['contacts'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
