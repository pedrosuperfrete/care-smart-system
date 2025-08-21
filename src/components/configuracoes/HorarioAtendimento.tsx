import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface HorarioAtendimentoProps {
  value: any;
  onChange: (horarios: any) => void;
}

const diasSemana = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export function HorarioAtendimento({ value, onChange }: HorarioAtendimentoProps) {
  const horarios = typeof value === 'string' ? {} : (value || {});

  const handleDiaChange = (dia: string, checked: boolean) => {
    const newHorarios = { ...horarios };
    if (checked) {
      newHorarios[dia] = {
        ativo: true,
        inicio: '08:00',
        fim: '18:00'
      };
    } else {
      delete newHorarios[dia];
    }
    onChange(newHorarios);
  };

  const handleHorarioChange = (dia: string, field: 'inicio' | 'fim', valor: string) => {
    const newHorarios = {
      ...horarios,
      [dia]: {
        ...horarios[dia],
        [field]: valor
      }
    };
    onChange(newHorarios);
  };

  return (
    <div className="space-y-4">
      <Label>Horários de Atendimento</Label>
      <div className="space-y-3">
        {diasSemana.map((dia) => (
          <div key={dia.key} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex items-center space-x-2 min-w-[140px]">
              <Checkbox
                id={dia.key}
                checked={!!horarios[dia.key]?.ativo}
                onCheckedChange={(checked) => handleDiaChange(dia.key, !!checked)}
              />
              <Label htmlFor={dia.key} className="font-medium cursor-pointer">
                {dia.label}
              </Label>
            </div>

            {horarios[dia.key]?.ativo && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${dia.key}-inicio`} className="text-sm">
                    Início:
                  </Label>
                  <Input
                    id={`${dia.key}-inicio`}
                    type="time"
                    value={horarios[dia.key]?.inicio || '08:00'}
                    onChange={(e) => handleHorarioChange(dia.key, 'inicio', e.target.value)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${dia.key}-fim`} className="text-sm">
                    Fim:
                  </Label>
                  <Input
                    id={`${dia.key}-fim`}
                    type="time"
                    value={horarios[dia.key]?.fim || '18:00'}
                    onChange={(e) => handleHorarioChange(dia.key, 'fim', e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}