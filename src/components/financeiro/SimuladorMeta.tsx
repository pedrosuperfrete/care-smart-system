import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Calculator,
  Scale,
  Calendar,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useSimuladorMeta } from '@/hooks/useSimuladorMeta';
import { formatCurrency } from '@/lib/utils';

export function SimuladorMeta() {
  const [metaDesejada, setMetaDesejada] = useState(10000);
  const { isLoading, resultado, temHistorico } = useSimuladorMeta(metaDesejada);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando dados históricos...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!temHistorico) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sem dados históricos suficientes</h3>
            <p className="text-muted-foreground">
              O simulador precisa de agendamentos realizados nos últimos 3 meses para calcular 
              a distribuição realista de serviços.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resultado) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Configure seus serviços</h3>
            <p className="text-muted-foreground">
              Cadastre serviços com preços para usar o simulador.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { equilibrio, meta, cenarioAtual, saldoAcumulado, custoFixoTotal, insights, alertas, metaViavel } = resultado;
  const diferencaAtendimentosMeta = isFinite(meta.totalAtendimentosNecessarios) 
    ? meta.totalAtendimentosNecessarios - cenarioAtual.atendimentosMensais 
    : Infinity;
  const percentualMeta = cenarioAtual.lucroMensal > 0 
    ? Math.min((cenarioAtual.lucroMensal / metaDesejada) * 100, 100) 
    : 0;

  const formatMes = (mesKey: string) => {
    const [ano, mes] = mesKey.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano.slice(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Input da Meta */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Qual sua meta de renda líquida mensal?
          </CardTitle>
          <CardDescription>
            Informe quanto você quer ganhar (já descontados todos os custos e taxas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Label htmlFor="meta">Meta de renda líquida</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="meta"
                  type="number"
                  value={metaDesejada}
                  onChange={(e) => setMetaDesejada(Number(e.target.value) || 0)}
                  className="pl-10 text-lg font-semibold"
                  min={0}
                  step={500}
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-[250px]">
              <p className="text-sm text-muted-foreground mb-1">Progresso atual</p>
              <div className="flex items-center gap-3">
                <Progress value={percentualMeta} className="flex-1" />
                <span className="text-sm font-medium">{percentualMeta.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Você ganha R$ {formatCurrency(cenarioAtual.lucroMensal)}/mês atualmente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo: Equilíbrio vs Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Equilíbrio */}
        <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-700 dark:text-amber-300 uppercase tracking-wide font-medium">
                Ponto de Equilíbrio
              </p>
            </div>
            <p className="text-2xl font-bold">
              {equilibrio.totalAtendimentosNecessarios === Infinity ? '—' : equilibrio.totalAtendimentosNecessarios}
            </p>
            <p className="text-sm text-muted-foreground">atendimentos/mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              Faturamento: R$ {formatCurrency(equilibrio.faturamentoBrutoNecessario)}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Para cobrir R$ {formatCurrency(custoFixoTotal)} de custos fixos
            </p>
          </CardContent>
        </Card>

        {/* Card Meta */}
        <Card className={`border-2 ${metaViavel ? 'border-success/30 bg-success/5' : 'border-primary/30 bg-primary/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs text-primary uppercase tracking-wide font-medium">
                Para atingir a Meta
              </p>
            </div>
            <p className="text-2xl font-bold">
              {meta.totalAtendimentosNecessarios === Infinity ? '—' : meta.totalAtendimentosNecessarios}
            </p>
            <p className="text-sm text-muted-foreground">atendimentos/mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              Faturamento: R$ {formatCurrency(meta.faturamentoBrutoNecessario)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {!isFinite(diferencaAtendimentosMeta) ? (
                <Badge variant="outline" className="text-xs border-destructive text-destructive">
                  Revise custos e preços
                </Badge>
              ) : diferencaAtendimentosMeta > 0 ? (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                  +{diferencaAtendimentosMeta} vs. atual
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-success text-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Já atingido
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Cenário Atual */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Cenário Atual (média)
              </p>
            </div>
            <p className="text-2xl font-bold">{Math.round(cenarioAtual.atendimentosMensais)}</p>
            <p className="text-sm text-muted-foreground">atendimentos/mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              Faturamento: R$ {formatCurrency(cenarioAtual.faturamentoMensal)}
            </p>
            <p className={`text-xs mt-1 ${cenarioAtual.lucroMensal >= 0 ? 'text-success' : 'text-destructive'}`}>
              Lucro: R$ {formatCurrency(cenarioAtual.lucroMensal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Distribuição Equilíbrio vs Meta */}
      <Tabs defaultValue="meta" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="equilibrio" className="gap-2">
            <Scale className="h-4 w-4" />
            Equilíbrio
          </TabsTrigger>
          <TabsTrigger value="meta" className="gap-2">
            <Target className="h-4 w-4" />
            Meta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equilibrio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-600" />
                Distribuição para Equilíbrio (Lucro = R$ 0)
              </CardTitle>
              <CardDescription>
                O mínimo necessário para não ter prejuízo no mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {equilibrio.servicosMix.map((servico) => (
                  <div key={servico.nome} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{servico.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {formatCurrency(servico.lucroUnitario)} lucro/atend.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{servico.atendimentosNecessarios}</p>
                      <p className="text-xs text-muted-foreground">atendimentos</p>
                    </div>
                    <div className="w-14 text-right">
                      <p className="text-sm text-muted-foreground">{servico.percentualMix.toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Distribuição para Meta (R$ {formatCurrency(metaDesejada)}/mês)
              </CardTitle>
              <CardDescription>
                Quantidade de atendimentos por serviço para atingir sua meta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {meta.servicosMix.map((servico) => (
                  <div key={servico.nome} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{servico.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {formatCurrency(servico.lucroUnitario)} lucro/atend.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{servico.atendimentosNecessarios}</p>
                      <p className="text-xs text-muted-foreground">atendimentos</p>
                    </div>
                    <div className="w-14 text-right">
                      <p className="text-sm text-muted-foreground">{servico.percentualMix.toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                * Distribuição baseada no seu histórico real dos últimos 3 meses
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Saldo Acumulado no Ano */}
      {saldoAcumulado.meses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Compensação entre Meses
            </CardTitle>
            <CardDescription>
              Acompanhe se você está acima ou abaixo da meta acumulada no ano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo do saldo */}
            <div className={`p-4 rounded-lg border ${
              saldoAcumulado.saldoTotal >= 0 
                ? 'bg-success/5 border-success/20' 
                : 'bg-destructive/5 border-destructive/20'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo acumulado no ano</p>
                  <p className={`text-2xl font-bold ${
                    saldoAcumulado.saldoTotal >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {saldoAcumulado.saldoTotal >= 0 ? '+' : ''}R$ {formatCurrency(saldoAcumulado.saldoTotal)}
                  </p>
                </div>
                
                {saldoAcumulado.mesesRestantes > 0 && saldoAcumulado.saldoTotal < 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Meta ajustada p/ compensar</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {formatCurrency(saldoAcumulado.metaMensalAjustada)}/mês
                    </p>
                    <p className="text-xs text-muted-foreground">
                      pelos próximos {saldoAcumulado.mesesRestantes} meses
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline dos meses */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Histórico por mês</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {saldoAcumulado.meses.map((mes) => (
                  <div 
                    key={mes.mes} 
                    className={`p-3 rounded-lg border text-center ${
                      mes.diferenca >= 0 
                        ? 'bg-success/5 border-success/20' 
                        : 'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{formatMes(mes.mes)}</p>
                    <p className={`text-sm font-bold ${
                      mes.diferenca >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {mes.diferenca >= 0 ? '+' : ''}R$ {formatCurrency(mes.diferenca)}
                    </p>
                    <div className="flex items-center justify-center mt-1">
                      {mes.diferenca >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Insights automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Ajustes aplicados</p>
                <ul className="space-y-1">
                  {alertas.map((alerta, idx) => (
                    <li key={idx} className="text-sm text-amber-700 dark:text-amber-300">
                      {alerta}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
