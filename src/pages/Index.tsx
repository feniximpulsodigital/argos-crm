import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, ShoppingCart, UserCheck, Store, Globe, Bot,
  TrendingUp, TrendingDown, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useContacts } from '@/hooks/useSupabaseData';
import { format, subDays, isAfter, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const periods = ['Hoje', '7 dias', '15 dias', '30 dias'] as const;
type Period = typeof periods[number];

const periodDays: Record<Period, number> = { 'Hoje': 0, '7 dias': 7, '15 dias': 15, '30 dias': 30 };

const CHANNEL_MAP: Record<string, { label: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  'instagram-direct': { label: 'Instagram', color: '#E1306C' },
  messenger: { label: 'Messenger', color: '#0084FF' },
  'facebook-ads': { label: 'Facebook Ads', color: '#1877F2' },
  site: { label: 'Site', color: '#f37121' },
};

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('7 dias');
  const { data: contacts, isLoading } = useContacts();

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const days = periodDays[period];
    if (days === 0) {
      const today = startOfDay(new Date());
      return contacts.filter(c => isAfter(parseISO(c.created_at), today));
    }
    const since = subDays(new Date(), days);
    return contacts.filter(c => isAfter(parseISO(c.created_at), since));
  }, [contacts, period]);

  const totalContacts = filtered.length;
  const purchases = filtered.filter(c => c.pipeline_stage === 'Compra Realizada').length;
  const aiActive = filtered.filter(c => c.ai_enabled).length;

  // Channel distribution
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => { counts[c.channel_tag] = (counts[c.channel_tag] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({
      name: CHANNEL_MAP[key]?.label || key,
      value,
      color: CHANNEL_MAP[key]?.color || '#888',
    }));
  }, [filtered]);

  // Daily contacts for last 7 days
  const dailyContacts = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: startOfDay(d), day: format(d, 'EEE', { locale: ptBR }) };
    });
    return days.map(({ date, day }) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      contatos: (contacts || []).filter(c => {
        const cd = startOfDay(parseISO(c.created_at));
        return cd.getTime() === date.getTime();
      }).length,
    }));
  }, [contacts]);

  const metrics = [
    { label: 'Total de contatos', value: totalContacts, icon: Users },
    { label: 'Compras realizadas', value: purchases, icon: ShoppingCart, badge: 'Conversão' },
    { label: 'IA ativa', value: aiActive, icon: Bot },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periods.map(p => (
            <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod(p)} className="text-xs">
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="metric-card animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <m.icon className="h-5 w-5 text-muted-foreground" />
              {m.badge && <Badge variant="secondary" className="text-[10px]">{m.badge}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Contatos por dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyContacts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="contatos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por canal</CardTitle></CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {channelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum contato no período</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
