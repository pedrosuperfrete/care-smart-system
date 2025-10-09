import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, CheckCircle, XCircle, Calendar, Clock, User, Plus } from "lucide-react";
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

interface VisaoDiariaProps {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  selectedDate: Date;
  onEditarAgendamento: (agendamento: Agendamento) => void;
  onConfirmarAgendamento: (id: string) => void;
  onDesmarcarAgendamento: (id: string) => void;
  onMarcarRealizadoAgendamento: (id: string) => void;
  onExcluirBloqueio: (id: string) => void;
  onNovaConsulta: (dataHora: Date) => void;
}

export function VisaoDiaria({
  agendamentos,
  bloqueios,
  selectedDate,
  onEditarAgendamento,
  onConfirmarAgendamento,
  onDesmarcarAgendamento,
  onMarcarRealizadoAgendamento,
  onExcluirBloqueio,
  onNovaConsulta
}: VisaoDiariaProps) {
  const [bloqueioParaEditar, setBloqueioParaEditar] = useState<BloqueioAgenda | null>(null);
  const [bloqueioParaExcluir, setBloqueioParaExcluir] = useState<BloqueioAgenda | null>(null);

  // Gerar slots de 30 minutos das 7h às 19h
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

  const isSlotOccupied = (time: string) => {
    const slotTime = new Date(selectedDate);
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
    return totalMinutes; // pixels = minutos (1px por minuto)
  };

  const calcularAltura = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes; // pixels = minutos
  };

  const handleNovaConsultaNoHorario = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const dataHora = new Date(selectedDate);
    dataHora.setHours(hours, minutes, 0, 0);
    onNovaConsulta(dataHora);
  };

  return (
    <div className="space-y-2">
      <div className="flex">
        {/* Coluna de horários */}
        <div className="w-16 flex-shrink-0">
          {timeSlots.map((time) => (
            <div key={time} className="h-[60px] text-sm text-gray-500 font-medium border-b border-gray-100 flex items-start pt-1">
              {time}
            </div>
          ))}
        </div>
        
        {/* Coluna de conteúdo com posicionamento absoluto */}
        <div className="flex-1 relative ml-4">
          {/* Grid de fundo */}
          {timeSlots.map((time) => (
            <div 
              key={time} 
              className="h-[60px] border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleNovaConsultaNoHorario(time)}
            >
              <Button
                variant="ghost"
                className="w-full h-full justify-start text-left text-gray-400 opacity-0 hover:opacity-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Horário disponível - Clique para agendar
              </Button>
            </div>
          ))}
          
          {/* Bloqueios posicionados absolutamente */}
          {bloqueios.map((bloqueio) => (
            <Card
              key={`bloqueio-${bloqueio.id}`}
              className="absolute left-0 right-2 border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition-shadow z-10"
              style={{
                top: `${calcularPosicaoTop(bloqueio.data_inicio)}px`,
                height: `${calcularAltura(bloqueio.data_inicio, bloqueio.data_fim)}px`,
                minHeight: '40px'
              }}
            >
              <CardContent className="p-2 h-full">
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-3 w-3 text-orange-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-orange-800 truncate">
                        {formatTimeLocal(bloqueio.data_inicio)} - {formatTimeLocal(bloqueio.data_fim)}
                      </span>
                    </div>
                    <div className="text-sm text-orange-700 font-medium truncate">
                      {bloqueio.titulo}
                    </div>
                    {bloqueio.descricao && calcularAltura(bloqueio.data_inicio, bloqueio.data_fim) > 60 && (
                      <div className="text-xs text-orange-600 mt-1 truncate">
                        {bloqueio.descricao}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBloqueioParaEditar(bloqueio);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBloqueioParaExcluir(bloqueio);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Agendamentos posicionados absolutamente */}
          {agendamentos.filter(ag => !ag.desmarcada).map((agendamento) => (
            <Card
              key={`agendamento-${agendamento.id}`}
              className={`absolute left-0 right-2 cursor-pointer hover:shadow-md transition-shadow z-10 ${
                agendamento.desmarcada ? 'opacity-50' : ''
              }`}
              style={{
                top: `${calcularPosicaoTop(agendamento.data_inicio)}px`,
                height: `${calcularAltura(agendamento.data_inicio, agendamento.data_fim)}px`,
                minHeight: '40px'
              }}
            >
              <CardContent className="p-2 h-full">
                <div className="flex justify-between items-start h-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                      <span className={`text-xs font-medium truncate ${agendamento.desmarcada ? 'line-through' : ''}`}>
                        {formatTimeLocal(agendamento.data_inicio)} - {formatTimeLocal(agendamento.data_fim)}
                      </span>
                      <Badge className={`text-xs ${agendamento.desmarcada ? 'bg-gray-100 text-gray-600' : getStatusColor(agendamento.status || 'pendente')}`}>
                        {agendamento.desmarcada ? 'Desmarcada' : getStatusText(agendamento.status || 'pendente')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                      <span className={`text-sm font-medium truncate ${agendamento.desmarcada ? 'line-through' : ''}`}>
                        {agendamento.pacientes?.nome}
                      </span>
                    </div>
                    
                    {calcularAltura(agendamento.data_inicio, agendamento.data_fim) > 60 && (
                      <div className={`text-xs text-gray-600 space-y-1 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                        <p className="truncate"><strong>Tipo:</strong> {agendamento.tipo_servico}</p>
                        <p className="truncate"><strong>Profissional:</strong> {agendamento.profissionais?.nome}</p>
                        {agendamento.valor && (
                          <p className="truncate"><strong>Valor:</strong> R$ {agendamento.valor.toFixed(2)}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                    {!agendamento.desmarcada && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarAgendamento(agendamento);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {agendamento.status === 'pendente' && (
                          <Button 
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onConfirmarAgendamento(agendamento.id);
                            }}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {agendamento.status === 'confirmado' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 px-2 text-xs"
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
              </CardContent>
            </Card>
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