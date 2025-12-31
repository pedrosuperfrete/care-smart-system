import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, CheckCircle, XCircle, Clock, User, Plus, UserX } from "lucide-react";
import { formatTimeLocal } from "@/lib/dateUtils";
import { BloqueioAgendaModal } from "./BloqueioAgendaModal";
import { BloqueioAgenda } from "@/hooks/useBloqueiosAgenda";

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  pacientes?: { nome: string };
  profissionais?: { nome: string };
  profissional_id?: string;
  tipo_servico: string;
  valor?: number;
  observacoes?: string;
  status?: string;
  desmarcada?: boolean;
}

interface BloqueioVirtual {
  id: string;
  data_inicio: string;
  data_fim: string;
  titulo: string;
  descricao?: string;
  virtual?: boolean;
}

// Paleta de cores para profissionais (estilo Google Calendar)
const CORES_PROFISSIONAIS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', accent: '#3b82f6' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', accent: '#ec4899' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', accent: '#22c55e' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', accent: '#a855f7' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', accent: '#f97316' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', accent: '#14b8a6' },
  { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', accent: '#ef4444' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800', accent: '#6366f1' },
];

interface VisaoSemanalGridProps {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  bloqueiosVirtuais?: BloqueioVirtual[];
  semanaInicio: Date;
  onEditarAgendamento: (agendamento: Agendamento) => void;
  onConfirmarAgendamento: (id: string) => void;
  onDesmarcarAgendamento: (id: string) => void;
  onMarcarRealizadoAgendamento: (id: string) => void;
  onMarcarFaltaAgendamento: (id: string) => void;
  onExcluirBloqueio: (id: string) => void;
  onNovaConsulta: (dataHora: Date) => void;
  // Props para exibição multi-profissional
  showMultiProfessional?: boolean;
  profissionais?: Array<{ id: string; nome: string }>;
}

