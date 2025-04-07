import React from 'react';
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  // Formatear la hora para visualización
  const formatDisplayTime = (timeValue: string): string => {
    if (!timeValue) return "";
    
    try {
      const [hours, minutes] = timeValue.split(':').map(num => parseInt(num, 10));
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      return timeValue;
    }
  };
  
  // Horas más comunes en clínicas dentales
  const commonTimes = [
    { label: "8:00 AM", value: "08:00" },
    { label: "9:00 AM", value: "09:00" },
    { label: "10:00 AM", value: "10:00" },
    { label: "11:00 AM", value: "11:00" },
    { label: "12:00 PM", value: "12:00" },
    { label: "1:00 PM", value: "13:00" },
    { label: "2:00 PM", value: "14:00" },
    { label: "3:00 PM", value: "15:00" },
    { label: "4:00 PM", value: "16:00" },
    { label: "5:00 PM", value: "17:00" },
    { label: "6:00 PM", value: "18:00" },
  ];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatDisplayTime(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="grid grid-cols-2 gap-2 p-3">
          {commonTimes.map((time) => (
            <Button
              key={time.value}
              variant={value === time.value ? "default" : "outline"}
              className="h-8 text-sm"
              onClick={() => onChange(time.value)}
            >
              {time.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 