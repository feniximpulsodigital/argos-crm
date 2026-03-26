import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Bot, User, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

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

interface Column {
  id: string;
  title: string;
  color: string;
  cards: FunnelCard[];
}

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
  messenger: { bg: '#0084FF', label: 'Messenger' },
  'facebook-ads': { bg: '#1877F2', label: 'Facebook Ads' },
  site: { bg: '#f37121', label: 'Site' },
};

const initialColumns: Column[] = [
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

function CardContent({ card }: { card: FunnelCard }) {
  const chs = channelStyles[card.channelTag] || { bg: '#888', label: card.channelTag };
  return (
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
  );
}

function SortableCard({ card }: { card: FunnelCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-card">
      <CardContent card={card} />
    </div>
  );
}

function DroppableColumn({ column, children }: { column: Column; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${isOver ? 'bg-accent/10 ring-2 ring-accent/30' : ''}`}>
      {children}
    </div>
  );
}

export default function Funnel() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<FunnelCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumn = (cardId: string) => columns.find(col => col.cards.some(c => c.id === cardId));

  const handleDragStart = (event: DragStartEvent) => {
    const col = findColumn(event.active.id as string);
    const card = col?.cards.find(c => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumn(activeId);
    // over could be a column id or a card id
    const destCol = columns.find(c => c.id === overId) || findColumn(overId);

    if (!sourceCol || !destCol || sourceCol.id === destCol.id) return;

    setColumns(prev => prev.map(col => {
      if (col.id === sourceCol.id) {
        return { ...col, cards: col.cards.filter(c => c.id !== activeId) };
      }
      if (col.id === destCol.id) {
        const card = sourceCol.cards.find(c => c.id === activeId);
        if (!card || col.cards.some(c => c.id === activeId)) return col;
        const overIndex = col.cards.findIndex(c => c.id === overId);
        const newCards = [...col.cards];
        if (overIndex >= 0) {
          newCards.splice(overIndex, 0, card);
        } else {
          newCards.push(card);
        }
        return { ...col, cards: newCards };
      }
      return col;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a column directly (empty column case)
    const targetCol = columns.find(c => c.id === overId);
    if (targetCol) {
      const sourceCol = findColumn(activeId);
      if (sourceCol && sourceCol.id !== targetCol.id) {
        setColumns(prev => prev.map(col => {
          if (col.id === sourceCol.id) {
            return { ...col, cards: col.cards.filter(c => c.id !== activeId) };
          }
          if (col.id === targetCol.id) {
            const card = sourceCol.cards.find(c => c.id === activeId);
            if (!card || col.cards.some(c => c.id === activeId)) return col;
            return { ...col, cards: [...col.cards, card] };
          }
          return col;
        }));
      }
    }

    const destCol = findColumn(activeId);
    if (destCol) {
      toast.success(`${activeCard?.name || 'Contato'} movido para ${destCol.title}`);
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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

                <DroppableColumn column={col}>
                  <SortableContext items={col.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {col.cards.map(card => (
                      <SortableCard key={card.id} card={card} />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="kanban-card shadow-lg ring-2 ring-accent/50 rotate-2">
              <CardContent card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
