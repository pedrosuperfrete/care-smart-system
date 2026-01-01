import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Calculator,
  PiggyBank,
  Building2,
  Zap,
  Lightbulb,
  Users
} from 'lucide-react';
import { useCustos, useRentabilidade, CustoInput } from '@/hooks/useCustos';
import { useTiposServicos } from '@/hooks/useTiposServicos';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Sugestões de custos pré-definidos
const custosSugeridos = {
  fixos: [
    { nome: 'Aluguel do consultório', valor: 2500, descricao: 'Aluguel mensal do espaço' },
    { nome: 'Secretária/Recepção', valor: 1800, descricao: 'Salário + encargos' },
    { nome: 'Internet', valor: 150, descricao: 'Plano de internet' },
    { nome: 'Energia elétrica', valor: 300, descricao: 'Conta de luz mensal' },
    { nome: 'Água', valor: 80, descricao: 'Conta de água mensal' },
    { nome: 'Sistemas e softwares', valor: 200, descricao: 'Assinaturas de sistemas' },
    { nome: 'Contador', valor: 400, descricao: 'Honorários contábeis' },
    { nome: 'Condomínio', valor: 500, descricao: 'Taxa de condomínio' },
    { nome: 'Seguro do consultório', valor: 150, descricao: 'Seguro mensal' },
    { nome: 'Marketing e publicidade', valor: 300, descricao: 'Investimento em marketing' },
  ],
  variaveis: [
    { nome: 'Materiais descartáveis', valor: 15, descricao: 'Luvas, máscaras, etc. por atendimento' },
    { nome: 'Insumos médicos', valor: 25, descricao: 'Medicamentos e materiais por procedimento' },
    { nome: 'Taxa de cartão', valor: 0, descricao: 'Percentual sobre pagamentos em cartão' },
    { nome: 'Comissão por atendimento', valor: 0, descricao: 'Se houver pagamento por sessão' },
  ],
};

