import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Calculator
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

  const { cenarioAtual, servicosMix, insights, alertas, metaViavel } = resultado;
  const diferencaAtendimentos = resultado.totalAtendimentosNecessarios - cenarioAtual.atendimentosMensais;
  const percentualMeta = cenarioAtual.lucroMensal > 0 
    ? Math.min((cenarioAtual.lucroMensal / metaDesejada) * 100, 100) 
    : 0;

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
          <div className="flex items-end gap-6">
            <div className="flex-1 max-w-xs">
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
            
            <div className="flex-1">
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

      {/* Resultado Principal */}
      <Card className={metaViavel ? 'border-success/30' : 'border-amber-500/30'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Para atingir sua meta
            </CardTitle>
            <Badge 
              variant={metaViavel ? 'default' : 'outline'}
              className={metaViavel ? 'bg-success' : 'border-amber-500 text-amber-600'}
            >
              {metaViavel ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Meta viável</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Requer ajustes</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Atendimentos/mês</p>
              <p className="text-2xl font-bold">{resultado.totalAtendimentosNecessarios}</p>
              {diferencaAtendimentos !== 0 && (
                <p className={`text-xs mt-1 ${diferencaAtendimentos > 0 ? 'text-amber-600' : 'text-success'}`}>
                  {diferencaAtendimentos > 0 ? '+' : ''}{diferencaAtendimentos} vs. atual ({cenarioAtual.atendimentosMensais})
                </p>
              )}
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Faturamento bruto</p>
              <p className="text-2xl font-bold">R$ {formatCurrency(resultado.faturamentoBrutoNecessario)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Atual: R$ {formatCurrency(cenarioAtual.faturamentoMensal)}
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-success/5 border-success/20">
              <p className="text-xs text-success uppercase tracking-wide mb-1">Renda líquida estimada</p>
              <p className="text-2xl font-bold text-success">R$ {formatCurrency(resultado.receitaLiquidaEstimada)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: R$ {formatCurrency(metaDesejada)}
              </p>
            </div>
          </div>

          {/* Breakdown por serviço */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Distribuição recomendada por serviço
            </h4>
            <div className="space-y-2">
              {servicosMix.map((servico) => (
                <div key={servico.nome} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{servico.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {formatCurrency(servico.lucroUnitario)} lucro/atendimento
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{servico.atendimentosNecessarios}</p>
                    <p className="text-xs text-muted-foreground">atendimentos</p>
                  </div>
                  <div className="w-16 text-right">
                    <p className="text-sm text-muted-foreground">{servico.percentualMix.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              * Distribuição baseada no seu histórico real dos últimos 3 meses
            </p>
          </div>
        </CardContent>
      </Card>

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

      {/* Comparação cenários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Comparação: Atual vs. Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Cenário Atual</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Atendimentos/mês</span>
                  <span className="font-medium">{cenarioAtual.atendimentosMensais}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Faturamento</span>
                  <span className="font-medium">R$ {formatCurrency(cenarioAtual.faturamentoMensal)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Lucro líquido</span>
                  <span className="font-bold">R$ {formatCurrency(cenarioAtual.lucroMensal)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
              <p className="text-xs text-primary uppercase tracking-wide mb-3">Com a Meta</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Atendimentos/mês</span>
                  <span className="font-medium">{resultado.totalAtendimentosNecessarios}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Faturamento</span>
                  <span className="font-medium">R$ {formatCurrency(resultado.faturamentoBrutoNecessario)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Lucro líquido</span>
                  <span className="font-bold text-primary">R$ {formatCurrency(resultado.receitaLiquidaEstimada)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
