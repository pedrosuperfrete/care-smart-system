import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, User, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgendamentos, useCreateAgendamento, useConfirmarAgendamento, useDesmarcarAgendamento } from '@/hooks/useAgendamentos';
import { usePacientes } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { toDateTimeLocalString, fromDateTimeLocalString, formatTimeLocal, isSameDayLocal } from '@/lib/dateUtils';
import { VisaoSemanal } from '@/components/agenda/VisaoSemanal';
import { VisaoMensal } from '@/components/agenda/VisaoMensal';
import { EditarAgendamentoDialog } from '@/components/agenda/EditarAgendamentoDialog';
import { GoogleCalendarConnect } from '@/components/agenda/GoogleCalendarConnect';
import { Tables } from '@/integrations/supabase/types';

type Agendamento = Tables<'agendamentos'>;

export default function Agenda() {
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: pacientes = [] } = usePacientes();
  const { data: profissionais = [] } = useProfissionais();
  const createAgendamento = useCreateAgendamento();
  const confirmarAgendamento = useConfirmarAgendamento();
  const desmarcarAgendamento = useDesmarcarAgendamento();
  const { profissional: currentProfissional, isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isNewConsultaOpen, setIsNewConsultaOpen] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);
  const [newConsulta, setNewConsulta] = useState({
    paciente_id: '',
    profissional_id: currentProfissional?.id || '',
    data_inicio: '',
    data_fim: '',
    tipo_servico: '',
    valor: '',
    observacoes: ''
  });

  const handleCreateConsulta = async () => {
    try {
      if (!newConsulta.paciente_id || !newConsulta.profissional_id || !newConsulta.data_inicio) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      await createAgendamento.mutateAsync({
        paciente_id: newConsulta.paciente_id,
        profissional_id: newConsulta.profissional_id,
        data_inicio: fromDateTimeLocalString(newConsulta.data_inicio),
        data_fim: fromDateTimeLocalString(newConsulta.data_fim),
        tipo_servico: newConsulta.tipo_servico,
        valor: newConsulta.valor ? parseFloat(newConsulta.valor) : null,
        observacoes: newConsulta.observacoes || null,
        status: 'pendente',
        confirmado_pelo_paciente: false,
        pagamento_id: null,
        desmarcada: false,
        google_event_id: null,
        origem: 'web',
      });

      setIsNewConsultaOpen(false);
      setNewConsulta({
        paciente_id: '',
        profissional_id: currentProfissional?.id || '',
        data_inicio: '',
        data_fim: '',
        tipo_servico: '',
        valor: '',
        observacoes: ''
      });
    } catch (error) {
      toast.error('Erro ao criar agendamento');
    }
  };

  const handleConfirmar = async (id: string) => {
    await confirmarAgendamento.mutateAsync(id);
  };

  const handleDesmarcar = async (id: string) => {
    await desmarcarAgendamento.mutateAsync(id);
  };

  const handleEditarAgendamento = (agendamento: Agendamento) => {
    setAgendamentoParaEditar(agendamento);
  };

  const navegarData = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'dia') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'semana') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'mes') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const getDateRangeText = () => {
    if (viewMode === 'dia') {
      return selectedDate.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'semana') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  const getAgendamentosCount = () => {
    if (viewMode === 'dia') {
      return agendamentos.filter(ag => 
        isSameDayLocal(ag.data_inicio, selectedDate)
      ).length;
    } else if (viewMode === 'semana') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return agendamentos.filter(ag => {
        const agendamentoDate = new Date(ag.data_inicio);
        // Comparar considerando apenas a data, sem o horário
        return agendamentoDate >= startOfWeek && agendamentoDate <= endOfWeek;
      }).length;
    } else {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      return agendamentos.filter(ag => {
        const agendamentoDate = new Date(ag.data_inicio);
        // Comparar considerando apenas a data, sem o horário
        return agendamentoDate >= startOfMonth && agendamentoDate <= endOfMonth;
      }).length;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-primary/10 text-primary',
      realizado: 'bg-success/10 text-success',
      faltou: 'bg-destructive/10 text-destructive'
    };
    return colors[status as keyof typeof colors] || colors.pendente;
  };

  const getStatusText = (status: string) => {
    const texts = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      realizado: 'Realizado',
      faltou: 'Faltou'
    };
    return texts[status as keyof typeof texts] || 'Pendente';
  };

  const todayAgendamentos = agendamentos.filter(ag => 
    isSameDayLocal(ag.data_inicio, selectedDate)
  );

  const getStartOfWeek = () => {
    const date = new Date(selectedDate);
    date.setDate(selectedDate.getDate() - selectedDate.getDay());
    return date;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os agendamentos da clínica
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Dia</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Profissionais
            </Button>
          )}

          <Dialog open={isNewConsultaOpen} onOpenChange={setIsNewConsultaOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Consulta</DialogTitle>
                <DialogDescription>
                  Agende uma nova consulta para o paciente
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select value={newConsulta.paciente_id} onValueChange={(value) => 
                      setNewConsulta(prev => ({ ...prev, paciente_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacientes.map(paciente => (
                          <SelectItem key={paciente.id} value={paciente.id}>
                            {paciente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Profissional *</Label>
                    <Select value={newConsulta.profissional_id} onValueChange={(value) => 
                      setNewConsulta(prev => ({ ...prev, profissional_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
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
                    <Label>Data e Hora Início *</Label>
                    <Input
                      type="datetime-local"
                      value={newConsulta.data_inicio}
                      onChange={(e) => setNewConsulta(prev => ({ 
                        ...prev, 
                        data_inicio: e.target.value,
                        data_fim: e.target.value ? toDateTimeLocalString(new Date(new Date(e.target.value).getTime() + 60*60*1000)) : ''
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data e Hora Fim *</Label>
                    <Input
                      type="datetime-local"
                      value={newConsulta.data_fim}
                      onChange={(e) => setNewConsulta(prev => ({ ...prev, data_fim: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Serviço *</Label>
                    <Select value={newConsulta.tipo_servico} onValueChange={(value) => 
                      setNewConsulta(prev => ({ ...prev, tipo_servico: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
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
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newConsulta.valor}
                      onChange={(e) => setNewConsulta(prev => ({ ...prev, valor: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    placeholder="Observações sobre a consulta..."
                    value={newConsulta.observacoes}
                    onChange={(e) => setNewConsulta(prev => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewConsultaOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateConsulta} disabled={createAgendamento.isPending}>
                    {createAgendamento.isPending ? 'Salvando...' : 'Agendar Consulta'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navegação de Data */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navegarData('prev')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {getDateRangeText()}
              </h2>
              <p className="text-gray-600">
                {getAgendamentosCount()} consulta(s) agendada(s)
              </p>
            </div>
            
            <Button variant="outline" onClick={() => navegarData('next')}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <GoogleCalendarConnect />

      {/* Conteúdo baseado na visualização */}
      {viewMode === 'dia' && (
        <div className="space-y-4">
          {todayAgendamentos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma consulta agendada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Não há consultas agendadas para esta data.
                  </p>
                  <Button onClick={() => setIsNewConsultaOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agendar Nova Consulta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            todayAgendamentos
              .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
              .map((agendamento) => (
                <Card key={agendamento.id} className={`hover:shadow-md transition-shadow ${agendamento.desmarcada ? 'opacity-50' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <span className={`font-semibold ${agendamento.desmarcada ? 'line-through' : ''}`}>
                            {formatTimeLocal(agendamento.data_inicio)} - {formatTimeLocal(agendamento.data_fim)}
                          </span>
                          <Badge className={agendamento.desmarcada ? 'bg-gray-100 text-gray-600' : getStatusColor(agendamento.status || 'pendente')}>
                            {agendamento.desmarcada ? 'Desmarcada' : getStatusText(agendamento.status || 'pendente')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-3 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className={`font-medium ${agendamento.desmarcada ? 'line-through' : ''}`}>
                            {(agendamento as any).pacientes?.nome}
                          </span>
                        </div>
                        
                        <div className={`text-sm text-gray-600 space-y-1 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                          <p><strong>Tipo:</strong> {agendamento.tipo_servico}</p>
                          <p><strong>Profissional:</strong> {(agendamento as any).profissionais?.nome}</p>
                          {agendamento.valor && (
                            <p><strong>Valor:</strong> R$ {agendamento.valor.toFixed(2)}</p>
                          )}
                          {agendamento.observacoes && (
                            <p><strong>Obs:</strong> {agendamento.observacoes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!agendamento.desmarcada && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditarAgendamento(agendamento)}
                          >
                            Editar
                          </Button>
                        )}
                        {!agendamento.desmarcada && agendamento.status === 'pendente' && (
                          <Button 
                            size="sm"
                            onClick={() => handleConfirmar(agendamento.id)}
                          >
                            Confirmar
                          </Button>
                        )}
                        {!agendamento.desmarcada && agendamento.status === 'confirmado' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDesmarcar(agendamento.id)}
                          >
                            Desmarcar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}

      {viewMode === 'semana' && (
        <VisaoSemanal
          agendamentos={agendamentos}
          semanaInicio={getStartOfWeek()}
          onEditarAgendamento={handleEditarAgendamento}
          onConfirmarAgendamento={handleConfirmar}
          onDesmarcarAgendamento={handleDesmarcar}
        />
      )}

      {viewMode === 'mes' && (
        <VisaoMensal
          agendamentos={agendamentos}
          mesAno={selectedDate}
          onDiaClick={(data) => {
            setSelectedDate(data);
            setViewMode('dia');
          }}
        />
      )}

      {/* Dialog para editar agendamento */}
      {agendamentoParaEditar && (
        <EditarAgendamentoDialog
          agendamento={agendamentoParaEditar}
          isOpen={!!agendamentoParaEditar}
          onClose={() => setAgendamentoParaEditar(null)}
        />
      )}
    </div>
  );
}
