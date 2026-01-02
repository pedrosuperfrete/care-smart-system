
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { Phone, Mail, MapPin, Edit, Calendar, User, CreditCard, Building } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { fromLocalDateString, calcularIdade } from '@/lib/dateUtils';

type Paciente = Tables<'pacientes'>;

interface PacienteInfoProps {
  paciente: Paciente;
  onClose?: () => void;
}

export function PacienteInfo({ paciente, onClose }: PacienteInfoProps) {
  const getTipoPacienteColor = (tipoPaciente: string | null) => {
    const colors = {
      novo: 'bg-blue-100 text-blue-800',
      recorrente: 'bg-yellow-100 text-yellow-800',
      antigo: 'bg-green-100 text-green-800'
    };
    return colors[tipoPaciente as keyof typeof colors] || colors.novo;
  };

  const getTipoPacienteText = (tipoPaciente: string | null) => {
    const texts = {
      novo: 'Novo',
      recorrente: 'Recorrente',
      antigo: 'Antigo'
    };
    return texts[tipoPaciente as keyof typeof texts] || 'Novo';
  };

  const getModalidadeText = (modalidade: string | null) => {
    const texts: Record<string, string> = {
      'plano': 'Atendimento pelo plano',
      'particular_reembolso': 'Particular com reembolso',
      'particular': 'Particular'
    };
    return modalidade ? texts[modalidade] || modalidade : '-';
  };

  // Monta o endereço completo
  const enderecoCompleto = [
    paciente.endereco,
    paciente.bairro,
    paciente.cidade && paciente.estado ? `${paciente.cidade} - ${paciente.estado}` : (paciente.cidade || paciente.estado),
    paciente.cep
  ].filter(Boolean).join(', ');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{paciente.nome}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={getTipoPacienteColor(paciente.tipo_paciente)}>
                {getTipoPacienteText(paciente.tipo_paciente)}
              </Badge>
              {paciente.inadimplente && (
                <Badge className="bg-red-100 text-red-800">Inadimplente</Badge>
              )}
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Dados Pessoais */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Dados Pessoais</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">CPF</p>
                <p className="text-base text-gray-900">{paciente.cpf || '-'}</p>
              </div>
              
              {paciente.data_nascimento && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Data de Nascimento</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-900">
                      {fromLocalDateString(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                      {calcularIdade(paciente.data_nascimento) !== null && (
                        <span className="text-muted-foreground ml-2">({calcularIdade(paciente.data_nascimento)} anos)</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
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
            
            {paciente.telefone && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Telefone</p>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-base text-gray-900">{paciente.telefone}</span>
                </div>
              </div>
            )}

            {enderecoCompleto && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Endereço</p>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <span className="text-base text-gray-900 leading-relaxed">{enderecoCompleto}</span>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita - Informações de Atendimento */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Informações de Atendimento</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Tipo de Paciente</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-base text-gray-900">{getTipoPacienteText(paciente.tipo_paciente)}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Modalidade</p>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-base text-gray-900">{getModalidadeText(paciente.modalidade_atendimento)}</span>
                </div>
              </div>
            </div>

            {paciente.origem && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Origem</p>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-base text-gray-900">{paciente.origem}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {paciente.observacoes && (
          <>
            <Separator className="my-6" />
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Observações</h4>
              <div className="bg-muted p-4 rounded-lg border">
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
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
