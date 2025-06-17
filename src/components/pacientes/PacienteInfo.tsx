
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { Phone, Mail, MapPin, Edit } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Paciente = Tables<'pacientes'>;

interface PacienteInfoProps {
  paciente: Paciente;
  onClose?: () => void;
}

export function PacienteInfo({ paciente, onClose }: PacienteInfoProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{paciente.nome}</CardTitle>
            <Badge className={`${getRiscoColor(paciente.risco)} mb-4`}>
              Risco {getRiscoText(paciente.risco)}
            </Badge>
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
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">CPF</p>
            <p className="text-base text-gray-900">{paciente.cpf}</p>
          </div>
          
          {paciente.email && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">E-mail</p>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-base text-gray-900">{paciente.email}</span>
              </div>
            </div>
          )}
          
          {paciente.data_nascimento && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Data de Nascimento</p>
              <p className="text-base text-gray-900">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          
          {paciente.endereco && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Endereço</p>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <span className="text-base text-gray-900 leading-relaxed">{paciente.endereco}</span>
              </div>
            </div>
          )}
          
          {paciente.telefone && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Telefone</p>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-base text-gray-900">{paciente.telefone}</span>
              </div>
            </div>
          )}
        </div>
        
        {paciente.observacoes && (
          <>
            <Separator className="my-6" />
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Observações</h4>
              <div className="bg-muted p-4 rounded-lg border">
                <p className="text-base text-gray-700 leading-relaxed">
                  {paciente.observacoes}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
