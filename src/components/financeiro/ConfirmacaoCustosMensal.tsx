import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Check, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Edit2,
  Save
} from 'lucide-react';
import { useCustosPagamentos, CustoPagamentoInput } from '@/hooks/useCustosPagamentos';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export function ConfirmacaoCustosMensal() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [editandoCusto, setEditandoCusto] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const mesReferencia = format(mesAtual, 'yyyy-MM');
  const mesFormatado = format(mesAtual, 'MMMM yyyy', { locale: ptBR });
  const isMesAtualCalendario = format(new Date(), 'yyyy-MM') === mesReferencia;
  const isMesFuturo = mesAtual > endOfMonth(new Date());

  const { 
    custosComPagamento,
    totalEstimado,
    totalPago,
    custosPendentes,
    custosConfirmados,
    salvarPagamento,
    confirmarTodosMes,
    isLoading,
  } = useCustosPagamentos(mesReferencia);

  const handleMesAnterior = () => {
    setMesAtual(prev => subMonths(prev, 1));
    setEditandoCusto(null);
  };

  const handleProximoMes = () => {
    setMesAtual(prev => addMonths(prev, 1));
    setEditandoCusto(null);
  };

  const handleEditarCusto = (custoId: string, valorAtual: number) => {
    setEditandoCusto(custoId);
    setValorEditando(valorAtual.toString());
  };

  const handleSalvarValor = async (item: typeof custosComPagamento[0]) => {
    const valorNumerico = parseFloat(valorEditando) || 0;
    
    try {
      await salvarPagamento.mutateAsync({
        custo_id: item.custo_id,
        mes_referencia: mesReferencia,
        valor_pago: valorNumerico,
        status: 'pago',
        data_pagamento: new Date(),
      });
      setEditandoCusto(null);
    } catch (error) {
      console.error('Erro ao salvar valor:', error);
    }
  };

  const handleConfirmarTodos = async () => {
    const pendentes = custosComPagamento.filter(c => c.status !== 'pago');
    
    try {
      const pagamentos: CustoPagamentoInput[] = pendentes.map(c => ({
        custo_id: c.custo_id,
        mes_referencia: mesReferencia,
        valor_pago: c.ultimo_valor_pago ?? c.valor_estimado,
        status: 'pago',
        data_pagamento: new Date(),
      }));
      
      await confirmarTodosMes.mutateAsync(pagamentos);
      toast.success(`${pendentes.length} custos confirmados!`);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Erro ao confirmar custos:', error);
      toast.error('Erro ao confirmar custos');
    }
  };

  const getStatusBadge = (status: 'pendente' | 'pago' | 'estimado') => {
    switch (status) {
      case 'pago':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'pendente':
        return (
          <Badge variant="outline" className="text-warning border-warning/50">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'estimado':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <AlertCircle className="h-3 w-3 mr-1" />
            Estimativa
          </Badge>
        );
    }
  };

  // Calcular valor exibido (último pago ou estimado)
  const getValorExibido = (item: typeof custosComPagamento[0]) => {
    if (item.valor_pago !== null) return item.valor_pago;
    if (item.ultimo_valor_pago !== null) return item.ultimo_valor_pago;
    return item.valor_estimado;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação de mês */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Confirmação de Custos Mensais
              </CardTitle>
              <CardDescription>
                Confirme os valores reais pagos em cada custo recorrente
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleMesAnterior}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-medium min-w-[160px] text-center capitalize">
                {mesFormatado}
              </div>
              <Button variant="outline" size="icon" onClick={handleProximoMes}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(totalEstimado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Confirmado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {formatCurrency(totalPago)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custos Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {custosConfirmados}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ {custosComPagamento.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {custosPendentes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de custos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Custos Recorrentes do Mês</CardTitle>
            {custosPendentes > 0 && !isMesFuturo && (
              <Button onClick={() => setIsConfirmDialogOpen(true)}>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Todos com Estimativa
              </Button>
            )}
          </div>
          {isMesFuturo && (
            <CardDescription className="text-warning">
              Este é um mês futuro. Os valores mostrados são apenas estimativas.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {custosComPagamento.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum custo fixo cadastrado.</p>
              <p className="text-sm">Cadastre seus custos na aba "Custos e Rentabilidade".</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Custo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Estimado</TableHead>
                  <TableHead className="text-right">Valor Real</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custosComPagamento.map((item) => (
                  <TableRow key={item.custo_id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={item.tipo === 'fixo' ? 'text-primary' : 'text-warning'}>
                        {item.tipo === 'fixo' ? 'Fixo' : 'Variável'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      R$ {formatCurrency(item.valor_estimado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {editandoCusto === item.custo_id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={valorEditando}
                            onChange={(e) => setValorEditando(e.target.value)}
                            className="w-28 text-right"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSalvarValor(item);
                              if (e.key === 'Escape') setEditandoCusto(null);
                            }}
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleSalvarValor(item)}
                            disabled={salvarPagamento.isPending}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className={item.valor_pago !== null ? 'font-medium' : 'text-muted-foreground italic'}>
                          R$ {formatCurrency(getValorExibido(item))}
                          {item.valor_pago === null && (
                            <span className="text-xs ml-1">(est.)</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {!isMesFuturo && editandoCusto !== item.custo_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarCusto(
                            item.custo_id, 
                            getValorExibido(item)
                          )}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          {item.status === 'pago' ? 'Editar' : 'Confirmar'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação em massa */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Todos os Custos</DialogTitle>
            <DialogDescription>
              Você está prestes a confirmar {custosPendentes} custos pendentes usando os valores estimados.
              Você pode editar valores individuais depois, se necessário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-sm text-muted-foreground mb-2">
              Os seguintes custos serão confirmados:
            </div>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {custosComPagamento
                .filter(c => c.status !== 'pago')
                .map(c => (
                  <li key={c.custo_id} className="flex justify-between text-sm">
                    <span>{c.nome}</span>
                    <span className="font-medium">
                      R$ {formatCurrency(c.ultimo_valor_pago ?? c.valor_estimado)}
                      {c.ultimo_valor_pago && (
                        <span className="text-xs text-muted-foreground ml-1">(último pago)</span>
                      )}
                    </span>
                  </li>
                ))
              }
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarTodos}
              disabled={confirmarTodosMes.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
