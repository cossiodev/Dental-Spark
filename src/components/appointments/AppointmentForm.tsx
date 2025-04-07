import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Custom Components
import { TimeBlockSelector } from "@/components/appointments/TimeBlockSelector";

// Types and Services
import { appointmentService } from "@/lib/data-service";
import type { Appointment, Patient } from "@/lib/models/types";

interface AppointmentFormProps {
  initialData?: Appointment;
  onSubmit: (data: Partial<Appointment>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function AppointmentForm({ 
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<Partial<Appointment>>({
    patientId: "",
    doctorId: "",
    date: new Date(),
    timeBlock: "09:00-10:00",
    status: "scheduled",
    notes: "",
    treatmentType: ""
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialData) {
      const formattedDate = 
        typeof initialData.date === 'string' 
          ? new Date(initialData.date) 
          : initialData.date;
      
      setFormData({
        id: initialData.id,
        patientId: initialData.patientId,
        doctorId: initialData.doctorId,
        date: formattedDate || new Date(),
        timeBlock: `${initialData.startTime}-${initialData.endTime}`,
        status: initialData.status || "scheduled",
        notes: initialData.notes || "",
        treatmentType: initialData.treatmentType || ""
      });
    }
  }, [initialData]);

  // Cargar pacientes y doctores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsData, doctorsData] = await Promise.all([
          appointmentService.getPatientsList(),
          appointmentService.getDoctors()
        ]);
        setPatients(patientsData || []);
        setDoctors(doctorsData || []);
      } catch (error) {
        console.error("Error cargando datos para el formulario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form change
  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar datos obligatorios
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.timeBlock) {
      // Manejar error de validación (podría mostrar un mensaje de error)
      return;
    }
    
    setIsSubmitting(true);
    
    // Extraer horas de inicio y fin del timeBlock
    const [startTime, endTime] = formData.timeBlock.split('-');
    
    // Crear objeto con datos para enviar
    const appointmentData = {
      ...formData,
      startTime,
      endTime
    };
    
    // Enviar datos al componente padre
    onSubmit(appointmentData);
    
    // Note: La función onSubmit es asíncrona y debería manejar el estado de isSubmitting
    // pero como no tenemos acceso directo al resultado, dejamos que el componente padre
    // maneje el estado de carga después de la llamada
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-40">Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient" className="font-medium">
                Paciente *
              </Label>
              <Select 
                value={formData.patientId || ""} 
                onValueChange={(value) => handleChange("patientId", value)}
                disabled={isEditing || isSubmitting}
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
              <Label htmlFor="doctor" className="font-medium">
                Doctor *
              </Label>
              <Select 
                value={formData.doctorId || ""} 
                onValueChange={(value) => handleChange("doctorId", value)}
                disabled={isSubmitting}
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
              <Label htmlFor="date" className="font-medium">
                Fecha *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        handleChange("date", date);
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    disabled={(date) => {
                      // Deshabilitar fechas pasadas excepto si estamos editando
                      if (!isEditing) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }
                      return false;
                    }}
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="treatmentType" className="font-medium">
                Tipo de Tratamiento
              </Label>
              <Select 
                value={formData.treatmentType || ""} 
                onValueChange={(value) => handleChange("treatmentType", value)}
                disabled={isSubmitting}
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
              <Label htmlFor="timeBlock" className="font-medium">
                Horario *
              </Label>
              <TimeBlockSelector
                value={formData.timeBlock || ""}
                onChange={(value) => handleChange("timeBlock", value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="font-medium">
                Estado *
              </Label>
              <Select 
                value={formData.status || "scheduled"} 
                onValueChange={(value) => handleChange("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-medium">
              Notas
            </Label>
            <Textarea 
              id="notes" 
              placeholder="Información adicional sobre la cita" 
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                isEditing ? "Actualizar Cita" : "Crear Cita"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
} 