import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PagamentoSucesso() {
  const navigate = useNavigate();

  useEffect(() => {
    // Pequena animação de confete ou celebração poderia ser adicionada aqui
    document.title = 'Pagamento Confirmado - Donee';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-lg">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Pagamento Confirmado!
          </h1>
          <p className="text-gray-600">
            Sua assinatura foi ativada com sucesso.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-green-900">
            Você agora tem acesso completo a:
          </h3>
          <ul className="text-sm text-green-800 space-y-1 text-left">
            <li>• Pacientes ilimitados</li>
            <li>• Agenda completa</li>
            <li>• Relatórios financeiros</li>
            <li>• Integração com Google Calendar</li>
            <li>• Suporte prioritário</li>
          </ul>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate('/app/dashboard')}
            className="w-full"
            size="lg"
          >
            Ir para o Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            onClick={() => navigate('/app/configuracoes?tab=assinatura')}
            variant="outline"
            className="w-full"
          >
            Ver Detalhes da Assinatura
          </Button>
        </div>

        <p className="text-sm text-gray-500 pt-4">
          Em caso de dúvidas, entre em contato com nosso suporte.
        </p>
      </Card>
    </div>
  );
}
