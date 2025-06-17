
import { usePaciente } from '@/hooks/usePacientes';
import { useProntuariosPorPaciente } from '@/hooks/useProntuarios';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { PacienteInfo } from '@/components/pacientes/PacienteInfo';
import { ProximosAgendamentos } from '@/components/pacientes/ProximosAgendamentos';
import { ProntuariosList } from '@/components/pacientes/ProntuariosList';
import { HistoricoAtendimentos } from '@/components/pacientes/HistoricoAtendimentos';

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

  return (
    <div className="space-y-6">
      <PacienteInfo paciente={paciente} onClose={onClose} />
      
      <ProximosAgendamentos 
        agendamentos={proximosAgendamentos}
        pacienteNome={paciente.nome}
        pacienteId={paciente.id}
        onClose={onClose}
      />

      <ProntuariosList prontuarios={prontuarios} />

      <HistoricoAtendimentos agendamentos={historicoAgendamentos} />
    </div>
  );
}
