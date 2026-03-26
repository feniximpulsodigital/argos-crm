import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Search, Send, Bot, User, ArrowRight, Store, Globe, ShoppingCart, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useContacts, useMessages, useSendMessage, useUpdateContact } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
  messenger: { bg: '#0084FF', label: 'Messenger' },
  'facebook-ads': { bg: '#1877F2', label: 'Facebook Ads' },
  site: { bg: '#f37121', label: 'Site' },
};

export default function Conversations() {
  const { user } = useAuth();
  const { data: contacts, isLoading } = useContacts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const selectedContact = contacts?.find(c => c.id === selectedId) || contacts?.[0] || null;
  const { data: messages } = useMessages(selectedContact?.id || null);
  const sendMessage = useSendMessage();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (contacts?.length && !selectedId) setSelectedId(contacts[0].id);
  }, [contacts, selectedId]);

  const filteredContacts = contacts?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.channel_tag.includes(searchQuery.toLowerCase())
  ) || [];

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
      onError: () => toast.error('Erro ao enviar mensagem'),
    });
  };

  const handleToggleAi = (enabled: boolean) => {
    if (!selectedContact) return;
    updateContact.mutate({ id: selectedContact.id, ai_enabled: enabled }, {
      onSuccess: () => toast.success(enabled ? 'IA ativada' : 'IA desativada'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const ch = selectedContact ? (channelStyles[selectedContact.channel_tag] || { bg: '#888', label: selectedContact.channel_tag }) : { bg: '#888', label: '' };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-0 rounded-xl border overflow-hidden bg-card animate-fade-in">
      {/* Contact list */}
      <div className="w-80 lg:w-96 flex-shrink-0 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contato..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredContacts.map(contact => {
            const chs = channelStyles[contact.channel_tag] || { bg: '#888', label: contact.channel_tag };
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedId(contact.id)}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedContact?.id === contact.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                      {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card" style={{ backgroundColor: chs.bg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.last_message_at ? format(parseISO(contact.last_message_at), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.pipeline_stage}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="channel-badge text-[10px]" style={{ backgroundColor: `${chs.bg}20`, color: chs.bg }}>{chs.label}</span>
                      {contact.ai_enabled && (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1"><Bot className="h-2.5 w-2.5" /> IA</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredContacts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato encontrado</p>
          )}
        </ScrollArea>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedContact ? (
          <>
            <div className="p-3 border-b flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground flex-shrink-0">
                  {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{selectedContact.name}</h3>
                    <span className="channel-badge text-[10px]" style={{ backgroundColor: `${ch.bg}20`, color: ch.bg }}>{ch.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedContact.pipeline_stage}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">IA</span>
                <Switch checked={selectedContact.ai_enabled} onCheckedChange={handleToggleAi} />
                <span className={`text-xs font-medium ${selectedContact.ai_enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                  {selectedContact.ai_enabled ? 'Ativa' : 'Desativada'}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {messages?.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}>
                    <div className={
                      msg.sender_type === 'client' ? 'message-client'
                        : msg.sender_type === 'ia' ? 'message-ia'
                        : 'message-human'
                    }>
                      {msg.sender_type !== 'client' && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                          {msg.sender_type === 'ia' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          <span>{msg.sender_type === 'ia' ? 'IA' : msg.sender_name || 'Atendente'}</span>
                        </div>
                      )}
                      <p>{msg.content}</p>
                      <span className="text-[10px] opacity-60 mt-1 block text-right">{format(parseISO(msg.created_at), 'HH:mm')}</span>
                    </div>
                  </div>
                ))}
                {(!messages || messages.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-12">Nenhuma mensagem ainda</p>
                )}
              </div>
            </ScrollArea>

            <div className="px-4 py-2 border-t flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => toast.info('Encaminhar para vendedor')}>
                <ArrowRight className="mr-1 h-3 w-3" /> Vendedor
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.info('Encaminhar para loja')}>
                <Store className="mr-1 h-3 w-3" /> Loja
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.info('Encaminhar para site')}>
                <Globe className="mr-1 h-3 w-3" /> Site
              </Button>
              <Button size="sm" variant="accent" onClick={() => {
                if (selectedContact) {
                  updateContact.mutate({ id: selectedContact.id, pipeline_stage: 'Compra Realizada' }, {
                    onSuccess: () => toast.success('Compra marcada!'),
                  });
                }
              }}>
                <ShoppingCart className="mr-1 h-3 w-3" /> Compra realizada
              </Button>
            </div>

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
            Selecione um contato para ver a conversa
          </div>
        )}
      </div>
    </div>
  );
}
