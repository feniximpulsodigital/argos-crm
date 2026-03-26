import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, ShoppingCart, UserCheck, Store, Globe, Bot,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const periods = ['Hoje', '7 dias', '15 dias', '30 dias'] as const;

const metrics = [
  { label: 'Total de contatos', value: 1247, icon: Users, trend: '+12%', up: true },
  { label: 'Compras realizadas', value: 89, icon: ShoppingCart, trend: '7.1%', up: true, badge: 'Conversão' },
  { label: 'Encaminhados vendedor', value: 156, icon: UserCheck, trend: '+8%', up: true },
  { label: 'Encaminhados loja', value: 43, icon: Store, trend: '-3%', up: false },
  { label: 'Encaminhados site', value: 78, icon: Globe, trend: '+15%', up: true },
  { label: 'IA ativa', value: 234, icon: Bot, trend: '', up: true },
];

const dailyContacts = [
  { day: 'Seg', contatos: 45 },
  { day: 'Ter', contatos: 52 },
  { day: 'Qua', contatos: 38 },
  { day: 'Qui', contatos: 65 },
  { day: 'Sex', contatos: 72 },
  { day: 'Sáb', contatos: 31 },
  { day: 'Dom', contatos: 18 },
];

const channelData = [
  { name: 'WhatsApp', value: 45 },
  { name: 'Instagram', value: 25 },
  { name: 'Messenger', value: 15 },
  { name: 'Facebook Ads', value: 10 },
  { name: 'Site', value: 5 },
];
const CHANNEL_COLORS = ['#25D366', '#E1306C', '#0084FF', '#1877F2', '#f37121'];

const conversionData = [
  { mes: 'Jan', taxa: 5.2 },
  { mes: 'Fev', taxa: 6.1 },
  { mes: 'Mar', taxa: 7.3 },
  { mes: 'Abr', taxa: 6.8 },
  { mes: 'Mai', taxa: 8.1 },
  { mes: 'Jun', taxa: 7.5 },
];

const resultsByChannel = [
  { canal: 'WhatsApp', compras: 42, encaminhamentos: 85, abandonos: 120 },
  { canal: 'Instagram', compras: 22, encaminhamentos: 40, abandonos: 65 },
  { canal: 'Messenger', compras: 12, encaminhamentos: 18, abandonos: 35 },
  { canal: 'Facebook Ads', compras: 8, encaminhamentos: 10, abandonos: 22 },
  { canal: 'Site', compras: 5, encaminhamentos: 3, abandonos: 12 },
];

export default function Dashboard() {
  const [period, setPeriod] = useState<typeof periods[number]>('7 dias');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periods.map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="metric-card animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <m.icon className="h-5 w-5 text-muted-foreground" />
              {m.badge && <Badge variant="secondary" className="text-[10px]">{m.badge}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            {m.trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${m.up ? 'text-primary' : 'text-destructive'}`}>
                {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contatos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyContacts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="contatos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="taxa"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultados por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={resultsByChannel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="canal" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="compras" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="encaminhamentos" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="abandonos" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
