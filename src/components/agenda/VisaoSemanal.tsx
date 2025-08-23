
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatTimeLocal, isSameDayLocal } from '@/lib/dateUtils';

type Agendamento = Tables<'agendamentos'>;

interface VisaoSemanalProps {
  agendamentos: Agendamento[];
  semanaInicio: Date;
  onEditarAgendamento: (agendamento: Agendamento) => void;
  onConfirmarAgendamento: (id: string) => void;
  onDesmarcarAgendamento: (id: string) => void;
  onMarcarRealizado: (id: string) => void;
}

export function VisaoSemanal({ 
  agendamentos, 
  semanaInicio,
  onEditarAgendamento,
  onConfirmarAgendamento, 
  onDesmarcarAgendamento,
  onMarcarRealizado
}: VisaoSemanalProps) {
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const getDiasSemanaDatas = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(semanaInicio);
      dia.setDate(semanaInicio.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const getAgendamentosDoDia = (data: Date) => {
    return agendamentos.filter(ag => {
      const agendamentoDate = new Date(ag.data_inicio);
      return agendamentoDate.getFullYear() === data.getFullYear() &&
             agendamentoDate.getMonth() === data.getMonth() &&
             agendamentoDate.getDate() === data.getDate();
    });
  };

  const getStatusColor = (status: string, desmarcada: boolean) => {
    if (desmarcada) return 'bg-gray-100 text-gray-600';
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-primary/10 text-primary',
      realizado: 'bg-success/10 text-success',
      faltou: 'bg-destructive/10 text-destructive'
    };
    return colors[status as keyof typeof colors] || colors.pendente;
  };

  const getStatusText = (status: string, desmarcada: boolean) => {
    if (desmarcada) return 'Desmarcada';
    const texts = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      realizado: 'Realizado',
      faltou: 'Faltou'
    };
    return texts[status as keyof typeof texts] || 'Pendente';
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {getDiasSemanaDatas().map((data, index) => {
        const agendamentosDia = getAgendamentosDoDia(data);
        return (
          <Card key={index} className="min-h-[200px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">
                {diasSemana[data.getDay()]}
                <div className="text-xs text-gray-500 font-normal">
                  {data.getDate()}/{data.getMonth() + 1}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {agendamentosDia.length === 0 ? (
                <p className="text-xs text-gray-400 text-center">Sem consultas</p>
              ) : (
                agendamentosDia.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className={`p-2 border rounded text-xs ${
                      agendamento.desmarcada ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`font-medium ${agendamento.desmarcada ? 'line-through' : ''}`}>
                      {formatTimeLocal(agendamento.data_inicio)}
                    </div>
                    <div className={`text-gray-600 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                      {(agendamento as any).pacientes?.nome}
                    </div>
                    <Badge 
                      className={`${getStatusColor(agendamento.status || 'pendente', agendamento.desmarcada)} text-xs mt-1`}
                    >
                      {getStatusText(agendamento.status || 'pendente', agendamento.desmarcada)}
                    </Badge>
                    
                    <div className="flex flex-col gap-1 mt-2">
                      {!agendamento.desmarcada && agendamento.status === 'pendente' && (
                        <button
                          onClick={() => onConfirmarAgendamento(agendamento.id)}
                          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                        >
                          Confirmar
                        </button>
                      )}
                      {!agendamento.desmarcada && (
                        <button
                          onClick={() => onEditarAgendamento(agendamento)}
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Editar
                        </button>
                      )}
                      {!agendamento.desmarcada && agendamento.status === 'confirmado' && (
                        <>
                          <button
                            onClick={() => onMarcarRealizado(agendamento.id)}
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                          >
                            Realizado
                          </button>
                          <button
                            onClick={() => onDesmarcarAgendamento(agendamento.id)}
                            className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded hover:bg-destructive/90"
                          >
                            Desmarcar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
