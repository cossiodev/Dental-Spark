import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment, Patient } from '@/lib/models/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeBlockSelector } from './TimeBlockSelector';
import { useQuery } from '@tanstack/react-query';
import { patientService, appointmentService } from '@/lib/data-service';
import { DialogFooter } from '@/components/ui/dialog';

interface AppointmentFormProps {
  initialData: Appointment;
  onSubmit: (data: Partial<Appointment>) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function AppointmentForm({ initialData, onSubmit, onCancel, isEditing }: AppointmentFormProps) {
  const [formData, setFormData] = useState<Partial<Appointment>>({
    patientId: initialData.patientId || '',
    doctorId: initialData.doctorId || '',
    date: initialData.date ? new Date(initialData.date) : new Date(),
    startTime: initialData.startTime || '09:00',
    endTime: initialData.endTime || '10:00',
    status: initialData.status || 'scheduled',
    notes: initialData.notes || '',
    treatmentType: initialData.treatmentType || '',
  });
  
  const [timeBlock, setTimeBlock] = useState(
    `${initialData.startTime || '09:00'}-${initialData.endTime || '10:00'}`
  );
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll(),
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => appointmentService.getDoctors(),
  });
  
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Actualizar startTime y endTime cuando cambia timeBlock
  useEffect(() => {
    const [start, end] = timeBlock.split('-');
    setFormData((prev) => ({
      ...prev,
      startTime: start,
      endTime: end,
    }));
  }, [timeBlock]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient" className="font-medium">Paciente *</Label>
          <Select
            value={formData.patientId}
            onValueChange={(value) => handleChange('patientId', value)}
            required
          >
            <SelectTrigger id="patient">
              <SelectValue placeholder="Seleccione un paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doctor" className="font-medium">Doctor *</Label>
          <Select
            value={formData.doctorId}
            onValueChange={(value) => handleChange('doctorId', value)}
            required
          >
            <SelectTrigger id="doctor">
              <SelectValue placeholder="Seleccione un doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.firstName} {doctor.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="font-medium">Fecha *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(new Date(formData.date), "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date instanceof Date ? formData.date : new Date(formData.date as string)}
                onSelect={(date) => date && handleChange('date', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="treatmentType" className="font-medium">Tipo de Tratamiento</Label>
          <Select
            value={formData.treatmentType || ''}
            onValueChange={(value) => handleChange('treatmentType', value)}
          >
            <SelectTrigger id="treatmentType">
              <SelectValue placeholder="Seleccione un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consulta</SelectItem>
              <SelectItem value="cleaning">Limpieza</SelectItem>
              <SelectItem value="filling">Empaste</SelectItem>
              <SelectItem value="extraction">Extracción</SelectItem>
              <SelectItem value="rootcanal">Endodoncia</SelectItem>
              <SelectItem value="orthodontics">Ortodoncia</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeBlock" className="font-medium">Horario *</Label>
          <TimeBlockSelector
            value={timeBlock}
            onChange={setTimeBlock}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status" className="font-medium">Estado *</Label>
          <Select
            value={formData.status || 'scheduled'}
            onValueChange={(value) => handleChange('status', value)}
            required
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="no-show">No asistió</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes" className="font-medium">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Información adicional sobre la cita"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Cita' : 'Guardar Cita'}
        </Button>
      </DialogFooter>
    </form>
  );
} 