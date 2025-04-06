import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TimePickerInput({
  value,
  onChange,
  className,
  placeholder = "Seleccionar hora",
  disabled = false,
}: TimePickerInputProps) {
  const [hours, setHours] = useState(() => value ? parseInt(value.split(':')[0]) : 9);
  const [minutes, setMinutes] = useState(() => value ? parseInt(value.split(':')[1]) : 0);
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => {
    if (!value) return 'AM';
    const hour = parseInt(value.split(':')[0]);
    return hour >= 12 ? 'PM' : 'AM';
  });

  // Actualizar el valor cuando cambian las horas o minutos
  React.useEffect(() => {
    const formattedHours = period === 'PM' && hours !== 12 
      ? hours + 12 
      : (period === 'AM' && hours === 12 ? 0 : hours);
    
    const formattedTime = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange(formattedTime);
  }, [hours, minutes, period, onChange]);

  // Actualizar los estados cuando cambia el valor externamente
  React.useEffect(() => {
    if (value) {
      const [hoursStr, minutesStr] = value.split(':');
      const parsedHours = parseInt(hoursStr);
      
      if (parsedHours >= 12) {
        setHours(parsedHours === 12 ? 12 : parsedHours - 12);
        setPeriod('PM');
      } else {
        setHours(parsedHours === 0 ? 12 : parsedHours);
        setPeriod('AM');
      }
      
      setMinutes(parseInt(minutesStr));
    }
  }, [value]);

  const incrementHours = () => {
    setHours(prev => (prev % 12) + 1);
  };

  const decrementHours = () => {
    setHours(prev => prev === 1 ? 12 : prev - 1);
  };

  const incrementMinutes = () => {
    setMinutes(prev => {
      const newMinutes = (prev + 15) % 60;
      if (newMinutes === 0 && prev !== 45) {
        incrementHours();
      }
      return newMinutes;
    });
  };

  const decrementMinutes = () => {
    setMinutes(prev => {
      const newMinutes = prev === 0 ? 45 : prev - 15;
      if (newMinutes === 45 && prev === 0) {
        decrementHours();
      }
      return newMinutes;
    });
  };

  const togglePeriod = () => {
    setPeriod(prev => prev === 'AM' ? 'PM' : 'AM');
  };

  return (
    <div className={cn("flex flex-row items-center space-x-2", className)}>
      <div className="relative flex items-center">
        <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <div className="flex items-center border rounded-md">
          <div className="flex flex-col items-center px-2 py-1 border-r">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0" 
              onClick={incrementHours}
              disabled={disabled}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <span className="mx-2 text-center w-6">
              {hours.toString().padStart(2, '0')}
            </span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0" 
              onClick={decrementHours}
              disabled={disabled}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-center mx-1">:</div>
          
          <div className="flex flex-col items-center px-2 py-1 border-r">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0" 
              onClick={incrementMinutes}
              disabled={disabled}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <span className="mx-2 text-center w-6">
              {minutes.toString().padStart(2, '0')}
            </span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0" 
              onClick={decrementMinutes}
              disabled={disabled}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            className="h-full px-3 rounded-l-none"
            onClick={togglePeriod}
            disabled={disabled}
          >
            {period}
          </Button>
        </div>
      </div>
    </div>
  );
} 