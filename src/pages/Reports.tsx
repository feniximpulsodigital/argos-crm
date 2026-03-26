import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useContacts, usePipelineStages, useProfiles, useUserRoles } from '@/hooks/useSupabaseData';

const periods = ['7 dias', '15 dias', '30 dias', '90 dias'] as const;
const COLORS = ['hsl(200,70%,50%)', 'hsl(23,90%,54%)', 'hsl(90,30%,35%)', 'hsl(330,70%,55%)', 'hsl(260,50%,50%)'];

const CHANNEL_MAP: Record<string, string> = {
  whatsapp: 'WhatsApp',
  'instagram-direct': 'Instagram',
  messenger: 'Messenger',
  'facebook-ads': 'Facebook Ads',
  site: 'Site',
};

export default function Reports() {
  const [period, setPeriod] = useState<typeof periods[number]>('30 dias');
  const { data: contacts, isLoading } = useContacts();
  const { data: stages } = usePipelineStages();
  const { data: profiles } = useProfiles();
  const { data: roles } = useUserRoles();

  const contactsByChannel = useMemo(() => {
    if (!contacts) return [];
    const counts: Record<string, number> = {};
    contacts.forEach(c => { counts[c.channel_tag] = (counts[c.channel_tag] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({
      canal: CHANNEL_MAP[key] || key,
      contatos: value,
    }));
  }, [contacts]);

  const conversionByStage = useMemo(() => {
    if (!contacts || !stages) return [];
    return stages.slice(0, -1).map((stage, i) => {
      const nextStage = stages[i + 1];
      const inCurrent = contacts.filter(c => c.pipeline_stage === stage.name).length;
      const inNext = contacts.filter(c => c.pipeline_stage === nextStage.name).length;
      return { name: `${stage.name} → ${nextStage.name}`, value: inNext };
    }).filter(s => s.value > 0);
  }, [contacts, stages]);

  const agentPerformance = useMemo(() => {
    if (!contacts || !profiles || !roles) return [];
    const atendentes = roles.filter(r => r.role === 'atendente').map(r => r.user_id);
    return profiles
      .filter(p => atendentes.includes(p.id))
      .map(p => {
        const assigned = contacts.filter(c => c.assigned_agent_id === p.id);
        const conversoes = assigned.filter(c => c.pipeline_stage === 'Compra Realizada').length;
        return {
          atendente: p.name,
          atendidos: assigned.length,
          conversoes,
          taxa: assigned.length > 0 ? `${((conversoes / assigned.length) * 100).toFixed(1)}%` : '0%',
        };
      });
  }, [contacts, profiles, roles]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada de desempenho</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {periods.map(p => (
              <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod(p)} className="text-xs">{p}</Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info('Exportar CSV')}><Download className="mr-1 h-3 w-3" /> Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Contatos por canal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={contactsByChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="canal" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="contatos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Conversão por fase</CardTitle></CardHeader>
          <CardContent>
            {conversionByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={conversionByStage} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                    {conversionByStage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados de conversão</p>
            )}
          </CardContent>
        </Card>
      </div>

      {agentPerformance.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Desempenho por atendente</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Atendente</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Atendidos</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Conversões</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map(a => (
                    <tr key={a.atendente} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 px-3 font-medium text-foreground">{a.atendente}</td>
                      <td className="py-2.5 px-3 text-right text-foreground">{a.atendidos}</td>
                      <td className="py-2.5 px-3 text-right text-foreground">{a.conversoes}</td>
                      <td className="py-2.5 px-3 text-right"><Badge variant="secondary">{a.taxa}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
