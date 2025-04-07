import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  
  // Estado para manejar notas como tags
  const [notesInput, setNotesInput] = useState('');
  const [notesTags, setNotesTags] = useState<string[]>([]);

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialData) {
      // Preservar la fecha original sin conversiones
      let preservedDate;
      
      if (typeof initialData.date === 'string') {
        // Asegurarse de que la fecha se cree correctamente desde el string
        // Evitar problemas de zona horaria al dividir el string y crear la fecha manualmente
        const [year, month, day] = initialData.date.split('-').map(Number);
        // Importante: En JavaScript los meses van de 0-11, por eso restamos 1 al mes
        preservedDate = new Date(year, month - 1, day, 12, 0, 0);
      } else if (initialData.date instanceof Date) {
        // Si ya es un objeto Date, crear una nueva instancia para evitar referencias
        preservedDate = new Date(initialData.date);
      } else {
        // Valor predeterminado
        preservedDate = new Date();
      }
      
      // Para debugging
      console.log('Fecha original:', initialData.date);
      console.log('Fecha preservada:', preservedDate);
      
      setFormData({
        id: initialData.id,
        patientId: initialData.patientId,
        doctorId: initialData.doctorId,
        date: preservedDate,
        timeBlock: `${initialData.startTime}-${initialData.endTime}`,
        status: initialData.status || "scheduled",
        notes: initialData.notes || "",
        treatmentType: initialData.treatmentType || ""
      });
      
      // Inicializar notas como tags si existen
      if (initialData.notes) {
        setNotesTags(initialData.notes.split(',').map(note => note.trim()).filter(Boolean));
      }
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

  // Función para añadir una nota como tag
  const addNoteTag = () => {
    if (notesInput.trim()) {
      const newTags = [...notesTags, notesInput.trim()];
      setNotesTags(newTags);
      setNotesInput('');
      
      // Actualizar el campo notes en formData
      handleChange('notes', newTags.join(', '));
    }
  };

  // Manejar tecla Enter para añadir nota
  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && notesInput.trim()) {
      e.preventDefault();
      addNoteTag();
    }
  };

  // Eliminar una nota
  const removeNoteTag = (indexToRemove: number) => {
    const newTags = notesTags.filter((_, index) => index !== indexToRemove);
    setNotesTags(newTags);
    
    // Actualizar el campo notes en formData
    handleChange('notes', newTags.join(', '));
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
    
    // Asegurar que la fecha se preserva correctamente
    let formattedDate = '';
    const date = formData.date;
    
    if (date instanceof Date) {
      // Usar formato YYYY-MM-DD sin ajustes de timezone
      // Importante: SIEMPRE usar getUTCDate() para evitar problemas de zona horaria
      formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      console.log('Fecha formateada desde objeto Date:', formattedDate);
    } else if (typeof date === 'string') {
      // Si ya es string, verificar que esté en formato correcto (YYYY-MM-DD)
      if (date.includes('T')) {
        formattedDate = date.split('T')[0];
      } else {
        formattedDate = date;
      }
      console.log('Fecha formateada desde string:', formattedDate);
    }
    
    console.log('Fecha final para enviar:', formattedDate);
    
    // Crear objeto con datos para enviar
    const appointmentData = {
      ...formData,
      date: formattedDate,
      startTime,
      endTime
    };
    
    // Enviar datos al componente padre
    onSubmit(appointmentData);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-40">Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient" className="font-medium">
            Paciente *
          </Label>
          <Select 
            value={formData.patientId || ""} 
            onValueChange={(value) => handleChange("patientId", value)}
            disabled={isEditing || isSubmitting}
          >
            <SelectTrigger id="patient" className="mt-1.5">
              <SelectValue placeholder="Seleccione un paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id || "placeholder-value"}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-patients">No hay pacientes disponibles</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="doctor" className="font-medium">
            Doctor *
          </Label>
          <Select 
            value={formData.doctorId || ""} 
            onValueChange={(value) => handleChange("doctorId", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="doctor" className="mt-1.5">
              <SelectValue placeholder="Seleccione un doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id || "placeholder-value"}>
                    {doctor.firstName} {doctor.lastName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-doctors">No hay doctores disponibles</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="date" className="font-medium">
            Fecha *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal mt-1.5",
                  !formData.date && "text-muted-foreground"
                )}
                type="button"
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "dd/MM/yyyy", { locale: es }) : <span>Selecciona una fecha</span>}
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
                className="p-2"
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
                  day: "h-8 w-8 font-normal text-slate-700 aria-selected:opacity-100 hover:bg-slate-100 rounded-md flex items-center justify-center",
                  head_cell: "text-slate-500 font-medium text-[0.8rem] flex items-center justify-center h-8 w-8",
                  table: "border-spacing-0 border-separate w-full",
                  row: "flex w-full justify-between mt-1",
                  cell: "p-0",
                  caption: "flex justify-center p-1.5 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-75 hover:opacity-100",
                  day_outside: "text-slate-300"
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label htmlFor="treatmentType" className="font-medium">
            Tipo de Tratamiento
          </Label>
          <Select 
            value={formData.treatmentType || ""} 
            onValueChange={(value) => handleChange("treatmentType", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="treatmentType" className="mt-1.5">
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
        
        <div>
          <Label htmlFor="timeBlock" className="font-medium">
            Horario *
          </Label>
          <TimeBlockSelector
            className="mt-1.5"
            value={formData.timeBlock || "09:00-10:00"}
            onChange={(value) => handleChange("timeBlock", value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor="status" className="font-medium">
            Estado *
          </Label>
          <Select 
            value={formData.status || "scheduled"} 
            onValueChange={(value) => handleChange("status", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="status" className="mt-1.5">
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
      
      <div>
        <Label htmlFor="notes" className="font-medium">
          Notas
        </Label>
        <div className="mt-1.5">
          <div className="flex gap-2 mb-2">
            <Input
              id="notes-input"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              onKeyDown={handleNotesKeyDown}
              placeholder="Añadir nota y presionar Enter"
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addNoteTag}
              disabled={!notesInput.trim() || isSubmitting}
            >
              Añadir
            </Button>
          </div>
          
          {notesTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {notesTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="py-1.5 pl-2 pr-1.5 flex items-center gap-1 bg-slate-100"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-slate-200"
                    onClick={() => removeNoteTag(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Cita' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
} 
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
        
        <div>
          <Label htmlFor="timeBlock" className="font-medium">
            Horario *
          </Label>
          <TimeBlockSelector
            className="mt-1.5"
            value={formData.timeBlock || "09:00-10:00"}
            onChange={(value) => handleChange("timeBlock", value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor="status" className="font-medium">
            Estado *
          </Label>
          <Select 
            value={formData.status || "scheduled"} 
            onValueChange={(value) => handleChange("status", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="status" className="mt-1.5">
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
      
      <div>
        <Label htmlFor="notes" className="font-medium">
          Notas
        </Label>
        <div className="mt-1.5">
          <div className="flex gap-2 mb-2">
            <Input
              id="notes-input"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              onKeyDown={handleNotesKeyDown}
              placeholder="Añadir nota y presionar Enter"
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addNoteTag}
              disabled={!notesInput.trim() || isSubmitting}
            >
              Añadir
            </Button>
          </div>
          
          {notesTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {notesTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="py-1.5 pl-2 pr-1.5 flex items-center gap-1 bg-slate-100"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-slate-200"
                    onClick={() => removeNoteTag(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Cita' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
} 
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
        
        <div>
          <Label htmlFor="timeBlock" className="font-medium">
            Horario *
          </Label>
          <TimeBlockSelector
            className="mt-1.5"
            value={formData.timeBlock || "09:00-10:00"}
            onChange={(value) => handleChange("timeBlock", value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor="status" className="font-medium">
            Estado *
          </Label>
          <Select 
            value={formData.status || "scheduled"} 
            onValueChange={(value) => handleChange("status", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="status" className="mt-1.5">
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
      
      <div>
        <Label htmlFor="notes" className="font-medium">
          Notas
        </Label>
        <div className="mt-1.5">
          <div className="flex gap-2 mb-2">
            <Input
              id="notes-input"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              onKeyDown={handleNotesKeyDown}
              placeholder="Añadir nota y presionar Enter"
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addNoteTag}
              disabled={!notesInput.trim() || isSubmitting}
            >
              Añadir
            </Button>
          </div>
          
          {notesTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {notesTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="py-1.5 pl-2 pr-1.5 flex items-center gap-1 bg-slate-100"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-slate-200"
                    onClick={() => removeNoteTag(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Cita' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
} 