import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, TrendingUp, Calendar, Search, CheckCircle, Clock, XCircle, Receipt, CreditCard, MessageSquare, FileText, Calculator } from 'lucide-react';
import { usePagamentos, useFinanceiroStats, useMarcarPago } from '@/hooks/useFinanceiro';
import { useCreatePagamento } from '@/hooks/useCreatePagamento';
import { useAuth } from '@/hooks/useAuth';
import { ReciboModal } from '@/components/financeiro/ReciboModal';
import { CobrancaModal } from '@/components/financeiro/CobrancaModal';
import { DateFilter } from '@/components/financeiro/DateFilter';
import { CustosRentabilidade } from '@/components/financeiro/CustosRentabilidade';
import { toast } from 'sonner';
import { NovoPagamentoModal } from '@/components/financeiro/NovoPagamentoModal';
import { DetalhesAgendamentoModal } from '@/components/financeiro/DetalhesAgendamentoModal';
import { formatCurrency } from '@/lib/utils';

export default function Financeiro() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isRecepcionista } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  // Rastrear se veio do dashboard
  const cameFromDashboard = useRef(false);
  
  // Configurar o mês atual por padrão
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const [startDate, setStartDate] = useState<Date | undefined>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Date | undefined>(lastDayOfMonth);
  
  // Estados dos modais
  const [reciboModal, setReciboModal] = useState<{ open: boolean; pagamento: any }>({
    open: false,
    pagamento: null
  });
  const [cobrancaModal, setCobrancaModal] = useState<{ open: boolean; pagamento: any }>({
    open: false,
    pagamento: null
  });
  const [novoPagamentoModal, setNovoPagamentoModal] = useState(false);
  const [detalhesModal, setDetalhesModal] = useState<{ open: boolean; pagamento: any }>({
    open: false,
    pagamento: null
  });

  console.log('User carregado:', user);
  console.log('Status do loading:', authLoading);

  // Hooks para dados
  const { data: pagamentos = [], isLoading: pagamentosLoading, error: pagamentosError } = usePagamentos(startDate, endDate);
  const { data: stats, isLoading: statsLoading } = useFinanceiroStats(startDate, endDate);
  const marcarPagoMutation = useMarcarPago();
  const createPagamentoMutation = useCreatePagamento();

  // Abrir detalhes do pagamento automaticamente se houver agendamento_id na URL
  useEffect(() => {
    const agendamentoId = searchParams.get('agendamento');
    if (agendamentoId && pagamentos.length > 0) {
      const pagamento = pagamentos.find(p => p.agendamento_id === agendamentoId);
      if (pagamento) {
        cameFromDashboard.current = true;
        setDetalhesModal({ open: true, pagamento });
        // Limpar o parâmetro da URL
        searchParams.delete('agendamento');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, pagamentos, setSearchParams]);

  // Função para fechar modal de detalhes
  const handleCloseDetalhes = () => {
    setDetalhesModal({ open: false, pagamento: null });
    if (cameFromDashboard.current) {
      cameFromDashboard.current = false;
      navigate('/app/dashboard');
    }
  };

  // Verificações de segurança
  if (authLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p>Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (pagamentosError) {
    console.error('Erro ao carregar pagamentos:', pagamentosError);
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-600">Não foi possível carregar os pagamentos. Verifique o console para mais detalhes.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pago: { variant: 'default' as const, icon: CheckCircle, text: 'Pago' },
      pendente: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
      vencido: { variant: 'destructive' as const, icon: XCircle, text: 'Vencido' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pendente;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const filteredPagamentos = pagamentos.filter(pagamento => {
    const pacienteNome = pagamento?.agendamentos?.pacientes?.nome || '';
    const tipoServico = pagamento?.agendamentos?.tipo_servico || '';
    
    const matchesSearch = pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tipoServico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || pagamento?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarcarPago = async (pagamentoId: string) => {
    try {
      await marcarPagoMutation.mutateAsync({
        id: pagamentoId,
        data: {
          status: 'pago',
          data_pagamento: new Date().toISOString(),
        }
      });
      console.log('Pagamento marcado como pago:', pagamentoId);
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
    }
  };

  const handleCreatePagamento = async (data: any) => {
    await createPagamentoMutation.mutateAsync(data);
  };

  const handleOpenRecibo = (pagamento: any) => {
    setReciboModal({ open: true, pagamento });
  };

  const handleOpenCobranca = (pagamento: any) => {
    setCobrancaModal({ open: true, pagamento });
  };

  const handleDateChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleOpenDetalhes = (pagamento: any) => {
    setDetalhesModal({ open: true, pagamento });
  };

  const statsData = stats || { totalRecebido: 0, totalPendente: 0, totalVencido: 0, receitaMensal: 0 };

  const [activeTab, setActiveTab] = useState('pagamentos');

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos e receitas da clínica
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pagamentos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Custos e Rentabilidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="space-y-6 mt-4">

      {/* Filtro de Datas */}
      <DateFilter 
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {/* Cards de Resumo - Oculto para secretárias */}
      {!isRecepcionista && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Recebido
              </CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {statsLoading ? '...' : formatCurrency(statsData.totalRecebido)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos recebidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                A Receber
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                R$ {statsLoading ? '...' : formatCurrency(statsData.totalPendente)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                A Ganhar
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {statsLoading ? '...' : formatCurrency(statsData.receitaMensal)}
              </div>
              <p className="text-xs text-muted-foreground">
                Consultas a realizar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Em Atraso
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {statsLoading ? '...' : formatCurrency(statsData.totalVencido)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos vencidos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setNovoPagamentoModal(true)}>
              Novo Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
          <CardDescription>
            Lista de todos os pagamentos da clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagamentosLoading ? (
            <div className="text-center py-8">
              <p>Carregando pagamentos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPagamentos.map((pagamento) => {
                  const pacienteNome = pagamento?.agendamentos?.pacientes?.nome || 'Nome não disponível';
                  const tipoServico = pagamento?.agendamentos?.tipo_servico || 'Serviço não especificado';
                  const servicosAdicionais = pagamento?.agendamentos?.servicos_adicionais as any[] | null;
                  const statusAgendamento = pagamento?.agendamentos?.status;
                  const valorTotal = Number(pagamento?.valor_total) || 0;
                  const dataCriacao = pagamento?.criado_em ? new Date(pagamento.criado_em).toLocaleDateString('pt-BR') : 'Data não disponível';
                  const formaPagamento = pagamento?.forma_pagamento || 'Não especificada';
                  const status = pagamento?.status || 'pendente';

                  const getStatusAgendamentoLabel = (statusAg: string | null | undefined) => {
                    switch (statusAg) {
                      case 'realizado': return 'Realizada';
                      case 'confirmado': return 'Confirmada';
                      case 'falta': return 'Falta';
                      default: return null;
                    }
                  };

                  const statusAgendamentoLabel = getStatusAgendamentoLabel(statusAgendamento);

                  return (
                    <TableRow 
                      key={pagamento?.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenDetalhes(pagamento)}
                    >
                      <TableCell className="font-medium">
                        {pacienteNome}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {tipoServico}
                            {Array.isArray(servicosAdicionais) && servicosAdicionais.length > 0 && (
                              <span className="text-muted-foreground">
                                {' '}+ {servicosAdicionais.length} {servicosAdicionais.length === 1 ? 'adicional' : 'adicionais'}
                              </span>
                            )}
                          </span>
                          {statusAgendamentoLabel && (
                            <span className={`text-xs ${
                              statusAgendamento === 'realizado' ? 'text-success' : 
                              statusAgendamento === 'falta' ? 'text-destructive' : 
                              'text-muted-foreground'
                            }`}>
                              ({statusAgendamentoLabel})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>R$ {formatCurrency(valorTotal)}</TableCell>
                      <TableCell>{dataCriacao}</TableCell>
                      <TableCell className="capitalize">{formaPagamento}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          {status === 'pendente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarcarPago(pagamento.id)}
                              disabled={marcarPagoMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marcar Pago
                            </Button>
                          )}
                          
                          {status === 'pago' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      disabled
                                      className="opacity-60 pointer-events-none"
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Enviar NF
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Em breve</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {(status === 'pendente' || status === 'vencido') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      disabled
                                      className="opacity-60 pointer-events-none"
                                    >
                                      <CreditCard className="h-4 w-4 mr-1" />
                                      Cobrar
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Em breve</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <ReciboModal
        open={reciboModal.open}
        onOpenChange={(open) => setReciboModal({ open, pagamento: open ? reciboModal.pagamento : null })}
        pagamento={reciboModal.pagamento}
      />
      
      <CobrancaModal
        open={cobrancaModal.open}
        onOpenChange={(open) => setCobrancaModal({ open, pagamento: open ? cobrancaModal.pagamento : null })}
        pagamento={cobrancaModal.pagamento}
      />

      <NovoPagamentoModal
        open={novoPagamentoModal}
        onOpenChange={setNovoPagamentoModal}
        onSave={handleCreatePagamento}
      />

      <DetalhesAgendamentoModal
        open={detalhesModal.open}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetalhes();
          } else {
            setDetalhesModal({ open, pagamento: detalhesModal.pagamento });
          }
        }}
        pagamento={detalhesModal.pagamento}
      />
        </TabsContent>

        <TabsContent value="custos" className="mt-4">
          <CustosRentabilidade />
        </TabsContent>
      </Tabs>
    </div>
  );
}
