import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, User, Filter, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { useAgendamentos, useCreateAgendamento, useConfirmarAgendamento, useDesmarcarAgendamento, useMarcarRealizado, useMarcarFalta } from '@/hooks/useAgendamentos';
import { useTiposServicos } from '@/hooks/useTiposServicos';
import { usePacientes } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useBloqueiosAgenda, useDeleteBloqueio } from '@/hooks/useBloqueiosAgenda';
import { useHorariosAtendimento } from '@/hooks/useHorariosAtendimento';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { toDateTimeLocalString, fromDateTimeLocalString, formatTimeLocal, isSameDayLocal } from '@/lib/dateUtils';
import { VisaoSemanal } from '@/components/agenda/VisaoSemanal';
import { VisaoDiaria } from '@/components/agenda/VisaoDiaria';
import { VisaoSemanalGrid } from '@/components/agenda/VisaoSemanalGrid';
import { VisaoMensal } from '@/components/agenda/VisaoMensal';
import { EditarAgendamentoDialog } from '@/components/agenda/EditarAgendamentoDialog';
import { GoogleCalendarConnect } from '@/components/agenda/GoogleCalendarConnect';
import { BloqueioAgendaModal } from '@/components/agenda/BloqueioAgendaModal';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tables } from '@/integrations/supabase/types';
import { BloqueioAgenda } from '@/hooks/useBloqueiosAgenda';

type Agendamento = Tables<'agendamentos'>;

