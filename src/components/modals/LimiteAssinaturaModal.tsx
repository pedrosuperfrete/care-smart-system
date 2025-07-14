import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Users } from 'lucide-react';
import { useCreateCheckout } from '@/hooks/useAssinatura';

interface LimiteAssinaturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LimiteAssinaturaModal({ open, onOpenChange }: LimiteAssinaturaModalProps) {
  const createCheckout = useCreateCheckout();

  const handleAssinar = () => {
    createCheckout.mutate();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Limite de Pacientes Atingido
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Você já possui 2 pacientes cadastrados</span>
            </div>
            
            <p>
              Para continuar cadastrando pacientes e ter acesso completo à plataforma, 
              assine nosso plano anual por apenas <strong>R$ 1.000,00</strong>.
            </p>
            
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Benefícios da assinatura:</h4>
              <ul className="text-sm space-y-1">
                <li>• Pacientes ilimitados</li>
                <li>• Agenda completa</li>
                <li>• Relatórios financeiros</li>
                <li>• Integração com Google Calendar</li>
                <li>• Suporte prioritário</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleAssinar}>
            Assinar Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}