
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Agendamento = Tables<'agendamentos'>;

interface VisaoSemanalProps {
  agendamentos: Agendamento[];
  semanaInicio: Date;
  onEditarAgendamento: (agendamento: Agendamento) => void;
  onConfirmarAgendamento: (id: string) => void;
  onDesmarcarAgendamento: (id: string) => void;
}

export function VisaoSemanal({ 
  agendamentos, 
  semanaInicio,
  onEditarAgendamento,
  onConfirmarAgendamento, 
  onDesmarcarAgendamento 
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
    return agendamentos.filter(ag => 
      new Date(ag.data_inicio).toDateString() === data.toDateString()
    );
  };

  const getStatusColor = (status: string, desmarcada: boolean) => {
    if (desmarcada) return 'bg-gray-100 text-gray-600';
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-blue-100 text-blue-800',
      realizado: 'bg-green-100 text-green-800',
      faltou: 'bg-red-100 text-red-800'
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
                      {new Date(agendamento.data_inicio).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className={`text-gray-600 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                      {(agendamento as any).pacientes?.nome}
                    </div>
                    <Badge 
                      className={`${getStatusColor(agendamento.status || 'pendente', agendamento.desmarcada)} text-xs mt-1`}
                    >
                      {getStatusText(agendamento.status || 'pendente', agendamento.desmarcada)}
                    </Badge>
                    
                    <div className="flex gap-1 mt-2">
                      {!agendamento.desmarcada && agendamento.status === 'pendente' && (
                        <button
                          onClick={() => onConfirmarAgendamento(agendamento.id)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
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
                        <button
                          onClick={() => onDesmarcarAgendamento(agendamento.id)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Desmarcar
                        </button>
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
