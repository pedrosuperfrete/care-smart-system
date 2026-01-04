import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { Tables } from '@/integrations/supabase/types';

type Paciente = Tables<'pacientes'>;

interface EditarPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: Paciente | null;
  onSuccess?: () => void;
}

export function EditarPacienteModal({ 
  open, 
  onOpenChange, 
  paciente,
  onSuccess 
}: EditarPacienteModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  if (!paciente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <PacienteForm 
          paciente={paciente} 
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
