import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, CheckCircle, XCircle, Calendar, Clock, User, Plus, UserX } from "lucide-react";
import { formatTimeLocal } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/utils";
import { BloqueioAgendaModal } from "./BloqueioAgendaModal";
import { BloqueioAgenda } from "@/hooks/useBloqueiosAgenda";

interface ServicoAdicional {
  nome: string;
  valor?: number;
  preco?: number;
}

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  pacientes?: { nome: string };
  profissionais?: { nome: string };
  profissional_id?: string;
  tipo_servico: string;
  servicos_adicionais?: any;
  valor?: number;
  observacoes?: string;
  status?: string;
  desmarcada?: boolean;
  [key: string]: any;
}

interface BloqueioVirtual {
  id: string;
  data_inicio: string;
  data_fim: string;
  titulo: string;
  descricao?: string;
  virtual?: boolean;
  profissional_id?: string;
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

interface VisaoDiariaProps {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  bloqueiosVirtuais?: BloqueioVirtual[];
  selectedDate: Date;
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

export function VisaoDiaria({
  agendamentos,
  bloqueios,
  bloqueiosVirtuais = [],
  selectedDate,
  onEditarAgendamento,
  onConfirmarAgendamento,
  onDesmarcarAgendamento,
  onMarcarRealizadoAgendamento,
  onMarcarFaltaAgendamento,
  onExcluirBloqueio,
  onNovaConsulta,
  showMultiProfessional = false,
  profissionais = []
}: VisaoDiariaProps) {
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

  // Calcular posicionamento horizontal para agendamentos sobrepostos
  const getOverlapInfo = useMemo(() => {
    if (!showMultiProfessional) return new Map<string, { index: number; total: number }>();
    
    const overlapMap = new Map<string, { index: number; total: number }>();
    const sortedAgendamentos = [...agendamentos].filter(ag => !ag.desmarcada).sort((a, b) => 
      new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
    );
    
    // Para cada agendamento, encontrar quantos outros se sobrepõem
    sortedAgendamentos.forEach((ag) => {
      const agStart = new Date(ag.data_inicio).getTime();
      const agEnd = new Date(ag.data_fim).getTime();
      
      // Encontrar todos que se sobrepõem com este
      const overlapping = sortedAgendamentos.filter(other => {
        if (other.id === ag.id) return false;
        const otherStart = new Date(other.data_inicio).getTime();
        const otherEnd = new Date(other.data_fim).getTime();
        return agStart < otherEnd && agEnd > otherStart;
      });
      
      if (overlapping.length === 0) {
        overlapMap.set(ag.id, { index: 0, total: 1 });
      } else {
        // Agrupar todos que se sobrepõem juntos
        const group = [ag, ...overlapping].sort((a, b) => {
          // Ordenar por profissional_id para consistência
          return (a.profissional_id || '').localeCompare(b.profissional_id || '');
        });
        const myIndex = group.findIndex(g => g.id === ag.id);
        overlapMap.set(ag.id, { index: myIndex, total: group.length });
      }
    });
    
    return overlapMap;
  }, [agendamentos, showMultiProfessional]);

  const getAgendamentoStyle = (agendamento: Agendamento) => {
    const overlapInfo = getOverlapInfo.get(agendamento.id) || { index: 0, total: 1 };
    const width = 100 / overlapInfo.total;
    const left = overlapInfo.index * width;
    
    return {
      width: `calc(${width}% - 8px)`,
      left: `calc(${left}% + 4px)`,
    };
  };

  const getAgendamentoCores = (agendamento: Agendamento) => {
    if (!showMultiProfessional || !agendamento.profissional_id) {
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
    }
    const cores = profissionalColorMap.get(agendamento.profissional_id);
    return cores || CORES_PROFISSIONAIS[0];
  };

  // Scroll automático para 8h ao montar o componente
  useEffect(() => {
    if (scrollContainerRef.current) {
      const baseHour = 0; // Grade começa à 0h
      const targetHour = 8; // Scroll para 8h
      const pixelsPerSlot = 60; // 60px por slot de 30min
      const slotsPerHour = 2;
      const scrollPosition = (targetHour - baseHour) * slotsPerHour * pixelsPerSlot;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Gerar slots de 30 minutos - 24 horas completas
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
    const baseHour = 0; // Início da grade às 0h
    const totalMinutes = (hours - baseHour) * 60 + minutes;
    const posicao = totalMinutes * 2; // Cada 30min = 60px, então cada minuto = 2px
    return posicao;
  };

  const calcularAltura = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes * 2; // Cada minuto = 2px
  };

  const handleNovaConsultaNoHorario = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const dataHora = new Date(selectedDate);
    dataHora.setHours(hours, minutes, 0, 0);
    onNovaConsulta(dataHora);
  };

  return (
    <div className="space-y-2">
      {/* Container com scroll vertical */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[600px] overflow-y-auto"
      >
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
          
          {/* Bloqueios virtuais (horários fora do expediente) */}
          {bloqueiosVirtuais.map((bloqueio) => {
            // Na visão multi-profissional, posicionar lado a lado
            let positionStyle: React.CSSProperties = {};
            let bloqueioColor = 'bg-gray-100 border-gray-200';
            
            if (showMultiProfessional && bloqueio.profissional_id && profissionais.length > 1) {
              const profIndex = profissionais.findIndex(p => p.id === bloqueio.profissional_id);
              if (profIndex >= 0) {
                const totalProfs = profissionais.length;
                const width = 100 / totalProfs;
                positionStyle = {
                  left: `${profIndex * width}%`,
                  width: `${width}%`,
                };
                const colors = profissionalColorMap.get(bloqueio.profissional_id);
                if (colors) {
                  bloqueioColor = `${colors.bg} ${colors.border}`;
                }
              }
            }
            
            return (
              <div
                key={`virtual-${bloqueio.id}`}
                className={`absolute ${bloqueioColor} border z-5 pointer-events-none opacity-60`}
                style={{
                  top: `${calcularPosicaoTop(bloqueio.data_inicio)}px`,
                  height: `${calcularAltura(bloqueio.data_inicio, bloqueio.data_fim)}px`,
                  minHeight: '20px',
                  left: positionStyle.left || '0',
                  right: showMultiProfessional ? undefined : '8px',
                  width: positionStyle.width,
                }}
              >
                <div className="p-1 h-full flex items-center justify-center">
                  <span className="text-[10px] text-gray-600 font-medium truncate">
                    {showMultiProfessional && bloqueio.profissional_id 
                      ? profissionais.find(p => p.id === bloqueio.profissional_id)?.nome?.split(' ')[0] || bloqueio.titulo
                      : bloqueio.titulo}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Bloqueios posicionados absolutamente */}
          {bloqueios.map((bloqueio) => {
            // Na visão multi-profissional, posicionar lado a lado
            let positionStyle: React.CSSProperties = { left: '0', right: '8px' };
            let bloqueioColor = { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
            
            if (showMultiProfessional && bloqueio.profissional_id && profissionais.length > 1) {
              const profIndex = profissionais.findIndex(p => p.id === bloqueio.profissional_id);
              if (profIndex >= 0) {
                const totalProfs = profissionais.length;
                const width = 100 / totalProfs;
                positionStyle = {
                  left: `${profIndex * width}%`,
                  width: `${width - 1}%`,
                };
                const colors = profissionalColorMap.get(bloqueio.profissional_id);
                if (colors) {
                  bloqueioColor = { bg: colors.bg.replace('100', '50'), border: colors.border, text: colors.text };
                }
              }
            }
            
            return (
              <Card
                key={`bloqueio-${bloqueio.id}`}
                className={`absolute ${bloqueioColor.border} ${bloqueioColor.bg} cursor-pointer hover:shadow-md transition-shadow z-10`}
                style={{
                  top: `${calcularPosicaoTop(bloqueio.data_inicio)}px`,
                  height: `${calcularAltura(bloqueio.data_inicio, bloqueio.data_fim)}px`,
                  minHeight: '40px',
                  ...positionStyle
                }}
              >
                <CardContent className="p-2 h-full">
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className={`h-3 w-3 ${bloqueioColor.text} flex-shrink-0`} />
                        <span className={`text-xs font-medium ${bloqueioColor.text} truncate`}>
                          {formatTimeLocal(bloqueio.data_inicio)} - {formatTimeLocal(bloqueio.data_fim)}
                        </span>
                      </div>
                      <div className={`text-sm ${bloqueioColor.text} font-medium truncate`}>
                        {bloqueio.titulo}
                      </div>
                      {showMultiProfessional && bloqueio.profissional_id && (
                        <div className={`text-xs ${bloqueioColor.text} opacity-75 truncate`}>
                          {profissionais.find(p => p.id === bloqueio.profissional_id)?.nome}
                        </div>
                      )}
                      {bloqueio.descricao && calcularAltura(bloqueio.data_inicio, bloqueio.data_fim) > 80 && (
                        <div className={`text-xs ${bloqueioColor.text} mt-1 truncate opacity-75`}>
                          {bloqueio.descricao}
                        </div>
                      )}
                    </div>
                    {!showMultiProfessional && (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Agendamentos posicionados absolutamente */}
          {agendamentos.filter(ag => !ag.desmarcada).map((agendamento) => {
            const cores = getAgendamentoCores(agendamento);
            const positionStyle = showMultiProfessional ? getAgendamentoStyle(agendamento) : {};
            
            return (
              <Card
                key={`agendamento-${agendamento.id}`}
                className={`absolute cursor-pointer hover:shadow-md transition-shadow z-10 ${cores.bg} ${cores.border} border-l-4 ${
                  agendamento.desmarcada ? 'opacity-50' : ''
                }`}
                style={{
                  top: `${calcularPosicaoTop(agendamento.data_inicio)}px`,
                  height: `${calcularAltura(agendamento.data_inicio, agendamento.data_fim)}px`,
                  minHeight: '40px',
                  ...(showMultiProfessional ? positionStyle : { left: 0, right: '8px' })
                }}
                onClick={() => onEditarAgendamento(agendamento)}
              >
                <CardContent className="p-2 h-full">
                  <div className="flex justify-between items-start h-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className={`h-3 w-3 flex-shrink-0 ${cores.text}`} />
                        <span className={`text-xs font-medium truncate ${cores.text} ${agendamento.desmarcada ? 'line-through' : ''}`}>
                          {formatTimeLocal(agendamento.data_inicio)} - {formatTimeLocal(agendamento.data_fim)}
                        </span>
                        {!showMultiProfessional && (
                          <Badge className={`text-xs ${agendamento.desmarcada ? 'bg-gray-100 text-gray-600' : getStatusColor(agendamento.status || 'pendente')}`}>
                            {agendamento.desmarcada ? 'Desmarcada' : getStatusText(agendamento.status || 'pendente')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-1">
                        <User className={`h-3 w-3 flex-shrink-0 ${cores.text}`} />
                        <span className={`text-sm font-medium truncate ${cores.text} ${agendamento.desmarcada ? 'line-through' : ''}`}>
                          {agendamento.pacientes?.nome}
                        </span>
                      </div>
                      
                      {/* Mostrar nome do profissional quando em modo multi-profissional */}
                      {showMultiProfessional && (
                        <div className={`text-xs font-medium truncate ${cores.text} opacity-80`}>
                          {agendamento.profissionais?.nome}
                        </div>
                      )}
                      
                      {!showMultiProfessional && calcularAltura(agendamento.data_inicio, agendamento.data_fim) > 60 && (
                        <div className={`text-xs text-gray-600 space-y-1 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                          <p className="truncate">
                            <strong>Tipo:</strong> {agendamento.tipo_servico}
                            {Array.isArray(agendamento.servicos_adicionais) && agendamento.servicos_adicionais.length > 0 && (
                              <span className="text-muted-foreground"> + {agendamento.servicos_adicionais.map((s: ServicoAdicional) => s.nome).join(', ')}</span>
                            )}
                          </p>
                          <p className="truncate"><strong>Profissional:</strong> {agendamento.profissionais?.nome}</p>
                          {agendamento.valor && (
                            <p className="truncate">
                              <strong>Valor:</strong> R$ {formatCurrency(
                                (agendamento.valor || 0) +
                                (Array.isArray(agendamento.servicos_adicionais)
                                  ? agendamento.servicos_adicionais.reduce(
                                      (acc: number, s: ServicoAdicional) =>
                                        acc + Number(s.valor ?? s.preco ?? 0),
                                      0
                                    )
                                  : 0)
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!showMultiProfessional && (
                      <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                        {!agendamento.desmarcada && (
                          <>
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
                            {(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAgendamentoParaDesmarcar(agendamento);
                                }}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {agendamento.status === 'confirmado' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
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
                                  variant="outline"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarcarFaltaAgendamento(agendamento.id);
                                  }}
                                  title="Marcar como falta"
                                >
                                  <UserX className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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