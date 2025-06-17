
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { usePaciente } from '@/hooks/usePacientes';
import { useProntuariosPorPaciente } from '@/hooks/useProntuarios';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { Phone, Mail, MapPin, Calendar, FileText, Edit, Plus, History, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Informações do Paciente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-3xl font-bold text-gray-900">{paciente.nome}</CardTitle>
                <Badge className={getRiscoColor(paciente.risco)}>
                  Risco {getRiscoText(paciente.risco)}
                </Badge>
              </div>
              <CardDescription className="text-base">
                Informações gerais do paciente
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-4">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">CPF</p>
                <p className="text-base">{paciente.cpf}</p>
              </div>
              {paciente.data_nascimento && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Data de Nascimento</p>
                  <p className="text-base">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {paciente.telefone && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Telefone</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-base">{paciente.telefone}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {paciente.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">E-mail</p>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-base break-all">{paciente.email}</span>
                  </div>
                </div>
              )}
              {paciente.endereco && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Endereço</p>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <span className="text-base leading-relaxed">{paciente.endereco}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {paciente.observacoes && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Observações</h4>
                <p className="text-base text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {paciente.observacoes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Próximos Agendamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Próximos Agendamentos</CardTitle>
            <CardDescription>
              Consultas agendadas para este paciente
            </CardDescription>
          </div>
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
            <p className="text-gray-500 text-center py-8">
              Nenhum agendamento futuro
            </p>
          ) : (
            <div className="space-y-4">
              {proximosAgendamentos.map((agendamento) => (
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

      {/* Prontuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Prontuários</CardTitle>
          <CardDescription>
            Histórico médico do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prontuarios.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum prontuário encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {prontuarios.slice(0, 5).map((prontuario) => (
                <div key={prontuario.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">
                        {new Date(prontuario.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(prontuario as any).profissionais?.nome || 'Profissional não informado'}
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
          <CardTitle className="text-xl">Histórico de Atendimentos</CardTitle>
          <CardDescription>
            Consultas anteriores do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historicoAgendamentos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum atendimento anterior
            </p>
          ) : (
            <div className="space-y-3">
              {historicoAgendamentos.slice(0, 5).map((agendamento) => (
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
    </div>
  );
}
