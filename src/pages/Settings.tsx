import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain, Palette, Users, Plus, Trash, Edit, Loader2, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTags, useCreateTag, useUpdateTag, useDeleteTag,
  usePipelineStages, useCreatePipelineStage, useUpdatePipelineStage, useDeletePipelineStage,
  useProfiles, useUserRoles, useInviteUser,
  useAppSettings, useUpdateAppSetting,
} from '@/hooks/useSupabaseData';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Acesso restrito a administradores');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const { data: tags, isLoading: tagsLoading } = useTags();
  const { data: stages } = usePipelineStages();
  const { data: profiles } = useProfiles();
  const { data: roles } = useUserRoles();
  const { data: settings } = useAppSettings();
  const updateSetting = useUpdateAppSetting();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const createStage = useCreatePipelineStage();
  const updateStage = useUpdatePipelineStage();
  const deleteStage = useDeletePipelineStage();
  const inviteUser = useInviteUser();

  const aiConfig = settings?.find(s => s.key === 'ai_config')?.value as any;
  const [aiName, setAiName] = useState('');
  const [aiDelay, setAiDelay] = useState(3);

  useEffect(() => {
    if (aiConfig) {
      setAiName(aiConfig.name || 'IA');
      setAiDelay(aiConfig.delay_seconds ?? 3);
    }
  }, [aiConfig]);

  const regularTags = tags?.filter(t => !t.is_channel_tag) || [];
  const channelTags = tags?.filter(t => t.is_channel_tag) || [];

  const teamMembers = profiles?.map(p => {
    const role = roles?.find(r => r.user_id === p.id);
    return { ...p, role: role?.role || 'atendente' };
  }) || [];

  // Tag dialog
  const [tagDialog, setTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id?: string; name: string; color: string } | null>(null);

  // Stage dialog
  const [stageDialog, setStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<{ id?: string; name: string; color: string } | null>(null);

  // Invite dialog
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'atendente' as 'admin' | 'atendente' });

  const handleSaveTag = () => {
    if (!editingTag?.name.trim()) return;
    if (editingTag.id) {
      updateTag.mutate({ id: editingTag.id, name: editingTag.name, color: editingTag.color }, {
        onSuccess: () => { toast.success('Tag atualizada'); setTagDialog(false); },
        onError: () => toast.error('Erro ao atualizar tag'),
      });
    } else {
      createTag.mutate({ name: editingTag.name, color: editingTag.color }, {
        onSuccess: () => { toast.success('Tag criada'); setTagDialog(false); },
        onError: () => toast.error('Erro ao criar tag'),
      });
    }
  };

  const handleDeleteTag = (id: string) => {
    deleteTag.mutate(id, {
      onSuccess: () => toast.success('Tag removida'),
      onError: () => toast.error('Erro ao remover tag'),
    });
  };

  const handleSaveStage = () => {
    if (!editingStage?.name.trim()) return;
    if (editingStage.id) {
      updateStage.mutate({ id: editingStage.id, name: editingStage.name, color: editingStage.color }, {
        onSuccess: () => { toast.success('Fase atualizada'); setStageDialog(false); },
        onError: () => toast.error('Erro ao atualizar fase'),
      });
    } else {
      const nextPos = (stages?.length || 0) + 1;
      createStage.mutate({ name: editingStage.name, color: editingStage.color, position: nextPos }, {
        onSuccess: () => { toast.success('Fase criada'); setStageDialog(false); },
        onError: () => toast.error('Erro ao criar fase'),
      });
    }
  };

  const handleDeleteStage = (id: string) => {
    deleteStage.mutate(id, {
      onSuccess: () => toast.success('Fase removida'),
      onError: () => toast.error('Erro ao remover fase'),
    });
  };

  const handleSaveAiName = () => {
    updateSetting.mutate(
      { key: 'ai_config', value: { ...aiConfig, name: aiName, delay_seconds: aiDelay } },
      { onSuccess: () => toast.success('Configuração da IA salva'), onError: () => toast.error('Erro ao salvar') },
    );
  };

  const handleInvite = () => {
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) return;
    inviteUser.mutate(inviteForm, {
      onSuccess: (data: any) => {
        toast.success(`Usuário criado! Senha temporária: ${data.temp_password}`, { duration: 15000 });
        setInviteDialog(false);
        setInviteForm({ name: '', email: '', role: 'atendente' });
      },
      onError: (err: any) => toast.error(err.message || 'Erro ao convidar'),
    });
  };

  if (user?.role !== 'admin') return null;

  const defaultColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie IA, tags, funil e equipe</p>
      </div>

      <Tabs defaultValue="ia" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="ia" className="gap-1.5"><Brain className="h-3.5 w-3.5" />IA</TabsTrigger>
          <TabsTrigger value="tags" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Tags e Funil</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5"><Users className="h-3.5 w-3.5" />Equipe</TabsTrigger>
        </TabsList>

        {/* IA Tab */}
        <TabsContent value="ia" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Configurações da IA</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Nome da IA</Label>
                <div className="flex gap-2">
                  <Input value={aiName} onChange={e => setAiName(e.target.value)} placeholder="Nome exibido na interface" className="max-w-xs" />
                  <Button onClick={handleSaveAiName} disabled={updateSetting.isPending} size="sm">
                    <Save className="mr-1 h-3.5 w-3.5" />Salvar
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>IA ativa globalmente</Label><p className="text-xs text-muted-foreground">Ativar/desativar para todos os contatos</p></div>
                <Switch
                  checked={aiConfig?.active_globally ?? true}
                  onCheckedChange={v => updateSetting.mutate({ key: 'ai_config', value: { ...aiConfig, active_globally: v } })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>IA inicia automaticamente</Label><p className="text-xs text-muted-foreground">Novo contato recebe IA ativa</p></div>
                <Switch
                  checked={aiConfig?.auto_start ?? true}
                  onCheckedChange={v => updateSetting.mutate({ key: 'ai_config', value: { ...aiConfig, auto_start: v } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delay de resposta (segundos)</Label>
                <div className="flex gap-2">
                  <Input type="number" value={aiDelay} onChange={e => setAiDelay(Number(e.target.value))} className="w-32" />
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Configuração por canal</Label>
                <div className="space-y-2">
                  {Object.entries(aiConfig?.channels || {}).map(([ch, enabled]) => (
                    <div key={ch} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground capitalize">{ch.replace('-', ' ')}</span>
                      <Switch
                        checked={enabled as boolean}
                        onCheckedChange={v => updateSetting.mutate({
                          key: 'ai_config',
                          value: { ...aiConfig, channels: { ...aiConfig.channels, [ch]: v } },
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags e Funil Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Tags</CardTitle>
                <CardDescription>Gerencie as tags do sistema</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingTag({ name: '', color: '#3b82f6' }); setTagDialog(true); }}>
                <Plus className="mr-1 h-3 w-3" />Nova Tag
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {regularTags.map(tag => (
                  <div key={tag.id} className="group flex items-center gap-1.5 border rounded-full px-3 py-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm">{tag.name}</span>
                    <button
                      onClick={() => { setEditingTag({ id: tag.id, name: tag.name, color: tag.color }); setTagDialog(true); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <Edit className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
                {regularTags.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tag criada</p>}
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags de canal (automáticas)</Label>
                <div className="flex flex-wrap gap-2">
                  {channelTags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="gap-1.5 px-3 py-1 opacity-70">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Fases do Funil</CardTitle>
                <CardDescription>Pipeline de vendas</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingStage({ name: '', color: '#888888' }); setStageDialog(true); }}>
                <Plus className="mr-1 h-3 w-3" />Nova Fase
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {stages?.map((stage, i) => (
                <div key={stage.id} className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm text-foreground flex-1">{stage.name}</span>
                  <button
                    onClick={() => { setEditingStage({ id: stage.id, name: stage.name, color: stage.color }); setStageDialog(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteStage(stage.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
              {(!stages || stages.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma fase criada</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipe Tab */}
        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Equipe</CardTitle>
                <CardDescription>Membros da equipe</CardDescription>
              </div>
              <Button size="sm" onClick={() => setInviteDialog(true)}>
                <Plus className="mr-1 h-3 w-3" />Novo membro
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">{member.role}</Badge>
                      <Badge variant="outline" className="text-xs">@{member.agent_tag}</Badge>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tag Dialog */}
      <Dialog open={tagDialog} onOpenChange={setTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag?.id ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editingTag?.name || ''} onChange={e => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="Nome da tag" />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map(c => (
                  <button key={c} onClick={() => setEditingTag(prev => prev ? { ...prev, color: c } : null)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${editingTag?.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveTag} disabled={createTag.isPending || updateTag.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage?.id ? 'Editar Fase' : 'Nova Fase'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editingStage?.name || ''} onChange={e => setEditingStage(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="Nome da fase" />
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
            <Button onClick={handleSaveStage} disabled={createStage.isPending || updateStage.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={inviteForm.name} onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={inviteForm.role} onValueChange={(v: 'admin' | 'atendente') => setInviteForm(prev => ({ ...prev, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviteUser.isPending}>
              {inviteUser.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Criar usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
