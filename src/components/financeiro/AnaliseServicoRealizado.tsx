import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnaliseServicoRealizadoProps {
  rentabilidade: {
    custoFixoTotal: number;
    rentabilidadePorServico: Array<{
      id: string;
      nome: string;
      preco: number;
      custoVariavel: number;
      custoFixoProporcional: number;
      custoTotal: number;
      margem: number;
      margemPercentual: number;
      rentavel: boolean;
    }>;
  };
  agendamentos: Array<{
    id: string;
    tipo_servico: string;
    valor: number | null;
    data_inicio: string;
    status: string | null;
    desmarcada: boolean;
  }> | undefined;
  periodoSelecionado: string;
  setPeriodoSelecionado: (value: string) => void;
}

export function AnaliseServicoRealizado({
  rentabilidade,
  agendamentos,
  periodoSelecionado,
  setPeriodoSelecionado,
}: AnaliseServicoRealizadoProps) {
  // Calcular período baseado na seleção
  const { dataInicio, dataFim, periodoLabel } = useMemo(() => {
    const meses = parseInt(periodoSelecionado);
    const agora = new Date();
    const inicio = startOfMonth(subMonths(agora, meses - 1));
    const fim = endOfMonth(agora);
    
    const labelMeses: Record<string, string> = {
      '1': format(agora, 'MMMM yyyy', { locale: ptBR }),
      '3': 'Últimos 3 meses',
      '6': 'Últimos 6 meses',
      '12': 'Últimos 12 meses',
    };
    
    return {
      dataInicio: inicio,
      dataFim: fim,
      periodoLabel: labelMeses[periodoSelecionado] || 'Período selecionado',
    };
  }, [periodoSelecionado]);

  // Filtrar agendamentos por período e status realizado
  const agendamentosFiltrados = useMemo(() => {
    if (!agendamentos) return [];
    
    return agendamentos.filter(ag => {
      const dataAg = parseISO(ag.data_inicio);
      const dentroPeriodo = isWithinInterval(dataAg, { start: dataInicio, end: dataFim });
      const foiRealizado = ag.status === 'realizado' && !ag.desmarcada;
      return dentroPeriodo && foiRealizado;
    });
  }, [agendamentos, dataInicio, dataFim]);

  // Calcular dados por serviço
  const dadosPorServico = useMemo(() => {
    const meses = parseInt(periodoSelecionado);
    
    return rentabilidade.rentabilidadePorServico.map(servico => {
      // Contar atendimentos realizados no período
      const atendimentosServico = agendamentosFiltrados.filter(
        ag => ag.tipo_servico === servico.nome
      );
      const quantidade = atendimentosServico.length;
      
      // Valor total recebido
      const valorTotal = atendimentosServico.reduce((acc, ag) => acc + (ag.valor || servico.preco), 0);
      
      // Margem unitária = preço - custos variáveis - custo fixo proporcional por atendimento
      // O custoFixoProporcional vem do useRentabilidade que já rateia entre todos os serviços
      const margemUnitaria = servico.preco - servico.custoVariavel - servico.custoFixoProporcional;
      
      // Calcular % de participação no total
      const totalAtendimentos = agendamentosFiltrados.length || 1;
      const participacao = (quantidade / totalAtendimentos) * 100;
      
      // Custo fixo proporcional ao período e participação
      // Nota: agora a margemUnitaria já inclui o custoFixoProporcional (rateado por serviço)
      // mas precisamos ainda considerar o rateio pela participação real no período
      const custoFixoPeriodo = rentabilidade.custoFixoTotal * meses;
      const custoFixoRateado = (custoFixoPeriodo * participacao) / 100;
      
      // Lucro real do período usando margem unitária (que já tem custo fixo por serviço embutido)
      // e subtraindo a diferença de rateio pela participação real vs rateio fixo
      const custoFixoJaEmbutido = servico.custoFixoProporcional * quantidade;
      const ajusteCustoFixo = custoFixoRateado - custoFixoJaEmbutido;
      const lucroTotal = (margemUnitaria * quantidade) - ajusteCustoFixo;
      
      // Margem real por atendimento
      const margemReal = quantidade > 0 ? lucroTotal / quantidade : 0;
      
      // Barra de rentabilidade (0-100%)
      const rentabilidadePercent = servico.preco > 0 
        ? Math.min(100, Math.max(0, (margemReal / servico.preco) * 100))
        : 0;
      
      return {
        ...servico,
        quantidade,
        valorTotal,
        margemUnitaria,
        lucroTotal,
        margemReal,
        rentabilidadePercent,
        participacao,
      };
    }).sort((a, b) => b.lucroTotal - a.lucroTotal);
  }, [rentabilidade, agendamentosFiltrados, periodoSelecionado]);

  const totalQuantidade = dadosPorServico.reduce((acc, s) => acc + s.quantidade, 0);
  const totalLucro = dadosPorServico.reduce((acc, s) => acc + s.lucroTotal, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Análise por Serviço Realizado
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Dados reais dos atendimentos realizados no período selecionado. A margem considera o custo fixo rateado pela participação de cada serviço.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              {periodoLabel} • {totalQuantidade} atendimentos • Lucro total: R$ {formatCurrency(totalLucro)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Este mês</SelectItem>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 ml-auto">
                      Margem Unit.
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lucro por atendimento (preço - custos variáveis - custo fixo rateado)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-center">Qtd.</TableHead>
              <TableHead className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 ml-auto">
                      Lucro Total
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lucro no período = (Margem × Qtd.) - Custo Fixo Rateado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="w-32">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Rentabilidade
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Margem real como % do preço de venda</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dadosPorServico.map((servico) => (
              <TableRow key={servico.id}>
                <TableCell className="font-medium">{servico.nome}</TableCell>
                <TableCell className="text-right">
                  R$ {formatCurrency(servico.preco)}
                </TableCell>
                <TableCell className={`text-right font-medium ${servico.margemUnitaria > 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {formatCurrency(servico.margemUnitaria)}
                </TableCell>
                <TableCell className="text-center">
                  {servico.quantidade > 0 ? (
                    <Badge variant="secondary">{servico.quantidade}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className={`text-right font-medium ${servico.lucroTotal > 0 ? 'text-success' : servico.lucroTotal < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {servico.quantidade > 0 ? (
                    `R$ ${formatCurrency(servico.lucroTotal)}`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {servico.quantidade > 0 ? (
                    <div className="space-y-1">
                      <Progress 
                        value={servico.rentabilidadePercent} 
                        className="h-2"
                      />
                      <span className={`text-xs ${servico.rentabilidadePercent > 50 ? 'text-success' : servico.rentabilidadePercent > 20 ? 'text-amber-600' : 'text-destructive'}`}>
                        {servico.rentabilidadePercent.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-4 italic">
          * Apenas atendimentos com status "realizado" são contabilizados. Custo fixo rateado pela participação de cada serviço no período.
        </p>
      </CardContent>
    </Card>
  );
}
