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

    // Verificar se o slot está ocupado mas NÃO é o início (slots intermediários)
    const isDentroDeAgendamento = agendamentos.some(ag => {
      const inicio = new Date(ag.data_inicio);
      const fim = new Date(ag.data_fim);
      return slotTime > inicio && slotTime < fim && !ag.desmarcada;
    });

    const isDentroDeBloqueio = bloqueios.some(bl => {
      const inicio = new Date(bl.data_inicio);
      const fim = new Date(bl.data_fim);
      return slotTime > inicio && slotTime < fim;
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

    return { 
      agendamento, 
      bloqueio, 
      isOccupied: dentroDeBloqueio || dentroDeAgendamento,
      isSlotIntermediario: isDentroDeAgendamento || isDentroDeBloqueio
    };
  };

  const calcularPosicaoTop = (dataInicio: string) => {
    const inicio = new Date(dataInicio);
    const hours = inicio.getHours();
    const minutes = inicio.getMinutes();
    const baseHour = 7; // Início da grade às 7h
    const totalMinutes = (hours - baseHour) * 60 + minutes;
    const posicao = (totalMinutes / 30) * 40; // Cada 30min = 40px
    console.log('VisaoSemanal - calcularPosicaoTop:', {
      dataInicio,
      hours,
      minutes,
      totalMinutes,
      posicao
    });
    return posicao;
  };

  const calcularAltura = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const altura = (diffMinutes / 30) * 40; // Cada 30min = 40px
    console.log('VisaoSemanal - calcularAltura:', {
      dataInicio,
      dataFim,
      diffMinutes,
      altura
    });
    return altura;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  return (
    <div className="relative">
      {/* Cabeçalho com dias da semana - Fixo no topo */}
      <div className="sticky top-0 left-0 right-0 bg-background z-[100] pb-3 pt-2 border-b shadow-md mb-2 -mx-2 px-2">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 gap-1">
              <div className="w-16 text-xs font-medium text-muted-foreground"></div>
              {diasSemana.map((dia, index) => (
                <div key={index} className="text-center p-2 border rounded bg-card shadow-sm">
                  <div className="text-xs font-medium text-muted-foreground">
                    {diasSemanaLabels[index]}
                  </div>
                  <div className="text-sm font-semibold">
                    {dia.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grade de horários com scroll horizontal */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">

        {/* Grade de horários */}
        <div className="grid grid-cols-8 gap-1">
          {/* Coluna de horários */}
          <div className="w-16">
            {timeSlots.map((time) => (
              <div key={time} className="h-[40px] text-xs text-gray-500 font-medium flex items-start pt-1">
                {time}
              </div>
            ))}
          </div>
          
          {/* Colunas dos dias com posicionamento absoluto */}
          {diasSemana.map((dia, dayIndex) => (
            <div key={dayIndex} className="relative">
              {/* Grid de fundo */}
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-[40px] border border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    const [hours, minutes] = time.split(':').map(Number);
                    const dataHora = new Date(dia);
                    dataHora.setHours(hours, minutes, 0, 0);
                    onNovaConsulta(dataHora);
                  }}
                >
                  <Button
                    variant="ghost"
                    className="w-full h-full text-xs text-gray-300 opacity-0 hover:opacity-100"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {/* Bloqueios do dia */}
              {bloqueios.filter(bl => isSameDay(new Date(bl.data_inicio), dia)).map((bloqueio) => (
                <div
                  key={`bloqueio-${bloqueio.id}`}
                  className="absolute left-1 right-1 bg-orange-100 border border-orange-200 p-1 rounded text-xs z-10 cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    top: `${calcularPosicaoTop(bloqueio.data_inicio)}px`,
                    height: `${Math.max(calcularAltura(bloqueio.data_inicio, bloqueio.data_fim), 30)}px`
                  }}
                >
                  <div className="font-medium text-orange-800 truncate text-[10px] mb-1">
                    {bloqueio.titulo}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="text-[9px] text-orange-700 border-orange-300 h-4 flex-shrink-0">
                      Bloqueado
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-orange-200 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBloqueioParaEditar(bloqueio);
                      }}
                    >
                      <Edit className="h-2 w-2" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 text-destructive hover:bg-orange-200 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBloqueioParaExcluir(bloqueio);
                      }}
                    >
                      <Trash2 className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Agendamentos do dia */}
              {agendamentos.filter(ag => !ag.desmarcada && isSameDay(new Date(ag.data_inicio), dia)).map((agendamento) => (
                <div
                  key={`agendamento-${agendamento.id}`}
                  className={`absolute left-1 right-1 bg-blue-50 border border-blue-200 p-1 rounded text-xs z-10 cursor-pointer hover:shadow-md transition-shadow ${
                    agendamento.desmarcada ? 'opacity-50' : ''
                  }`}
                  style={{
                    top: `${calcularPosicaoTop(agendamento.data_inicio)}px`,
                    height: `${Math.max(calcularAltura(agendamento.data_inicio, agendamento.data_fim), 30)}px`
                  }}
                >
                  <div className={`font-medium truncate text-[10px] mb-1 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                    {agendamento.pacientes?.nome}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge className={`text-[9px] h-4 flex-shrink-0 ${getStatusColor(agendamento.status || 'pendente')}`}>
                      {agendamento.desmarcada ? 'Desmarcada' : getStatusText(agendamento.status || 'pendente')}
                    </Badge>
                    {!agendamento.desmarcada && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-blue-200 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarAgendamento(agendamento);
                          }}
                        >
                          <Edit className="h-2 w-2" />
                        </Button>
                        {agendamento.status === 'pendente' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-blue-200 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onConfirmarAgendamento(agendamento.id);
                            }}
                          >
                            <CheckCircle className="h-2 w-2" />
                          </Button>
                        )}
                        {agendamento.status === 'confirmado' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-blue-200 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarcarRealizadoAgendamento(agendamento.id);
                            }}
                          >
                            ✓
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
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