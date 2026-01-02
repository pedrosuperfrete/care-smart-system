import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Building2,
  Zap,
  Lightbulb,
  ArrowUpCircle
} from 'lucide-react';
import { useCustos, useRentabilidade, useMixServicos } from '@/hooks/useCustos';
import { useTiposServicos } from '@/hooks/useTiposServicos';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function Rentabilidade() {
  const { custos, isLoading: custosLoading } = useCustos();
  const { data: tiposServicos = [] } = useTiposServicos();
  const rentabilidade = useRentabilidade();
  const mixServicos = useMixServicos();
  const navigate = useNavigate();
  
  const [metaMensal, setMetaMensal] = useState(5000);
  const [servicoSelecionado, setServicoSelecionado] = useState<string>('todos');
  
  const custosCadastrados = custos.length > 0;

  // Dados do serviço selecionado
  const servicoInfo = servicoSelecionado !== 'todos' 
    ? tiposServicos.find(s => s.id === servicoSelecionado)
    : null;

  const dadosServicoSelecionado = servicoSelecionado === 'todos'
    ? {
        preco: rentabilidade.ticketMedio,
        margem: rentabilidade.margemMedia,
        breakEven: rentabilidade.breakEven,
      }
    : rentabilidade.rentabilidadePorServico.find(s => s.id === servicoSelecionado) || {
        preco: 0,
        margem: 0,
        breakEven: Infinity,
      };

  // Calcular quantos atendimentos para atingir a meta
  const margemParaCalculo = servicoSelecionado === 'todos' 
    ? rentabilidade.margemMedia 
    : (dadosServicoSelecionado as any).margem || 0;
  const atendimentosParaMeta = margemParaCalculo > 0 
    ? Math.ceil((metaMensal + rentabilidade.custoFixoTotal) / margemParaCalculo)
    : Infinity;

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

      {/* Seletor de Serviço */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Calcular para qual serviço?</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione um serviço específico ou veja a média de todos
              </p>
            </div>
            <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Média de todos os serviços</SelectItem>
                {tiposServicos.filter(s => s.preco && s.preco > 0).map(servico => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} (R$ {formatCurrency(servico.preco || 0)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Card de Break-even */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Ponto de Equilíbrio</h3>
                {servicoInfo && (
                  <Badge variant="outline" className="ml-2">{servicoInfo.nome}</Badge>
                )}
              </div>
              <p className="text-3xl font-bold text-primary mb-1">
                {servicoSelecionado === 'todos' 
                  ? (rentabilidade.breakEven === Infinity ? '∞' : rentabilidade.breakEven)
                  : Math.ceil(rentabilidade.custoFixoTotal / Math.max(1, (dadosServicoSelecionado as any).margem || 1))
                } atendimentos/mês
              </p>
              <p className="text-sm text-muted-foreground">
                {servicoSelecionado === 'todos' 
                  ? 'É o mínimo que você precisa atender (média) para cobrir todos os seus custos.'
                  : `É o mínimo de "${servicoInfo?.nome}" que você precisa fazer para cobrir todos os custos.`
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Margem por atendimento</p>
              <p className={`text-xl font-bold ${(dadosServicoSelecionado as any).margem > 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {formatCurrency((dadosServicoSelecionado as any).margem || 0)}
              </p>
              {servicoInfo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Preço: R$ {formatCurrency(servicoInfo.preco)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculadora de meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora de Meta
          </CardTitle>
          <CardDescription>
            Quanto você quer lucrar por mês? Veja quantos atendimentos precisa fazer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="meta">Meta de lucro mensal</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="meta"
                  type="number"
                  value={metaMensal}
                  onChange={(e) => setMetaMensal(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Você precisa fazer</p>
              <p className="text-2xl font-bold text-primary">
                {atendimentosParaMeta === Infinity ? '∞' : atendimentosParaMeta} atendimentos
              </p>
              <p className="text-xs text-muted-foreground">
                {servicoSelecionado === 'todos' ? '(média de todos os serviços)' : `de "${servicoInfo?.nome}"`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Inteligência de Mix de Serviços */}
      {mixServicos.totalAtendimentos > 0 && mixServicos.analiseInteligente && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Inteligência de Mix
                </CardTitle>
                <CardDescription>
                  Análise baseada em {mixServicos.totalAtendimentos} atendimentos dos últimos 3 meses
                </CardDescription>
              </div>
              <Badge 
                variant={
                  mixServicos.analiseInteligente.diagnostico === 'otimo' ? 'default' :
                  mixServicos.analiseInteligente.diagnostico === 'bom' ? 'secondary' :
                  mixServicos.analiseInteligente.diagnostico === 'atencao' ? 'outline' : 'destructive'
                }
                className={`text-sm px-3 py-1 ${
                  mixServicos.analiseInteligente.diagnostico === 'otimo' ? 'bg-success text-success-foreground' : ''
                }`}
              >
                {mixServicos.analiseInteligente.diagnostico === 'otimo' ? '✨ Mix Otimizado' :
                 mixServicos.analiseInteligente.diagnostico === 'bom' ? '👍 Mix Bom' :
                 mixServicos.analiseInteligente.diagnostico === 'atencao' ? '⚠️ Precisa Atenção' : '🚨 Crítico'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-lg border ${
              mixServicos.analiseInteligente.diagnostico === 'critico' ? 'bg-destructive/10 border-destructive/30' :
              mixServicos.analiseInteligente.diagnostico === 'atencao' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' :
              'bg-muted/50 border-transparent'
            }`}>
              <p className="text-sm font-medium">{mixServicos.analiseInteligente.mensagemDiagnostico}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Lucro Atual</p>
                <p className="text-2xl font-bold">R$ {formatCurrency(mixServicos.analiseInteligente.lucroAtualMensal)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground mt-1">Margem média: {mixServicos.analiseInteligente.margemPonderadaAtual.toFixed(1)}%</p>
              </div>
              
              {mixServicos.analiseInteligente.ganhoOtimizacao > 50 && (
                <div className="p-4 rounded-lg border-2 border-success/30 bg-success/5">
                  <p className="text-xs text-success uppercase tracking-wide mb-2">Potencial com Otimização</p>
                  <p className="text-2xl font-bold text-success">R$ {formatCurrency(mixServicos.analiseInteligente.lucroOtimizadoMensal)}<span className="text-sm font-normal text-success/70">/mês</span></p>
                  <p className="text-xs text-success mt-1">+R$ {formatCurrency(mixServicos.analiseInteligente.ganhoOtimizacao)}/mês possível</p>
                </div>
              )}
            </div>

            {mixServicos.analiseInteligente.servicoEstrela && (
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-success/5 border-success/20">
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-success font-medium">🌟 Serviço Estrela</span>
                  </div>
                  <p className="font-bold text-lg">{mixServicos.analiseInteligente.servicoEstrela.servico}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {formatCurrency(mixServicos.analiseInteligente.servicoEstrela.margem)} de lucro por atendimento • 
                    {mixServicos.analiseInteligente.servicoEstrela.percentual.toFixed(0)}% da sua agenda
                  </p>
                </div>
              </div>
            )}

            {mixServicos.analiseInteligente.oportunidades.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-primary">
                  <Target className="h-4 w-4" />
                  Ações para melhorar sua lucratividade
                </h4>
                
                {mixServicos.analiseInteligente.oportunidades.slice(0, 3).map((op, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border ${
                      op.tipo === 'oportunidade' 
                        ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' 
                        : op.tipo === 'problema'
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        op.tipo === 'oportunidade' 
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : op.tipo === 'problema'
                          ? 'bg-destructive/20'
                          : 'bg-amber-100 dark:bg-amber-900'
                      }`}>
                        {op.tipo === 'oportunidade' 
                          ? <ArrowUpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          : op.tipo === 'problema'
                          ? <AlertTriangle className="h-4 w-4 text-destructive" />
                          : <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1">{op.titulo}</p>
                        <p className="text-sm text-muted-foreground">{op.descricao}</p>
                        <p className="text-sm font-medium mt-2 text-primary">{op.acao}</p>
                        {op.impactoMensal > 0 && (
                          <Badge 
                            variant="outline" 
                            className={`mt-2 ${op.tipo === 'problema' ? 'border-destructive/50 text-destructive bg-destructive/10' : 'border-success/50 text-success bg-success/10'}`}
                          >
                            {op.tipo === 'problema' ? 'Prejuízo' : 'Impacto'}: {op.tipo === 'problema' ? '-' : '+'}R$ {formatCurrency(op.impactoMensal)}/mês
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mixServicos.analiseInteligente.oportunidades.length === 0 && mixServicos.analiseInteligente.diagnostico === 'otimo' && (
              <div className="text-center py-4">
                <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Seu mix de serviços está bem equilibrado. Continue monitorando mensalmente.
                </p>
              </div>
            )}
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
              <CardTitle>Análise por Serviço</CardTitle>
              <CardDescription>
                Veja quanto sobra de cada serviço após descontar os custos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead className="w-32">Rentabilidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentabilidade.rentabilidadePorServico.map((servico) => (
                    <TableRow key={servico.id}>
                      <TableCell className="font-medium">{servico.nome}</TableCell>
                      <TableCell className="text-right">
                        R$ {formatCurrency(servico.preco)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        R$ {formatCurrency(servico.custoTotal)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${servico.margem > 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {formatCurrency(servico.margem)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.max(0, Math.min(100, servico.margemPercentual))} 
                            className="h-2"
                          />
                          <span className="text-xs text-muted-foreground w-10">
                            {servico.margemPercentual.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
