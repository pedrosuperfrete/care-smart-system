
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { Calendar, Plus, User, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useState } from 'react';

type Agendamento = Tables<'agendamentos'>;

interface ProximosAgendamentosProps {
  agendamentos: Agendamento[];
  pacienteNome: string;
  pacienteId: string;
  onClose?: () => void;
}

export function ProximosAgendamentos({ agendamentos, pacienteNome, pacienteId, onClose }: ProximosAgendamentosProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(agendamentos.length / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = agendamentos.slice(startIndex, endIndex);

  const getStatusIcon = (confirmado: boolean | null) => {
    return confirmado ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    );
  };

  const getStatusColor = (confirmado: boolean | null) => {
    return confirmado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

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
            <CardTitle className="text-xl font-bold">Próximos Agendamentos</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Consultas agendadas para este paciente
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Consulta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agendar Nova Consulta</DialogTitle>
                  <DialogDescription>
                    Criar um novo agendamento para {pacienteNome}
                  </DialogDescription>
                </DialogHeader>
                <AgendamentoForm 
                  pacienteId={pacienteId} 
                  onSuccess={onClose}
                />
              </DialogContent>
            </Dialog>
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
        </div>
      </CardHeader>
      <CardContent>
        {agendamentos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum agendamento futuro
          </p>
        ) : (
          <div className="space-y-4">
            {currentItems.map((agendamento) => (
              <div key={agendamento.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {new Date(agendamento.data_inicio).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {agendamento.tipo_servico}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                        <User className="h-3 w-3" />
                        <span>{(agendamento as any).profissionais?.nome || 'Profissional não informado'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(agendamento.confirmado_pelo_paciente)}
                    <Badge className={getStatusColor(agendamento.confirmado_pelo_paciente)}>
                      {agendamento.confirmado_pelo_paciente ? 'Confirmado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
