import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
}

export function DateFilter({ startDate, endDate, onDateChange }: DateFilterProps) {
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(endDate);

  const handleApplyFilter = () => {
    onDateChange(localStartDate, localEndDate);
    console.log('Filtro de data aplicado:', { start: localStartDate, end: localEndDate });
  };

  const handleClearFilter = () => {
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
    onDateChange(undefined, undefined);
    console.log('Filtro de data limpo');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !localStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localStartDate ? format(localStartDate, "dd/MM/yyyy") : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localStartDate}
                  onSelect={setLocalStartDate}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-gray-500">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !localEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localEndDate ? format(localEndDate, "dd/MM/yyyy") : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localEndDate}
                  onSelect={setLocalEndDate}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleApplyFilter} size="sm">
              Aplicar
            </Button>
            <Button onClick={handleClearFilter} variant="outline" size="sm">
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
