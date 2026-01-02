import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Building2,
  Zap,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { useCustos, CustoInput } from '@/hooks/useCustos';
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
    { nome: 'Comissão por atendimento', valor: 0, descricao: 'Se houver pagamento por sessão' },
  ],
};

export function CadastroCustos() {
  const { custos, custosServicos, isLoading: custosLoading, criarCusto, atualizarCusto, deletarCusto } = useCustos();
  const { data: tiposServicos = [] } = useTiposServicos();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CustoInput>({
    nome: '',
    valor_estimado: 0,
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
      valor_estimado: sugerido.valor,
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
    if (!formData.nome || formData.valor_estimado <= 0) {
      return;
    }
    
    if (editingCusto) {
      atualizarCusto.mutate({
        id: editingCusto,
        nome: formData.nome,
        valor_estimado: formData.valor_estimado,
        tipo: formData.tipo,
        frequencia: formData.frequencia,
        descricao: formData.descricao || null,
        aplicacao: formData.aplicacao,
        servicos_ids: formData.servicos_ids,
        percentual_rateio: formData.percentual_rateio,
      });
    } else {
      criarCusto.mutate(formData);
    }
    
    setIsDialogOpen(false);
    setEditingCusto(null);
    resetForm();
  };

  const handleEditCusto = (custo: typeof custos[0]) => {
    const servicosVinculados = custosServicos
      .filter(cs => cs.custo_id === custo.id)
      .map(cs => cs.tipo_servico_id);
    
    const aplicaTodos = servicosVinculados.length === 0 || servicosVinculados.length >= tiposServicos.length;
    
    setFormData({
      nome: custo.nome,
      valor_estimado: custo.valor_estimado,
      tipo: custo.tipo as 'fixo' | 'variavel',
      frequencia: custo.frequencia as 'mensal' | 'por_atendimento' | 'ocasional',
      descricao: custo.descricao || '',
      aplicacao: aplicaTodos ? 'todos' : 'especificos',
      servicos_ids: servicosVinculados,
      percentual_rateio: 100,
    });
    setEditingCusto(custo.id);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      valor_estimado: 0,
      tipo: 'fixo',
      frequencia: 'mensal',
      descricao: '',
      aplicacao: 'todos',
      servicos_ids: [],
      percentual_rateio: 100,
    });
    setEditingCusto(null);
  };

  if (custosLoading) {
    return <div className="text-center py-8">Carregando custos...</div>;
  }

  return (
    <div className="space-y-6">
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
                  <TableHead>Aplica-se a</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos.map((custo) => {
                  const servicosVinculados = custosServicos
                    .filter(cs => cs.custo_id === custo.id)
                    .map(cs => tiposServicos.find(s => s.id === cs.tipo_servico_id)?.nome)
                    .filter(Boolean);
                  
                  const aplicaTodos = servicosVinculados.length === 0 || servicosVinculados.length >= tiposServicos.length;
                  
                  return (
                    <TableRow key={custo.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{custo.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {custo.frequencia === 'mensal' ? 'Mensal' : 
                             custo.frequencia === 'por_atendimento' ? 'Por atendimento' : 'Ocasional'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={custo.tipo === 'fixo' ? 'default' : 'secondary'}>
                          {custo.tipo === 'fixo' ? 'Fixo' : 'Variável'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {aplicaTodos ? (
                          <span className="text-sm text-muted-foreground">Todos os serviços</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {servicosVinculados.slice(0, 2).map((nome, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {nome}
                              </Badge>
                            ))}
                            {servicosVinculados.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{servicosVinculados.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {formatCurrency(custo.valor_estimado)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCusto(custo)}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletarCusto.mutate(custo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Modal de novo/editar custo */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCusto(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingCusto ? 'Editar Custo' : 'Cadastrar Custo'}</DialogTitle>
            <DialogDescription>
              {editingCusto ? 'Altere os dados do custo' : 'Adicione um novo custo fixo ou variável'}
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
                <Label htmlFor="valor">Valor Estimado *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="valor"
                    type="number"
                    value={formData.valor_estimado || ''}
                    onChange={(e) => setFormData({ ...formData, valor_estimado: Number(e.target.value) })}
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
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setEditingCusto(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={criarCusto.isPending || atualizarCusto.isPending}>
              {(criarCusto.isPending || atualizarCusto.isPending) ? 'Salvando...' : editingCusto ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
