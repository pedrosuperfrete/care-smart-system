
import { useState } from 'react';
import { usePaciente } from '@/hooks/usePacientes';
import { useProntuariosPorPaciente } from '@/hooks/useProntuarios';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { PacienteInfo } from '@/components/pacientes/PacienteInfo';
import { ProximosAgendamentos } from '@/components/pacientes/ProximosAgendamentos';
import { ProntuariosList } from '@/components/pacientes/ProntuariosList';
import { HistoricoAtendimentos } from '@/components/pacientes/HistoricoAtendimentos';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { NovoProntuarioModal } from '@/components/prontuarios/NovoProntuarioModal';

interface PacienteDetalhesProps {
  pacienteId: string;
  onClose?: () => void;
}

export function PacienteDetalhes({ pacienteId, onClose }: PacienteDetalhesProps) {
  const [showNovoProntuario, setShowNovoProntuario] = useState(false);
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prontuários</h3>
          <Button
            onClick={() => setShowNovoProntuario(true)}
            size="sm"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Novo Prontuário
          </Button>
        </div>
        <ProntuariosList prontuarios={prontuarios} />
      </div>

      <HistoricoAtendimentos agendamentos={historicoAgendamentos} />

      <NovoProntuarioModal
        isOpen={showNovoProntuario}
        onClose={() => setShowNovoProntuario(false)}
        pacienteId={pacienteId}
      />
    </div>
  );
}
