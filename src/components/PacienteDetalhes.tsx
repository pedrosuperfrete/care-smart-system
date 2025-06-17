
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePaciente } from '@/hooks/usePacientes';
import { useProntuariosPorPaciente } from '@/hooks/useProntuarios';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { Phone, Mail, MapPin, Calendar, FileText, Edit, Plus, History } from 'lucide-react';

interface PacienteDetalhesProps {
  pacienteId: string;
  onClose?: () => void;
}

export function PacienteDetalhes({ pacienteId, onClose }: PacienteDetalhesProps) {
  const { data: paciente, isLoading } = usePaciente(pacienteId);
  const { data: prontuarios = [] } = useProntuariosPorPaciente(pacienteId);
  const { data: agendamentos = [] } = useAgendamentos();

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!paciente) {
    return <div className="p-6">Paciente não encontrado</div>;
  }

  const agendamentosPaciente = agendamentos.filter(ag => ag.paciente_id === pacienteId);
  const proximosAgendamentos = agendamentosPaciente.filter(ag => 
    new Date(ag.data_inicio) >= new Date()
  );
  const historicoAgendamentos = agendamentosPaciente.filter(ag => 
    new Date(ag.data_inicio) < new Date()
  );

  const getRiscoColor = (risco: string | null) => {
    const colors = {
      baixo: 'bg-green-100 text-green-800',
      medio: 'bg-yellow-100 text-yellow-800',
      alto: 'bg-red-100 text-red-800'
    };
    return colors[risco as keyof typeof colors] || colors.baixo;
  };

  const getRiscoText = (risco: string | null) => {
    const texts = {
      baixo: 'Baixo',
      medio: 'Médio',
      alto: 'Alto'
    };
    return texts[risco as keyof typeof texts] || 'Baixo';
  };

  return (
    <div className="space-y-6">
      {/* Informações do Paciente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-2xl">{paciente.nome}</CardTitle>
              <Badge className={getRiscoColor(paciente.risco)}>
                Risco {getRiscoText(paciente.risco)}
              </Badge>
            </div>
            <CardDescription>
              Informações gerais do paciente
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
                <DialogDescription>
                  Atualize as informações do paciente
                </DialogDescription>
              </DialogHeader>
              <PacienteForm paciente={paciente} onSuccess={onClose} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p><strong>CPF:</strong> {paciente.cpf}</p>
              {paciente.data_nascimento && (
                <p><strong>Nascimento:</strong> {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              {paciente.telefone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{paciente.telefone}</span>
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{paciente.email}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {paciente.endereco && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-2">{paciente.endereco}</span>
                </div>
              )}
            </div>
          </div>
          
          {paciente.observacoes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm">
                <strong>Observações:</strong> {paciente.observacoes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximos Agendamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>
              Consultas agendadas para este paciente
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agendar Nova Consulta</DialogTitle>
                <DialogDescription>
                  Criar um novo agendamento para {paciente.nome}
                </DialogDescription>
              </DialogHeader>
              <AgendamentoForm 
                pacienteId={paciente.id} 
                onSuccess={onClose}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {proximosAgendamentos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum agendamento futuro
            </p>
          ) : (
            <div className="space-y-3">
              {proximosAgendamentos.map((agendamento) => (
                <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">
                        {new Date(agendamento.data_inicio).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {agendamento.tipo_servico} - {(agendamento as any).profissionais?.nome}
                      </div>
                    </div>
                  </div>
                  <Badge variant={agendamento.confirmado_pelo_paciente ? 'default' : 'secondary'}>
                    {agendamento.confirmado_pelo_paciente ? 'Confirmado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prontuários */}
      <Card>
        <CardHeader>
          <CardTitle>Prontuários</CardTitle>
          <CardDescription>
            Histórico médico do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prontuarios.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum prontuário encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {prontuarios.slice(0, 5).map((prontuario) => (
                <div key={prontuario.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">
                        {new Date(prontuario.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(prontuario as any).profissionais?.nome}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Atendimentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atendimentos</CardTitle>
          <CardDescription>
            Consultas anteriores do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historicoAgendamentos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum atendimento anterior
            </p>
          ) : (
            <div className="space-y-3">
              {historicoAgendamentos.slice(0, 5).map((agendamento) => (
                <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <History className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">
                        {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {agendamento.tipo_servico} - {(agendamento as any).profissionais?.nome}
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
    </div>
  );
}
