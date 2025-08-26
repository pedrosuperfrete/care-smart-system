
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface OnboardingStep1Props {
  data: {
    nome: string;
    mini_bio: string;
    servicos_oferecidos: string[];
  };
  onDataChange: (data: any) => void;
  onNext: () => void;
}

export function OnboardingStep1({ data, onDataChange, onNext }: OnboardingStep1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!data.nome.trim()) {
      newErrors.nome = 'Nome completo é obrigatório';
    }

    if (!data.mini_bio.trim()) {
      newErrors.mini_bio = 'Mini bio é obrigatória';
    }

    if (data.servicos_oferecidos.length === 0) {
      newErrors.servicos_oferecidos = 'Selecione pelo menos um serviço';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const handleServicoChange = (servico: string, checked: boolean) => {
    const newServicos = checked 
      ? [...data.servicos_oferecidos, servico]
      : data.servicos_oferecidos.filter(s => s !== servico);
    
    onDataChange({ ...data, servicos_oferecidos: newServicos });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete seu Perfil - Etapa 1 de 2</CardTitle>
        <CardDescription>
          Vamos conhecer você melhor para personalizar sua experiência
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => onDataChange({ ...data, nome: e.target.value })}
              placeholder="Seu nome completo"
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mini_bio">Mini Bio *</Label>
            <Textarea
              id="mini_bio"
              value={data.mini_bio}
              onChange={(e) => onDataChange({ ...data, mini_bio: e.target.value })}
              placeholder="Escreva sua apresentação como se fosse para um novo paciente: especialidade, experiência e diferenciais. Seu assistente de whatsapp usará esse texto como base para apresentar seu trabalho."
              rows={4}
            />
            {errors.mini_bio && (
              <p className="text-sm text-red-600">{errors.mini_bio}</p>
            )}
          </div>

          <div className="space-y-4">
            <Label>Serviços Oferecidos *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servicosDisponiveis.map((servico) => (
                <div key={servico} className="flex items-center space-x-2">
                  <Checkbox
                    id={servico}
                    checked={data.servicos_oferecidos.includes(servico)}
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
            {errors.servicos_oferecidos && (
              <p className="text-sm text-red-600">{errors.servicos_oferecidos}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Próxima Etapa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
