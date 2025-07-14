import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Crown } from "lucide-react";
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
    <Card 
      className="mb-6 p-4 border-0 shadow-sm animate-fade-in" 
      style={{ backgroundColor: '#FFF8E1' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">
              Você atingiu o limite gratuito de 3 pacientes.
            </span>
            <span className="ml-1">
              Para continuar utilizando todos os recursos da plataforma, ative sua assinatura.
            </span>
          </div>
        </div>
        <Button 
          onClick={handleAssinar}
          disabled={createCheckout.isPending}
          className="flex-shrink-0 ml-4 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
          style={{ 
            backgroundColor: '#264c43',
            color: 'white'
          }}
        >
          <Crown className="h-4 w-4" />
          {createCheckout.isPending ? 'Processando...' : 'Ativar Assinatura'}
        </Button>
      </div>
    </Card>
  );
}