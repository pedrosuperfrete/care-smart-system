
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useUpdateAgendamento } from '@/hooks/useAgendamentos';
import { useTiposServicos } from '@/hooks/useTiposServicos';
import { toast } from 'sonner';
import { toDateTimeLocalString, fromDateTimeLocalString } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

type Agendamento = Tables<'agendamentos'>;

interface ServicoAdicional {
  nome: string;
  valor: number;
}

interface EditarAgendamentoDialogProps {
  agendamento: Agendamento | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditarAgendamentoDialog({ 
  agendamento, 
  isOpen, 
  onClose
}: EditarAgendamentoDialogProps) {
  const { data: profissionais = [] } = useProfissionais();
  const { data: tiposServicos = [] } = useTiposServicos();
  const updateMutation = useUpdateAgendamento();
  const [formData, setFormData] = useState({
    data_inicio: '',
    data_fim: '',
    tipo_servico: '',
    profissional_id: '',
    valor: '',
    observacoes: ''
  });
  const [servicosAdicionais, setServicosAdicionais] = useState<ServicoAdicional[]>([]);

  useEffect(() => {
    if (agendamento) {
      setFormData({
        data_inicio: toDateTimeLocalString(agendamento.data_inicio),
        data_fim: toDateTimeLocalString(agendamento.data_fim),
        tipo_servico: agendamento.tipo_servico,
        profissional_id: agendamento.profissional_id,
        valor: agendamento.valor?.toString() || '',
        observacoes: agendamento.observacoes || ''
      });
      
      // Carregar serviços adicionais do agendamento
      const servicosExistentes = agendamento.servicos_adicionais as unknown as ServicoAdicional[] | null;
      setServicosAdicionais(Array.isArray(servicosExistentes) ? servicosExistentes : []);
    }
  }, [agendamento]);

  const handleSave = async () => {
    if (!agendamento) return;
    
    try {
      const updateData = {
        data_inicio: fromDateTimeLocalString(formData.data_inicio),
        data_fim: fromDateTimeLocalString(formData.data_fim),
        tipo_servico: formData.tipo_servico,
        profissional_id: formData.profissional_id,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        observacoes: formData.observacoes || null,
        servicos_adicionais: servicosAdicionais as unknown as any
      };
      
      await updateMutation.mutateAsync({ 
        id: agendamento.id, 
        data: updateData 
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  };

  const handleTipoServicoChange = (tipoServicoNome: string) => {
    setFormData(prev => ({ ...prev, tipo_servico: tipoServicoNome }));
    
    // Auto-preencher valor quando tipo de serviço é selecionado
    const tipoServico = tiposServicos.find(tipo => tipo.nome === tipoServicoNome);
    if (tipoServico?.preco) {
      setFormData(prev => ({ ...prev, valor: tipoServico.preco!.toString() }));
    }
  };

  const handleAddServicoAdicional = () => {
    setServicosAdicionais(prev => [...prev, { nome: '', valor: 0 }]);
  };

  const handleRemoveServicoAdicional = (index: number) => {
    setServicosAdicionais(prev => prev.filter((_, i) => i !== index));
  };

  const handleServicoAdicionalChange = (index: number, field: 'nome' | 'valor', value: string) => {
    setServicosAdicionais(prev => {
      const updated = [...prev];
      if (field === 'nome') {
        updated[index].nome = value;
        // Auto-preencher valor do serviço adicional
        const tipoServico = tiposServicos.find(tipo => tipo.nome === value);
        if (tipoServico?.preco) {
          updated[index].valor = tipoServico.preco;
        }
      } else {
        updated[index].valor = parseFloat(value) || 0;
      }
      return updated;
    });
  };

  const calcularValorTotal = () => {
    const valorPrincipal = parseFloat(formData.valor) || 0;
    const valorAdicionais = servicosAdicionais.reduce((sum, s) => sum + (s.valor || 0), 0);
    return valorPrincipal + valorAdicionais;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Altere as informações da consulta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data e Hora Início *</Label>
              <Input
                type="datetime-local"
                value={formData.data_inicio}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  data_inicio: e.target.value,
                  data_fim: e.target.value ? toDateTimeLocalString(new Date(new Date(e.target.value).getTime() + 60*60*1000)) : prev.data_fim
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data e Hora Fim *</Label>
              <Input
                type="datetime-local"
                value={formData.data_fim}
                onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Serviço Principal *</Label>
              <Select value={formData.tipo_servico} onValueChange={handleTipoServicoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposServicos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.nome}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Profissional *</Label>
              <Select value={formData.profissional_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, profissional_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor do Serviço Principal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              />
            </div>
          </div>

          {/* Serviços Adicionais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Serviços Adicionais</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddServicoAdicional}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Serviço
              </Button>
            </div>

            {servicosAdicionais.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                {servicosAdicionais.map((servico, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={servico.nome}
                      onValueChange={(value) => handleServicoAdicionalChange(index, 'nome', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposServicos.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.nome}>
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={servico.valor || ''}
                      onChange={(e) => handleServicoAdicionalChange(index, 'valor', e.target.value)}
                      className="w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveServicoAdicional(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {servicosAdicionais.length > 0 && (
              <div className="text-right text-sm font-medium">
                Valor Total: <span className="text-primary">R$ {formatCurrency(calcularValorTotal())}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input
              placeholder="Observações sobre a consulta..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
