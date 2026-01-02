import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Calculator,
  Building2,
  Zap,
  Lightbulb,
  Target,
  Scale,
  Info
} from 'lucide-react';
import { useCustos, useRentabilidade, useMixServicos } from '@/hooks/useCustos';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { SimuladorMeta } from './SimuladorMeta';

export function Rentabilidade() {
  const { custos, isLoading: custosLoading } = useCustos();
  const rentabilidade = useRentabilidade();
  const mixServicos = useMixServicos();
  const navigate = useNavigate();
  const [metaInput, setMetaInput] = useState(10000);
  
  const custosCadastrados = custos.length > 0;

  if (custosLoading) {
    return <div className="text-center py-8">Carregando dados...</div>;
  }

  if (!custosCadastrados) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Comece a entender sua rentabilidade</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre seus custos fixos e variáveis para descobrir quanto você realmente ganha por atendimento.
            </p>
            <Button onClick={() => navigate('/app/financeiro?tab=custos')}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Custos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Custos Fixos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(rentabilidade.custoFixoTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas que você tem todo mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Custo por Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(rentabilidade.custoVariavelPorAtendimento)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Materiais e insumos por consulta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(rentabilidade.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio dos seus serviços
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulador de Meta */}
      <SimuladorMeta />

      {/* Alerta de serviços com margem negativa */}
      {rentabilidade.servicoMenosRentavel && rentabilidade.servicoMenosRentavel.margem <= 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h4 className="font-medium text-destructive">Atenção: Serviços com margem baixa</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Alguns dos seus serviços podem estar dando prejuízo. Veja a análise por serviço abaixo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise por Serviço */}
      {rentabilidade.rentabilidadePorServico.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rentabilidade.servicoMaisRentavel && (
              <Card className="border-success/50 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium text-success">Mais Rentável</span>
                  </div>
                  <p className="text-lg font-bold">{rentabilidade.servicoMaisRentavel.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Margem: R$ {formatCurrency(rentabilidade.servicoMaisRentavel.margem)} ({rentabilidade.servicoMaisRentavel.margemPercentual.toFixed(0)}%)
                  </p>
                </CardContent>
              </Card>
            )}

            {rentabilidade.servicoMenosRentavel && rentabilidade.servicoMenosRentavel.margem < rentabilidade.servicoMaisRentavel?.margem && (
              <Card className={`${rentabilidade.servicoMenosRentavel.margem <= 0 ? 'border-destructive/50 bg-destructive/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className={`h-5 w-5 ${rentabilidade.servicoMenosRentavel.margem <= 0 ? 'text-destructive' : 'text-amber-500'}`} />
                    <span className={`text-sm font-medium ${rentabilidade.servicoMenosRentavel.margem <= 0 ? 'text-destructive' : 'text-amber-500'}`}>
                      {rentabilidade.servicoMenosRentavel.margem <= 0 ? 'Dando Prejuízo' : 'Menor Margem'}
                    </span>
                  </div>
                  <p className="text-lg font-bold">{rentabilidade.servicoMenosRentavel.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Margem: R$ {formatCurrency(rentabilidade.servicoMenosRentavel.margem)} ({rentabilidade.servicoMenosRentavel.margemPercentual.toFixed(0)}%)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Análise Completa por Serviço
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>A margem unitária considera apenas custos variáveis. A margem real considera o volume realizado nos últimos 3 meses menos os custos fixos rateados.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>
                    Margem real, quantidade mínima para cobrir custos e quantidade para atingir sua meta
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="metaTabela" className="text-sm whitespace-nowrap">Meta:</Label>
                  <div className="relative w-32">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input
                      id="metaTabela"
                      type="number"
                      value={metaInput}
                      onChange={(e) => setMetaInput(Number(e.target.value) || 0)}
                      className="pl-8 h-8 text-sm"
                      min={0}
                      step={500}
                    />
                  </div>
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
                            <p>Lucro por atendimento (preço - custos variáveis)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            Qtd. Realizada
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Volume médio mensal dos últimos 3 meses</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 ml-auto">
                            Lucro Total
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lucro mensal real = (Margem × Qtd.) - Custos Fixos Rateados</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Scale className="h-3 w-3" />
                            Mín. Equilíbrio
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quantidade mínima para cobrir os custos fixos (só fazendo esse serviço)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Target className="h-3 w-3" />
                            P/ Meta
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quantidade para atingir a meta de R$ {formatCurrency(metaInput)} (só fazendo esse serviço)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentabilidade.rentabilidadePorServico.map((servico) => {
                    // Buscar volume histórico do mix
                    const mixInfo = mixServicos.mixAtual.find(m => m.servico === servico.nome);
                    const volumeMensal = mixInfo?.quantidade ? Math.round(mixInfo.quantidade / 3) : 0;
                    
                    // Margem unitária (preço - custos variáveis, sem custos fixos)
                    const margemUnitaria = servico.preco - servico.custoVariavel;
                    
                    // Lucro total considerando volume e custo fixo proporcional
                    const custoFixoRateado = (rentabilidade.custoFixoTotal * (mixInfo?.percentual || 0)) / 100;
                    const lucroTotalReal = (margemUnitaria * volumeMensal) - custoFixoRateado;
                    
                    // Quantidade mínima para cobrir custos fixos (break-even só com esse serviço)
                    const breakEvenServico = rentabilidade.calcularBreakEvenPorServico(servico.id);
                    const qtdMinima = breakEvenServico.breakEven === Infinity ? '—' : breakEvenServico.breakEven;
                    
                    // Quantidade para atingir meta (só com esse serviço)
                    const qtdParaMeta = rentabilidade.calcularAtendimentosParaMetaPorServico(metaInput, servico.id);
                    const qtdMetaDisplay = qtdParaMeta === Infinity ? '—' : qtdParaMeta;
                    
                    return (
                      <TableRow key={servico.id}>
                        <TableCell className="font-medium">{servico.nome}</TableCell>
                        <TableCell className="text-right">
                          R$ {formatCurrency(servico.preco)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${margemUnitaria > 0 ? 'text-success' : 'text-destructive'}`}>
                          R$ {formatCurrency(margemUnitaria)}
                        </TableCell>
                        <TableCell className="text-center">
                          {volumeMensal > 0 ? (
                            <Badge variant="secondary">{volumeMensal}/mês</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${lucroTotalReal > 0 ? 'text-success' : lucroTotalReal < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {volumeMensal > 0 ? (
                            `R$ ${formatCurrency(lucroTotalReal)}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {typeof qtdMinima === 'number' ? (
                            <div className="flex items-center justify-center gap-1">
                              <Scale className="h-3 w-3 text-amber-500" />
                              <span className={volumeMensal >= qtdMinima ? 'text-success' : 'text-amber-600'}>
                                {qtdMinima}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{qtdMinima}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {typeof qtdMetaDisplay === 'number' ? (
                            <div className="flex items-center justify-center gap-1">
                              <Target className="h-3 w-3 text-primary" />
                              <span>{qtdMetaDisplay}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{qtdMetaDisplay}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-4 italic">
                * Qtd. Realizada baseada no histórico dos últimos 3 meses. "Mín. Equilíbrio" e "P/ Meta" assumem que você faria apenas esse serviço.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {rentabilidade.rentabilidadePorServico.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum serviço cadastrado</h3>
            <p className="text-muted-foreground">
              Cadastre seus serviços em Configurações → Tipos de Serviços para ver a rentabilidade de cada um.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
