import { useEffect } from 'react';
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
  Plus, Copy, Trash, ExternalLink, QrCode, Check, X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Acesso restrito a administradores');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast.info('Testando conexão...')}>Testar Conexão</Button>
              </div>
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
              <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                Nenhum webhook de entrada configurado
              </div>
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
                  {[
                    'Novo contato recebido', 'Nova mensagem do lead', 'IA desativada manualmente',
                    'IA reativada manualmente', 'Contato encaminhado', 'Compra realizada',
                    'Tag adicionada/removida', 'Contato movido no funil', 'Reengajamento enviado',
                  ].map(event => (
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
            <CardHeader>
              <CardTitle className="text-base">Configurações da IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Nome da IA</Label>
                <Input defaultValue="IA" placeholder="Nome exibido na interface" />
                <p className="text-xs text-muted-foreground">Este nome será usado em toda a interface</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>IA ativa globalmente</Label><p className="text-xs text-muted-foreground">Ativar/desativar para todos os contatos</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>IA inicia automaticamente</Label><p className="text-xs text-muted-foreground">Novo contato recebe IA ativa</p></div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Delay de resposta (segundos)</Label>
                <Input type="number" defaultValue="3" className="w-32" />
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Configuração por canal</Label>
                <div className="space-y-2">
                  {['WhatsApp', 'Instagram Direct', 'Messenger', 'Facebook', 'Site'].map(ch => (
                    <div key={ch} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">{ch}</span>
                      <Switch defaultChecked />
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
                {[
                  { name: 'Lead', color: '#3b82f6' }, { name: 'Comprou', color: '#22c55e' },
                  { name: 'Sem retorno', color: '#ef4444' }, { name: 'Interessado', color: '#f59e0b' },
                  { name: 'Suporte', color: '#8b5cf6' }, { name: 'VIP', color: '#ec4899' },
                ].map(tag => (
                  <Badge key={tag.name} variant="outline" className="gap-1.5 px-3 py-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                    <button className="ml-1 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags de canal (automáticas)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'whatsapp', color: '#25D366' }, { name: 'instagram-direct', color: '#E1306C' },
                    { name: 'messenger', color: '#0084FF' }, { name: 'facebook-ads', color: '#1877F2' },
                  ].map(tag => (
                    <Badge key={tag.name} variant="outline" className="gap-1.5 px-3 py-1 opacity-70">
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
              <CardDescription>Configure as fases do pipeline de vendas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Novo Lead', 'Em Atendimento', 'Proposta Enviada', 'Negociação', 'Compra Realizada', 'Fora de Funil'].map((stage, i) => (
                <div key={stage} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}</span>
                  <Input defaultValue={stage} className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Adicionar Fase</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipe Tab */}
        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Equipe</CardTitle>
                <CardDescription>Gerencie os membros da equipe</CardDescription>
              </div>
              <Button size="sm" onClick={() => toast.info('Funcionalidade disponível após conectar Supabase Auth')}>
                <Plus className="mr-1 h-3 w-3" />Convidar membro
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'Admin Argos', email: 'admin@argos.com', role: 'admin', tag: 'admin', active: true },
                  { name: 'Maria Silva', email: 'maria@argos.com', role: 'atendente', tag: 'maria', active: true },
                  { name: 'Carlos Souza', email: 'carlos@argos.com', role: 'atendente', tag: 'carlos', active: true },
                ].map(member => (
                  <div key={member.email} className="flex items-center justify-between p-3 rounded-lg border">
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
                      <Badge variant="outline" className="text-xs">@{member.tag}</Badge>
                      <Switch checked={member.active} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
