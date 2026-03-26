import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Search, Send, Bot, User, ArrowRight, Store, Globe, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
};

const myContacts = [
  { id: '2', name: 'Ana Costa', phone: '+5511988776655', channel: 'instagram', channelTag: 'instagram-direct', lastMessage: 'Vocês fazem entrega para SP?', time: '09:45', aiEnabled: false, assignedAgent: 'Maria Silva', tags: ['Lead'], pipelineStage: 'Proposta Enviada' },
  { id: '6', name: 'Fernanda Rocha', phone: '+5511944332211', channel: 'whatsapp', channelTag: 'whatsapp', lastMessage: 'Obrigada pelo atendimento!', time: '08:15', aiEnabled: false, assignedAgent: 'Maria Silva', tags: ['Lead', 'Comprou'], pipelineStage: 'Compra Realizada' },
];

const mockMessages = [
  { id: '1', content: 'Vocês fazem entrega para SP?', senderType: 'client' as const, time: '09:40' },
  { id: '2', content: 'Sim, fazemos! O frete para SP capital é grátis acima de R$ 200.', senderType: 'human' as const, senderName: 'Maria Silva', time: '09:42' },
  { id: '3', content: 'Ótimo! Vou fazer meu pedido agora', senderType: 'client' as const, time: '09:45' },
];

export default function MyConversations() {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState(myContacts[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Conversas</h1>
        <p className="text-sm text-muted-foreground">Conversas atribuídas a {user?.name}</p>
      </div>

      <div className="flex h-[calc(100vh-11rem)] gap-0 rounded-xl border overflow-hidden bg-card">
        {/* Left panel */}
        <div className="w-80 lg:w-96 flex-shrink-0 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {myContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(contact => {
              const chs = channelStyles[contact.channelTag] || { bg: '#888', label: contact.channelTag };
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedContact.id === contact.id ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                      {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.lastMessage}</p>
                      <span className="channel-badge text-[10px] mt-1" style={{ backgroundColor: `${chs.bg}20`, color: chs.bg }}>
                        {chs.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-3 border-b flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
              {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{selectedContact.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedContact.pipelineStage}</p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3 max-w-3xl mx-auto">
              {mockMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderType === 'client' ? 'justify-start' : 'justify-end'}`}>
                  <div className={msg.senderType === 'client' ? 'message-client' : 'message-human'}>
                    {msg.senderType === 'human' && (
                      <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                        <User className="h-3 w-3" />
                        <span>{msg.senderName}</span>
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <span className="text-[10px] opacity-60 mt-1 block text-right">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma mensagem..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && message.trim() && (toast.success('Mensagem enviada!'), setMessage(''))}
                className="flex-1"
              />
              <Button onClick={() => { if (message.trim()) { toast.success('Mensagem enviada!'); setMessage(''); } }} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
