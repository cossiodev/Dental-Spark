import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
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
  // Convertir el valor de hora en componentes
  const parseTimeValue = (val: string) => {
    if (!val) return { hour: 9, minute: 0, period: 'AM' };
    
    const [hourStr, minuteStr] = val.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    
    // Convertir a formato 12 horas
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    
    return { hour, minute, period };
  };
  
  const { hour, minute, period } = parseTimeValue(value);
  
  // Genera las opciones para las horas (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Genera las opciones para los minutos (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45];
  
  // Función para formatear la hora y enviarla al onChange
  const handleTimeChange = (h: number, m: number, p: 'AM' | 'PM') => {
    let hour24 = h;
    
    // Convertir a formato de 24 horas
    if (p === 'PM' && h !== 12) hour24 += 12;
    if (p === 'AM' && h === 12) hour24 = 0;
    
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(formattedTime);
  };
  
  // Formatear la hora para mostrarla en el botón
  const displayTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? displayTime : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Hora</div>
              <div className="font-medium text-sm">Minutos</div>
              <div className="font-medium text-sm">AM/PM</div>
            </div>
            <div className="flex justify-between">
              <div className="w-[80px] border rounded-md overflow-hidden">
                <div className="grid grid-cols-3 gap-1 p-1 h-[200px] overflow-y-auto">
                  {hourOptions.map((h) => (
                    <Button
                      key={h}
                      variant={h === hour ? "default" : "ghost"} 
                      className="py-1 px-2 h-auto text-sm"
                      onClick={() => handleTimeChange(h, minute, period)}
                    >
                      {h}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="w-[80px] border rounded-md overflow-hidden">
                <div className="grid grid-cols-2 gap-1 p-1 h-[200px] overflow-y-auto">
                  {minuteOptions.map((m) => (
                    <Button
                      key={m}
                      variant={m === minute ? "default" : "ghost"} 
                      className="py-1 px-2 h-auto text-sm"
                      onClick={() => handleTimeChange(hour, m, period)}
                    >
                      {m.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="w-[80px] border rounded-md overflow-hidden">
                <div className="grid grid-cols-1 gap-1 p-1">
                  <Button
                    variant={period === 'AM' ? "default" : "ghost"} 
                    className="py-2 h-auto text-sm"
                    onClick={() => handleTimeChange(hour, minute, 'AM')}
                  >
                    AM
                  </Button>
                  <Button
                    variant={period === 'PM' ? "default" : "ghost"} 
                    className="py-2 h-auto text-sm"
                    onClick={() => handleTimeChange(hour, minute, 'PM')}
                  >
                    PM
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTimeChange(9, 0, 'AM')}
            >
              09:00 AM
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTimeChange(12, 0, 'PM')}
            >
              12:00 PM
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTimeChange(5, 0, 'PM')}
            >
              05:00 PM
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 