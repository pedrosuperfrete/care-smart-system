
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Crown } from 'lucide-react';
import { useLimitePacientes } from '@/hooks/usePlanos';
import { usePlanos } from '@/hooks/usePlanos';
import { PacienteForm } from './PacienteForm';

interface PacienteFormWithLimitProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingPaciente?: any;
}

export function PacienteFormWithLimit({ isOpen, onClose, onSuccess, editingPaciente }: PacienteFormWithLimitProps) {
  const { atingiuLimite, podeAdicionarPaciente, planoAtual, contadorPacientes } = useLimitePacientes();
  const { createCheckoutSession } = usePlanos();
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const handleFormSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleUpgrade = () => {
    createCheckoutSession.mutate('price_1RbqlPH56oqrru1DGeZDWA6b');
    setShowLimitDialog(false);
  };

  // Se não for edição e não pode adicionar paciente (plano free com limite atingido)
  if (isOpen && !editingPaciente && !podeAdicionarPaciente && planoAtual === 'free') {
    return (
      <Dialog open={true} onOpenChange={() => {
        setShowLimitDialog(false);
        onClose();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
              Limite de Pacientes Atingido
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Você atingiu o limite de {contadorPacientes} pacientes do plano gratuito. 
                    Para cadastrar mais pacientes, faça upgrade para o plano Profissional.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Plano Profissional</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>✓ Pacientes ilimitados</li>
                    <li>✓ Todos os recursos atuais</li>
                    <li>✓ Suporte prioritário</li>
                  </ul>
                  <p className="text-blue-900 font-semibold mt-2">R$ 399/mês</p>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={handleUpgrade}
                    disabled={createCheckoutSession.isPending}
                    className="flex-1"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    {createCheckoutSession.isPending ? 'Carregando...' : 'Assinar Plano Profissional'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PacienteForm
          paciente={editingPaciente}
          onSuccess={handleFormSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
