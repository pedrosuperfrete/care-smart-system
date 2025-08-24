import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { formatTimeLocal, isSameDayLocal } from "@/lib/dateUtils";
import { CheckCircle, XCircle, Eye, Edit } from "lucide-react";
import { BloqueioAgenda } from "@/hooks/useBloqueiosAgenda";

type Agendamento = Tables<"agendamentos"> & {
  pacientes: { nome: string } | null;
  profissionais: { nome: string } | null;
};

interface VisaoSemanalProps {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  semanaInicio: Date;
  onEditarAgendamento: (agendamento: Agendamento) => void;
  onConfirmarAgendamento: (id: string) => void;
  onDesmarcarAgendamento: (id: string) => void;
  onMarcarRealizado: (id: string) => void;
}

export function VisaoSemanal({ 
  agendamentos, 
  bloqueios,
  semanaInicio, 
  onEditarAgendamento, 
  onConfirmarAgendamento, 
  onDesmarcarAgendamento, 
  onMarcarRealizado 
}: VisaoSemanalProps) {
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const getDiasSemanaDatas = () => {
    const datas = [];
    for (let i = 0; i < 7; i++) {
      const data = new Date(semanaInicio);
      data.setDate(semanaInicio.getDate() - semanaInicio.getDay() + i);
      datas.push(data);
    }
    return datas;
  };

  const getAgendamentosDoDia = (data: Date) => {
    return agendamentos.filter(agendamento => {
      const agendamentoDate = new Date(agendamento.data_inicio);
      const agendamentoYear = agendamentoDate.getFullYear();
      const agendamentoMonth = agendamentoDate.getMonth();
      const agendamentoDay = agendamentoDate.getDate();
      
      return (
        agendamentoYear === data.getFullYear() &&
        agendamentoMonth === data.getMonth() &&
        agendamentoDay === data.getDate()
      );
    });
  };

  const getBloqueiosDoDia = (data: Date) => {
    return bloqueios.filter(bloqueio => {
      const bloqueioDate = new Date(bloqueio.data_inicio);
      const bloqueioYear = bloqueioDate.getFullYear();
      const bloqueioMonth = bloqueioDate.getMonth();
      const bloqueioDay = bloqueioDate.getDate();
      
      return (
        bloqueioYear === data.getFullYear() &&
        bloqueioMonth === data.getMonth() &&
        bloqueioDay === data.getDate()
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-primary';
      case 'pendente': return 'bg-warning';
      case 'realizado': return 'bg-success';
      default: return 'bg-destructive';
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

  return (
    <div className="grid grid-cols-7 gap-2">
      {getDiasSemanaDatas().map((dia, index) => (
        <Card key={index} className="min-h-[300px]">
          <div className="p-4 min-h-[200px]">
            <h3 className="font-medium text-sm mb-3">
              {dia.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {/* Renderizar bloqueios */}
              {getBloqueiosDoDia(dia).map((bloqueio) => (
                <div
                  key={`bloqueio-${bloqueio.id}`}
                  className="p-2 rounded border border-orange-200 bg-orange-50 text-xs"
                >
                  <div className="font-medium text-orange-800">{bloqueio.titulo}</div>
                  <div className="text-orange-600">
                    {formatTimeLocal(bloqueio.data_inicio)} - {formatTimeLocal(bloqueio.data_fim)}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1 text-orange-700 border-orange-300">
                    Bloqueado
                  </Badge>
                </div>
              ))}
              
              {/* Renderizar agendamentos */}
              {getAgendamentosDoDia(dia).map((agendamento) => (
                <Card 
                  key={agendamento.id} 
                  className={`p-3 text-xs ${agendamento.desmarcada ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium">{agendamento.pacientes?.nome}</div>
                      <div className="text-muted-foreground">
                        {formatTimeLocal(agendamento.data_inicio)}
                      </div>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(agendamento.status || 'pendente')}`}
                    >
                      {getStatusText(agendamento.status || 'pendente')}
                    </Badge>
                    
                    {!agendamento.desmarcada && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditarAgendamento(agendamento)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        {agendamento.status === 'pendente' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onConfirmarAgendamento(agendamento.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {agendamento.status === 'confirmado' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onMarcarRealizado(agendamento.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}