
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Calendar, Search, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Mock data - substituir por hooks reais
  const pagamentos = [
    {
      id: '1',
      paciente: 'Maria Silva',
      servico: 'Consulta Cardiológica',
      valor: 250.00,
      status: 'pago',
      data: '2024-06-15',
      forma: 'cartao'
    },
    {
      id: '2',
      paciente: 'José Santos',
      servico: 'Exame de Rotina',
      valor: 180.00,
      status: 'pendente',
      data: '2024-06-14',
      forma: 'pix'
    },
    {
      id: '3',
      paciente: 'Ana Costa',
      servico: 'Consulta de Retorno',
      valor: 120.00,
      status: 'vencido',
      data: '2024-06-10',
      forma: 'dinheiro'
    }
  ];

  const stats = {
    totalRecebido: pagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0),
    totalPendente: pagamentos.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0),
    totalVencido: pagamentos.filter(p => p.status === 'vencido').reduce((acc, p) => acc + p.valor, 0),
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
    const matchesSearch = pagamento.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pagamento.servico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || pagamento.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                    {pagamento.paciente}
                  </TableCell>
                  <TableCell>{pagamento.servico}</TableCell>
                  <TableCell>R$ {pagamento.valor.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(pagamento.data).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="capitalize">{pagamento.forma}</TableCell>
                  <TableCell>
                    {getStatusBadge(pagamento.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {pagamento.status === 'pendente' && (
                        <Button size="sm" variant="outline">
                          Marcar Pago
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Recibo
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Recibo de Pagamento</DialogTitle>
                            <DialogDescription>
                              Detalhes do pagamento de {pagamento.paciente}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <strong>Paciente:</strong> {pagamento.paciente}
                              </div>
                              <div>
                                <strong>Serviço:</strong> {pagamento.servico}
                              </div>
                              <div>
                                <strong>Valor:</strong> R$ {pagamento.valor.toFixed(2)}
                              </div>
                              <div>
                                <strong>Data:</strong> {new Date(pagamento.data).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">Imprimir</Button>
                              <Button>Enviar por Email</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
