import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  // Horarios disponibles durante las horas de operación de la clínica (9AM-6PM)
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
    { value: "otro", label: "Otro horario" },
  ];

  // Manejar el caso de "Otro horario"
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customTime, setCustomTime] = React.useState("");

  // Verificar si se debe mostrar el campo de entrada personalizada al iniciar
  React.useEffect(() => {
    // Si el valor actual no está entre las opciones disponibles y no es vacío, mostrar campo personalizado
    if (value && !availableHours.some(hour => hour.value === value)) {
      setShowCustomInput(true);
      setCustomTime(value);
    } else {
      setShowCustomInput(value === "otro");
    }
  }, [value]);

  // Al seleccionar una opción
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "otro") {
      setShowCustomInput(true);
      // No actualizar el valor principal hasta que se ingrese algo en el campo personalizado
      return;
    }
    
    setShowCustomInput(false);
    onChange(selectedValue);
  };

  // Al ingresar un horario personalizado
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customValue = e.target.value;
    setCustomTime(customValue);
    
    // Solo actualizar el valor principal si hay algo válido
    if (customValue && customValue.includes('-')) {
      onChange(customValue);
    }
  };

  return (
    <div className={className}>
      <Select
        value={availableHours.some(hour => hour.value === value) ? value : "otro"}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar horario">
            {availableHours.find(hour => hour.value === value)?.label || (value || "Seleccionar horario")}
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

      {showCustomInput && (
        <div className="mt-2">
          <Input
            type="text"
            placeholder="Ej: 09:00-10:00"
            value={customTime}
            onChange={handleCustomTimeChange}
            className="w-full"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ingresa el horario en formato 24h (HH:MM-HH:MM)
          </p>
        </div>
      )}
    </div>
  );
} 