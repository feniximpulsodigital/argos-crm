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
import {
  MessageSquare, Facebook, Webhook, Brain, Palette, Users,
  Plus, Trash, ExternalLink, QrCode, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTags, usePipelineStages, useProfiles, useUserRoles,
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

  const aiConfig = settings?.find(s => s.key === 'ai_config')?.value as any;

  const regularTags = tags?.filter(t => !t.is_channel_tag) || [];
  const channelTags = tags?.filter(t => t.is_channel_tag) || [];

  const teamMembers = profiles?.map(p => {
    const role = roles?.find(r => r.user_id === p.id);
    return { ...p, role: role?.role || 'atendente' };
  }) || [];

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie integrações, IA e equipe</p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="meta" className="gap-1.5"><Facebook className="h-3.5 w-3.5" />Meta</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5"><Webhook className="h-3.5 w-3.5" />Webhooks</TabsTrigger>
          <TabsTrigger value="ia" className="gap-1.5"><Brain className="h-3.5 w-3.5" />IA</TabsTrigger>
          <TabsTrigger value="tags" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Tags e Funil</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5"><Users className="h-3.5 w-3.5" />Equipe</TabsTrigger>
        </TabsList>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolution API</CardTitle>
              <CardDescription>Conecte via Evolution API para WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>URL Base</Label><Input placeholder="https://api.evolution.com" /></div>
                <div className="space-y-2"><Label>API Key</Label><Input type="password" placeholder="Sua API Key" /></div>
                <div className="space-y-2"><Label>Nome da Instância</Label><Input placeholder="minha-instancia" /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Desconectado</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast.info('Testando conexão...')}>Testar Conexão</Button>
                <Button variant="accent" onClick={() => toast.info('Gerando QR Code...')}><QrCode className="mr-1 h-4 w-4" />Gerar QR Code</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta API (WhatsApp Business)</CardTitle>
              <CardDescription>WhatsApp Business API oficial da Meta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone Number ID</Label><Input placeholder="ID do número" /></div>
                <div className="space-y-2"><Label>Token de Acesso</Label><Input type="password" placeholder="Token permanente" /></div>
                <div className="space-y-2"><Label>WABA ID</Label><Input placeholder="WhatsApp Business Account ID" /></div>
                <div className="space-y-2"><Label>App Secret</Label><Input type="password" placeholder="App Secret" /></div>
              </div>
              <Button variant="outline" onClick={() => toast.info('Testando conexão...')}>Testar Conexão</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tab */}
        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Facebook / Messenger</CardTitle>
              <CardDescription>Conecte suas páginas do Facebook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline"><Facebook className="mr-2 h-4 w-4" />Conectar com Facebook</Button>
              <p className="text-sm text-muted-foreground">Nenhuma página conectada</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instagram</CardTitle>
              <CardDescription>Conecte sua conta profissional do Instagram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline"><ExternalLink className="mr-2 h-4 w-4" />Conectar com Instagram</Button>
              <p className="text-sm text-muted-foreground">Nenhuma conta conectada</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhooks de Entrada</CardTitle>
              <CardDescription>Receba leads de fontes externas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button size="sm"><Plus className="mr-1 h-3 w-3" /> Criar novo webhook</Button>
              <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">Nenhum webhook configurado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhook de Saída (N8n)</CardTitle>
              <CardDescription>Configure o endpoint N8n para automações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>URL do N8n</Label><Input placeholder="https://n8n.seuservidor.com/webhook/..." /></div>
                <div className="space-y-2"><Label>Token de Autenticação</Label><Input type="password" placeholder="Token" /></div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-3 block">Eventos para disparar:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Novo contato recebido', 'Nova mensagem do lead', 'IA desativada manualmente', 'IA reativada manualmente', 'Contato encaminhado', 'Compra realizada', 'Tag adicionada/removida', 'Contato movido no funil', 'Reengajamento enviado'].map(event => (
                    <div key={event} className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm text-foreground">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" onClick={() => toast.info('Teste enviado para N8n')}>Testar envio</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IA Tab */}
        <TabsContent value="ia" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Configurações da IA</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Nome da IA</Label>
                <Input defaultValue={aiConfig?.name || 'IA'} placeholder="Nome exibido na interface" />
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
                <Input type="number" defaultValue={aiConfig?.delay_seconds ?? 3} className="w-32" />
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
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
              <CardDescription>Gerencie as tags do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button size="sm"><Plus className="mr-1 h-3 w-3" />Nova Tag</Button>
              <div className="flex flex-wrap gap-2">
                {regularTags.map(tag => (
                  <Badge key={tag.id} variant="outline" className="gap-1.5 px-3 py-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </Badge>
                ))}
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
            <CardHeader>
              <CardTitle className="text-base">Fases do Funil</CardTitle>
              <CardDescription>Pipeline de vendas configurado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stages?.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm text-foreground flex-1">{stage.name}</span>
                </div>
              ))}
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
              <Button size="sm" onClick={() => toast.info('Para convidar membros, crie o usuário no painel Supabase Auth')}>
                <Plus className="mr-1 h-3 w-3" />Convidar membro
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
                      <Switch checked={member.is_active} />
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
