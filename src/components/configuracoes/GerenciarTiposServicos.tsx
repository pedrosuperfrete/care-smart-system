import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit3, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useTiposServicos, 
  useCreateTipoServico, 
  useUpdateTipoServico, 
  useDeleteTipoServico,
  TipoServico
} from '@/hooks/useTiposServicos';
import { useAuth } from '@/hooks/useAuth';
import { useMigrarServicos } from '@/hooks/useMigrarServicos';
import { useProfissionais } from '@/hooks/useProfissionais';
import { formatCurrency } from '@/lib/utils';

export function GerenciarTiposServicos() {
  const { data: tiposServicos = [], isLoading } = useTiposServicos();
  const createMutation = useCreateTipoServico();
  const updateMutation = useUpdateTipoServico();
  const deleteMutation = useDeleteTipoServico();
  const { profissional, isRecepcionista, isAdmin, clinicaAtual } = useAuth();
  const { data: profissionais = [] } = useProfissionais();
  
  // Migrar dados antigos automaticamente
  useMigrarServicos();
  
  // Secretárias e admins podem escolher o profissional
  const podeEscolherProfissional = isRecepcionista || isAdmin;
  const deveMostrarSelectProfissional = podeEscolherProfissional && profissionais.length > 0;
  
  const [novoTipo, setNovoTipo] = useState({ 
    nome: '', 
    preco: '',
    percentualFalta: '',
    percentualAgendamento: '',
    profissionalId: ''
  });
  const [editandoTipo, setEditandoTipo] = useState<TipoServico | null>(null);
  const [editForm, setEditForm] = useState({ 
    nome: '', 
    preco: '',
    percentualFalta: '',
    percentualAgendamento: ''
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleCriarTipo = async () => {
    if (!novoTipo.nome.trim()) return;
    
    // Se pode escolher profissional, usa o selecionado; senão, usa o próprio profissional
    const profissionalIdFinal = podeEscolherProfissional 
      ? novoTipo.profissionalId || undefined
      : profissional?.id;
    
    // Buscar a clinica_id do profissional selecionado ou usar a clínica atual
    let clinicaIdFinal: string | null | undefined = clinicaAtual || profissional?.clinica_id;
    
    if (profissionalIdFinal && profissionais.length > 0) {
      const profissionalSelecionado = profissionais.find(p => p.id === profissionalIdFinal);
      if (profissionalSelecionado?.clinica_id) {
        clinicaIdFinal = profissionalSelecionado.clinica_id;
      }
    }
    
    const data = {
      nome: novoTipo.nome.trim(),
      preco: novoTipo.preco ? parseFloat(novoTipo.preco) : undefined,
      percentual_cobranca_falta: novoTipo.percentualFalta ? parseFloat(novoTipo.percentualFalta) : undefined,
      percentual_cobranca_agendamento: novoTipo.percentualAgendamento ? parseFloat(novoTipo.percentualAgendamento) : undefined,
      profissional_id: profissionalIdFinal,
      clinica_id: clinicaIdFinal
    };
    
    await createMutation.mutateAsync(data);
    setNovoTipo({ nome: '', preco: '', percentualFalta: '', percentualAgendamento: '', profissionalId: '' });
    setShowCreateDialog(false);
  };

  const handleEditarTipo = (tipo: TipoServico) => {
    setEditandoTipo(tipo);
    setEditForm({
      nome: tipo.nome,
      preco: tipo.preco?.toString() || '',
      percentualFalta: tipo.percentual_cobranca_falta?.toString() || '',
      percentualAgendamento: tipo.percentual_cobranca_agendamento?.toString() || ''
    });
    setShowEditDialog(true);
  };

  const handleSalvarEdicao = async () => {
    if (!editandoTipo || !editForm.nome.trim()) return;
    
    const data = {
      nome: editForm.nome.trim(),
      preco: editForm.preco ? parseFloat(editForm.preco) : undefined,
      percentual_cobranca_falta: editForm.percentualFalta ? parseFloat(editForm.percentualFalta) : null,
      percentual_cobranca_agendamento: editForm.percentualAgendamento ? parseFloat(editForm.percentualAgendamento) : null
    };
    
    await updateMutation.mutateAsync({ id: editandoTipo.id, data });
    setShowEditDialog(false);
    setEditandoTipo(null);
  };

  const handleRemoverTipo = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este tipo de serviço?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatPercentual = (value: number | undefined | null) => {
    if (value === null || value === undefined) return null;
    return `${value}%`;
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tipos de Serviços</CardTitle>
            <CardDescription>
              Gerencie os tipos de serviços oferecidos pela clínica
            </CardDescription>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Tipo de Serviço</DialogTitle>
                <DialogDescription>
                  Adicione um novo tipo de serviço à sua clínica
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {deveMostrarSelectProfissional && (
                  <div>
                    <Label htmlFor="profissional">Profissional *</Label>
                    <Select
                      value={novoTipo.profissionalId}
                      onValueChange={(value) => setNovoTipo(prev => ({ ...prev, profissionalId: value }))}
                    >
                      <SelectTrigger id="profissional">
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {profissionais.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="nome">Nome do Serviço *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Consulta, Retorno, Exame..."
                    value={novoTipo.nome}
                    onChange={(e) => setNovoTipo(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={novoTipo.preco}
                    onChange={(e) => setNovoTipo(prev => ({ ...prev, preco: e.target.value }))}
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">Cobranças (opcional)</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Configure cobranças automáticas baseadas em percentual do valor do serviço.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="percentualAgendamento">% cobrado no agendamento</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Percentual do valor cobrado na hora do agendamento (entrada/sinal).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="percentualAgendamento"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="Ex: 30"
                      value={novoTipo.percentualAgendamento}
                      onChange={(e) => setNovoTipo(prev => ({ ...prev, percentualAgendamento: e.target.value }))}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="percentualFalta">% cobrado em caso de falta</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Percentual do valor cobrado quando o paciente falta à consulta confirmada.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="percentualFalta"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="Ex: 100"
                      value={novoTipo.percentualFalta}
                      onChange={(e) => setNovoTipo(prev => ({ ...prev, percentualFalta: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCriarTipo}
                    disabled={!novoTipo.nome.trim() || createMutation.isPending || (deveMostrarSelectProfissional && !novoTipo.profissionalId)}
                  >
                    {createMutation.isPending ? 'Criando...' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {tiposServicos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum tipo de serviço cadastrado ainda.
            </p>
          ) : (
            tiposServicos.map((tipo) => (
              <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{tipo.nome}</h4>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {tipo.preco && (
                      <span>R$ {formatCurrency(tipo.preco)}</span>
                    )}
                    {tipo.percentual_cobranca_agendamento && (
                      <span className="text-primary">
                        • {formatPercentual(tipo.percentual_cobranca_agendamento)} no agendamento
                      </span>
                    )}
                    {tipo.percentual_cobranca_falta && (
                      <span className="text-destructive">
                        • {formatPercentual(tipo.percentual_cobranca_falta)} em falta
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditarTipo(tipo)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoverTipo(tipo.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Serviço</DialogTitle>
            <DialogDescription>
              Altere as informações do tipo de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome do Serviço *</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-preco">Preço (R$)</Label>
              <Input
                id="edit-preco"
                type="number"
                step="0.01"
                value={editForm.preco}
                onChange={(e) => setEditForm(prev => ({ ...prev, preco: e.target.value }))}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Cobranças (opcional)</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Configure cobranças automáticas baseadas em percentual do valor do serviço.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="edit-percentualAgendamento">% cobrado no agendamento</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Percentual do valor cobrado na hora do agendamento (entrada/sinal).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="edit-percentualAgendamento"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="Ex: 30"
                  value={editForm.percentualAgendamento}
                  onChange={(e) => setEditForm(prev => ({ ...prev, percentualAgendamento: e.target.value }))}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="edit-percentualFalta">% cobrado em caso de falta</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Percentual do valor cobrado quando o paciente falta à consulta confirmada.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="edit-percentualFalta"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="Ex: 100"
                  value={editForm.percentualFalta}
                  onChange={(e) => setEditForm(prev => ({ ...prev, percentualFalta: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvarEdicao}
                disabled={!editForm.nome.trim() || updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}