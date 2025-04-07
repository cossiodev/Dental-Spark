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
  // Horarios comunes preestablecidos
  const commonHours = [
    { value: "08:00-09:00", label: "8:00 - 9:00" },
    { value: "09:00-10:00", label: "9:00 - 10:00" },
    { value: "10:00-11:00", label: "10:00 - 11:00" },
    { value: "11:00-12:00", label: "11:00 - 12:00" },
    { value: "12:00-13:00", label: "12:00 - 13:00" },
    { value: "13:00-14:00", label: "13:00 - 14:00" },
    { value: "14:00-15:00", label: "14:00 - 15:00" },
    { value: "15:00-16:00", label: "15:00 - 16:00" },
    { value: "16:00-17:00", label: "16:00 - 17:00" },
    { value: "17:00-18:00", label: "17:00 - 18:00" },
    { value: "18:00-19:00", label: "18:00 - 19:00" },
    { value: "otro", label: "Otro horario" },
  ];

  // Manejar el caso de "Otro horario"
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customTime, setCustomTime] = React.useState("");

  // Al seleccionar una opción
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "otro") {
      setShowCustomInput(true);
      return;
    }
    
    setShowCustomInput(false);
    onChange(selectedValue);
  };

  // Al ingresar un horario personalizado
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customValue = e.target.value;
    setCustomTime(customValue);
    onChange(customValue);
  };

  return (
    <div className={className}>
      <Select
        value={commonHours.some(hour => hour.value === value) ? value : "otro"}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar horario" />
        </SelectTrigger>
        <SelectContent>
          {commonHours.map((hour) => (
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
            placeholder="Ej: 9:30-10:30"
            value={customTime}
            onChange={handleCustomTimeChange}
            className="w-full"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
} 