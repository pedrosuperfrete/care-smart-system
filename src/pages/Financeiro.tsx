
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Calendar, Search, CheckCircle, Clock, XCircle, MessageCircle, CreditCard, AlertCircle } from 'lucide-react';
import { usePagamentos, useFinanceiroStats, useMarcarPago } from '@/hooks/useFinanceiro';
import { FiltroData } from '@/components/financeiro/FiltroData';
import { ModalCobranca } from '@/components/financeiro/ModalCobranca';
import { toast } from 'sonner';

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [cobrancaModal, setCobrancaModal] = useState<{ isOpen: boolean; pagamento: any }>({ isOpen: false, pagamento: null });

  const { data: pagamentos = [], isLoading } = usePagamentos();
  const { data: stats = { totalRecebido: 0, totalPendente: 0, totalVencido: 0, receitaMensal: 0 } } = useFinanceiroStats(dateRange.start, dateRange.end);
  const marcarPagoMutation = useMarcarPago();

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const handleMarcarPago = async (pagamentoId: string) => {
    try {
      await marcarPagoMutation.mutateAsync(pagamentoId);
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
    }
  };

  const handleSendWhatsAppRecibo = (pagamento: any) => {
    const telefone = pagamento.agendamentos?.pacientes?.telefone?.replace(/\D/g, '') || '';
    const mensagem = `Olá ${pagamento.agendamentos?.pacientes?.nome}!

Seu recibo referente ao serviço: ${pagamento.agendamentos?.tipo_servico}
Valor pago: R$ ${Number(pagamento.valor_pago).toFixed(2)}
Data do pagamento: ${new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}

Obrigado pela preferência!`;

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pago: { variant: 'default' as const, icon: CheckCircle, text: 'Pago' },
      pendente: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
      vencido: { variant: 'destructive' as const, icon: XCircle, text: 'Vencido' }
    };
    
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const filteredPagamentos = pagamentos.filter(pagamento => {
    const matchesSearch = pagamento.agendamentos?.pacientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pagamento.agendamentos?.tipo_servico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || pagamento.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const pagamentoDate = new Date(pagamento.criado_em);
      matchesDate = pagamentoDate >= dateRange.start && pagamentoDate <= dateRange.end;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
      <FiltroData onDateRangeChange={handleDateRangeChange} />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalRecebido.toFixed(2)}
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
              R$ {stats.totalPendente.toFixed(2)}
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
              R$ {stats.totalVencido.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos vencidos
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
              {filteredPagamentos.map((pagamento) => (
                <TableRow key={pagamento.id}>
                  <TableCell className="font-medium">
                    {pagamento.agendamentos?.pacientes?.nome || 'N/A'}
                  </TableCell>
                  <TableCell>{pagamento.agendamentos?.tipo_servico || 'N/A'}</TableCell>
                  <TableCell>R$ {Number(pagamento.valor_total).toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(pagamento.criado_em).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="capitalize">{pagamento.forma_pagamento}</TableCell>
                  <TableCell>
                    {getStatusBadge(pagamento.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {pagamento.status === 'pendente' && (
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
                      
                      {(pagamento.status === 'pendente' || pagamento.status === 'vencido') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setCobrancaModal({ 
                            isOpen: true, 
                            pagamento: {
                              id: pagamento.id,
                              paciente: pagamento.agendamentos?.pacientes?.nome || 'N/A',
                              servico: pagamento.agendamentos?.tipo_servico || 'N/A',
                              valor: Number(pagamento.valor_total),
                              data: pagamento.criado_em,
                              telefone: pagamento.agendamentos?.pacientes?.telefone
                            }
                          })}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Cobrar
                        </Button>
                      )}
                      
                      {pagamento.status === 'pago' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <CreditCard className="h-4 w-4 mr-1" />
                              Recibo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Recibo de Pagamento</DialogTitle>
                              <DialogDescription>
                                Detalhes do pagamento de {pagamento.agendamentos?.pacientes?.nome}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Paciente:</strong> {pagamento.agendamentos?.pacientes?.nome}
                                </div>
                                <div>
                                  <strong>Serviço:</strong> {pagamento.agendamentos?.tipo_servico}
                                </div>
                                <div>
                                  <strong>Valor:</strong> R$ {Number(pagamento.valor_pago).toFixed(2)}
                                </div>
                                <div>
                                  <strong>Data:</strong> {new Date(pagamento.data_pagamento || pagamento.criado_em).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Imprimir</Button>
                                <Button variant="outline">Enviar por Email</Button>
                                <Button onClick={() => handleSendWhatsAppRecibo(pagamento)}>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Enviar por WhatsApp
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Cobrança */}
      <ModalCobranca
        isOpen={cobrancaModal.isOpen}
        onClose={() => setCobrancaModal({ isOpen: false, pagamento: null })}
        pagamento={cobrancaModal.pagamento}
      />
    </div>
  );
}
