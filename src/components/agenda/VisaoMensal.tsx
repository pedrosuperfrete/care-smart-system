import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { formatTimeLocal } from "@/lib/dateUtils";
import { BloqueioAgenda } from "@/hooks/useBloqueiosAgenda";

type Agendamento = Tables<"agendamentos"> & {
  pacientes: { nome: string } | null;
  profissionais: { nome: string } | null;
};

interface VisaoMensalProps {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  mesAno: Date;
  onDiaClick: (data: Date) => void;
}

export function VisaoMensal({ agendamentos, bloqueios, mesAno, onDiaClick }: VisaoMensalProps) {
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
            <div key={dia} className="text-center text-sm font-medium text-muted-foreground p-2">
              {dia}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {diasDoMes.map((dia, index) => {
            if (!dia) {
              return (
                <div key={index} className="min-h-[80px] bg-muted/20">
                </div>
              );
            }
            
            const isHoje = dia.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`
                  min-h-[80px] border rounded p-2 cursor-pointer transition-colors hover:bg-muted/50
                  ${isHoje ? 'bg-primary/10 border-primary/30' : ''}
                `}
                onClick={() => onDiaClick(dia)}
              >
                <div className="font-medium">{dia.getDate()}</div>
                <div className="mt-1 space-y-1">
                  {/* Mostrar bloqueios */}
                  {getBloqueiosDoDia(dia).slice(0, 1).map((bloqueio) => (
                    <div 
                      key={`bloqueio-${bloqueio.id}`} 
                      className="w-2 h-2 rounded-full bg-orange-500"
                      title={bloqueio.titulo}
                    />
                  ))}
                  
                  {/* Mostrar agendamentos */}
                  {getAgendamentosDoDia(dia).slice(0, 2).map((agendamento, index) => {
                    const status = agendamento.status || 'pendente';
                    const statusColor = getStatusColor(status);
                    return (
                      <div 
                        key={agendamento.id} 
                        className={`w-2 h-2 rounded-full ${statusColor}`}
                      />
                    );
                  })}
                  
                  {(getAgendamentosDoDia(dia).length + getBloqueiosDoDia(dia).length) > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{(getAgendamentosDoDia(dia).length + getBloqueiosDoDia(dia).length) - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}