import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  // Parsear el valor actual en horas, minutos y período
  const parseTime = (timeString: string) => {
    if (!timeString) return { hour: "09", minute: "00", period: "AM" };
    
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    
    return {
      hour: hourNum > 12 ? (hourNum - 12).toString().padStart(2, '0') : hourNum.toString().padStart(2, '0'),
      minute: minutes,
      period: hourNum >= 12 ? "PM" : "AM"
    };
  };
  
  const { hour, minute, period } = parseTime(value);
  
  // Construir el valor en formato 24 horas cuando cambia alguna parte
  const handleChange = (type: 'hour' | 'minute' | 'period', newValue: string) => {
    let newHour = hour;
    let newMinute = minute;
    let newPeriod = period;
    
    // Actualizar el valor correspondiente
    if (type === 'hour') newHour = newValue;
    if (type === 'minute') newMinute = newValue;
    if (type === 'period') newPeriod = newValue;
    
    // Convertir a formato 24 horas
    let hour24 = parseInt(newHour, 10);
    if (newPeriod === 'PM' && hour24 < 12) hour24 += 12;
    if (newPeriod === 'AM' && hour24 === 12) hour24 = 0;
    
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${newMinute}`;
    onChange(formattedTime);
  };
  
  // Opciones para los selectores
  const hourOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const minuteOptions = ["00", "15", "30", "45"];
  
  // Si no hay valor inicial, mostrar valores por defecto
  React.useEffect(() => {
    if (!value) {
      onChange("09:00");
    }
  }, [value, onChange]);
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select
        value={hour}
        onValueChange={(val) => handleChange('hour', val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-16">
          <SelectValue placeholder={hour} />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="text-lg">:</span>
      
      <Select
        value={minute}
        onValueChange={(val) => handleChange('minute', val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-16">
          <SelectValue placeholder={minute} />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={period}
        onValueChange={(val) => handleChange('period', val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder={period} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="ml-2 flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm" 
          className="h-9"
          onClick={() => onChange("09:00")}
          disabled={disabled}
        >
          9AM
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => onChange("12:00")}
          disabled={disabled}
        >
          12PM
        </Button>
        <Button
          type="button" 
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => onChange("17:00")}
          disabled={disabled}
        >
          5PM
        </Button>
      </div>
    </div>
  );
} 