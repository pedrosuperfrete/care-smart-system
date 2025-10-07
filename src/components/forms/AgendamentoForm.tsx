import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAgendamento, useUpdateAgendamento } from '@/hooks/useAgendamentos';
import { usePacientes } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useAuth } from '@/hooks/useAuth';
import { useTiposServicos } from '@/hooks/useTiposServicos';
import { Tables } from '@/integrations/supabase/types';

type Agendamento = Tables<'agendamentos'>;

interface AgendamentoFormProps {
  agendamento?: Agendamento;
  pacienteId?: string;
  onSuccess?: () => void;
}

export function AgendamentoForm({ agendamento, pacienteId, onSuccess }: AgendamentoFormProps) {
  const { profissional, user } = useAuth();
  const createMutation = useCreateAgendamento();
  const updateMutation = useUpdateAgendamento();
  const { data: pacientes = [] } = usePacientes();
  const { data: profissionais = [] } = useProfissionais();
  const { data: tiposServicos = [], isLoading: loadingTipos } = useTiposServicos();

  console.log('Tipos de serviços carregados:', tiposServicos, 'Loading:', loadingTipos);

  // Se o usuário é profissional, usar automaticamente seu ID. Se é recepcionista, mostrar lista
  const isProfissional = profissional && user;
  
  const [formData, setFormData] = useState({
    paciente_id: agendamento?.paciente_id || pacienteId || '',
    profissional_id: agendamento?.profissional_id || (isProfissional ? profissional?.id || '' : ''),
    data_inicio: agendamento?.data_inicio ? 
      new Date(agendamento.data_inicio).toISOString().slice(0, 16) : '',
    data_fim: agendamento?.data_fim ? 
      new Date(agendamento.data_fim).toISOString().slice(0, 16) : '',
    tipo_servico: agendamento?.tipo_servico || '',
    valor: agendamento?.valor?.toString() || '',
    observacoes: agendamento?.observacoes || '',
    status: agendamento?.status || 'pendente',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Dados do formulário:', formData);
    console.log('Profissional disponível:', profissional);
    console.log('Lista de profissionais:', profissionais);
    
    if (!formData.paciente_id || !formData.profissional_id || !formData.data_inicio) {
      console.error('Dados obrigatórios ausentes:', {
        paciente_id: formData.paciente_id,
        profissional_id: formData.profissional_id,
        data_inicio: formData.data_inicio
      });
      return;
    }

    // Calcular data_fim se não fornecida (1 hora após início)
    let dataFim = formData.data_fim;
    if (!dataFim && formData.data_inicio) {
      const inicio = new Date(formData.data_inicio);
      inicio.setHours(inicio.getHours() + 1);
      dataFim = inicio.toISOString();
    }

    const agendamentoData = {
      paciente_id: formData.paciente_id,
      profissional_id: formData.profissional_id,
      data_inicio: formData.data_inicio,
      data_fim: dataFim,
      tipo_servico: formData.tipo_servico,
      valor: formData.valor ? parseFloat(formData.valor) : null,
      observacoes: formData.observacoes || null,
      status: formData.status as any,
      confirmado_pelo_paciente: false,
      pagamento_id: null,
      desmarcada: false,
      google_event_id: null,
      origem: 'web',
    };

    try {
      if (agendamento?.id) {
        await updateMutation.mutateAsync({ 
          id: agendamento.id, 
          data: agendamentoData 
        });
      } else {
        await createMutation.mutateAsync(agendamentoData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-preencher valor quando tipo de serviço é selecionado
    if (field === 'tipo_servico') {
      const tipoServico = tiposServicos.find(tipo => tipo.nome === value);
      if (tipoServico?.preco) {
        setFormData(prev => ({ ...prev, valor: tipoServico.preco!.toString() }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paciente">Paciente *</Label>
          <Select 
            value={formData.paciente_id} 
            onValueChange={(value) => handleChange('paciente_id', value)}
            disabled={!!pacienteId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientes.map((paciente) => (
                <SelectItem key={paciente.id} value={paciente.id}>
                  {paciente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profissional">Profissional *</Label>
          {isProfissional ? (
            <Input
              value={profissional?.nome || 'Profissional não encontrado'}
              disabled
              className="bg-muted"
            />
          ) : (
            <Select 
              value={formData.profissional_id} 
              onValueChange={(value) => handleChange('profissional_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {profissionais.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Nenhum profissional encontrado</div>
                ) : (
                  profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.especialidade}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data e Hora de Início *</Label>
          <Input
            id="data_inicio"
            type="datetime-local"
            value={formData.data_inicio}
            onChange={(e) => handleChange('data_inicio', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fim">Data e Hora de Fim</Label>
          <Input
            id="data_fim"
            type="datetime-local"
            value={formData.data_fim}
            onChange={(e) => handleChange('data_fim', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
          <Select 
            value={formData.tipo_servico} 
            onValueChange={(value) => handleChange('tipo_servico', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {loadingTipos ? (
                <div className="p-2 text-sm text-muted-foreground">Carregando tipos de serviço...</div>
              ) : tiposServicos.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">Nenhum tipo de serviço cadastrado</div>
              ) : (
                tiposServicos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.nome}>
                    {tipo.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.valor}
            onChange={(e) => handleChange('valor', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Observações sobre o agendamento..."
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 
           agendamento ? 'Atualizar' : 'Criar Agendamento'}
        </Button>
      </div>
    </form>
  );
}
