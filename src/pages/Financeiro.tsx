
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Calendar, Search, CheckCircle, Clock, XCircle, Receipt, CreditCard, MessageSquare } from 'lucide-react';
import { usePagamentos, useFinanceiroStats, useMarcarPago } from '@/hooks/useFinanceiro';
import { useAuth } from '@/hooks/useAuth';
import { ReciboModal } from '@/components/financeiro/ReciboModal';
import { CobrancaModal } from '@/components/financeiro/CobrancaModal';
import { DateFilter } from '@/components/financeiro/DateFilter';
import { toast } from 'sonner';

export default function Financeiro() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Estados dos modais
  const [reciboModal, setReciboModal] = useState<{ open: boolean; pagamento: any }>({
    open: false,
    pagamento: null
  });
  const [cobrancaModal, setCobrancaModal] = useState<{ open: boolean; pagamento: any }>({
    open: false,
    pagamento: null
  });

  console.log('User carregado:', user);
  console.log('Status do loading:', authLoading);

  // Hooks para dados
  const { data: pagamentos = [], isLoading: pagamentosLoading, error: pagamentosError } = usePagamentos(startDate, endDate);
  const { data: stats, isLoading: statsLoading } = useFinanceiroStats(startDate, endDate);
  const marcarPagoMutation = useMarcarPago();

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

  const statsData = stats || { totalRecebido: 0, totalPendente: 0, totalVencido: 0, receitaMensal: 0 };

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

      {/* Filtro de Datas */}
      <DateFilter 
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {statsLoading ? '...' : statsData.totalRecebido.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              A Receber
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {statsLoading ? '...' : statsData.totalPendente.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Atraso
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {statsLoading ? '...' : statsData.totalVencido.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos vencidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {statsLoading ? '...' : statsData.receitaMensal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Recebido este mês
            </p>
          </CardContent>
        </Card>
      </div>

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
                  const pacienteNome = pagamento?.agendamentos?.pac


ientes?.nome || 'Nome não disponível';
                  const tipoServico = pagamento?.agendamentos?.tipo_servico || 'Serviço não especificado';
                  const valorTotal = Number(pagamento?.valor_total) || 0;
                  const dataCriacao = pagamento?.criado_em ? new Date(pagamento.criado_em).toLocaleDateString('pt-BR') : 'Data não disponível';
                  const formaPagamento = pagamento?.forma_pagamento || 'Não especificada';
                  const status = pagamento?.status || 'pendente';

                  return (
                    <TableRow key={pagamento?.id}>
                      <TableCell className="font-medium">
                        {pacienteNome}
                      </TableCell>
                      <TableCell>{tipoServico}</TableCell>
                      <TableCell>R$ {valorTotal.toFixed(2)}</TableCell>
                      <TableCell>{dataCriacao}</TableCell>
                      <TableCell className="capitalize">{formaPagamento}</TableCell>
                      <TableCell>
                        {getStatusBadge(status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
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
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenRecibo(pagamento)}
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              Recibo
                            </Button>
                          )}
                          
                          {(status === 'pendente' || status === 'vencido') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenCobranca(pagamento)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Cobrar
                            </Button>
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
    </div>
  );
}
