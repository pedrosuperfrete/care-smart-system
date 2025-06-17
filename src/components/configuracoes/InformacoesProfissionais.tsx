
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const servicosDisponiveis = [
  'Consulta presencial',
  'Teleconsulta',
  'Psicologia',
  'Nutricionista',
  'Atendimento domiciliar',
  'Retorno',
  'Exames clínicos',
  'Sessões de psicoterapia'
];

interface InformacoesProfissionaisProps {
  profileData: any;
  setProfileData: (data: any) => void;
  handleServicoChange: (servico: string, checked: boolean) => void;
}

export function InformacoesProfissionais({ profileData, setProfileData, handleServicoChange }: InformacoesProfissionaisProps) {
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
            placeholder="Conte um pouco sobre você e sua experiência profissional..."
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

        <div className="space-y-2">
          <Label>Horários de Atendimento</Label>
          <Textarea
            value={profileData.horarios_atendimento}
            onChange={(e) => setProfileData({ ...profileData, horarios_atendimento: e.target.value })}
            placeholder="Ex: Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <Label>Serviços Oferecidos</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {servicosDisponiveis.map((servico) => (
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
