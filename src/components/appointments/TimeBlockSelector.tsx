import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

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
  // Horarios disponibles en formato simplificado
  const availableHours = [
    { value: "09:00-10:00", label: "9AM - 10AM" },
    { value: "10:00-11:00", label: "10AM - 11AM" },
    { value: "11:00-12:00", label: "11AM - 12PM" },
    { value: "12:00-13:00", label: "12PM - 1PM" },
    { value: "13:00-14:00", label: "1PM - 2PM" },
    { value: "14:00-15:00", label: "2PM - 3PM" },
    { value: "15:00-16:00", label: "3PM - 4PM" },
    { value: "16:00-17:00", label: "4PM - 5PM" },
    { value: "17:00-18:00", label: "5PM - 6PM" },
  ];

  // Función para obtener la etiqueta del valor actual
  const getCurrentLabel = () => {
    const found = availableHours.find(hour => hour.value === value);
    if (found) return found.label;
    
    // Si no está en las opciones predefinidas, convertir al formato AM/PM
    if (value && value.includes('-')) {
      const [start, end] = value.split('-');
      // Convertir a formato 12h con AM/PM
      const formatHour = (time: string) => {
        const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}${period}`;
      };
      return `${formatHour(start)} - ${formatHour(end)}`;
    }
    
    // Valor por defecto si no hay coincidencia
    return "Seleccionar horario";
  };

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue>
            {getCurrentLabel()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableHours.map((hour) => (
            <SelectItem key={hour.value} value={hour.value}>
              {hour.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 