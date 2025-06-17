
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Prontuario = Tables<'prontuarios'>;

interface ProntuariosListProps {
  prontuarios: Prontuario[];
}

export function ProntuariosList({ prontuarios }: ProntuariosListProps) {
  return (
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
  );
}
