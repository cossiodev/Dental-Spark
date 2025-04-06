import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  // Formatear la hora para mostrar
  const formatDisplayTime = (timeString: string): string => {
    if (!timeString) return "";
    
    try {
      const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
      if (isNaN(hours) || isNaN(minutes)) return "";
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 === 0 ? 12 : hours % 12;
      
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      return "";
    }
  };
  
  // Horarios comunes preestablecidos
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
  
  // Generamos incrementos de 30 minutos más detallados para la mañana y tarde
  const generateTimeSlots = () => {
    const slots = [];
    
    // Mañana: 8:00 AM - 12:00 PM
    for (let hour = 8; hour <= 11; hour++) {
      slots.push({ 
        label: `${hour}:00 AM`, 
        value: `${hour.toString().padStart(2, '0')}:00` 
      });
      slots.push({ 
        label: `${hour}:30 AM`, 
        value: `${hour.toString().padStart(2, '0')}:30` 
      });
    }
    
    // Mediodía
    slots.push({ label: "12:00 PM", value: "12:00" });
    slots.push({ label: "12:30 PM", value: "12:30" });
    
    // Tarde: 1:00 PM - 6:00 PM
    for (let hour = 1; hour <= 6; hour++) {
      const hour24 = hour + 12;
      slots.push({ 
        label: `${hour}:00 PM`, 
        value: `${hour24.toString().padStart(2, '0')}:00` 
      });
      slots.push({ 
        label: `${hour}:30 PM`, 
        value: `${hour24.toString().padStart(2, '0')}:30` 
      });
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {value ? formatDisplayTime(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-[280px]">
        <div className="border-b px-3 py-2 bg-muted/30">
          <div className="font-medium text-sm text-center">Horarios habituales</div>
        </div>
        
        <div className="grid grid-cols-2 p-2 gap-1">
          {commonTimes.map((time) => (
            <Button
              key={time.value}
              variant={value === time.value ? "default" : "outline"} 
              size="sm"
              className={cn(
                "justify-start px-2 py-1 h-auto text-sm",
                value === time.value && "bg-primary text-primary-foreground"
              )}
              onClick={() => onChange(time.value)}
            >
              {time.label}
            </Button>
          ))}
        </div>
        
        <div className="border-t px-3 py-2 bg-muted/30">
          <div className="font-medium text-sm text-center">Todos los horarios</div>
        </div>
        
        <div className="max-h-[200px] overflow-y-auto p-2">
          <div className="grid grid-cols-2 gap-1">
            {timeSlots.map((time) => (
              <Button
                key={time.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start px-2 py-1 h-auto text-sm",
                  value === time.value && "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => onChange(time.value)}
              >
                {time.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 