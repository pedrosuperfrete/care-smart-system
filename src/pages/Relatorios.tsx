
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useRelatorios } from '@/hooks/useRelatorios';
import { useExportarRelatorios } from '@/hooks/useExportarRelatorios';
import { toast } from '@/hooks/use-toast';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mes');
  const [tipoRelatorio, setTipoRelatorio] = useState('consultas');
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState('ultimo-mes');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [usarDateRange, setUsarDateRange] = useState(false);

  const { 
    loading, 
    error, 
    estatisticas, 
    consultasPorDia, 
    receitaPorMes, 
    tiposConsulta,
    statusConsultas,
    statusPagamentos
  } = useRelatorios(
    usarDateRange ? 'custom' : periodo,
    dateRange?.from,
    dateRange?.to
  );

  const { exportarCSV, exportarPDF } = useExportarRelatorios();

  const iconsMap = {
    FileText,
    Users,
    DollarSign,
    TrendingUp
  };

  const handleExportarCSV = async () => {
    await exportarCSV({
      tipo: tipoRelatorio,
      periodo: periodoPersonalizado
    });
  };

  const handleExportarPDF = async () => {
    await exportarPDF({
      tipo: tipoRelatorio,
      periodo: periodoPersonalizado
    });
  };

  const handleGerarRelatorio = () => {
    toast({
      title: "Relatório gerado",
      description: `Relatório de ${tipoRelatorio} para ${periodoPersonalizado} foi processado com sucesso!`
    });
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-destructive">Erro ao carregar relatórios: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Análise de dados e estatísticas da clínica
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!usarDateRange ? (
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
          ) : (
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              setUsarDateRange(!usarDateRange);
              if (!usarDateRange) {
                setDateRange(undefined);
              }
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {usarDateRange ? 'Períodos' : 'Data Customizada'}
          </Button>
          
          <Button variant="outline" onClick={handleExportarCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          
          <Button variant="outline" onClick={handleExportarPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          estatisticas.map((stat, index) => {
            const IconComponent = iconsMap[stat.icon as keyof typeof iconsMap];
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.titulo}
                  </CardTitle>
                  {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
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
            );
          })
        )}
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
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consultasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="consultas" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
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
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={receitaPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`R$ ${value}`, 'Receita']} />
                  <Line type="monotone" dataKey="receita" stroke="hsl(var(--success))" />
                </LineChart>
              </ResponsiveContainer>
            )}
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
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : tiposConsulta.length > 0 ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Consultas</CardTitle>
            <CardDescription>
              Distribuição dos status das consultas no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : statusConsultas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusConsultas}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, valor }) => `${nome}: ${valor}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="valor"
                  >
                    {statusConsultas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pagamentos</CardTitle>
            <CardDescription>
              Distribuição dos valores por status de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : statusPagamentos.length > 0 && statusPagamentos.some(item => item.valor > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPagamentos.filter(item => item.valor > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, valor }) => `${nome}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="valor"
                  >
                    {statusPagamentos.filter(item => item.valor > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
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
              <Select value={periodoPersonalizado} onValueChange={setPeriodoPersonalizado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultima-semana">Última Semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último Mês</SelectItem>
                  <SelectItem value="ultimo-trimestre">Último Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full" onClick={handleGerarRelatorio}>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
