import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, CheckCircle, XCircle, Clock, User, Plus } from "lucide-react";
import { formatTimeLocal } from "@/lib/dateUtils";
import { BloqueioAgendaModal } from "./BloqueioAgendaModal";
import { BloqueioAgenda } from "@/hooks/useBloqueiosAgenda";

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  pacientes?: { nome: string };
  profissionais?: { nome: string };
  tipo_servico: string;
  valor?: number;
  observacoes?: string;
  status?: string;
  desmarcada?: boolean;
}

interface VisaoSemanalGridProps {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  semanaInicio: Date;
  onEditarAgendamento: (agendamento: Agendamento) => void;
  onConfirmarAgendamento: (id: string) => void;
  onDesmarcarAgendamento: (id: string) => void;
  onMarcarRealizadoAgendamento: (id: string) => void;
  onExcluirBloqueio: (id: string) => void;
  onNovaConsulta: (dataHora: Date) => void;
}

export function VisaoSemanalGrid({
  agendamentos,
  bloqueios,
  semanaInicio,
  onEditarAgendamento,
  onConfirmarAgendamento,
  onDesmarcarAgendamento,
  onMarcarRealizadoAgendamento,
  onExcluirBloqueio,
  onNovaConsulta
}: VisaoSemanalGridProps) {
  const [bloqueioParaEditar, setBloqueioParaEditar] = useState<BloqueioAgenda | null>(null);
  const [bloqueioParaExcluir, setBloqueioParaExcluir] = useState<BloqueioAgenda | null>(null);

  // Gerar dias da semana
  const getDiasSemanaDatas = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(semanaInicio);
      dia.setDate(semanaInicio.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  // Gerar slots de tempo
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const diasSemana = getDiasSemanaDatas();
  const diasSemanaLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-primary text-primary-foreground';
      case 'pendente': return 'bg-warning text-warning-foreground';
      case 'realizado': return 'bg-success text-success-foreground';
      default: return 'bg-destructive text-destructive-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'pendente': return 'Pendente';
      case 'realizado': return 'Realizado';
      default: return 'Cancelado';
    }
  };

  const isSlotOccupied = (time: string, dia: Date) => {
    const slotTime = new Date(dia);
    const [hours, minutes] = time.split(':').map(Number);
    slotTime.setHours(hours, minutes, 0, 0);

    // Verificar agendamentos - renderizar apenas no horário de início
    const agendamento = agendamentos.find(ag => {
      const inicio = new Date(ag.data_inicio);
      return slotTime.getTime() === inicio.getTime() && !ag.desmarcada;
    });

    // Verificar bloqueios - renderizar apenas no horário de início
    const bloqueio = bloqueios.find(bl => {
      const inicio = new Date(bl.data_inicio);
      return slotTime.getTime() === inicio.getTime();
    });

    // Verificar se o slot está dentro de um agendamento ou bloqueio (para desabilitar clique)
    const dentroDeBloqueio = bloqueios.some(bl => {
      const inicio = new Date(bl.data_inicio);
      const fim = new Date(bl.data_fim);
      return slotTime >= inicio && slotTime < fim;
    });

    const dentroDeAgendamento = agendamentos.some(ag => {
      const inicio = new Date(ag.data_inicio);
      const fim = new Date(ag.data_fim);
      return slotTime >= inicio && slotTime < fim && !ag.desmarcada;
    });

    return { agendamento, bloqueio, isOccupied: dentroDeBloqueio || dentroDeAgendamento };
  };

  const calcularSlots = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return Math.ceil(diffMinutes / 30); // Cada slot tem 30 minutos
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Cabeçalho com dias da semana */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="w-16 text-xs font-medium text-gray-500"></div>
          {diasSemana.map((dia, index) => (
            <div key={index} className="text-center p-2 border rounded">
              <div className="text-xs font-medium text-gray-600">
                {diasSemanaLabels[index]}
              </div>
              <div className="text-sm font-semibold">
                {dia.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grade de horários */}
        <div className="space-y-1">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-1 min-h-[40px]">
              {/* Coluna do horário */}
              <div className="w-16 text-xs text-gray-500 font-medium py-2">
                {time}
              </div>
              
              {/* Colunas dos dias */}
              {diasSemana.map((dia, dayIndex) => {
                const { agendamento, bloqueio, isOccupied } = isSlotOccupied(time, dia);
                
                return (
                  <div key={dayIndex} className="border border-gray-100 min-h-[40px]">
                    {bloqueio ? (
                      // Mostrar bloqueio
                      <div 
                        className="bg-orange-100 border border-orange-200 p-1 rounded text-xs"
                        style={{ 
                          minHeight: `${calcularSlots(bloqueio.data_inicio, bloqueio.data_fim) * 40}px`
                        }}
                      >
                        <div className="font-medium text-orange-800 truncate">
                          {bloqueio.titulo}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                            Bloqueado
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() => setBloqueioParaEditar(bloqueio)}
                            >
                              <Edit className="h-2 w-2" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 text-destructive"
                              onClick={() => setBloqueioParaExcluir(bloqueio)}
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : agendamento ? (
                      // Mostrar agendamento
                      <div 
                        className={`bg-blue-50 border border-blue-200 p-1 rounded text-xs ${agendamento.desmarcada ? 'opacity-50' : ''}`}
                        style={{ 
                          minHeight: `${calcularSlots(agendamento.data_inicio, agendamento.data_fim) * 40}px`
                        }}
                      >
                        <div className={`font-medium truncate ${agendamento.desmarcada ? 'line-through' : ''}`}>
                          {agendamento.pacientes?.nome}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <Badge className={`text-xs ${getStatusColor(agendamento.status || 'pendente')}`}>
                            {agendamento.desmarcada ? 'Desmarcada' : getStatusText(agendamento.status || 'pendente')}
                          </Badge>
                          <div className="flex gap-1">
                            {!agendamento.desmarcada && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0"
                                  onClick={() => onEditarAgendamento(agendamento)}
                                >
                                  <Edit className="h-2 w-2" />
                                </Button>
                                {agendamento.status === 'pendente' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0"
                                    onClick={() => onConfirmarAgendamento(agendamento.id)}
                                  >
                                    <CheckCircle className="h-2 w-2" />
                                  </Button>
                                )}
                                {agendamento.status === 'confirmado' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0"
                                    onClick={() => onMarcarRealizadoAgendamento(agendamento.id)}
                                  >
                                    ✓
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : !isOccupied ? (
                      // Slot disponível
                      <Button
                        variant="ghost"
                        className="w-full h-full text-xs text-gray-300 hover:bg-gray-50 hover:text-gray-600"
                        onClick={() => {
                          const [hours, minutes] = time.split(':').map(Number);
                          const dataHora = new Date(dia);
                          dataHora.setHours(hours, minutes, 0, 0);
                          onNovaConsulta(dataHora);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal para editar bloqueio */}
      {bloqueioParaEditar && (
        <BloqueioAgendaModal
          isOpen={!!bloqueioParaEditar}
          onClose={() => setBloqueioParaEditar(null)}
          bloqueio={bloqueioParaEditar}
        />
      )}

      {/* Dialog para confirmar exclusão */}
      <AlertDialog open={!!bloqueioParaExcluir} onOpenChange={() => setBloqueioParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Bloqueio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este bloqueio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (bloqueioParaExcluir) {
                  onExcluirBloqueio(bloqueioParaExcluir.id);
                  setBloqueioParaExcluir(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}