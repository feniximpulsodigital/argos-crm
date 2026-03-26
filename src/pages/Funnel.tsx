import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Bot, User, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface FunnelCard {
  id: string;
  name: string;
  channel: string;
  channelTag: string;
  lastMessage: string;
  aiEnabled: boolean;
  assignedAgent: string | null;
  tags: string[];
}

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
  messenger: { bg: '#0084FF', label: 'Messenger' },
  'facebook-ads': { bg: '#1877F2', label: 'Facebook Ads' },
  site: { bg: '#f37121', label: 'Site' },
};

const initialColumns = [
  {
    id: 'novo', title: 'Novo Lead', color: 'hsl(var(--chart-4))',
    cards: [
      { id: '1', name: 'Pedro Santos', channel: 'messenger', channelTag: 'messenger', lastMessage: 'Qual o preço do kit?', aiEnabled: true, assignedAgent: null, tags: ['Lead', 'Preço'] },
      { id: '4', name: 'Mariana Lima', channel: 'facebook', channelTag: 'facebook-ads', lastMessage: 'Vi o anúncio...', aiEnabled: true, assignedAgent: null, tags: ['Anúncio'] },
    ],
  },
  {
    id: 'atendimento', title: 'Em Atendimento', color: 'hsl(var(--accent))',
    cards: [
      { id: '3', name: 'João Silva', channel: 'whatsapp', channelTag: 'whatsapp', lastMessage: 'Quero uma proposta', aiEnabled: true, assignedAgent: null, tags: ['Lead', 'Interessado'] },
    ],
  },
  {
    id: 'proposta', title: 'Proposta Enviada', color: 'hsl(var(--chart-1))',
    cards: [
      { id: '2', name: 'Ana Costa', channel: 'instagram', channelTag: 'instagram-direct', lastMessage: 'Vocês fazem entrega?', aiEnabled: false, assignedAgent: 'Maria Silva', tags: ['Lead'] },
    ],
  },
  {
    id: 'negociacao', title: 'Negociação', color: 'hsl(var(--chart-5))',
    cards: [],
  },
  {
    id: 'compra', title: 'Compra Realizada', color: 'hsl(var(--primary))',
    cards: [
      { id: '5', name: 'Lucas Oliveira', channel: 'site', channelTag: 'site', lastMessage: 'Pedido #4523', aiEnabled: false, assignedAgent: 'Carlos Souza', tags: ['Comprou'] },
      { id: '6', name: 'Fernanda Rocha', channel: 'whatsapp', channelTag: 'whatsapp', lastMessage: 'Obrigada!', aiEnabled: false, assignedAgent: 'Maria Silva', tags: ['Comprou'] },
    ],
  },
  {
    id: 'fora', title: 'Fora de Funil', color: 'hsl(var(--muted-foreground))',
    cards: [],
  },
];

export default function Funnel() {
  const [columns] = useState(initialColumns);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground">Arraste contatos entre as fases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Editar fases')}>
            <Edit className="mr-1 h-3 w-3" /> Editar Fases
          </Button>
          <Button size="sm" onClick={() => toast.info('Adicionar fase')}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar Fase
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map(col => (
            <div key={col.id} className="kanban-column">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{col.cards.length}</Badge>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {col.cards.map(card => {
                  const chs = channelStyles[card.channelTag] || { bg: '#888', label: card.channelTag };
                  return (
                    <div key={card.id} className="kanban-card">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground truncate">{card.name}</span>
                            {card.aiEnabled && <Bot className="h-3 w-3 text-primary flex-shrink-0" />}
                          </div>
                          {card.assignedAgent && (
                            <div className="flex items-center gap-1 text-xs text-accent mt-0.5">
                              <User className="h-2.5 w-2.5" />
                              <span>{card.assignedAgent}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground truncate mt-1">{card.lastMessage}</p>
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <span
                              className="channel-badge text-[9px]"
                              style={{ backgroundColor: `${chs.bg}20`, color: chs.bg }}
                            >
                              {chs.label}
                            </span>
                            {card.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[9px] h-4">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