export function CustosRentabilidade() {
  const { custos, isLoading: custosLoading, criarCusto, deletarCusto } = useCustos();
  const { data: tiposServicos = [] } = useTiposServicos();
  const rentabilidade = useRentabilidade();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [metaMensal, setMetaMensal] = useState(5000);
  const [servicoSelecionado, setServicoSelecionado] = useState<string>('todos');
  
  // Form state
  const [formData, setFormData] = useState<CustoInput>({
    nome: '',
    valor: 0,
    tipo: 'fixo',
    frequencia: 'mensal',
    descricao: '',
    aplicacao: 'todos',
    servicos_ids: [],
    percentual_rateio: 100,
  });

  const handleAddSugerido = (sugerido: typeof custosSugeridos.fixos[0], tipo: 'fixo' | 'variavel') => {
    setFormData({
      nome: sugerido.nome,
      valor: sugerido.valor,
      tipo,
      frequencia: tipo === 'fixo' ? 'mensal' : 'por_atendimento',
      descricao: sugerido.descricao,
      aplicacao: 'todos',
      servicos_ids: [],
      percentual_rateio: 100,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome || formData.valor <= 0) {
      return;
    }
    criarCusto.mutate(formData);
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: 0,
      tipo: 'fixo',
      frequencia: 'mensal',
      descricao: '',
      aplicacao: 'todos',
      servicos_ids: [],
      percentual_rateio: 100,
    });
  };

  // Dados calculados com base no serviço selecionado
  const dadosServicoSelecionado = servicoSelecionado !== 'todos' 
    ? rentabilidade.calcularBreakEvenPorServico(servicoSelecionado)
    : { breakEven: rentabilidade.breakEven, margem: rentabilidade.margemMedia };
  
  const atendimentosParaMeta = servicoSelecionado !== 'todos'
    ? rentabilidade.calcularAtendimentosParaMetaPorServico(metaMensal, servicoSelecionado)
    : rentabilidade.calcularAtendimentosParaMeta(metaMensal);

  const servicoInfo = servicoSelecionado !== 'todos' 
    ? rentabilidade.rentabilidadePorServico.find(s => s.id === servicoSelecionado)
    : null;

  if (custosLoading || rentabilidade.isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  const custosCadastrados = custos.length > 0;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Cadastrar Custos
          </TabsTrigger>
          <TabsTrigger value="servicos" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Rentabilidade
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {!custosCadastrados ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Comece a entender sua rentabilidade</h3>
                  <p className="text-muted-foreground mb-4">
                    Cadastre seus custos fixos e variáveis para descobrir quanto você realmente ganha por atendimento.
                  </p>
                  <Button onClick={() => setActiveTab('custos')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Custos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
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
                        {dadosServicoSelecionado.breakEven === Infinity ? '∞' : dadosServicoSelecionado.breakEven} atendimentos/mês
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
                      <p className={`text-xl font-bold ${dadosServicoSelecionado.margem > 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {formatCurrency(dadosServicoSelecionado.margem)}
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
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quantos pacientes para sua meta?
                    {servicoInfo && (
                      <Badge variant="outline" className="ml-2 font-normal">{servicoInfo.nome}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {servicoSelecionado === 'todos' 
                      ? 'Digite quanto você quer ganhar por mês (já descontando os custos)'
                      : `Quantos atendimentos de "${servicoInfo?.nome}" você precisa fazer`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="meta">Meta de ganho mensal</Label>
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
                    <div className="text-center px-8 py-4 bg-muted rounded-lg min-w-[160px]">
                      <p className="text-sm text-muted-foreground mb-1">Você precisa de</p>
                      <p className="text-3xl font-bold text-primary">
                        {atendimentosParaMeta === Infinity ? '∞' : atendimentosParaMeta}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {servicoSelecionado === 'todos' ? 'atendimentos/mês' : `${servicoInfo?.nome?.toLowerCase() || 'sessões'}/mês`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alertas */}
              {rentabilidade.rentabilidadePorServico.some(s => s.margem <= 0) && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <h4 className="font-medium text-destructive">Atenção: Serviços com margem baixa</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Alguns dos seus serviços podem estar dando prejuízo. Veja a aba "Rentabilidade" para mais detalhes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Cadastro de Custos */}
        <TabsContent value="custos" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Seus Custos</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre todos os gastos da sua clínica
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Custo
            </Button>
          </div>

          {/* Lista de custos cadastrados */}
          {custos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custos.map((custo) => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>
                          <Badge variant={custo.tipo === 'fixo' ? 'default' : 'secondary'}>
                            {custo.tipo === 'fixo' ? 'Fixo' : 'Variável'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {custo.frequencia === 'mensal' ? 'Mensal' : 
                           custo.frequencia === 'por_atendimento' ? 'Por atendimento' : 'Ocasional'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {formatCurrency(custo.valor)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletarCusto.mutate(custo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Sugestões de custos */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Sugestões de custos comuns
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custos Fixos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Custos Fixos (mensais)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {custosSugeridos.fixos.map((sugerido, idx) => {
                    const jaCadastrado = custos.some(c => c.nome === sugerido.nome);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-2 rounded-lg border ${jaCadastrado ? 'bg-muted/50' : 'hover:bg-muted/50 cursor-pointer'}`}
                        onClick={() => !jaCadastrado && handleAddSugerido(sugerido, 'fixo')}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{sugerido.nome}</p>
                          <p className="text-xs text-muted-foreground">{sugerido.descricao}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            R$ {sugerido.valor}
                          </span>
                          {jaCadastrado ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Plus className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Custos Variáveis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Custos Variáveis (por atendimento)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {custosSugeridos.variaveis.map((sugerido, idx) => {
                    const jaCadastrado = custos.some(c => c.nome === sugerido.nome);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-2 rounded-lg border ${jaCadastrado ? 'bg-muted/50' : 'hover:bg-muted/50 cursor-pointer'}`}
                        onClick={() => !jaCadastrado && handleAddSugerido(sugerido, 'variavel')}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{sugerido.nome}</p>
                          <p className="text-xs text-muted-foreground">{sugerido.descricao}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            R$ {sugerido.valor}
                          </span>
                          {jaCadastrado ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Plus className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Rentabilidade por Serviço */}
        <TabsContent value="servicos" className="space-y-6">
          {rentabilidade.rentabilidadePorServico.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center py-8">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum serviço cadastrado</h3>
                <p className="text-muted-foreground">
                  Cadastre seus serviços em Configurações → Tipos de Serviços para ver a rentabilidade de cada um.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cards de destaque */}
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

              {/* Tabela de rentabilidade */}
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
        </TabsContent>
      </Tabs>

      {/* Modal de novo custo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Cadastrar Custo</DialogTitle>
            <DialogDescription>
              Adicione um novo custo fixo ou variável
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do custo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Aluguel do consultório"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="valor"
                    type="number"
                    value={formData.valor || ''}
                    onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v: 'fixo' | 'variavel') => setFormData({ 
                    ...formData, 
                    tipo: v,
                    frequencia: v === 'fixo' ? 'mensal' : 'por_atendimento'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixo">Fixo (mensal)</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipo === 'variavel' && (
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select 
                  value={formData.frequencia} 
                  onValueChange={(v: 'mensal' | 'por_atendimento' | 'ocasional') => setFormData({ ...formData, frequencia: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="por_atendimento">Por atendimento</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="ocasional">Ocasional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Esse custo se aplica a:</Label>
              <RadioGroup
                value={formData.aplicacao}
                onValueChange={(v: 'todos' | 'especificos') => setFormData({ ...formData, aplicacao: v })}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="todos" id="todos" />
                  <Label htmlFor="todos" className="font-normal cursor-pointer">
                    Todos os serviços
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="especificos" id="especificos" />
                  <Label htmlFor="especificos" className="font-normal cursor-pointer">
                    Apenas serviços específicos
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.aplicacao === 'especificos' && tiposServicos.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Selecione os serviços:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tiposServicos.map((servico) => (
                    <div key={servico.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={servico.id}
                        checked={formData.servicos_ids?.includes(servico.id)}
                        onCheckedChange={(checked) => {
                          const ids = formData.servicos_ids || [];
                          setFormData({
                            ...formData,
                            servicos_ids: checked 
                              ? [...ids, servico.id]
                              : ids.filter(id => id !== servico.id)
                          });
                        }}
                      />
                      <Label htmlFor={servico.id} className="font-normal cursor-pointer">
                        {servico.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes sobre esse custo..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={criarCusto.isPending}>
              {criarCusto.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
