import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Hooks and Services
import { useToast } from "@/hooks/use-toast";
import { appointmentService, patientService } from "@/lib/data-service";
import type { Appointment, Patient } from "@/lib/models/types";

// Importar el componente TimeBlockSelector
import { TimeBlockSelector } from "@/components/appointments/TimeBlockSelector";
import { StatusBadge } from "@/components/appointments/StatusBadge";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "PPP", { locale: es });
};

const Appointments = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTab, setSelectedTab] = useState("today");
  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    date: new Date(),
    timeBlock: "09:00-10:00", // Formato para la base de datos que luego se convierte
    status: "scheduled",
    notes: "",
    treatmentType: ""
  });

  // Estado para manejar la edición de citas
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

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

  // Fetch appointments y configuración para actualización
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    refetch: refetchAppointments,
    isError: isErrorAppointments
  } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => appointmentService.getAll(),
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refrescar automáticamente cada 3 segundos (más rápido)
    retry: 3,
    staleTime: 0, // Considerar los datos obsoletos inmediatamente
    refetchOnMount: true // Refrescar los datos cada vez que el componente se monta
  });

  // State para rastrear la última cita creada y forzar recarga visual
  const [lastCreatedAppointment, setLastCreatedAppointment] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Filter appointments based on selected tab
  const filteredAppointments = appointments.filter((appointment) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
    if (selectedTab === "today") {
      return appointment.date === today;
    } else if (selectedTab === "tomorrow") {
      return appointment.date === tomorrowStr;
    } else if (selectedTab === "upcoming") {
      return appointment.date >= today;
    }
    return true;
  });
  
  // Efecto para recargar las citas al cambiar de pestaña o cuando se fuerza un refresco
  useEffect(() => {
    console.log("Recargando citas al cambiar pestaña:", selectedTab);
    refetchAppointments();
  }, [selectedTab, refetchAppointments, forceRefresh]);

  // Efecto para mostrar mensaje cuando no hay citas pero deberían cargarse
  useEffect(() => {
    if (lastCreatedAppointment && appointments.length === 0 && !isLoadingAppointments) {
      console.log("No hay citas cargadas a pesar de haber creado una nueva. Intentando recargar...");
      const timer = setTimeout(() => {
        refetchAppointments();
        setForceRefresh(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [appointments.length, isLoadingAppointments, lastCreatedAppointment, refetchAppointments]);

  // Handle form change
  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar datos obligatorios
    if (!formData.patient || !formData.doctor || !formData.date || !formData.timeBlock) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formattedDate = format(formData.date, "yyyy-MM-dd");
      
      // Extraer horas de inicio y fin del timeBlock
      let [startTime, endTime] = formData.timeBlock.split('-');
      
      // Convertir formato 12h a 24h si se usó el formato AM/PM
      const convertTo24Hour = (time: string) => {
        time = time.trim().toUpperCase();
        const isPM = time.includes('PM');
        const isAM = time.includes('AM');
        
        if (isPM || isAM) {
          // Eliminar AM/PM y espacios
          time = time.replace(/AM|PM/i, '').trim();
          
          // Separar hora y minutos
          let [hours, minutes] = time.split(':').map(part => part.trim());
          let hoursNum = parseInt(hours);
          
          // Convertir a formato 24 horas
          if (isPM && hoursNum < 12) hoursNum += 12;
          if (isAM && hoursNum === 12) hoursNum = 0;
          
          // Formatear con ceros a la izquierda
          return `${hoursNum.toString().padStart(2, '0')}:${minutes || '00'}`;
        }
        
        return time; // Ya está en formato 24h
      };
      
      // Convertir los tiempos si es necesario
      if (startTime.includes('AM') || startTime.includes('PM') || 
          endTime.includes('AM') || endTime.includes('PM')) {
        startTime = convertTo24Hour(startTime);
        endTime = convertTo24Hour(endTime);
      }
      
      console.log('Enviando datos de cita con horario convertido:', {
        patientId: formData.patient,
        doctorId: formData.doctor,
        date: formattedDate,
        startTime,
        endTime,
        status: formData.status,
        notes: formData.notes || '',
        treatmentType: formData.treatmentType || ''
      });
      
      // Crear la cita
      const newAppointment = await appointmentService.create({
        patientId: formData.patient,
        doctorId: formData.doctor,
        date: formattedDate,
        startTime,
        endTime,
        status: formData.status,
        notes: formData.notes || '',
        treatmentType: formData.treatmentType || ''
      });

      toast({
        title: "¡Cita creada!",
        description: "La cita ha sido creada exitosamente.",
      });
      
      // Reset form and close dialog
      setFormData({
        patient: "",
        doctor: "",
        date: new Date(),
        timeBlock: "09:00-10:00",
        status: "scheduled",
        notes: "",
        treatmentType: ""
      });
      setOpen(false);
      
      // Guardar ID de la última cita creada para seguimiento
      setLastCreatedAppointment(newAppointment.id);
      
      // Configurar múltiples intentos de recarga para asegurar que aparezca la cita
      const reloadWithDelay = async () => {
        // Inmediatamente
        await refetchAppointments();
        console.log("Primera recarga de citas completada");
        
        // Después de 1 segundo
        setTimeout(async () => {
          await refetchAppointments();
          console.log("Segunda recarga de citas después de 1 segundo");
          
          // Después de 3 segundos
          setTimeout(async () => {
            await refetchAppointments();
            console.log("Tercera recarga de citas después de 3 segundos");
            
            // Forzar actualización del estado para re-renderizar
            setForceRefresh(prev => prev + 1);
          }, 2000);
        }, 1000);
      };
      
      reloadWithDelay();
      
      // Si la cita es para hoy, asegurarse de mostrar la pestaña "hoy"
      const today = new Date().toISOString().split("T")[0];
      if (formattedDate === today && selectedTab !== "today") {
        setSelectedTab("today");
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Función para iniciar la edición de una cita
  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsEditingAppointment(true);
    setShowEditForm(true);
  };

  // Función para eliminar una cita
  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.delete(appointmentId);
      await refetchAppointments();
      setForceRefresh(prev => prev + 1);
      
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada exitosamente.",
      });
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita. Por favor intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Función para cambiar el estado de una cita
  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    try {
      const updatedAppointment = { ...appointment, status: newStatus };
      await appointmentService.update(updatedAppointment);
      await refetchAppointments();
      setForceRefresh(prev => prev + 1);
      
      toast({
        title: "Estado actualizado",
        description: `La cita ahora está ${
          newStatus === 'scheduled' ? 'programada' :
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' : newStatus
        }.`,
      });
    } catch (error) {
      console.error("Error al cambiar estado de la cita:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. Por favor intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Función para guardar cambios en una cita
  const handleUpdateAppointment = async (updatedData: Partial<Appointment>) => {
    try {
      if (!appointmentToEdit) return;
      
      const appointmentData = {
        ...appointmentToEdit,
        ...updatedData,
        patientName: appointmentToEdit.patientName, // Mantener el nombre del paciente para la UI
        doctorName: appointmentToEdit.doctorName,   // Mantener el nombre del doctor para la UI
      };
      
      await appointmentService.update(appointmentData as Appointment);
      
      toast({
        title: "¡Cita actualizada!",
        description: "La cita ha sido actualizada exitosamente.",
      });
      
      // Resetear estado de edición
      setIsEditingAppointment(false);
      setAppointmentToEdit(null);
      setShowEditForm(false);
      
      // Refrescar datos de citas
      await refetchAppointments();
      setForceRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita. Por favor intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Función para cancelar la edición
  const handleCancelEdit = () => {
    setIsEditingAppointment(false);
    setAppointmentToEdit(null);
    setShowEditForm(false);
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground">Gestiona las citas de los pacientes en el sistema.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cita</DialogTitle>
              <DialogDescription>
                Completa la información para agendar una nueva cita.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient" className="font-medium">
                      Paciente *
                    </Label>
                    <Select 
                      value={formData.patient} 
                      onValueChange={(value) => handleChange("patient", value)}
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
                    <Label htmlFor="doctor" className="font-medium">
                      Doctor *
                    </Label>
                    <Select 
                      value={formData.doctor} 
                      onValueChange={(value) => handleChange("doctor", value)}
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
                              // Asegurarnos de que solo un día puede estar seleccionado
                              handleChange("date", date);
                            }
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                          disabled={(date) => {
                            // Deshabilitar fechas pasadas
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
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
                      value={formData.treatmentType} 
                      onValueChange={(value) => handleChange("treatmentType", value)}
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
                    <Label htmlFor="startTime" className="font-medium">
                      Horario *
                    </Label>
                    <TimeBlockSelector
                      value={formData.timeBlock}
                      onChange={(value) => handleChange("timeBlock", value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="font-medium">
                      Estado *
                    </Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleChange("status", value)}
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
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">
                  Crear Cita
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Formulario de edición de cita */}
      {showEditForm && appointmentToEdit && (
        <div className="my-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Editar Cita</h2>
            <p className="text-muted-foreground">Modifica los detalles de la cita seleccionada.</p>
          </div>
          <AppointmentForm 
            initialData={appointmentToEdit}
            onSubmit={handleUpdateAppointment}
            onCancel={handleCancelEdit}
            isEditing={true}
          />
        </div>
      )}

      <Tabs defaultValue="today" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="tomorrow">Mañana</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
        </TabsList>
        
        {/* Combined content for all tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Citas {selectedTab === "today" ? "de Hoy" : selectedTab === "tomorrow" ? "de Mañana" : "Próximas"}</CardTitle>
            <CardDescription>
              {isLoadingAppointments ? "Cargando citas..." : 
                filteredAppointments.length > 0 
                  ? `Mostrando ${filteredAppointments.length} citas`
                  : "No hay citas programadas en este período"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="flex justify-center py-8">
                <p>Cargando citas...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.patientName || appointment.patientId}</TableCell>
                        <TableCell>{appointment.doctorName || appointment.doctorId}</TableCell>
                        <TableCell>{formatDate(appointment.date)}</TableCell>
                        <TableCell>{appointment.startTime} - {appointment.endTime}</TableCell>
                        <TableCell>
                          {appointment.treatmentType ? 
                            appointment.treatmentType === "consultation" ? "Consulta" :
                            appointment.treatmentType === "cleaning" ? "Limpieza" :
                            appointment.treatmentType === "filling" ? "Empaste" :
                            appointment.treatmentType === "extraction" ? "Extracción" :
                            appointment.treatmentType === "rootcanal" ? "Endodoncia" :
                            appointment.treatmentType === "orthodontics" ? "Ortodoncia" : "Otro"
                          : "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <AppointmentActions 
                            appointment={appointment}
                            onEdit={handleEditAppointment}
                            onDelete={handleDeleteAppointment}
                            onStatusChange={handleStatusChange}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No hay citas programadas para este período</p>
                <Button onClick={() => setOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Nueva Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Appointments;
