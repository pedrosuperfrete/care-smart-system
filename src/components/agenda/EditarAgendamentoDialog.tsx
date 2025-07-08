
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useUpdateAgendamento } from '@/hooks/useAgendamentos';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';

type Agendamento = Tables<'agendamentos'>;

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
  const updateMutation = useUpdateAgendamento();
  const { syncToGoogle, isConnected } = useGoogleCalendar();
  const [formData, setFormData] = useState({
    data_inicio: '',
    data_fim: '',
    tipo_servico: '',
    profissional_id: '',
    valor: '',
    observacoes: ''
  });

  useEffect(() => {
    if (agendamento) {
      setFormData({
        data_inicio: new Date(agendamento.data_inicio).toISOString().slice(0, 16),
        data_fim: new Date(agendamento.data_fim).toISOString().slice(0, 16),
        tipo_servico: agendamento.tipo_servico,
        profissional_id: agendamento.profissional_id,
        valor: agendamento.valor?.toString() || '',
        observacoes: agendamento.observacoes || ''
      });
    }
  }, [agendamento]);

  const handleSave = async () => {
    if (!agendamento) return;
    
    try {
      const updateData = {
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        tipo_servico: formData.tipo_servico,
        profissional_id: formData.profissional_id,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        observacoes: formData.observacoes || null
      };
      
      const updatedAgendamento = await updateMutation.mutateAsync({ 
        id: agendamento.id, 
        data: updateData 
      });

      // Sincronizar com Google Calendar se conectado e houver google_event_id
      if (isConnected && agendamento.google_event_id) {
        console.log('Sincronizando agendamento editado com Google Calendar:', {
          agendamentoId: agendamento.id,
          googleEventId: agendamento.google_event_id
        });
        
        const agendamentoParaSync = {
          ...updatedAgendamento,
          google_event_id: agendamento.google_event_id
        };
        
        await syncToGoogle(agendamentoParaSync);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
                  data_fim: e.target.value ? new Date(new Date(e.target.value).getTime() + 60*60*1000).toISOString().slice(0, 16) : prev.data_fim
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
              <Label>Tipo de Serviço *</Label>
              <Select value={formData.tipo_servico} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, tipo_servico: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consulta de Rotina">Consulta de Rotina</SelectItem>
                  <SelectItem value="Retorno">Retorno</SelectItem>
                  <SelectItem value="Exame">Exame</SelectItem>
                  <SelectItem value="Emergência">Emergência</SelectItem>
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
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              />
            </div>
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
