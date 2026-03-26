import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash, Zap, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useReengagementRules, useUpsertReengagementRule, useDeleteReengagementRule,
  useAppSettings, useUpdateAppSetting,
} from '@/hooks/useSupabaseData';

export default function PresetMessages() {
  const { data: rules, isLoading } = useReengagementRules();
  const { data: settings } = useAppSettings();
  const upsertRule = useUpsertReengagementRule();
  const deleteRuleMutation = useDeleteReengagementRule();
  const updateSetting = useUpdateAppSetting();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formValue, setFormValue] = useState(48);
  const [formUnit, setFormUnit] = useState<'hours' | 'days'>('hours');
  const [formReactivateAi, setFormReactivateAi] = useState(true);
  const [formAddTag, setFormAddTag] = useState('');

  const funnelInactivity = settings?.find(s => s.key === 'funnel_inactivity');
  const funnelConfig = funnelInactivity?.value as { enabled: boolean; days: number } | undefined;

  const openNew = () => {
    setEditingId(null);
    setFormName(''); setFormMessage(''); setFormTags(''); setFormValue(48);
    setFormUnit('hours'); setFormReactivateAi(true); setFormAddTag('');
    setDialogOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingId(rule.id);
    setFormName(rule.name); setFormMessage(rule.message);
    setFormTags(rule.required_tags.join(', ')); setFormValue(rule.inactivity_value);
    setFormUnit(rule.inactivity_unit); setFormReactivateAi(rule.reactivate_ai);
    setFormAddTag(rule.add_tag_after || '');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName || !formMessage) { toast.error('Preencha nome e mensagem'); return; }
    upsertRule.mutate({
      ...(editingId ? { id: editingId } : {}),
      name: formName,
      message: formMessage,
      required_tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      inactivity_value: formValue,
      inactivity_unit: formUnit,
      reactivate_ai: formReactivateAi,
      add_tag_after: formAddTag || null,
    }, {
      onSuccess: () => { toast.success('Regra salva!'); setDialogOpen(false); },
      onError: () => toast.error('Erro ao salvar regra'),
    });
  };

  const handleToggle = (rule: any) => {
    upsertRule.mutate({ id: rule.id, name: rule.name, message: rule.message, is_active: !rule.is_active }, {
      onSuccess: () => toast.success('Status atualizado'),
    });
  };

  const handleDelete = (id: string) => {
    deleteRuleMutation.mutate(id, {
      onSuccess: () => toast.success('Regra excluída'),
      onError: () => toast.error('Erro ao excluir'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mensagens Pré-prontas</h1>
          <p className="text-sm text-muted-foreground">Regras de reengajamento automático</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Regra' : 'Nova Regra de Reengajamento'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nome da regra</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Reengajamento 48h" />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Olá {{nome_do_lead}}..." rows={3} />
                <p className="text-xs text-muted-foreground">Use {'{{nome_do_lead}}'} para inserir o nome</p>
              </div>
              <div className="space-y-2">
                <Label>Tags obrigatórias</Label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="Lead, Interessado" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempo de inatividade</Label>
                  <Input type="number" value={formValue} onChange={e => setFormValue(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={formUnit} onChange={e => setFormUnit(e.target.value as any)}>
                    <option value="hours">Horas</option>
                    <option value="days">Dias</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Reativar IA após envio</Label>
                <Switch checked={formReactivateAi} onCheckedChange={setFormReactivateAi} />
              </div>
              <div className="space-y-2">
                <Label>Tag a adicionar após envio (opcional)</Label>
                <Input value={formAddTag} onChange={e => setFormAddTag(e.target.value)} placeholder="Reengajado" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={upsertRule.isPending}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funnel inactivity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Regra de Inatividade do Funil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Ativar regra de inatividade</Label><p className="text-xs text-muted-foreground">Leads sem interação serão movidos para "Fora de Funil"</p></div>
            <Switch
              checked={funnelConfig?.enabled ?? true}
              onCheckedChange={v => updateSetting.mutate({ key: 'funnel_inactivity', value: { ...funnelConfig, enabled: v } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Dias sem interação</Label>
            <Input
              type="number"
              value={funnelConfig?.days ?? 7}
              onChange={e => updateSetting.mutate({ key: 'funnel_inactivity', value: { ...funnelConfig, days: Number(e.target.value) } })}
              min={1} max={365} className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rules?.map(rule => (
          <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Zap className={`h-5 w-5 mt-0.5 flex-shrink-0 ${rule.is_active ? 'text-accent' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {rule.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rule.message}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        ⏱ {rule.inactivity_value} {rule.inactivity_unit === 'hours' ? 'horas' : 'dias'}
                      </span>
                      {rule.required_tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                      {rule.reactivate_ai && <Badge variant="outline" className="text-[10px]">🤖 Reativa IA</Badge>}
                      {rule.add_tag_after && <Badge variant="outline" className="text-[10px]">🏷 +{rule.add_tag_after}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Switch checked={rule.is_active} onCheckedChange={() => handleToggle(rule)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(rule.id)}>
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma regra de reengajamento criada</p>
        )}
      </div>
    </div>
  );
}
