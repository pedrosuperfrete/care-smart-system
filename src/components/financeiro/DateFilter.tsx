
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';

interface DateFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
}

export function DateFilter({ startDate, endDate, onDateChange }: DateFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(
    startDate ? startDate.toISOString().split('T')[0] : ''
  );
  const [localEndDate, setLocalEndDate] = useState(
    endDate ? endDate.toISOString().split('T')[0] : ''
  );

  const handleApplyFilter = () => {
    const start = localStartDate ? new Date(localStartDate) : undefined;
    const end = localEndDate ? new Date(localEndDate) : undefined;
    onDateChange(start, end);
    console.log('Filtro de data aplicado:', { start, end });
  };

  const handleClearFilter = () => {
    setLocalStartDate('');
    setLocalEndDate('');
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
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="w-40"
              placeholder="Data inicial"
            />
            <span className="text-gray-500">até</span>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="w-40"
              placeholder="Data final"
            />
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
