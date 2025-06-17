
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, X } from 'lucide-react';

interface FiltroDataProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function FiltroData({ onDateRangeChange }: FiltroDataProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleApplyFilter = () => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    onDateRangeChange(start, end);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange(null, null);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Label htmlFor="start-date" className="text-sm font-medium">
              Período:
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-sm text-gray-500">até</span>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleApplyFilter} size="sm">
            Aplicar
          </Button>
          <Button onClick={handleClearFilter} variant="outline" size="sm">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
