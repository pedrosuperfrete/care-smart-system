
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { HorarioAtendimento } from './HorarioAtendimento';
import { useClinica } from '@/hooks/useClinica';

const tiposConsultaDisponiveis = [
  'Consulta presencial',
  'Consulta online',
  'Consulta para clínica',
  'Consulta autônoma',
  'Atendimento domiciliar',
  'Retorno/Acompanhamento',
  'Exames / Procedimentos'
];

interface InformacoesProfissionaisProps {
  profileData: any;
  setProfileData: (data: any) => void;
  handleServicoChange: (servico: string, checked: boolean) => void;
}

export function InformacoesProfissionais({ profileData, setProfileData, handleServicoChange }: InformacoesProfissionaisProps) {
  const { data: clinica } = useClinica();

  // Carregar dados da clínica quando disponíveis
  useEffect(() => {
    if (clinica && (!profileData.cnpj_clinica || !profileData.endereco_clinica)) {
      setProfileData({ 
        ...profileData, 
        cnpj_clinica: clinica.cnpj || '',
        endereco_clinica: clinica.endereco || ''
      });
    }
  }, [clinica, profileData, setProfileData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Profissionais</CardTitle>
        <CardDescription>
          Suas informações profissionais e de apresentação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mini Bio</Label>
          <Textarea
            value={profileData.mini_bio}
            onChange={(e) => setProfileData({ ...profileData, mini_bio: e.target.value })}
            placeholder="Escreva sua apresentação como se fosse para um novo paciente: especialidade, experiência e diferenciais. Seu assistente de whatsapp usará esse texto como base para apresentar seu trabalho."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Nome da Clínica</Label>
          <Input
            value={profileData.nome_clinica}
            onChange={(e) => setProfileData({ ...profileData, nome_clinica: e.target.value })}
            placeholder="Nome que será exibido aos pacientes"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CNPJ da Clínica</Label>
            <Input
              value={profileData.cnpj_clinica || ''}
              onChange={(e) => setProfileData({ ...profileData, cnpj_clinica: e.target.value })}
              placeholder="00.000.000/0001-00"
            />
          </div>

          <div className="space-y-2">
            <Label>Endereço da Clínica</Label>
            <Input
              value={profileData.endereco_clinica || ''}
              onChange={(e) => setProfileData({ ...profileData, endereco_clinica: e.target.value })}
              placeholder="Endereço completo"
            />
          </div>
        </div>

        <HorarioAtendimento
          value={profileData.horarios_atendimento}
          onChange={(horarios) => setProfileData({ ...profileData, horarios_atendimento: horarios })}
        />

        <div className="space-y-4">
          <Label>Tipo de Consultas</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tiposConsultaDisponiveis.map((servico) => (
              <div key={servico} className="flex items-center space-x-2">
                <Checkbox
                  id={servico}
                  checked={profileData.servicos_oferecidos.includes(servico)}
                  onCheckedChange={(checked) => handleServicoChange(servico, !!checked)}
                />
                <Label
                  htmlFor={servico}
                  className="text-sm font-normal cursor-pointer"
                >
                  {servico}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
