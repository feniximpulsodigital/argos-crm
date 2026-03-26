import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useContacts, useMessages, useSendMessage } from '@/hooks/useSupabaseData';
import { format, parseISO } from 'date-fns';

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
  messenger: { bg: '#0084FF', label: 'Messenger' },
  'facebook-ads': { bg: '#1877F2', label: 'Facebook Ads' },
  site: { bg: '#f37121', label: 'Site' },
};

export default function MyConversations() {
  const { user } = useAuth();
  const { data: allContacts, isLoading } = useContacts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  // Filter contacts assigned to current user
  const myContacts = allContacts?.filter(c => c.assigned_agent_id === user?.id) || [];
  const selectedContact = myContacts.find(c => c.id === selectedId) || myContacts[0] || null;
  const { data: messages } = useMessages(selectedContact?.id || null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (myContacts.length && !selectedId) setSelectedId(myContacts[0].id);
  }, [myContacts, selectedId]);

  const filtered = myContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = () => {
    if (!message.trim() || !selectedContact) return;
    sendMessage.mutate({
      contact_id: selectedContact.id,
      content: message,
      sender_type: 'human',
      sender_name: user?.name,
      sender_user_id: user?.id,
    }, {
      onSuccess: () => { toast.success('Mensagem enviada!'); setMessage(''); },
      onError: () => toast.error('Erro ao enviar'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Conversas</h1>
        <p className="text-sm text-muted-foreground">Conversas atribuídas a {user?.name}</p>
      </div>

      <div className="flex h-[calc(100vh-11rem)] gap-0 rounded-xl border overflow-hidden bg-card">
        <div className="w-80 lg:w-96 flex-shrink-0 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filtered.map(contact => {
              const chs = channelStyles[contact.channel_tag] || { bg: '#888', label: contact.channel_tag };
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedContact?.id === contact.id ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                      {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {contact.last_message_at ? format(parseISO(contact.last_message_at), 'HH:mm') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.pipeline_stage}</p>
                      <span className="channel-badge text-[10px] mt-1" style={{ backgroundColor: `${chs.bg}20`, color: chs.bg }}>{chs.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa atribuída a você</p>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <>
              <div className="p-3 border-b flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                  {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedContact.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedContact.pipeline_stage}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 max-w-3xl mx-auto">
                  {messages?.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}>
                      <div className={msg.sender_type === 'client' ? 'message-client' : 'message-human'}>
                        {msg.sender_type === 'human' && (
                          <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                            <User className="h-3 w-3" />
                            <span>{msg.sender_name || 'Atendente'}</span>
                          </div>
                        )}
                        <p>{msg.content}</p>
                        <span className="text-[10px] opacity-60 mt-1 block text-right">{format(parseISO(msg.created_at), 'HH:mm')}</span>
                      </div>
                    </div>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-12">Nenhuma mensagem</p>
                  )}
                </div>
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} size="icon" disabled={sendMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Nenhuma conversa atribuída
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
