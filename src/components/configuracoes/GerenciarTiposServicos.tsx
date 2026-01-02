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
  
  // Filtro por profissional (para secretárias/admins)
  const [filtroProfissional, setFiltroProfissional] = useState<string>('todos');
  
  const [novoTipo, setNovoTipo] = useState({ 
    nome: '', 
    preco: '',
    descricao: '',
    percentualFalta: '',
    percentualAgendamento: '',
    profissionalId: ''
  });
  const [editandoTipo, setEditandoTipo] = useState<TipoServico | null>(null);
  const [editForm, setEditForm] = useState({ 
    nome: '', 
    preco: '',
    descricao: '',
    percentualFalta: '',
    percentualAgendamento: ''
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Filtrar tipos de serviço conforme seleção
  const tiposServicosFiltrados = tiposServicos.filter(tipo => {
    if (filtroProfissional === 'todos') return true;
    if (filtroProfissional === 'clinica') return !tipo.profissional_id;
    return tipo.profissional_id === filtroProfissional || !tipo.profissional_id;
  });

  const handleCriarTipo = async () => {
    if (!novoTipo.nome.trim() || !novoTipo.preco) return;
    
    // Determinar profissional_id e clinica_id baseado na seleção
    let profissionalIdFinal: string | undefined = undefined;
    let clinicaIdFinal: string | null | undefined = clinicaAtual || profissional?.clinica_id;
    
    if (podeEscolherProfissional) {
      // Se selecionou "clinica", profissional_id fica null (serviço para toda clínica)
      if (novoTipo.profissionalId === 'clinica') {
        profissionalIdFinal = undefined;
      } else if (novoTipo.profissionalId) {
        // Se selecionou um profissional específico
        profissionalIdFinal = novoTipo.profissionalId;
        const profissionalSelecionado = profissionais.find(p => p.id === profissionalIdFinal);
        if (profissionalSelecionado?.clinica_id) {
          clinicaIdFinal = profissionalSelecionado.clinica_id;
        }
      }
    } else {
      // Se não pode escolher, usa o próprio profissional
      profissionalIdFinal = profissional?.id;
    }
    
    const data = {
      nome: novoTipo.nome.trim(),
      preco: parseFloat(novoTipo.preco),
      descricao: novoTipo.descricao.trim() || undefined,
      percentual_cobranca_falta: novoTipo.percentualFalta ? parseFloat(novoTipo.percentualFalta) : undefined,
      percentual_cobranca_agendamento: novoTipo.percentualAgendamento ? parseFloat(novoTipo.percentualAgendamento) : undefined,
      profissional_id: profissionalIdFinal,
      clinica_id: clinicaIdFinal
    };
    
    await createMutation.mutateAsync(data);
    setNovoTipo({ nome: '', preco: '', descricao: '', percentualFalta: '', percentualAgendamento: '', profissionalId: '' });
    setShowCreateDialog(false);
  };

  const handleEditarTipo = (tipo: TipoServico) => {
    setEditandoTipo(tipo);
    setEditForm({
      nome: tipo.nome,
      preco: tipo.preco?.toString() || '',
      descricao: tipo.descricao || '',
      percentualFalta: tipo.percentual_cobranca_falta?.toString() || '',
      percentualAgendamento: tipo.percentual_cobranca_agendamento?.toString() || ''
    });
    setShowEditDialog(true);
  };

  const handleSalvarEdicao = async () => {
    if (!editandoTipo || !editForm.nome.trim() || !editForm.preco) return;
    
    const data = {
      nome: editForm.nome.trim(),
      preco: parseFloat(editForm.preco),
      descricao: editForm.descricao.trim() || undefined,
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Tipos de Serviços</CardTitle>
            <CardDescription>
              Gerencie os tipos de serviços oferecidos pela clínica
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filtro por profissional para secretárias/admins */}
            {deveMostrarSelectProfissional && (
              <Select
                value={filtroProfissional}
                onValueChange={setFiltroProfissional}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os serviços</SelectItem>
                  <SelectItem value="clinica">🏥 Somente da Clínica</SelectItem>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      👤 {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          
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
                    <Label htmlFor="profissional">Visibilidade *</Label>
                    <Select
                      value={novoTipo.profissionalId}
                      onValueChange={(value) => setNovoTipo(prev => ({ ...prev, profissionalId: value }))}
                    >
                      <SelectTrigger id="profissional">
                        <SelectValue placeholder="Selecione a visibilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinica">
                          🏥 Toda a Clínica (visível para todos)
                        </SelectItem>
                        {profissionais.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            👤 {prof.nome} (exclusivo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha "Toda a Clínica" para que todos os profissionais vejam este serviço
                    </p>
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
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={novoTipo.preco}
                    onChange={(e) => setNovoTipo(prev => ({ ...prev, preco: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Descreva o serviço (opcional)"
                    value={novoTipo.descricao}
                    onChange={(e) => setNovoTipo(prev => ({ ...prev, descricao: e.target.value }))}
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
                    disabled={!novoTipo.nome.trim() || !novoTipo.preco || createMutation.isPending || (deveMostrarSelectProfissional && !novoTipo.profissionalId)}
                  >
                    {createMutation.isPending ? 'Criando...' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {tiposServicosFiltrados.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum tipo de serviço cadastrado ainda.
            </p>
          ) : (
            tiposServicosFiltrados.map((tipo) => {
              // Encontrar o nome do profissional se existir
              const profissionalDoTipo = tipo.profissional_id 
                ? profissionais.find(p => p.id === tipo.profissional_id)
                : null;
              
              return (
                <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{tipo.nome}</h4>
                      {podeEscolherProfissional && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tipo.profissional_id 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {tipo.profissional_id 
                            ? `👤 ${profissionalDoTipo?.nome || 'Profissional'}` 
                            : '🏥 Toda Clínica'}
                        </span>
                      )}
                    </div>
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
            );
          })
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
              <Label htmlFor="edit-preco">Preço (R$) *</Label>
              <Input
                id="edit-preco"
                type="number"
                step="0.01"
                min="0"
                value={editForm.preco}
                onChange={(e) => setEditForm(prev => ({ ...prev, preco: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Input
                id="edit-descricao"
                placeholder="Descreva o serviço (opcional)"
                value={editForm.descricao}
                onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
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
                disabled={!editForm.nome.trim() || !editForm.preco || updateMutation.isPending}
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