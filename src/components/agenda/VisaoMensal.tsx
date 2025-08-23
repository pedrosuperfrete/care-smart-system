
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { isSameDayLocal } from '@/lib/dateUtils';

type Agendamento = Tables<'agendamentos'>;

interface VisaoMensalProps {
  agendamentos: Agendamento[];
  mesAno: Date;
  onDiaClick: (data: Date) => void;
}

export function VisaoMensal({ agendamentos, mesAno, onDiaClick }: VisaoMensalProps) {
  const getDiasDoMes = () => {
    const ano = mesAno.getFullYear();
    const mes = mesAno.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasDoMes = [];
    
    // Adicionar dias vazios no início para alinhamento
    const diaSemanaInicio = primeiroDia.getDay();
    for (let i = 0; i < diaSemanaInicio; i++) {
      diasDoMes.push(null);
    }
    
    // Adicionar todos os dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasDoMes.push(new Date(ano, mes, dia));
    }
    
    return diasDoMes;
  };

  const getAgendamentosDoDia = (data: Date | null) => {
    if (!data) return [];
    return agendamentos.filter(ag => {
      const agendamentoDate = new Date(ag.data_inicio);
      return agendamentoDate.getFullYear() === data.getFullYear() &&
             agendamentoDate.getMonth() === data.getMonth() &&
             agendamentoDate.getDate() === data.getDate();
    });
  };

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasDoMes = getDiasDoMes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {mesAno.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-center text-sm font-medium text-gray-500 p-2">
              {dia}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {diasDoMes.map((data, index) => {
            const agendamentosDia = getAgendamentosDoDia(data);
            const isHoje = data && data.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`
                  min-h-[60px] border rounded p-1 cursor-pointer transition-colors
                  ${data ? 'hover:bg-gray-50' : 'bg-gray-100'}
                  ${isHoje ? 'bg-primary/10 border-primary/30' : ''}
                `}
                onClick={() => data && onDiaClick(data)}
              >
                {data && (
                  <>
                    <div className={`text-sm ${isHoje ? 'font-bold text-primary' : ''}`}>
                      {data.getDate()}
                    </div>
                    {agendamentosDia.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agendamentosDia.slice(0, 3).map((ag, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              ag.desmarcada ? 'bg-gray-300' :
                              ag.status === 'confirmado' ? 'bg-primary' :
                              ag.status === 'pendente' ? 'bg-warning' :
                              ag.status === 'realizado' ? 'bg-success' : 'bg-destructive'
                            }`}
                          />
                        ))}
                        {agendamentosDia.length > 3 && (
                          <div className="text-xs text-gray-500">+{agendamentosDia.length - 3}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
