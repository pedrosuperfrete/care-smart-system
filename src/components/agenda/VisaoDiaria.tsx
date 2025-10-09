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

    return { agendamento, bloqueio };
  };

  const handleNovaConsultaNoHorario = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const dataHora = new Date(selectedDate);
    dataHora.setHours(hours, minutes, 0, 0);
    onNovaConsulta(dataHora);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-1">
        {timeSlots.map((time) => {
          const { agendamento, bloqueio } = isSlotOccupied(time);
          
          return (
            <div key={time} className="flex items-center min-h-[60px] border-b border-gray-100">
              {/* Coluna do horário */}
              <div className="w-16 text-sm text-gray-500 font-medium">
                {time}
              </div>
              
              {/* Coluna do conteúdo */}
              <div className="flex-1 ml-4">
                {bloqueio ? (
                  // Mostrar bloqueio
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-800">
                              {formatTimeLocal(bloqueio.data_inicio)} - {formatTimeLocal(bloqueio.data_fim)}
                            </span>
                            <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-100">
                              Bloqueado
                            </Badge>
                          </div>
                          <div className="text-orange-700 font-medium">
                            {bloqueio.titulo}
                          </div>
                          {bloqueio.descricao && (
                            <div className="text-orange-600 text-sm mt-1">
                              {bloqueio.descricao}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1">
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
                ) : agendamento ? (
                  // Mostrar agendamento
                  <Card className={`hover:shadow-md transition-shadow ${agendamento.desmarcada ? 'opacity-50' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className={`font-medium ${agendamento.desmarcada ? 'line-through' : ''}`}>
                              {formatTimeLocal(agendamento.data_inicio)} - {formatTimeLocal(agendamento.data_fim)}
                            </span>
                            <Badge className={agendamento.desmarcada ? 'bg-gray-100 text-gray-600' : getStatusColor(agendamento.status || 'pendente')}>
                              {agendamento.desmarcada ? 'Desmarcada' : getStatusText(agendamento.status || 'pendente')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className={`font-medium ${agendamento.desmarcada ? 'line-through' : ''}`}>
                              {agendamento.pacientes?.nome}
                            </span>
                          </div>
                          
                          <div className={`text-sm text-gray-600 space-y-1 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                            <p><strong>Tipo:</strong> {agendamento.tipo_servico}</p>
                            <p><strong>Profissional:</strong> {agendamento.profissionais?.nome}</p>
                            {agendamento.valor && (
                              <p><strong>Valor:</strong> R$ {agendamento.valor.toFixed(2)}</p>
                            )}
                            {agendamento.observacoes && (
                              <p><strong>Obs:</strong> {agendamento.observacoes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          {!agendamento.desmarcada && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onEditarAgendamento(agendamento)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {!agendamento.desmarcada && agendamento.status === 'pendente' && (
                            <Button 
                              size="sm"
                              onClick={() => onConfirmarAgendamento(agendamento.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {!agendamento.desmarcada && agendamento.status === 'confirmado' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onMarcarRealizadoAgendamento(agendamento.id)}
                            >
                              ✓ Realizado
                            </Button>
                          )}
                          {!agendamento.desmarcada && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onDesmarcarAgendamento(agendamento.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Slot disponível
                  <Button
                    variant="ghost"
                    className="w-full h-full justify-start text-left hover:bg-gray-50 text-gray-400"
                    onClick={() => handleNovaConsultaNoHorario(time)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Horário disponível - Clique para agendar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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