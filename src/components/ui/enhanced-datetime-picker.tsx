import * as React from "react";
import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";

interface EnhancedDateTimePickerProps {
  value?: string; // ISO string format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function EnhancedDateTimePicker({ 
  value, 
  onChange, 
  placeholder = "dd/mm/aaaa --:--",
  disabled,
  className 
}: EnhancedDateTimePickerProps) {
  const dateFromValue = value ? new Date(value) : undefined;
  
  const [inputValue, setInputValue] = useState(
    dateFromValue ? format(dateFromValue, "dd/MM/yyyy HH:mm") : ""
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(dateFromValue || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(dateFromValue ? dateFromValue.getHours().toString().padStart(2, '0') : '09');
  const [minutes, setMinutes] = useState(dateFromValue ? dateFromValue.getMinutes().toString().padStart(2, '0') : '00');

  // Gerar array de anos (100 anos atrás até 10 anos à frente)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 111 }, (_, i) => currentYear - 100 + i);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    
    // Tentar fazer parse da data conforme o usuário digita
    if (val.length === 16) {
      try {
        const parsedDate = parse(val, "dd/MM/yyyy HH:mm", new Date());
        if (isValid(parsedDate)) {
          onChange?.(parsedDate.toISOString().slice(0, 16));
          setCurrentMonth(parsedDate);
          setHours(parsedDate.getHours().toString().padStart(2, '0'));
          setMinutes(parsedDate.getMinutes().toString().padStart(2, '0'));
        }
      } catch (error) {
        // Silently ignore parse errors
      }
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      selectedDate.setHours(parseInt(hours), parseInt(minutes));
      setInputValue(format(selectedDate, "dd/MM/yyyy HH:mm"));
      onChange?.(selectedDate.toISOString().slice(0, 16));
      setCurrentMonth(selectedDate);
    }
  };

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    setHours(newHours);
    setMinutes(newMinutes);
    
    if (dateFromValue) {
      const newDate = new Date(dateFromValue);
      newDate.setHours(parseInt(newHours), parseInt(newMinutes));
      setInputValue(format(newDate, "dd/MM/yyyy HH:mm"));
      onChange?.(newDate.toISOString().slice(0, 16));
    }
  };

  const handleMonthChange = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(parseInt(year));
    setCurrentMonth(newMonth);
  };

  React.useEffect(() => {
    if (dateFromValue) {
      setInputValue(format(dateFromValue, "dd/MM/yyyy HH:mm"));
      setHours(dateFromValue.getHours().toString().padStart(2, '0'));
      setMinutes(dateFromValue.getMinutes().toString().padStart(2, '0'));
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateFromValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFromValue ? (
              format(dateFromValue, "dd/MM/yyyy HH:mm", { locale: ptBR })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            {/* Input manual para data e hora */}
            <div className="mb-3">
              <Input
                type="text"
                placeholder="DD/MM/AAAA HH:MM"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-center"
                maxLength={16}
              />
            </div>
            
            {/* Controles de navegação personalizados */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(-1)}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {format(currentMonth, "MMMM", { locale: ptBR })}
                </span>
                <Select
                  value={currentMonth.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="h-7 w-20 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-40">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(1)}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendário */}
            <DayPicker
              mode="single"
              selected={dateFromValue}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              disabled={disabled}
              showOutsideDays={true}
              className={cn("pointer-events-auto")}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "hidden",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />

            {/* Seletor de hora */}
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={hours} onValueChange={(h) => handleTimeChange(h, minutes)}>
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-lg font-medium">:</span>
                <Select value={minutes} onValueChange={(m) => handleTimeChange(hours, m)}>
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão para confirmar */}
            <div className="mt-3">
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}