import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Calendar,
  Receipt,
  CreditCard,
  Check
} from 'lucide-react';
import { useFluxoCaixa, useDespesasAvulsas, DespesaAvulsaInput } from '@/hooks/useFluxoCaixa';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export function FluxoCaixa() {
  const [mesesAtras, setMesesAtras] = useState(6);
  const fluxo = useFluxoCaixa(mesesAtras);
  const { despesas, criarDespesa, deletarDespesa, categorias, isLoading: despesasLoading } = useDespesasAvulsas();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<DespesaAvulsaInput>({
    descricao: '',
    valor: 0,
    categoria: 'Outros',
    data_pagamento: new Date(),
    parcelas: 1,
  });

  const allCategories = [...categorias, ...customCategories.filter(c => !categorias.includes(c))];

  const handleSubmit = () => {
    if (!formData.descricao || formData.valor <= 0) return;
    criarDespesa.mutate(formData);
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: 0,
      categoria: 'Outros',
      data_pagamento: new Date(),
      parcelas: 1,
    });
  };

  if (fluxo.isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Calcular saldo acumulado para a linha
  let saldoAcumulado = 0;
  let saldoAcumuladoPrevisto = 0;
  let ultimoSaldoReal = 0;
  
  // Primeiro passo: encontrar o último mês não-futuro para ter o saldo base
  fluxo.fluxoMensal.forEach(m => {
    if (!m.isFuturo) {
      ultimoSaldoReal += m.saldo;
    }
  });
  
  const chartData = fluxo.fluxoMensal.map((m, index) => {
    saldoAcumulado += m.saldo;
    
    // Para o saldo previsto, precisamos continuar do último saldo real
    if (m.isFuturo) {
      saldoAcumuladoPrevisto += m.saldoPrevisto;
    }
    
    // Para conectar as linhas, o primeiro mês futuro também precisa ter o valor do último real
    const isLastRealMonth = !m.isFuturo && (index === fluxo.fluxoMensal.length - 1 || fluxo.fluxoMensal[index + 1]?.isFuturo);
    
    // Entradas: sempre sólidas (passado = realizadas, futuro = confirmadas/contratadas)
    const entradas = m.isFuturo ? m.receitaPrevista : m.receitaBruta;
    
    // Saídas: passado = realizadas (sólido), futuro = estimadas (com opacidade)
    const saidasRealizadas = m.isFuturo ? null : -m.totalDespesas;
    const saidasEstimadas = m.isFuturo ? -(m.despesasFixas + m.despesasAvulsas + m.taxasPrevistas) : null;
    
    return {
      name: m.mesFormatado,
      // Entradas são sempre "certas" - passadas ou contratadas
      Entradas: entradas,
      // Saídas passadas (realizadas)
      Saídas: saidasRealizadas,
      // Saídas futuras (estimadas)
      'Saídas Estimadas': saidasEstimadas,
      // Saldo acumulado
      'Saldo Acumulado': !m.isFuturo ? saldoAcumulado : null,
      'Saldo Previsto': m.isFuturo 
        ? (ultimoSaldoReal + saldoAcumuladoPrevisto)
        : (isLastRealMonth ? saldoAcumulado : null),
      isFuturo: m.isFuturo,
    };
  });

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-success" />
              Receita Bruta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {formatCurrency(fluxo.totalReceitasBrutas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos {mesesAtras} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-warning" />
              Taxas de Cartão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              R$ {formatCurrency(fluxo.totalTaxasCartao)}
            </div>
            <p className="text-xs text-muted-foreground">
              Crédito: {fluxo.taxaCredito}% / Débito: {fluxo.taxaDebito}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-destructive" />
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {formatCurrency(fluxo.totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Inclui taxas de cartão
            </p>
          </CardContent>
        </Card>

        {/* Card de previsão futura */}
        {fluxo.totalReceitasPrevistas > 0 && (
          <Card className="border-dashed border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Previsão de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {formatCurrency(fluxo.totalReceitasPrevistas)}
              </div>
              <p className="text-xs text-muted-foreground">
                Parcelas a receber (próx. meses)
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Saldo do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fluxo.saldoTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {formatCurrency(fluxo.saldoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fluxo.saldoTotal >= 0 ? 'Lucro' : 'Prejuízo'} acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Média Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              <span className="text-success">+R$ {formatCurrency(fluxo.mediaReceitaMensal)}</span>
            </div>
            <div className="text-sm">
              <span className="text-destructive">-R$ {formatCurrency(fluxo.mediaDespesaMensal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Label>Período:</Label>
          <Select value={String(mesesAtras)} onValueChange={(v) => setMesesAtras(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Despesa Avulsa
        </Button>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Mensal</CardTitle>
          <CardDescription>Comparativo de receitas e despesas por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `R$ ${formatCurrency(Math.abs(value))}`, 
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
              {/* Entradas - sempre sólidas (passado e futuro são confirmadas) */}
              <Bar dataKey="Entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} stackId="stack" />
              {/* Saídas realizadas (passado) */}
              <Bar dataKey="Saídas" name="Saídas" fill="hsl(var(--destructive))" radius={[0, 0, 4, 4]} stackId="stack" />
              {/* Saídas estimadas (futuro) - com opacidade reduzida */}
              <Bar dataKey="Saídas Estimadas" name="Saídas Estimadas" fill="hsl(var(--destructive))" fillOpacity={0.5} radius={[0, 0, 4, 4]} stackId="stack" />
              {/* Linha de saldo real */}
              <Line 
                type="monotone" 
                dataKey="Saldo Acumulado"
                name="Saldo Acumulado"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
              {/* Linha de saldo previsto - tracejada */}
              <Line 
                type="monotone" 
                dataKey="Saldo Previsto"
                name="Saldo Previsto"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, strokeDasharray: '' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Mensal</CardTitle>
          <CardDescription>
            <span className="flex items-center gap-2">
              Meses futuros mostram <Badge variant="outline" className="border-primary text-primary">previsões</Badge> baseadas em parcelas confirmadas e custos recorrentes
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receita Bruta</TableHead>
                <TableHead className="text-right">Despesas Fixas</TableHead>
                <TableHead className="text-right">Despesas Variáveis</TableHead>
                <TableHead className="text-right">Despesas Avulsas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fluxo.fluxoMensal.map((mes) => (
                <TableRow 
                  key={mes.mes} 
                  className={mes.isFuturo ? 'bg-primary/5 border-dashed' : ''}
                >
                  <TableCell className="font-medium capitalize">
                    <div className="flex items-center gap-2">
                      {mes.mesFormatado}
                      {mes.isFuturo && (
                        <Badge variant="outline" className="border-primary text-primary text-xs">
                          Previsão
                        </Badge>
                      )}
                      {mes.isEstimado && !mes.isFuturo && (
                        <Badge variant="outline" className="text-xs">
                          Estimado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={mes.isFuturo ? 'text-primary' : 'text-success'}>
                      R$ {formatCurrency(mes.isFuturo ? mes.receitaPrevista : mes.receitaBruta)}
                    </div>
                    {mes.isFuturo && mes.receitaPrevista > 0 && (
                      <span className="text-xs text-muted-foreground">parcelas a receber</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-muted-foreground">
                      R$ {formatCurrency(mes.despesasFixas)}
                    </div>
                    {mes.isEstimado && (
                      <span className="text-xs text-muted-foreground/70">
                        {mes.despesasFixasReal > 0 && `R$ ${formatCurrency(mes.despesasFixasReal)} confirmado`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {mes.isFuturo ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : (
                      <>
                        R$ {formatCurrency(mes.despesasVariaveis)}
                        <span className="text-xs ml-1">({mes.atendimentosRealizados} atend.)</span>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    R$ {formatCurrency(mes.despesasAvulsas)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    (mes.isFuturo ? mes.saldoPrevisto : mes.saldo) >= 0 
                      ? (mes.isFuturo ? 'text-primary' : 'text-success')
                      : 'text-destructive'
                  }`}>
                    {(mes.isFuturo ? mes.saldoPrevisto : mes.saldo) >= 0 ? '+' : ''}
                    R$ {formatCurrency(mes.isFuturo ? mes.saldoPrevisto : mes.saldo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Despesas Avulsas Recentes */}
      {despesas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Despesas Avulsas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Parcelas</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.slice(0, 10).map((despesa) => (
                  <TableRow key={despesa.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(despesa.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{despesa.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{despesa.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      R$ {formatCurrency(despesa.valor)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(despesa.parcelas || 1) > 1 
                        ? `${despesa.parcelas}x de R$ ${formatCurrency(despesa.valor / (despesa.parcelas || 1))}`
                        : 'À vista'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletarDespesa.mutate(despesa.id)}
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

      {/* Modal de nova despesa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Despesa Avulsa</DialogTitle>
            <DialogDescription>
              Adicione uma despesa pontual que não faz parte dos custos fixos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Compra de equipamento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Total *</Label>
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
                <Label htmlFor="parcelas">Parcelas</Label>
                <Input
                  id="parcelas"
                  type="number"
                  min="1"
                  max="48"
                  value={formData.parcelas || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    parcelas: Math.max(1, parseInt(e.target.value) || 1) 
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data 1ª parcela</Label>
                <Input
                  id="data"
                  type="date"
                  value={format(formData.data_pagamento, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    data_pagamento: e.target.value ? new Date(e.target.value) : new Date() 
                  })}
                />
              </div>
              
              {(formData.parcelas || 1) > 1 && (
                <div className="space-y-2">
                  <Label>Valor por parcela</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                    R$ {(formData.valor / (formData.parcelas || 1)).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(v) => {
                  if (v === '__add_new__') {
                    setIsAddingCategory(true);
                  } else {
                    setFormData({ ...formData, categoria: v });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <Separator className="my-1" />
                  {isAddingCategory ? (
                    <div className="flex items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nova categoria..."
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCategory.trim()) {
                            e.preventDefault();
                            setCustomCategories([...customCategories, newCategory.trim()]);
                            setFormData({ ...formData, categoria: newCategory.trim() });
                            setNewCategory('');
                            setIsAddingCategory(false);
                          }
                          if (e.key === 'Escape') {
                            setNewCategory('');
                            setIsAddingCategory(false);
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (newCategory.trim()) {
                            setCustomCategories([...customCategories, newCategory.trim()]);
                            setFormData({ ...formData, categoria: newCategory.trim() });
                            setNewCategory('');
                            setIsAddingCategory(false);
                          }
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsAddingCategory(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar categoria
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes sobre essa despesa..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={criarDespesa.isPending}>
              {criarDespesa.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
