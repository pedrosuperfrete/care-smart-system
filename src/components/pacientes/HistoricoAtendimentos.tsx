
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useState } from 'react';
import { formatDateTimeLocal } from '@/lib/dateUtils';

type Agendamento = Tables<'agendamentos'>;

interface HistoricoAtendimentosProps {
  agendamentos: Agendamento[];
}

export function HistoricoAtendimentos({ agendamentos }: HistoricoAtendimentosProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  
  // Ordenar por data, mais recentes primeiro
  const sortedAgendamentos = [...agendamentos].sort((a, b) => 
    new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
  );
  
  const totalPages = Math.ceil(sortedAgendamentos.length / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedAgendamentos.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const getStatusText = (agendamento: Agendamento) => {
    if (agendamento.desmarcada) return 'Desmarcada';
    switch (agendamento.status) {
      case 'realizado': return 'Realizado';
      case 'confirmado': return 'Confirmado';
      case 'pendente': return 'Pendente';
      case 'faltou': return 'Faltou';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (agendamento: Agendamento) => {
    if (agendamento.desmarcada) return 'bg-muted text-muted-foreground';
    switch (agendamento.status) {
      case 'realizado': return 'bg-success text-success-foreground';
      case 'confirmado': return 'bg-primary text-primary-foreground';
      case 'pendente': return 'bg-warning text-warning-foreground';
      case 'faltou': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Histórico de Atendimentos</CardTitle>
            <CardDescription>
              Todas as consultas do paciente ({sortedAgendamentos.length} {sortedAgendamentos.length === 1 ? 'consulta' : 'consultas'})
            </CardDescription>
          </div>
          {sortedAgendamentos.length > itemsPerPage && (
            <div className="flex items-center justify-center sm:justify-end space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {currentPage + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedAgendamentos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum atendimento registrado
          </p>
        ) : (
          <div className="space-y-3">
            {currentItems.map((agendamento) => {
              const isRealizado = agendamento.status === 'realizado' && !agendamento.desmarcada;
              
              return (
                <div 
                  key={agendamento.id} 
                  className={`p-4 border rounded-lg ${agendamento.desmarcada ? 'bg-muted/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <History className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${agendamento.desmarcada ? 'line-through text-muted-foreground' : ''}`}>
                            {formatDateTimeLocal(agendamento.data_inicio)}
                          </span>
                          <Badge className={getStatusColor(agendamento)}>
                            {getStatusText(agendamento)}
                          </Badge>
                        </div>
                        <div className={`text-sm text-muted-foreground mt-1 ${agendamento.desmarcada ? 'line-through' : ''}`}>
                          <span className="font-medium text-foreground">{agendamento.tipo_servico}</span>
                          {' • '}
                          {(agendamento as any).profissionais?.nome || 'Profissional não informado'}
                        </div>
                        
                        {/* Mostrar valor apenas para consultas realizadas */}
                        {isRealizado && agendamento.valor && (
                          <div className="mt-2 text-sm">
                            <span className="font-semibold text-success">
                              {formatCurrency(agendamento.valor)}
                            </span>
                          </div>
                        )}
                        
                        {/* Observações se houver */}
                        {agendamento.observacoes && (
                          <div className="mt-2 text-sm text-muted-foreground italic">
                            {agendamento.observacoes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
