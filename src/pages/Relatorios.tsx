
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mes');
  const [tipoRelatorio, setTipoRelatorio] = useState('consultas');

  // Mock data para os gráficos
  const consultasPorDia = [
    { dia: '01/06', consultas: 8 },
    { dia: '02/06', consultas: 12 },
    { dia: '03/06', consultas: 6 },
    { dia: '04/06', consultas: 15 },
    { dia: '05/06', consultas: 10 },
    { dia: '06/06', consultas: 14 },
    { dia: '07/06', consultas: 9 },
  ];

  const receitaPorMes = [
    { mes: 'Jan', receita: 15420 },
    { mes: 'Fev', receita: 18630 },
    { mes: 'Mar', receita: 22150 },
    { mes: 'Abr', receita: 19800 },
    { mes: 'Mai', receita: 24300 },
    { mes: 'Jun', receita: 21750 },
  ];

  const tiposConsulta = [
    { nome: 'Consulta de Rotina', valor: 45, cor: 'hsl(var(--primary))' },
    { nome: 'Retorno', valor: 30, cor: 'hsl(var(--success))' },
    { nome: 'Exames', valor: 15, cor: 'hsl(var(--warning))' },
    { nome: 'Emergência', valor: 10, cor: 'hsl(var(--destructive))' },
  ];

  const estatisticas = [
    {
      titulo: 'Total de Consultas',
      valor: '342',
      mudanca: '+12%',
      tipo: 'positivo',
      icon: FileText,
      descricao: 'Este mês'
    },
    {
      titulo: 'Novos Pacientes',
      valor: '28',
      mudanca: '+8%',
      tipo: 'positivo',
      icon: Users,
      descricao: 'Este mês'
    },
    {
      titulo: 'Receita Total',
      valor: 'R$ 24.300',
      mudanca: '+15%',
      tipo: 'positivo',
      icon: DollarSign,
      descricao: 'Este mês'
    },
    {
      titulo: 'Taxa de Retorno',
      valor: '85%',
      mudanca: '+3%',
      tipo: 'positivo',
      icon: TrendingUp,
      descricao: 'Pacientes que retornaram'
    }
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Análise de dados e estatísticas da clínica
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {estatisticas.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.titulo}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.valor}</div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={stat.tipo === 'positivo' ? 'default' : 'destructive'}>
                  {stat.mudanca}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {stat.descricao}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultas por Dia</CardTitle>
            <CardDescription>
              Número de consultas realizadas nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consultasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consultas" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>
              Evolução da receita nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={receitaPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`R$ ${value}`, 'Receita']} />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--success))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Consulta</CardTitle>
            <CardDescription>
              Distribuição por tipo de atendimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tiposConsulta}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="valor"
                >
                  {tiposConsulta.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Detalhados</CardTitle>
            <CardDescription>
              Gere relatórios específicos para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultas">Relatório de Consultas</SelectItem>
                  <SelectItem value="pacientes">Relatório de Pacientes</SelectItem>
                  <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
                  <SelectItem value="produtividade">Relatório de Produtividade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultima-semana">Última Semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último Mês</SelectItem>
                  <SelectItem value="ultimo-trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="personalizado">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
