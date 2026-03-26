import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Search, Send, Bot, User, Phone, Mail, Tag,
  ArrowRight, ShoppingCart, Store, Globe, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  channel: string;
  channelTag: string;
  lastMessage: string;
  time: string;
  aiEnabled: boolean;
  assignedAgent: string | null;
  tags: string[];
  pipelineStage: string;
}

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
  messenger: { bg: '#0084FF', label: 'Messenger' },
  'facebook-ads': { bg: '#1877F2', label: 'Facebook Ads' },
  site: { bg: '#f37121', label: 'Site' },
};

const mockContacts: Contact[] = [
  { id: '1', name: 'João Silva', phone: '+5511999001122', email: 'joao@email.com', channel: 'whatsapp', channelTag: 'whatsapp', lastMessage: 'Olá, gostaria de saber mais sobre o produto X', time: '10:30', aiEnabled: true, assignedAgent: null, tags: ['Lead', 'Interessado'], pipelineStage: 'Em Atendimento' },
  { id: '2', name: 'Ana Costa', phone: '+5511988776655', email: 'ana@email.com', channel: 'instagram', channelTag: 'instagram-direct', lastMessage: 'Vocês fazem entrega para SP?', time: '09:45', aiEnabled: false, assignedAgent: 'Maria Silva', tags: ['Lead'], pipelineStage: 'Proposta Enviada' },
  { id: '3', name: 'Pedro Santos', phone: '+5511977665544', email: 'pedro@email.com', channel: 'messenger', channelTag: 'messenger', lastMessage: 'Qual o preço do kit completo?', time: '09:20', aiEnabled: true, assignedAgent: null, tags: ['Lead', 'Preço'], pipelineStage: 'Novo Lead' },
  { id: '4', name: 'Mariana Lima', phone: '+5511966554433', email: 'mariana@email.com', channel: 'facebook', channelTag: 'facebook-ads', lastMessage: 'Vi o anúncio de vocês e quero saber mais', time: 'Ontem', aiEnabled: true, assignedAgent: null, tags: ['Anúncio', 'Lead'], pipelineStage: 'Novo Lead' },
  { id: '5', name: 'Lucas Oliveira', phone: '+5511955443322', email: 'lucas@email.com', channel: 'site', channelTag: 'site', lastMessage: 'Preciso de ajuda com meu pedido #4523', time: 'Ontem', aiEnabled: false, assignedAgent: 'Carlos Souza', tags: ['Suporte', 'Comprou'], pipelineStage: 'Compra Realizada' },
];

interface Message {
  id: string;
  content: string;
  senderType: 'client' | 'ia' | 'human';
  senderName?: string;
  time: string;
}

const mockMessages: Message[] = [
  { id: '1', content: 'Olá, gostaria de saber mais sobre o produto X', senderType: 'client', time: '10:25' },
  { id: '2', content: 'Olá João! 👋 Tudo bem? O produto X é uma solução completa para gestão de vendas. Posso te contar mais sobre os recursos?', senderType: 'ia', time: '10:25' },
  { id: '3', content: 'Sim, quero saber o preço e as formas de pagamento', senderType: 'client', time: '10:28' },
  { id: '4', content: 'Ótimo! O produto X está disponível a partir de R$ 199/mês. Aceitamos cartão de crédito, boleto e Pix. Quer que eu envie uma proposta personalizada?', senderType: 'ia', time: '10:28' },
  { id: '5', content: 'Sim, por favor. Minha empresa tem 15 funcionários.', senderType: 'client', time: '10:30' },
];

export default function Conversations() {
  const [selectedContact, setSelectedContact] = useState<Contact>(mockContacts[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [aiEnabled, setAiEnabled] = useState(selectedContact.aiEnabled);

  const filteredContacts = mockContacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.channelTag.includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!message.trim()) return;
    toast.success('Mensagem enviada!');
    setMessage('');
  };

  const ch = channelStyles[selectedContact.channelTag] || { bg: '#888', label: selectedContact.channelTag };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-0 rounded-xl border overflow-hidden bg-card animate-fade-in">
      {/* Left panel - Contact list */}
      <div className="w-80 lg:w-96 flex-shrink-0 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredContacts.map(contact => {
            const chs = channelStyles[contact.channelTag] || { bg: '#888', label: contact.channelTag };
            return (
              <div
                key={contact.id}
                onClick={() => { setSelectedContact(contact); setAiEnabled(contact.aiEnabled); }}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedContact.id === contact.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                      {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card"
                      style={{ backgroundColor: chs.bg }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">{contact.time}</span>
                    </div>
                    {contact.assignedAgent && (
                      <p className="text-xs text-accent truncate">{contact.assignedAgent}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.lastMessage}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span
                        className="channel-badge text-[10px]"
                        style={{ backgroundColor: `${chs.bg}20`, color: chs.bg }}
                      >
                        {chs.label}
                      </span>
                      {contact.aiEnabled && (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1">
                          <Bot className="h-2.5 w-2.5" /> IA
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </div>

      {/* Right panel - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="p-3 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground flex-shrink-0">
              {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">{selectedContact.name}</h3>
                <span
                  className="channel-badge text-[10px]"
                  style={{ backgroundColor: `${ch.bg}20`, color: ch.bg }}
                >
                  {ch.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{selectedContact.pipelineStage}</span>
                {selectedContact.assignedAgent && (
                  <>
                    <span>•</span>
                    <span className="text-accent">{selectedContact.assignedAgent}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">IA</span>
              <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              <span className={`text-xs font-medium ${aiEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                {aiEnabled ? 'Ativa' : 'Desativada'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 max-w-3xl mx-auto">
            {mockMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === 'client' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={
                  msg.senderType === 'client'
                    ? 'message-client'
                    : msg.senderType === 'ia'
                    ? 'message-ia'
                    : 'message-human'
                }>
                  {msg.senderType !== 'client' && (
                    <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                      {msg.senderType === 'ia' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      <span>{msg.senderType === 'ia' ? 'IA' : msg.senderName || 'Atendente'}</span>
                    </div>
                  )}
                  <p>{msg.content}</p>
                  <span className="text-[10px] opacity-60 mt-1 block text-right">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Actions bar */}
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
          <Button size="sm" variant="accent" onClick={() => toast.success('Compra marcada!')}>
            <ShoppingCart className="mr-1 h-3 w-3" /> Compra realizada
          </Button>
        </div>

        {/* Message input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma mensagem..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
