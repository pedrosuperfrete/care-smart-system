import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";
import { useVerificarLimitePacientes, useCreateCheckout } from "@/hooks/useAssinatura";

export function AlertaAssinatura() {
  const { data: limitePacientes } = useVerificarLimitePacientes();
  const createCheckout = useCreateCheckout();

  // Só mostra se o profissional tem mais de 2 pacientes e não tem assinatura ativa
  if (!limitePacientes || limitePacientes.assinaturaAtiva || limitePacientes.totalPacientes <= 2) {
    return null;
  }

  const handleAssinar = () => {
    createCheckout.mutate();
  };

  return (
    <Alert className="bg-destructive/15 border-destructive/30 text-destructive-foreground mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            Você possui {limitePacientes.totalPacientes} pacientes e precisa de uma assinatura ativa para continuar usando todas as funcionalidades.
          </span>
        </div>
        <Button 
          onClick={handleAssinar}
          disabled={createCheckout.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2 ml-4"
        >
          <Crown className="h-4 w-4" />
          {createCheckout.isPending ? 'Processando...' : 'Assinar Agora'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}