export default function Agenda() {
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: pacientes = [] } = usePacientes();
  const { data: profissionais = [] } = useProfissionais();
  const { data: bloqueios = [] } = useBloqueiosAgenda();
  const deleteBloqueio = useDeleteBloqueio();
  const createAgendamento = useCreateAgendamento();
  const confirmarAgendamento = useConfirmarAgendamento();
  const desmarcarAgendamento = useDesmarcarAgendamento();
  const marcarRealizado = useMarcarRealizado();
  const marcarFalta = useMarcarFalta();
  const { data: tiposServicos = [], isLoading: loadingTipos } = useTiposServicos();
  const { profissional: currentProfissional, isAdmin, isRecepcionista } = useAuth();
  const { getBloqueiosVirtuais, getBloqueiosVirtuaisSemana, hasHorariosConfigurados } = useHorariosAtendimento();

  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [useGridView, setUseGridView] = useState(true); // Nova opção para grade de horários
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isNewConsultaOpen, setIsNewConsultaOpen] = useState(false);
  const [dataHoraSelecionada, setDataHoraSelecionada] = useState<Date | undefined>(undefined);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);
  const [bloqueioParaEditar, setBloqueioParaEditar] = useState<BloqueioAgenda | null>(null);
  const [bloqueioParaExcluir, setBloqueioParaExcluir] = useState<BloqueioAgenda | null>(null);
  const [newConsulta, setNewConsulta] = useState({
    paciente_id: '',
    profissional_id: currentProfissional?.id || '',
    data_inicio: '',
    data_fim: '',
    tipo_servico: '',
    valor: '',
    observacoes: ''
  });

  // Atualizar profissional_id quando currentProfissional muda
  React.useEffect(() => {
    if (currentProfissional?.id) {
      setNewConsulta(prev => ({ 
        ...prev, 
        profissional_id: currentProfissional.id 
      }));
    }
  }, [currentProfissional]);

  const handleCreateConsulta = async () => {
    try {
      if (!newConsulta.paciente_id || !newConsulta.profissional_id || !newConsulta.data_inicio) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Auto-preencher valor se tipo de serviço tem preço definido e valor não foi informado
      let valor = newConsulta.valor ? parseFloat(newConsulta.valor) : null;
      if (!valor && newConsulta.tipo_servico) {
        const tipoServico = tiposServicos.find(tipo => tipo.nome === newConsulta.tipo_servico);
        if (tipoServico?.preco) {
          valor = tipoServico.preco;
        }
      }

      await createAgendamento.mutateAsync({
        paciente_id: newConsulta.paciente_id,
        profissional_id: newConsulta.profissional_id,
        data_inicio: fromDateTimeLocalString(newConsulta.data_inicio),
        data_fim: fromDateTimeLocalString(newConsulta.data_fim || newConsulta.data_inicio),
        tipo_servico: newConsulta.tipo_servico,
        valor: valor,
        observacoes: newConsulta.observacoes || null,
        status: 'pendente',
        confirmado_pelo_paciente: false,
        pagamento_id: null,
        desmarcada: false,
        google_event_id: null,
        origem: 'web',
        servicos_adicionais: [],
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
      
      toast.success('Agendamento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    }
  };

  const handleConfirmar = async (id: string) => {
    await confirmarAgendamento.mutateAsync(id);
  };

  const handleDesmarcar = async (id: string) => {
    await desmarcarAgendamento.mutateAsync(id);
  };

  const handleMarcarRealizado = async (id: string) => {
    await marcarRealizado.mutateAsync(id);
  };

  const handleMarcarFalta = async (id: string) => {
    await marcarFalta.mutateAsync(id);
  };

  const handleTipoServicoChange = (value: string) => {
    setNewConsulta(prev => ({ ...prev, tipo_servico: value }));
    
    // Auto-preencher valor quando tipo de serviço é selecionado
    const tipoServico = tiposServicos.find(tipo => tipo.nome === value);
    if (tipoServico?.preco) {
      setNewConsulta(prev => ({ ...prev, valor: tipoServico.preco!.toString() }));
    }
  };

  const handleEditarAgendamento = (agendamento: Agendamento) => {
    setAgendamentoParaEditar(agendamento);
  };

  const handleExcluirBloqueio = async (id: string) => {
    await deleteBloqueio.mutateAsync(id);
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
        isSameDayLocal(ag.data_inicio, selectedDate) && !ag.desmarcada
      ).length;
    } else if (viewMode === 'semana') {
      return getWeekAgendamentos().length;
    } else {
      return getMonthAgendamentos().length;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-primary/10 text-primary',
      realizado: 'bg-success/10 text-success',
      falta: 'bg-destructive/10 text-destructive'
    };
    return colors[status as keyof typeof colors] || colors.pendente;
  };

  const getStatusText = (status: string) => {
    const texts = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      realizado: 'Realizado',
      falta: 'Falta'
    };
    return texts[status as keyof typeof texts] || 'Pendente';
  };

  // Filtrar agendamentos por data selecionada e não desmarcados
  const todayAgendamentos = agendamentos.filter(ag => 
    isSameDayLocal(ag.data_inicio, selectedDate) && !ag.desmarcada
  );

  const getStartOfWeek = () => {
    const date = new Date(selectedDate);
    date.setDate(selectedDate.getDate() - selectedDate.getDay());
    return date;
  };

  const getWeekAgendamentos = () => {
    const startOfWeek = getStartOfWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return agendamentos.filter(ag => {
      const agendamentoDate = new Date(ag.data_inicio);
      // Verificar se o agendamento está dentro da semana usando comparação por dia
      for (let i = 0; i < 7; i++) {
        const dayToCheck = new Date(startOfWeek);
        dayToCheck.setDate(startOfWeek.getDate() + i);
        if (isSameDayLocal(ag.data_inicio, dayToCheck)) {
          return !ag.desmarcada;
        }
      }
      return false;
    });
  };

  const getMonthAgendamentos = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    return agendamentos.filter(ag => {
      const agendamentoDate = new Date(ag.data_inicio);
      const agendamentoYear = agendamentoDate.getFullYear();
      const agendamentoMonth = agendamentoDate.getMonth();
      
      return agendamentoYear === year && agendamentoMonth === month && !ag.desmarcada;
    });
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
          {/* Toggle para visualização com grade de horários - apenas para dia e semana */}
          {(viewMode === 'dia' || viewMode === 'semana') && (
            <Button 
              variant={useGridView ? "default" : "outline"} 
              onClick={() => setUseGridView(!useGridView)}
              size="sm"
            >
              {useGridView ? '📅 Grade de Horários' : '📋 Vista Clássica'}
            </Button>
          )}

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

          {!isRecepcionista && (
            <BloqueioAgendaModal defaultDate={selectedDate}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Bloquear Horário
              </Button>
            </BloqueioAgendaModal>
          )}

          <Dialog 
            open={isNewConsultaOpen} 
            onOpenChange={(open) => {
              setIsNewConsultaOpen(open);
              if (!open) setDataHoraSelecionada(undefined);
            }}
          >
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
              
              <AgendamentoForm 
                dataHoraInicial={dataHoraSelecionada}
                onSuccess={() => {
                  setIsNewConsultaOpen(false);
                  setDataHoraSelecionada(undefined);
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Google Calendar Integration - apenas para profissionais/admins */}
      {!isRecepcionista && <GoogleCalendarConnect />}

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

      {/* Conteúdo baseado na visualização */}
      {viewMode === 'dia' && (
        useGridView ? (
          <VisaoDiaria
            agendamentos={todayAgendamentos}
            bloqueios={bloqueios.filter(bloqueio => {
              const bloqueioDate = new Date(bloqueio.data_inicio);
              return isSameDayLocal(bloqueioDate, selectedDate);
            })}
            bloqueiosVirtuais={getBloqueiosVirtuais(selectedDate)}
            selectedDate={selectedDate}
            onEditarAgendamento={handleEditarAgendamento}
            onConfirmarAgendamento={handleConfirmar}
            onDesmarcarAgendamento={handleDesmarcar}
            onMarcarRealizadoAgendamento={handleMarcarRealizado}
            onMarcarFaltaAgendamento={handleMarcarFalta}
            onExcluirBloqueio={handleExcluirBloqueio}
            onNovaConsulta={(dataHora: Date) => {
              setDataHoraSelecionada(dataHora);
              setIsNewConsultaOpen(true);
            }}
          />
        ) : (
          <div className="space-y-4">
            {(() => {
              const agendamentosDia = todayAgendamentos;
              const bloqueiosDia = bloqueios.filter(bloqueio => {
                const bloqueioDate = new Date(bloqueio.data_inicio);
                return isSameDayLocal(bloqueioDate, selectedDate);
              });
              
              const hasItems = agendamentosDia.length > 0 || bloqueiosDia.length > 0;
              
              if (!hasItems) {
                return (
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
                );
              }
              
              const allItems = [
                ...bloqueiosDia.map(b => ({ ...b, type: 'bloqueio', data_inicio: b.data_inicio })),
                ...agendamentosDia.map(a => ({ ...a, type: 'agendamento' }))
              ].sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
              
              return allItems.map((item) => {
                if (item.type === 'bloqueio') {
                  const bloqueio = item as any; // Type assertion for bloqueio
                  return (
                    <Card key={`bloqueio-${bloqueio.id}`} className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Clock className="h-5 w-5 text-orange-600" />
                              <span className="font-semibold text-orange-800">
                                {formatTimeLocal(bloqueio.data_inicio)} - {formatTimeLocal(bloqueio.data_fim)}
                              </span>
                              <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-100">
                                Bloqueado
                              </Badge>
                            </div>
                            <div className="text-orange-700 font-medium ml-8">
                              {bloqueio.titulo}
                            </div>
                            {bloqueio.descricao && (
                              <div className="text-orange-600 text-sm ml-8 mt-1">
                                {bloqueio.descricao}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setBloqueioParaEditar(bloqueio)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setBloqueioParaExcluir(bloqueio)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else {
                  const agendamento = item as any;
                   return (
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
                             <>
                               <Button 
                                 size="sm"
                                 onClick={() => handleMarcarRealizado(agendamento.id)}
                               >
                                 Realizado
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="destructive"
                                 onClick={() => handleDesmarcar(agendamento.id)}
                               >
                                 Desmarcar
                               </Button>
                             </>
                           )}
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 );
               }
              });
            })()}
          </div>
        )
      )}

      {viewMode === 'semana' && (
        useGridView ? (
          <VisaoSemanalGrid
            agendamentos={getWeekAgendamentos()}
            bloqueios={bloqueios}
            bloqueiosVirtuais={getBloqueiosVirtuaisSemana(getStartOfWeek())}
            semanaInicio={getStartOfWeek()}
            onEditarAgendamento={handleEditarAgendamento}
            onConfirmarAgendamento={handleConfirmar}
            onDesmarcarAgendamento={handleDesmarcar}
            onMarcarRealizadoAgendamento={handleMarcarRealizado}
            onMarcarFaltaAgendamento={handleMarcarFalta}
            onExcluirBloqueio={handleExcluirBloqueio}
            onNovaConsulta={(dataHora: Date) => {
              setDataHoraSelecionada(dataHora);
              setIsNewConsultaOpen(true);
            }}
          />
        ) : (
          <VisaoSemanal
            agendamentos={getWeekAgendamentos()}
            bloqueios={bloqueios}
            semanaInicio={getStartOfWeek()}
            onEditarAgendamento={handleEditarAgendamento}
            onConfirmarAgendamento={handleConfirmar}
            onDesmarcarAgendamento={handleDesmarcar}
            onMarcarRealizado={handleMarcarRealizado}
            onMarcarFalta={handleMarcarFalta}
            onExcluirBloqueio={handleExcluirBloqueio}
          />
        )
      )}

      {viewMode === 'mes' && (
        <VisaoMensal
          agendamentos={getMonthAgendamentos()}
          bloqueios={bloqueios}
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

      {/* Modal para editar bloqueio */}
      {bloqueioParaEditar && (
        <BloqueioAgendaModal
          bloqueio={bloqueioParaEditar}
          isOpen={!!bloqueioParaEditar}
          onClose={() => setBloqueioParaEditar(null)}
        />
      )}

      {/* Dialog de confirmação para excluir bloqueio */}
      <AlertDialog 
        open={!!bloqueioParaExcluir} 
        onOpenChange={(open) => !open && setBloqueioParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Bloqueio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloqueio "{bloqueioParaExcluir?.titulo}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bloqueioParaExcluir) {
                  handleExcluirBloqueio(bloqueioParaExcluir.id);
                  setBloqueioParaExcluir(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
