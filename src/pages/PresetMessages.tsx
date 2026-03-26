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
import { Plus, Edit, Trash, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
  id: string;
  name: string;
  message: string;
  requiredTags: string[];
  inactivityValue: number;
  inactivityUnit: 'hours' | 'days';
  reactivateAi: boolean;
  addTagAfter: string;
  isActive: boolean;
}

const initialRules: Rule[] = [
  {
    id: '1', name: 'Reengajamento 48h', message: 'Olá {{nome_do_lead}}! 👋 Percebi que não conversamos há algum tempo. Posso te ajudar com algo?',
    requiredTags: ['Lead'], inactivityValue: 48, inactivityUnit: 'hours',
    reactivateAi: true, addTagAfter: 'Reengajado', isActive: true,
  },
  {
    id: '2', name: 'Follow-up proposta', message: 'Oi {{nome_do_lead}}, tudo bem? Gostaria de saber se teve tempo de analisar nossa proposta. Estou à disposição!',
    requiredTags: ['Lead', 'Proposta'], inactivityValue: 3, inactivityUnit: 'days',
    reactivateAi: false, addTagAfter: 'Follow-up enviado', isActive: true,
  },
  {
    id: '3', name: 'Inatividade 7 dias', message: 'Olá {{nome_do_lead}}! Notei que faz uma semana que não nos falamos. Tem alguma dúvida que posso esclarecer?',
    requiredTags: ['Lead'], inactivityValue: 7, inactivityUnit: 'days',
    reactivateAi: true, addTagAfter: '', isActive: false,
  },
];

export default function PresetMessages() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    toast.success('Status atualizado');
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Regra excluída');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mensagens Pré-prontas</h1>
          <p className="text-sm text-muted-foreground">Regras de reengajamento automático</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRule(null)}>
              <Plus className="mr-1 h-4 w-4" /> Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra de Reengajamento'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nome da regra</Label>
                <Input placeholder="Ex: Reengajamento 48h" defaultValue={editingRule?.name} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Olá {{nome_do_lead}}, gostaria de..."
                  defaultValue={editingRule?.message}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Use {'{{nome_do_lead}}'} para inserir o nome do contato</p>
              </div>
              <div className="space-y-2">
                <Label>Tags obrigatórias</Label>
                <Input placeholder="Lead, Interessado (separadas por vírgula)" defaultValue={editingRule?.requiredTags.join(', ')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempo de inatividade</Label>
                  <Input type="number" placeholder="48" defaultValue={editingRule?.inactivityValue} />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" defaultValue={editingRule?.inactivityUnit || 'hours'}>
                    <option value="hours">Horas</option>
                    <option value="days">Dias</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Reativar IA após envio</Label>
                <Switch defaultChecked={editingRule?.reactivateAi ?? true} />
              </div>
              <div className="space-y-2">
                <Label>Tag a adicionar após envio (opcional)</Label>
                <Input placeholder="Reengajado" defaultValue={editingRule?.addTagAfter} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => { toast.success('Regra salva!'); setDialogOpen(false); }}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funnel inactivity rule */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Regra de inatividade do funil</p>
                <p className="text-xs text-muted-foreground">Após 14 dias sem interação, mover lead para "FORA DE FUNIL"</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rules.map(rule => (
          <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Zap className={`h-5 w-5 mt-0.5 flex-shrink-0 ${rule.isActive ? 'text-accent' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {rule.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rule.message}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        ⏱ {rule.inactivityValue} {rule.inactivityUnit === 'hours' ? 'horas' : 'dias'}
                      </span>
                      {rule.requiredTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                      {rule.reactivateAi && <Badge variant="outline" className="text-[10px]">🤖 Reativa IA</Badge>}
                      {rule.addTagAfter && <Badge variant="outline" className="text-[10px]">🏷 +{rule.addTagAfter}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRule(rule); setDialogOpen(true); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
