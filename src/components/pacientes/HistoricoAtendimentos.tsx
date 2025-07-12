
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useState } from 'react';

type Agendamento = Tables<'agendamentos'>;

interface HistoricoAtendimentosProps {
  agendamentos: Agendamento[];
}

export function HistoricoAtendimentos({ agendamentos }: HistoricoAtendimentosProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(agendamentos.length / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = agendamentos.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Histórico de Atendimentos</CardTitle>
            <CardDescription>
              Consultas anteriores do paciente
            </CardDescription>
          </div>
          {agendamentos.length > itemsPerPage && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
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
        {agendamentos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum atendimento anterior
          </p>
        ) : (
          <div className="space-y-3">
            {currentItems.map((agendamento) => (
              <div key={agendamento.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <History className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">
                      {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {agendamento.tipo_servico} - {(agendamento as any).profissionais?.nome || 'Profissional não informado'}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {agendamento.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
