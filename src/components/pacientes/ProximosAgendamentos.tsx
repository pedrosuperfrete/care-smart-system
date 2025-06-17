
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { Calendar, Plus, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Agendamento = Tables<'agendamentos'>;

interface ProximosAgendamentosProps {
  agendamentos: Agendamento[];
  pacienteNome: string;
  pacienteId: string;
  onClose?: () => void;
}

export function ProximosAgendamentos({ agendamentos, pacienteNome, pacienteId, onClose }: ProximosAgendamentosProps) {
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

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold">Próximos Agendamentos</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Consultas agendadas para este paciente
          </CardDescription>
          <div className="mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
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
            {agendamentos.map((agendamento) => (
              <div key={agendamento.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
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
