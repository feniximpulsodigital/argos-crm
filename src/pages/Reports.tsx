import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const periods = ['7 dias', '15 dias', '30 dias', '90 dias'] as const;

const contactsByChannel = [
  { canal: 'WhatsApp', contatos: 520 },
  { canal: 'Instagram', contatos: 310 },
  { canal: 'Messenger', contatos: 180 },
  { canal: 'Facebook Ads', contatos: 145 },
  { canal: 'Site', contatos: 92 },
];

const conversionByStage = [
  { name: 'Novo Lead → Atendimento', value: 72 },
  { name: 'Atendimento → Proposta', value: 45 },
  { name: 'Proposta → Negociação', value: 30 },
  { name: 'Negociação → Compra', value: 18 },
];
const COLORS = ['hsl(200,70%,50%)', 'hsl(23,90%,54%)', 'hsl(90,30%,35%)', 'hsl(330,70%,55%)'];

const agentPerformance = [
  { atendente: 'Maria Silva', atendidos: 142, conversoes: 23, taxa: '16.2%' },
  { atendente: 'Carlos Souza', atendidos: 118, conversoes: 19, taxa: '16.1%' },
  { atendente: 'Admin Argos', atendidos: 85, conversoes: 12, taxa: '14.1%' },
];

const adPerformance = [
  { anuncio: 'Promo Verão 2024', contatos: 234, conversoes: 28 },
  { anuncio: 'Black Friday', contatos: 189, conversoes: 32 },
  { anuncio: 'Lançamento Produto X', contatos: 156, conversoes: 18 },
  { anuncio: 'Remarketing Geral', contatos: 98, conversoes: 11 },
];

export default function Reports() {
  const [period, setPeriod] = useState<typeof periods[number]>('30 dias');

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
              <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod(p)} className="text-xs">
                {p}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info('Exportar CSV')}>
            <Download className="mr-1 h-3 w-3" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contatos por canal</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle className="text-base">Taxa de conversão por fase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={conversionByStage} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                  {conversionByStage.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent performance table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por atendente</CardTitle>
        </CardHeader>
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
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant="secondary">{a.taxa}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ad performance table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por anúncio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Anúncio</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Contatos</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Conversões</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {adPerformance.map(a => (
                  <tr key={a.anuncio} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 px-3 font-medium text-foreground">{a.anuncio}</td>
                    <td className="py-2.5 px-3 text-right text-foreground">{a.contatos}</td>
                    <td className="py-2.5 px-3 text-right text-foreground">{a.conversoes}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant="secondary">{((a.conversoes / a.contatos) * 100).toFixed(1)}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
