import React, { useState } from 'react';
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
  // Inicializar los valores de hora, minuto y periodo
  const parseTime = () => {
    if (!value) return { hour: 9, minute: 0, period: 'AM' };
    
    let hour = parseInt(value.split(':')[0]);
    const minute = parseInt(value.split(':')[1] || '0');
    
    // Determinar el periodo (AM/PM)
    const period = hour >= 12 ? 'PM' : 'AM';
    
    // Convertir a formato 12 horas para mostrar
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    
    return { hour, minute, period };
  };
  
  const [timeValues, setTimeValues] = useState(parseTime());
  
  // Actualizar el estado local cuando cambia el valor prop
  React.useEffect(() => {
    setTimeValues(parseTime());
  }, [value]);
  
  // Función para actualizar la hora y enviar el cambio
  const updateTime = (newHour?: number, newMinute?: number, newPeriod?: 'AM' | 'PM') => {
    const updatedValues = {
      hour: newHour !== undefined ? newHour : timeValues.hour,
      minute: newMinute !== undefined ? newMinute : timeValues.minute,
      period: newPeriod !== undefined ? newPeriod : timeValues.period
    };
    
    setTimeValues(updatedValues);
    
    // Convertir a formato 24 horas para el value
    let hour24 = updatedValues.hour;
    if (updatedValues.period === 'PM' && updatedValues.hour !== 12) hour24 += 12;
    if (updatedValues.period === 'AM' && updatedValues.hour === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${updatedValues.minute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };
  
  // Manejadores para incrementar y decrementar
  const incrementHour = () => {
    const newHour = timeValues.hour === 12 ? 1 : timeValues.hour + 1;
    updateTime(newHour);
  };
  
  const decrementHour = () => {
    const newHour = timeValues.hour === 1 ? 12 : timeValues.hour - 1;
    updateTime(newHour);
  };
  
  const incrementMinute = () => {
    let newMinute = Math.floor(timeValues.minute / 5) * 5 + 5;
    if (newMinute >= 60) newMinute = 0;
    updateTime(undefined, newMinute);
  };
  
  const decrementMinute = () => {
    let newMinute = Math.ceil(timeValues.minute / 5) * 5 - 5;
    if (newMinute < 0) newMinute = 55;
    updateTime(undefined, newMinute);
  };
  
  const togglePeriod = () => {
    updateTime(undefined, undefined, timeValues.period === 'AM' ? 'PM' : 'AM');
  };
  
  return (
    <div className={cn("flex items-center space-x-1 border rounded-md p-1", className)}>
      <div className="flex flex-col items-center">
        <button 
          type="button"
          className="text-gray-500 hover:text-gray-700 p-1"
          onClick={incrementHour}
          disabled={disabled}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <div className="w-8 text-center font-medium">
          {timeValues.hour.toString().padStart(2, '0')}
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 p-1"
          onClick={decrementHour}
          disabled={disabled}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="text-xl">:</div>
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 p-1"
          onClick={incrementMinute}
          disabled={disabled}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <div className="w-8 text-center font-medium">
          {timeValues.minute.toString().padStart(2, '0')}
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 p-1"
          onClick={decrementMinute}
          disabled={disabled}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={togglePeriod}
        disabled={disabled}
        className={cn(
          "min-w-[40px] h-8 px-2 rounded font-medium transition-colors",
          timeValues.period === 'AM' 
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
            : "bg-orange-100 text-orange-700 hover:bg-orange-200"
        )}
      >
        {timeValues.period}
      </button>
      
      <div className="flex ml-2 gap-1">
        <button
          type="button"
          onClick={() => updateTime(9, 0, 'AM')}
          disabled={disabled}
          className="text-xs bg-gray-100 px-1 py-0.5 rounded hover:bg-gray-200"
        >
          9AM
        </button>
        <button
          type="button"
          onClick={() => updateTime(12, 0, 'PM')}
          disabled={disabled}
          className="text-xs bg-gray-100 px-1 py-0.5 rounded hover:bg-gray-200"
        >
          12PM
        </button>
        <button
          type="button"
          onClick={() => updateTime(5, 0, 'PM')}
          disabled={disabled}
          className="text-xs bg-gray-100 px-1 py-0.5 rounded hover:bg-gray-200"
        >
          5PM
        </button>
      </div>
    </div>
  );
} 