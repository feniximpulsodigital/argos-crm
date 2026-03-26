import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Bot, User, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useContacts, usePipelineStages, useUpdateContact } from '@/hooks/useSupabaseData';
import type { Tables } from '@/integrations/supabase/types';

const channelStyles: Record<string, { bg: string; label: string }> = {
  whatsapp: { bg: '#25D366', label: 'WhatsApp' },
  'instagram-direct': { bg: '#E1306C', label: 'Instagram' },
  messenger: { bg: '#0084FF', label: 'Messenger' },
  'facebook-ads': { bg: '#1877F2', label: 'Facebook Ads' },
  site: { bg: '#f37121', label: 'Site' },
};

function FunnelCardContent({ card }: { card: Tables<'contacts'> }) {
  const chs = channelStyles[card.channel_tag] || { bg: '#888', label: card.channel_tag };
  return (
    <div className="flex items-start gap-2">
      <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0 cursor-grab" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground truncate">{card.name}</span>
          {card.ai_enabled && <Bot className="h-3 w-3 text-primary flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          <span className="channel-badge text-[9px]" style={{ backgroundColor: `${chs.bg}20`, color: chs.bg }}>{chs.label}</span>
          {card.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] h-4">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function SortableCard({ card }: { card: Tables<'contacts'> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-card">
      <FunnelCardContent card={card} />
    </div>
  );
}

function DroppableColumn({ id, isOver, children }: { id: string; isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${isOver ? 'bg-accent/10 ring-2 ring-accent/30' : ''}`}>
      {children}
    </div>
  );
}

export default function Funnel() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const updateContact = useUpdateContact();
  const [activeCard, setActiveCard] = useState<Tables<'contacts'> | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() => {
    if (!stages || !contacts) return [];
    return stages.map(stage => ({
      ...stage,
      cards: contacts.filter(c => c.pipeline_stage === stage.name),
    }));
  }, [stages, contacts]);

  const findColumnByCardId = (cardId: string) => columns.find(col => col.cards.some(c => c.id === cardId));

  const handleDragStart = (event: DragStartEvent) => {
    const col = findColumnByCardId(event.active.id as string);
    const card = col?.cards.find(c => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    const targetCol = columns.find(c => c.id === over.id) || findColumnByCardId(over.id as string);
    setOverColumnId(targetCol?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setOverColumnId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const targetCol = columns.find(c => c.id === overId) || findColumnByCardId(overId);
    const sourceCol = findColumnByCardId(activeId);

    if (targetCol && sourceCol && targetCol.id !== sourceCol.id) {
      updateContact.mutate({ id: activeId, pipeline_stage: targetCol.name }, {
        onSuccess: () => toast.success(`Movido para ${targetCol.name}`),
        onError: () => toast.error('Erro ao mover contato'),
      });
    }
  };

  if (stagesLoading || contactsLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground">Arraste contatos entre as fases</p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {columns.map(col => (
              <div key={col.id} className="kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className="text-sm font-semibold text-foreground">{col.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">{col.cards.length}</Badge>
                </div>
                <DroppableColumn id={col.id} isOver={overColumnId === col.id}>
                  <SortableContext items={col.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {col.cards.map(card => <SortableCard key={card.id} card={card} />)}
                  </SortableContext>
                </DroppableColumn>
              </div>
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="kanban-card shadow-lg ring-2 ring-accent/50 rotate-2">
              <FunnelCardContent card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
