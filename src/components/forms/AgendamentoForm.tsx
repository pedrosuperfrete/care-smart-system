import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateAgendamento, useUpdateAgendamento } from '@/hooks/useAgendamentos';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useAuth } from '@/hooks/useAuth';
import { useTiposServicos, useCreateTipoServico } from '@/hooks/useTiposServicos';
import { Tables } from '@/integrations/supabase/types';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { EnhancedDateTimePicker } from '@/components/ui/enhanced-datetime-picker';
import { toLocalDateString } from '@/lib/dateUtils';
import { useQueryClient } from '@tanstack/react-query';

type Agendamento = Tables<'agendamentos'>;

const novoPacienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  data_nascimento: z.date().optional(),
});

type NovoPacienteFormData = z.infer<typeof novoPacienteSchema>;

const novoTipoServicoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  preco: z.string().optional(),
});

type NovoTipoServicoFormData = z.infer<typeof novoTipoServicoSchema>;

interface AgendamentoFormProps {
  agendamento?: Agendamento;
  pacienteId?: string;
  dataHoraInicial?: Date;
  onSuccess?: () => void;
}

export function AgendamentoForm({ agendamento, pacienteId, dataHoraInicial, onSuccess }: AgendamentoFormProps) {
  const { profissional, user, clinicaAtual } = useAuth();
  const queryClient = useQueryClient();
  const createMutation = useCreateAgendamento();
  const updateMutation = useUpdateAgendamento();
  const { data: pacientes = [] } = usePacientes();
  const { data: profissionais = [] } = useProfissionais();
  const { data: tiposServicos = [], isLoading: loadingTipos } = useTiposServicos();
  const createPaciente = useCreatePaciente();
  const createTipoServico = useCreateTipoServico();

  const [showNovoPacienteDialog, setShowNovoPacienteDialog] = useState(false);
  const [isCreatingPaciente, setIsCreatingPaciente] = useState(false);
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [showNovoTipoServicoDialog, setShowNovoTipoServicoDialog] = useState(false);
  const [isCreatingTipoServico, setIsCreatingTipoServico] = useState(false);

  const novoPacienteForm = useForm<NovoPacienteFormData>({
    resolver: zodResolver(novoPacienteSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
    },
  });

  const novoTipoServicoForm = useForm<NovoTipoServicoFormData>({
    resolver: zodResolver(novoTipoServicoSchema),
    defaultValues: {
      nome: '',
      preco: '',
    },
  });

  console.log('Tipos de serviços carregados:', tiposServicos, 'Loading:', loadingTipos);

  // Se o usuário é profissional, usar automaticamente seu ID. Se é recepcionista, mostrar lista
  const isProfissional = profissional && user;
  
  const getDataInicioDefault = () => {
    if (agendamento?.data_inicio) {
      return new Date(agendamento.data_inicio).toISOString().slice(0, 16);
    }
    if (dataHoraInicial) {
      return dataHoraInicial.toISOString().slice(0, 16);
    }
    return '';
  };

  const getDataFimDefault = () => {
    if (agendamento?.data_fim) {
      return new Date(agendamento.data_fim).toISOString().slice(0, 16);
    }
    if (dataHoraInicial) {
      const dataFim = new Date(dataHoraInicial);
      dataFim.setHours(dataFim.getHours() + 1);
      return dataFim.toISOString().slice(0, 16);
    }
    return '';
  };

  const [formData, setFormData] = useState({
    paciente_id: agendamento?.paciente_id || pacienteId || '',
    profissional_id: agendamento?.profissional_id || (isProfissional ? profissional?.id || '' : ''),
    data_inicio: getDataInicioDefault(),
    data_fim: getDataFimDefault(),
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
    
    // Auto-preencher hora fim (1 hora depois) quando hora início é alterada
    if (field === 'data_inicio' && value) {
      const dataInicio = new Date(value);
      const dataFim = new Date(dataInicio);
      dataFim.setHours(dataFim.getHours() + 1);
      
      const year = dataFim.getFullYear();
      const month = String(dataFim.getMonth() + 1).padStart(2, '0');
      const day = String(dataFim.getDate()).padStart(2, '0');
      const hour = String(dataFim.getHours()).padStart(2, '0');
      const minute = String(dataFim.getMinutes()).padStart(2, '0');
      const dataHoraFim = `${year}-${month}-${day}T${hour}:${minute}`;
      
      setFormData(prev => ({ ...prev, data_fim: dataHoraFim }));
    }
  };

  const handleCreatePaciente = async (data: NovoPacienteFormData) => {
    if (!clinicaAtual) return;

    setIsCreatingPaciente(true);
    try {
      const pacienteData = {
        nome: data.nome,
        cpf: data.cpf,
        clinica_id: clinicaAtual,
        email: data.email || null,
        telefone: data.telefone || null,
        data_nascimento: data.data_nascimento ? toLocalDateString(data.data_nascimento) : null,
        endereco: null,
        observacoes: null,
        origem: null,
        modalidade_atendimento: null,
        tipo_paciente: 'novo' as const,
        ativo: true,
        inadimplente: false,
        verificarLimite: true,
      };

      const novoPaciente = await createPaciente.mutateAsync(pacienteData);
      
      // Aguarda a query de pacientes ser atualizada
      await queryClient.refetchQueries({ queryKey: ['pacientes'] });
      
      // Seleciona o paciente recém-criado
      setFormData(prev => ({ ...prev, paciente_id: novoPaciente.id }));
      
      // Fecha o dialog e limpa o formulário
      setShowNovoPacienteDialog(false);
      novoPacienteForm.reset();
      setTelefoneFormatado('');
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error);
      // Não fecha o dialog para permitir que o usuário tente novamente ou cancele
    } finally {
      setIsCreatingPaciente(false);
    }
  };

  const handleCreateTipoServico = async (data: NovoTipoServicoFormData) => {
    if (!clinicaAtual) return;

    setIsCreatingTipoServico(true);
    try {
      const tipoServicoData = {
        nome: data.nome,
        preco: data.preco ? parseFloat(data.preco) : undefined,
        clinica_id: clinicaAtual,
        profissional_id: profissional?.id,
      };

      const novoTipoServico = await createTipoServico.mutateAsync(tipoServicoData);
      
      // Aguarda a query de tipos de serviço ser atualizada
      await queryClient.refetchQueries({ queryKey: ['tipos-servicos'] });
      
      // Seleciona o tipo de serviço recém-criado
      setFormData(prev => ({ 
        ...prev, 
        tipo_servico: novoTipoServico.nome,
        valor: novoTipoServico.preco?.toString() || ''
      }));
      
      // Fecha o dialog e limpa o formulário
      setShowNovoTipoServicoDialog(false);
      novoTipoServicoForm.reset();
    } catch (error: any) {
      console.error('Erro ao criar tipo de serviço:', error);
    } finally {
      setIsCreatingTipoServico(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paciente">Paciente *</Label>
          <Select 
            value={formData.paciente_id} 
            onValueChange={(value) => {
              if (value === 'novo-paciente') {
                setShowNovoPacienteDialog(true);
              } else {
                handleChange('paciente_id', value);
              }
            }}
            disabled={!!pacienteId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo-paciente" className="font-medium text-primary">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar novo paciente
                </div>
              </SelectItem>
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
          <Label htmlFor="data_inicio">Data e Hora Início *</Label>
          <EnhancedDateTimePicker
            value={formData.data_inicio}
            onChange={(value) => handleChange('data_inicio', value)}
            placeholder="dd/mm/aaaa --:--"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fim">Data e Hora Fim *</Label>
          <EnhancedDateTimePicker
            value={formData.data_fim}
            onChange={(value) => handleChange('data_fim', value)}
            placeholder="dd/mm/aaaa --:--"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
          <Select 
            value={formData.tipo_servico} 
            onValueChange={(value) => {
              if (value === 'novo-tipo-servico') {
                setShowNovoTipoServicoDialog(true);
              } else {
                handleChange('tipo_servico', value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo-tipo-servico" className="font-medium text-primary">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar novo tipo de serviço
                </div>
              </SelectItem>
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

      {/* Dialog para criar novo paciente */}
      <Dialog open={showNovoPacienteDialog} onOpenChange={setShowNovoPacienteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={novoPacienteForm.handleSubmit(handleCreatePaciente)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-nome">Nome *</Label>
                <Input
                  id="novo-nome"
                  {...novoPacienteForm.register('nome')}
                  placeholder="Nome completo"
                />
                {novoPacienteForm.formState.errors.nome && (
                  <p className="text-sm text-destructive">
                    {novoPacienteForm.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="novo-cpf">CPF *</Label>
                <Input
                  id="novo-cpf"
                  {...novoPacienteForm.register('cpf')}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/\D/g, '');
                    const limited = numbers.slice(0, 11);
                    const formatted = limited
                      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      .replace(/(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
                      .replace(/(\d{3})(\d{3})(\d{2})/, '$1.$2.$3')
                      .replace(/(\d{3})(\d{2})/, '$1.$2');
                    novoPacienteForm.setValue('cpf', numbers);
                    e.target.value = formatted;
                  }}
                />
                {novoPacienteForm.formState.errors.cpf && (
                  <p className="text-sm text-destructive">
                    {novoPacienteForm.formState.errors.cpf.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="novo-telefone">Telefone</Label>
                <Input
                  id="novo-telefone"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  value={telefoneFormatado}
                  onChange={(e) => {
                    const input = e.target.value;
                    const numbers = input.replace(/\D/g, '').slice(0, 11);
                    
                    // Aplica a máscara enquanto digita
                    let formatted = '';
                    if (numbers.length > 0) {
                      formatted = '(' + numbers.substring(0, 2);
                      if (numbers.length >= 3) {
                        formatted += ') ' + numbers.substring(2, 7);
                      }
                      if (numbers.length >= 8) {
                        formatted += '-' + numbers.substring(7, 11);
                      }
                    }
                    
                    setTelefoneFormatado(formatted);
                    novoPacienteForm.setValue('telefone', numbers);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novo-email">Email</Label>
                <Input
                  id="novo-email"
                  type="email"
                  {...novoPacienteForm.register('email')}
                  placeholder="email@exemplo.com"
                />
                {novoPacienteForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {novoPacienteForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <EnhancedDatePicker
                  date={novoPacienteForm.watch('data_nascimento')}
                  onDateChange={(date) => novoPacienteForm.setValue('data_nascimento', date)}
                  placeholder="Selecione a data"
                  disabled={(date) => date > new Date()}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNovoPacienteDialog(false);
                  novoPacienteForm.reset();
                  setTelefoneFormatado('');
                }}
                disabled={isCreatingPaciente}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingPaciente}>
                {isCreatingPaciente ? 'Criando...' : 'Criar Paciente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar novo tipo de serviço */}
      <Dialog open={showNovoTipoServicoDialog} onOpenChange={setShowNovoTipoServicoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Tipo de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={novoTipoServicoForm.handleSubmit(handleCreateTipoServico)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novo-tipo-nome">Nome *</Label>
              <Input
                id="novo-tipo-nome"
                {...novoTipoServicoForm.register('nome')}
                placeholder="Ex: Consulta, Terapia de Casal..."
              />
              {novoTipoServicoForm.formState.errors.nome && (
                <p className="text-sm text-destructive">
                  {novoTipoServicoForm.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-tipo-preco">Preço (R$)</Label>
              <Input
                id="novo-tipo-preco"
                type="number"
                step="0.01"
                {...novoTipoServicoForm.register('preco')}
                placeholder="0,00"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNovoTipoServicoDialog(false);
                  novoTipoServicoForm.reset();
                }}
                disabled={isCreatingTipoServico}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingTipoServico}>
                {isCreatingTipoServico ? 'Criando...' : 'Criar Tipo de Serviço'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
