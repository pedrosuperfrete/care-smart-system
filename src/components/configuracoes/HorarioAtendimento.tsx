import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy } from 'lucide-react';

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

const diasUteis = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];

export function HorarioAtendimento({ value, onChange }: HorarioAtendimentoProps) {
  const horarios = typeof value === 'string' ? {} : (value || {});
  const [massaInicio, setMassaInicio] = useState('08:00');
  const [massaFim, setMassaFim] = useState('18:00');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handlePreencherDiasUteis = () => {
    const newHorarios = { ...horarios };
    diasUteis.forEach(dia => {
      newHorarios[dia] = {
        ativo: true,
        inicio: massaInicio,
        fim: massaFim
      };
    });
    onChange(newHorarios);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Horários de Atendimento</Label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Preencher dias úteis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Preencher dias úteis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Preencher Segunda a Sexta com o mesmo horário:
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="massa-inicio" className="text-sm">Início</Label>
                  <Input
                    id="massa-inicio"
                    type="time"
                    value={massaInicio}
                    onChange={(e) => setMassaInicio(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="massa-fim" className="text-sm">Fim</Label>
                  <Input
                    id="massa-fim"
                    type="time"
                    value={massaFim}
                    onChange={(e) => setMassaFim(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handlePreencherDiasUteis} className="w-full">
                Aplicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
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
