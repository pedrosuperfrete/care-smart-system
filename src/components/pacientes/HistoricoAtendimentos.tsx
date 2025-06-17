
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Agendamento = Tables<'agendamentos'>;

interface HistoricoAtendimentosProps {
  agendamentos: Agendamento[];
}

export function HistoricoAtendimentos({ agendamentos }: HistoricoAtendimentosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Histórico de Atendimentos</CardTitle>
        <CardDescription>
          Consultas anteriores do paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {agendamentos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum atendimento anterior
          </p>
        ) : (
          <div className="space-y-3">
            {agendamentos.slice(0, 5).map((agendamento) => (
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
