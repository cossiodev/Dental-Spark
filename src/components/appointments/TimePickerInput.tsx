import React from 'react';
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  // Extraer hora, minutos y período del valor actual
  const parseTime = () => {
    if (!value) return { hour: "09", minute: "00", period: "AM" };
    
    try {
      const [hoursStr, minutesStr] = value.split(':');
      const hours = parseInt(hoursStr);
      
      let hour = hours;
      if (hours > 12) hour = hours - 12;
      if (hours === 0) hour = 12;
      
      const period = hours >= 12 ? "PM" : "AM";
      
      return {
        hour: hour.toString().padStart(2, '0'),
        minute: minutesStr,
        period
      };
    } catch (e) {
      return { hour: "09", minute: "00", period: "AM" };
    }
  };
  
  const { hour, minute, period } = parseTime();
  
  // Actualizar el valor cuando cambia cualquier parte
  const updateTime = (type: 'hour' | 'minute' | 'period', newValue: string) => {
    const current = parseTime();
    
    // Actualizar el valor correspondiente
    if (type === 'hour') current.hour = newValue;
    if (type === 'minute') current.minute = newValue;
    if (type === 'period') current.period = newValue;
    
    // Convertir a formato 24 horas
    let hours = parseInt(current.hour);
    if (current.period === 'PM' && hours < 12) hours += 12;
    if (current.period === 'AM' && hours === 12) hours = 0;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${current.minute}`;
    onChange(timeString);
  };
  
  // Opciones para los selectores
  const hourOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const minuteOptions = ["00", "15", "30", "45"];
  const periodOptions = ["AM", "PM"];
  
  // Atajos de horarios comunes
  const timePresets = [
    { label: "9AM", value: "09:00" },
    { label: "12PM", value: "12:00" },
    { label: "5PM", value: "17:00" }
  ];
  
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center">
        <Select
          value={hour}
          onValueChange={(val) => updateTime('hour', val)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[4.5rem] rounded-r-none border-r-0">
            <SelectValue placeholder={hour} />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center justify-center h-10 px-2 border border-l-0 border-r-0">
          :
        </div>
        
        <Select
          value={minute}
          onValueChange={(val) => updateTime('minute', val)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[4.5rem] rounded-l-none rounded-r-none border-l-0 border-r-0">
            <SelectValue placeholder={minute} />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={period}
          onValueChange={(val) => updateTime('period', val)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[4.5rem] rounded-l-none border-l-0">
            <SelectValue placeholder={period} />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-1">
        {timePresets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => onChange(preset.value)}
            disabled={disabled}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
} 