export function VisaoSemanalGrid({
  agendamentos,
  bloqueios,
  bloqueiosVirtuais = [],
  semanaInicio,
  onEditarAgendamento,
  onConfirmarAgendamento,
  onDesmarcarAgendamento,
  onMarcarRealizadoAgendamento,
  onMarcarFaltaAgendamento,
  onExcluirBloqueio,
  onNovaConsulta,
  showMultiProfessional = false,
  profissionais = []
}: VisaoSemanalGridProps) {
  const [bloqueioParaEditar, setBloqueioParaEditar] = useState<BloqueioAgenda | null>(null);
  const [bloqueioParaExcluir, setBloqueioParaExcluir] = useState<BloqueioAgenda | null>(null);
  const [agendamentoParaDesmarcar, setAgendamentoParaDesmarcar] = useState<Agendamento | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mapear profissionais para cores
  const profissionalColorMap = useMemo(() => {
    const map = new Map<string, typeof CORES_PROFISSIONAIS[0]>();
    profissionais.forEach((prof, index) => {
      map.set(prof.id, CORES_PROFISSIONAIS[index % CORES_PROFISSIONAIS.length]);
    });
    return map;
  }, [profissionais]);

  // Função para obter cores de um agendamento
  const getAgendamentoCores = (agendamento: Agendamento) => {
    if (!showMultiProfessional || !agendamento.profissional_id) {
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
    }
    const cores = profissionalColorMap.get(agendamento.profissional_id);
    return cores || CORES_PROFISSIONAIS[0];
  };

  // Calcular posicionamento horizontal para agendamentos sobrepostos no mesmo dia
  const getOverlapInfoForDay = (dia: Date) => {
    if (!showMultiProfessional) return new Map<string, { index: number; total: number }>();
    
    const overlapMap = new Map<string, { index: number; total: number }>();
    const dayAgendamentos = agendamentos.filter(ag => 
      !ag.desmarcada && isSameDay(new Date(ag.data_inicio), dia)
    ).sort((a, b) => 
      new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
    );
    
    dayAgendamentos.forEach((ag) => {
      const agStart = new Date(ag.data_inicio).getTime();
      const agEnd = new Date(ag.data_fim).getTime();
      
      const overlapping = dayAgendamentos.filter(other => {
        if (other.id === ag.id) return false;
        const otherStart = new Date(other.data_inicio).getTime();
        const otherEnd = new Date(other.data_fim).getTime();
        return agStart < otherEnd && agEnd > otherStart;
      });
      
      if (overlapping.length === 0) {
        overlapMap.set(ag.id, { index: 0, total: 1 });
      } else {
        const group = [ag, ...overlapping].sort((a, b) => 
          (a.profissional_id || '').localeCompare(b.profissional_id || '')
        );
        const myIndex = group.findIndex(g => g.id === ag.id);
        overlapMap.set(ag.id, { index: myIndex, total: group.length });
      }
    });
    
    return overlapMap;
  };

  // Scroll automático para 8h ao montar o componente
  useEffect(() => {
    if (scrollContainerRef.current) {
      const baseHour = 0; // Grade começa à 0h
      const targetHour = 8; // Scroll para 8h
      const pixelsPerSlot = 40; // 40px por slot de 30min
      const slotsPerHour = 2;
      const scrollPosition = (targetHour - baseHour) * slotsPerHour * pixelsPerSlot;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

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

  // Gerar slots de tempo - 24 horas completas
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
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
      case 'falta': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'pendente': return 'Pendente';
      case 'realizado': return 'Realizado';
      case 'falta': return 'Falta';
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
    const baseHour = 0; // Início da grade às 0h
    const totalMinutes = (hours - baseHour) * 60 + minutes;
    const posicao = (totalMinutes / 30) * 40; // Cada 30min = 40px
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
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Cabeçalho com dias da semana - fixo */}
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

        {/* Container com scroll vertical */}
        <div 
          ref={scrollContainerRef}
          className="max-h-[600px] overflow-y-auto"
        >
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
              
              {/* Bloqueios virtuais (fora do expediente) */}
              {bloqueiosVirtuais.filter(bl => isSameDay(new Date(bl.data_inicio), dia)).map((bloqueio) => (
                <div
                  key={`virtual-${bloqueio.id}`}
                  className="absolute left-0 right-0 bg-gray-100 border border-gray-200 z-5 pointer-events-none"
                  style={{
                    top: `${calcularPosicaoTop(bloqueio.data_inicio)}px`,
                    height: `${Math.max(calcularAltura(bloqueio.data_inicio, bloqueio.data_fim), 20)}px`
                  }}
                >
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[9px] text-gray-400 font-medium truncate px-1">
                      {bloqueio.titulo}
                    </span>
                  </div>
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
              {(() => {
                const overlapInfo = getOverlapInfoForDay(dia);
                return agendamentos.filter(ag => !ag.desmarcada && isSameDay(new Date(ag.data_inicio), dia)).map((agendamento) => {
                  const cores = getAgendamentoCores(agendamento);
                  const overlap = overlapInfo.get(agendamento.id) || { index: 0, total: 1 };
                  const width = showMultiProfessional && overlap.total > 1 ? `calc(${100 / overlap.total}% - 2px)` : 'calc(100% - 8px)';
                  const left = showMultiProfessional && overlap.total > 1 ? `calc(${overlap.index * (100 / overlap.total)}% + 4px)` : '4px';
                  
                  return (
                    <div
                      key={`agendamento-${agendamento.id}`}
                      className={`absolute ${cores.bg} border-l-2 ${cores.border} p-1 rounded text-xs z-10 cursor-pointer hover:shadow-md transition-shadow ${
                        agendamento.desmarcada ? 'opacity-50' : ''
                      }`}
                      style={{
                        top: `${calcularPosicaoTop(agendamento.data_inicio)}px`,
                        height: `${Math.max(calcularAltura(agendamento.data_inicio, agendamento.data_fim), 30)}px`,
                        width,
                        left
                      }}
                      onClick={() => onEditarAgendamento(agendamento)}
                    >
                      <div className={`font-medium truncate text-[10px] mb-1 ${cores.text} ${agendamento.desmarcada ? 'line-through' : ''}`}>
                        {agendamento.pacientes?.nome}
                      </div>
                      {showMultiProfessional && (
                        <div className={`text-[9px] truncate ${cores.text} opacity-75`}>
                          {agendamento.profissionais?.nome}
                        </div>
                      )}
                      {!showMultiProfessional && (
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
                              {(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 hover:bg-red-200 text-destructive flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAgendamentoParaDesmarcar(agendamento);
                                  }}
                                >
                                  <XCircle className="h-2 w-2" />
                                </Button>
                              )}
                              {agendamento.status === 'confirmado' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 hover:bg-blue-200 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarcarRealizadoAgendamento(agendamento.id);
                                    }}
                                    title="Marcar como realizado"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 hover:bg-red-200 text-destructive flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarcarFaltaAgendamento(agendamento.id);
                                    }}
                                    title="Marcar como falta"
                                  >
                                    <UserX className="h-2 w-2" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ))}
        </div>
        {/* Fim scroll container */}
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

      {/* Dialog para confirmar exclusão de bloqueio */}
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

      {/* Dialog para confirmar desmarcação de agendamento */}
      <AlertDialog open={!!agendamentoParaDesmarcar} onOpenChange={() => setAgendamentoParaDesmarcar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desmarcar Consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desmarcar a consulta de {agendamentoParaDesmarcar?.pacientes?.nome}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (agendamentoParaDesmarcar) {
                  onDesmarcarAgendamento(agendamentoParaDesmarcar.id);
                  setAgendamentoParaDesmarcar(null);
                }
              }}
            >
              Desmarcar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}