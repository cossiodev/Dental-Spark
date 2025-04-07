import React from 'react';
import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TimeBlockSelectorProps {
  value: string; // Formato: "HH:MM-HH:MM" (ej. "09:00-10:00")
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimeBlockSelector({
  value,
  onChange,
  className,
  disabled = false,
}: TimeBlockSelectorProps) {
  // Extraer la hora de inicio del valor actual
  const getStartHour = () => {
    if (!value) return "09:00";
    const parts = value.split('-');
    return parts[0] || "09:00";
  };

  const startTime = getStartHour();
  
  // Generar la hora de fin (startTime + 1 hora)
  const calculateEndTime = (start: string) => {
    try {
      const [hours, minutes] = start.split(':').map(Number);
      let endHours = hours + 1;
      const period = endHours >= 12 ? 'PM' : 'AM';
      
      // Ajustar para formato 12 horas si es necesario
      if (endHours > 12) endHours -= 12;
      
      return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
      return "10:00";
    }
  };

  // Opciones de bloques de tiempo disponibles
  const timeBlocks = [
    { start: "08:00", end: "09:00", label: "8:00 AM - 9:00 AM" },
    { start: "09:00", end: "10:00", label: "9:00 AM - 10:00 AM" },
    { start: "10:00", end: "11:00", label: "10:00 AM - 11:00 AM" },
    { start: "11:00", end: "12:00", label: "11:00 AM - 12:00 PM" },
    { start: "12:00", end: "13:00", label: "12:00 PM - 1:00 PM" },
    { start: "13:00", end: "14:00", label: "1:00 PM - 2:00 PM" },
    { start: "14:00", end: "15:00", label: "2:00 PM - 3:00 PM" },
    { start: "15:00", end: "16:00", label: "3:00 PM - 4:00 PM" },
    { start: "16:00", end: "17:00", label: "4:00 PM - 5:00 PM" },
    { start: "17:00", end: "18:00", label: "5:00 PM - 6:00 PM" },
    { start: "18:00", end: "19:00", label: "6:00 PM - 7:00 PM" },
  ];

  // Actualizar el valor cuando se selecciona un bloque de tiempo
  const handleSelectTimeBlock = (startTime: string) => {
    const endTime = calculateEndTime(startTime);
    onChange(`${startTime}-${endTime}`);
  };

  // Seleccionar un bloque de tiempo predefinido
  const selectTimeBlock = (block: { start: string, end: string }) => {
    onChange(`${block.start}-${block.end}`);
  };

  // Encontrar el bloque de tiempo actual para mostrar en el selector
  const getCurrentBlock = () => {
    const startHour = getStartHour();
    const found = timeBlocks.find(block => block.start === startHour);
    return found ? found.label : "Seleccionar horario";
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectTimeBlock(timeBlocks[1])}
          disabled={disabled}
        >
          9AM
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectTimeBlock(timeBlocks[4])}
          disabled={disabled}
        >
          12PM
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectTimeBlock(timeBlocks[8])}
          disabled={disabled}
        >
          4PM
        </Button>
      </div>

      <Select
        value={startTime}
        onValueChange={(val) => handleSelectTimeBlock(val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getCurrentBlock()} />
        </SelectTrigger>
        <SelectContent>
          {timeBlocks.map((block) => (
            <SelectItem key={block.start} value={block.start}>
              {block.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 