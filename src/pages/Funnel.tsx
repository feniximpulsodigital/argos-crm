import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Bot, GripVertical, Loader2, Trash } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  useContacts, usePipelineStages, useUpdateContact,
  useCreatePipelineStage, useUpdatePipelineStage, useDeletePipelineStage, useReorderPipelineStages,
} from '@/hooks/useSupabaseData';
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

function SortableColumn({ stage, cards, isOver, onEdit, onDelete }: {
  stage: Tables<'pipeline_stages'>;
  cards: Tables<'contacts'>[];
  isOver: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef: sortRef, transform, transition, isDragging } = useSortable({
    id: `stage-${stage.id}`,
    data: { type: 'stage', stage },
  });
  const { setNodeRef: dropRef } = useDroppable({ id: stage.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={sortRef} style={style} className="kanban-column">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">{cards.length}</Badge>
          <button onClick={onEdit} className="p-1 hover:bg-muted rounded"><Edit className="h-3 w-3 text-muted-foreground" /></button>
          <button onClick={onDelete} className="p-1 hover:bg-muted rounded"><Trash className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
        </div>
      </div>
      <div ref={dropRef} className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${isOver ? 'bg-accent/10 ring-2 ring-accent/30' : ''}`}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => <SortableCard key={card.id} card={card} />)}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Funnel() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const updateContact = useUpdateContact();
  const createStage = useCreatePipelineStage();
  const updateStage = useUpdatePipelineStage();
  const deleteStage = useDeletePipelineStage();
  const reorderStages = useReorderPipelineStages();

  const [activeCard, setActiveCard] = useState<Tables<'contacts'> | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const [stageDialog, setStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<{ id?: string; name: string; color: string } | null>(null);

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
    const id = event.active.id as string;
    // Check if it's a stage drag
    if (id.startsWith('stage-')) return;
    const col = findColumnByCardId(id);
    const card = col?.cards.find(c => c.id === id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    if (overId.startsWith('stage-')) return;
    const targetCol = columns.find(c => c.id === overId) || findColumnByCardId(overId);
    setOverColumnId(targetCol?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setOverColumnId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Stage reordering
    if (activeId.startsWith('stage-') && overId.startsWith('stage-')) {
      const fromStageId = activeId.replace('stage-', '');
      const toStageId = overId.replace('stage-', '');
      if (fromStageId === toStageId || !stages) return;
      const fromIdx = stages.findIndex(s => s.id === fromStageId);
      const toIdx = stages.findIndex(s => s.id === toStageId);
      if (fromIdx === -1 || toIdx === -1) return;
      const reordered = [...stages];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      const updates = reordered.map((s, i) => ({ id: s.id, position: i }));
      reorderStages.mutate(updates, {
        onSuccess: () => toast.success('Ordem atualizada'),
        onError: () => toast.error('Erro ao reordenar'),
      });
      return;
    }

    // Card moving
    const targetCol = columns.find(c => c.id === overId) || findColumnByCardId(overId);
    const sourceCol = findColumnByCardId(activeId);
    if (targetCol && sourceCol && targetCol.id !== sourceCol.id) {
      updateContact.mutate({ id: activeId, pipeline_stage: targetCol.name }, {
        onSuccess: () => toast.success(`Movido para ${targetCol.name}`),
        onError: () => toast.error('Erro ao mover contato'),
      });
    }
  };

  const handleSaveStage = () => {
    if (!editingStage?.name.trim()) return;
    if (editingStage.id) {
      updateStage.mutate({ id: editingStage.id, name: editingStage.name, color: editingStage.color }, {
        onSuccess: () => { toast.success('Fase atualizada'); setStageDialog(false); },
      });
    } else {
      createStage.mutate({ name: editingStage.name, color: editingStage.color, position: (stages?.length || 0) }, {
        onSuccess: () => { toast.success('Fase criada'); setStageDialog(false); },
      });
    }
  };

  const defaultColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  if (stagesLoading || contactsLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground">Arraste contatos entre as fases ou reordene as colunas</p>
        </div>
        <Button size="sm" onClick={() => { setEditingStage({ name: '', color: '#888888' }); setStageDialog(true); }}>
          <Plus className="mr-1 h-3.5 w-3.5" />Nova Fase
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            <SortableContext items={columns.map(c => `stage-${c.id}`)} strategy={horizontalListSortingStrategy}>
              {columns.map(col => (
                <SortableColumn
                  key={col.id}
                  stage={col}
                  cards={col.cards}
                  isOver={overColumnId === col.id}
                  onEdit={() => { setEditingStage({ id: col.id, name: col.name, color: col.color }); setStageDialog(true); }}
                  onDelete={() => deleteStage.mutate(col.id, { onSuccess: () => toast.success('Fase removida') })}
                />
              ))}
            </SortableContext>
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

      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage?.id ? 'Editar Fase' : 'Nova Fase'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editingStage?.name || ''} onChange={e => setEditingStage(prev => prev ? { ...prev, name: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map(c => (
                  <button key={c} onClick={() => setEditingStage(prev => prev ? { ...prev, color: c } : null)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${editingStage?.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveStage}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
