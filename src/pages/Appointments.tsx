import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, PlusCircle, Edit, Trash2 } from "lucide-react";
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

// Helper para formatear fecha para mostrar (SIMPLIFICADO AL MÁXIMO)
const formatDisplayDate = (dateString: string) => {
  try {
    // Si no hay fecha, mostrar mensaje
    if (!dateString) return 'Sin fecha';

    // Acceder directamente a los componentes de la fecha de la base de datos
    // Format en Supabase: YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    // Extraer componentes
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    // Nombres de meses en español
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    // Devolver la fecha formateada en español
    return `${day} de ${monthNames[month-1]} de ${year}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    // Devolver la fecha original si hay error
    return dateString;
  }
};

// Helper para formatear fecha para la BD
const formatISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper para convertir hora de 12h a 24h
const convert12To24Format = (time: string): string => {
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

// Corrige el error de instanceof y toISOString en la línea 218-219
const formatDateToYYYYMMDD = (date: Date | string): string => {
  if (!date) return '';
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // Si ya está en formato YYYY-MM-DD, retornarlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Intentar convertir a Date y formatear
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }
  
  return '';
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

  // Estado para permisos de usuario
  const [userPermissions, setUserPermissions] = useState({
    canEdit: false,
    canDelete: false,
    userEmail: null as string | null,
    checked: false
  });

  // Estado para manejar la edición de citas
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Estado para indicar si se está enviando el formulario
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
  const filteredAppointments = useMemo(() => {
    // Obtener fechas formateadas con timezone local
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log('DEBUG - Fechas de referencia: HOY =', todayStr, 'MAÑANA =', tomorrowStr);
    console.log('FILTRADO - Total de citas cargadas:', appointments.length);
    
    if (appointments.length > 0) {
      appointments.forEach((appt, idx) => {
        console.log(`Cita ${idx+1}:`, { 
          id: appt.id, 
          fecha: appt.date, 
          paciente: appt.patientName,
          fechaHoy: todayStr,
          fechaMañana: tomorrowStr,
          pestaña: selectedTab
        });
      });
    }
    
    const filtered = appointments.filter((appointment) => {
      // Validar que appointment.date existe y es un string válido
      if (!appointment.date) {
        console.error('Cita sin fecha:', appointment);
        return false;
      }
      
      // Normalizar la fecha para comparación - quitar cualquier componente de hora o timezone
      let appointmentDate;
      if (typeof appointment.date === 'string') {
        // Extraer solo la parte de la fecha (YYYY-MM-DD)
        appointmentDate = appointment.date.trim().split('T')[0];
      } else if (appointment.date instanceof Date) {
        appointmentDate = appointment.date.toISOString().split('T')[0];
      } else {
        console.error('Fecha de cita con formato desconocido:', appointment.date);
        return false;
      }
      
      console.log(`Comparando cita ID=${appointment.id}, fecha=${appointmentDate}, contra HOY=${todayStr}, MAÑANA=${tomorrowStr}, pestaña=${selectedTab}`);
      
      // Comparación exacta de strings para mayor precisión
      let result;
      if (selectedTab === "today") {
        result = appointmentDate === todayStr;
      } else if (selectedTab === "tomorrow") { 
        result = appointmentDate === tomorrowStr;
      } else { // upcoming
        // La fecha de la cita debe ser mayor o igual que hoy
        result = appointmentDate >= todayStr;
      }
      
      console.log(`Resultado filtro: ${result ? 'MOSTRAR' : 'OCULTAR'}`);
      return result;
    });
    
    console.log(`RESULTADO - Citas filtradas para "${selectedTab}":`, filtered.length);
    
    return filtered;
  }, [appointments, selectedTab]);
  
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

  // Función de depuración que se ejecutará una vez al cargar
  useEffect(() => {
    const debugAppointments = () => {
      if (appointments && appointments.length > 0) {
        console.log('🔴 DEPURACIÓN DE CITAS:');
        appointments.forEach((a, i) => {
          console.log(`🔴 CITA #${i+1} - ID: ${a.id}`);
          console.log(`   - Fecha en DB: "${a.date}"`);
          console.log(`   - Fecha formateada: "${formatDisplayDate(a.date)}"`);
          console.log(`   - Paciente: ${a.patientName}`);
          console.log(`   - Doctor: ${a.doctorName}`);
          console.log(`   - Hora: ${a.startTime}-${a.endTime}`);
        });
      }
    };
    
    // Solo ejecutar una vez cuando se cargan las citas
    if (!isLoadingAppointments && appointments.length > 0) {
      debugAppointments();
    }
  }, [appointments, isLoadingAppointments]);

  // Efecto para verificar permisos del usuario al cargar
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permissions = await appointmentService.checkUserPermissions();
        setUserPermissions({
          ...permissions,
          checked: true
        });
        
        console.log('Permisos del usuario:', permissions);
        
        if (!permissions.canEdit || !permissions.canDelete) {
          toast({
            title: "Información de permisos",
            description: `Usuario: ${permissions.userEmail || 'No identificado'}. ${!permissions.canEdit ? 'No tienes permisos para editar citas.' : ''} ${!permissions.canDelete ? 'No tienes permisos para eliminar citas.' : ''}`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error al verificar permisos:', error);
      }
    };
    
    checkPermissions();
  }, [toast]);

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
    
    if (!formData.patient || !formData.doctor || !formData.date || !formData.timeBlock) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    
    // Normalizar y formatear la fecha para enviar a la API
    let formattedDate;
    
    if (formData.date instanceof Date) {
      // CORRECCIÓN: Mantener la fecha exacta sin ajustes de timezone
      // Al usar UTC, nos aseguramos que la fecha se guarde sin conversiones
      const year = formData.date.getFullYear();
      const month = (formData.date.getMonth() + 1).toString().padStart(2, '0');
      const day = formData.date.getDate().toString().padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;

      // Añadir hora UTC+0 para forzar que la fecha se mantenga
      const dateObject = new Date(`${formattedDate}T12:00:00Z`);
      console.log('🔍 Fecha con UTC forzado:', dateObject.toISOString());
    } else if (typeof formData.date === 'string') {
      // Si es string, asegurar que tenga el formato correcto
      formattedDate = formData.date.trim().split('T')[0];
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }
    
    console.log('🔍 Fecha seleccionada (original):', formData.date);
    console.log('🔍 Fecha formateada para enviar:', formattedDate);
    
    // Validar horas
    let [startTime, endTime] = formData.timeBlock.split('-');
    
    // Convertir de formato 12h a 24h si es necesario
    if (startTime.includes('AM') || startTime.includes('PM')) {
      startTime = convert12To24Format(startTime);
    }
    if (endTime.includes('AM') || endTime.includes('PM')) {
      endTime = convert12To24Format(endTime);
    }
    
    console.log(`🔍 Enviando cita con fecha ${formattedDate} y horas ${startTime}-${endTime}`);
    
    setIsLoading(true);
    
    appointmentService.create({
      patientId: formData.patient,
      doctorId: formData.doctor,
      date: formattedDate, // Usamos la fecha formateada correctamente
      startTime,
      endTime,
      status: formData.status || 'scheduled',
      notes: formData.notes || '',
      treatmentType: formData.treatmentType || '',
    })
      .then((newAppointment) => {
        console.log('✅ Cita creada exitosamente:', newAppointment);
        setLastCreatedAppointment(newAppointment.id);
        setOpen(false);
        resetForm();
        toast({
          title: "Éxito",
          description: "Cita creada correctamente",
        });
        
        // Forzar recarga de citas
        setForceRefresh(prev => prev + 1);
        
        // Programar múltiples intentos de recarga
        setTimeout(() => refetchAppointments(), 1000);
        setTimeout(() => refetchAppointments(), 3000);
        setTimeout(() => refetchAppointments(), 5000);
      })
      .catch((error) => {
        console.error("❌ Error al crear cita:", error);
        toast({
          title: "Error",
          description: error.message || "Error al crear la cita",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
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
      setIsLoading(true);
      
      console.log(`Eliminando cita con ID: ${appointmentId}`);
      await appointmentService.delete(appointmentId);
      
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada exitosamente.",
      });
      
      // Refrescar los datos
      await refetchAppointments();
      setForceRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la cita. Por favor intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Corrige los errores de tipo en status (líneas 385 y 464)
  type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

  // Función para cambiar el estado de una cita
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      setIsLoading(true);
      
      console.log(`Cambiando estado de cita ${id} a: ${newStatus}`);
      const updatedAppointment = { id, status: newStatus };
      
      await appointmentService.update(updatedAppointment);
      
      toast({
        title: "Estado actualizado",
        description: `La cita ahora está ${
          newStatus === 'scheduled' ? 'programada' :
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' : newStatus
        }.`,
      });
      
      // Refrescar los datos
      await refetchAppointments();
      setForceRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error("Error al cambiar estado de la cita:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el estado. Por favor intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar cambios en una cita
  const handleUpdateAppointment = async (updatedData: Partial<Appointment>) => {
    try {
      if (!appointmentToEdit) {
        toast({
          title: "Error",
          description: "No se encontró la cita para actualizar",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      // Normalizar y formatear la fecha para enviar a la API
      let formattedDate;
      
      if (updatedData.date instanceof Date) {
        // CORRECCIÓN: Mantener la fecha exacta sin ajustes de timezone
        // Al usar UTC, nos aseguramos que la fecha se guarde sin conversiones
        const year = updatedData.date.getFullYear();
        const month = (updatedData.date.getMonth() + 1).toString().padStart(2, '0');
        const day = updatedData.date.getDate().toString().padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;

        // Añadir hora UTC+0 para forzar que la fecha se mantenga
        const dateObject = new Date(`${formattedDate}T12:00:00Z`);
        console.log('🔍 Fecha de actualización con UTC forzado:', dateObject.toISOString());
      } else if (typeof updatedData.date === 'string') {
        // Si es string, asegurar que tenga el formato correcto
        formattedDate = updatedData.date.trim().split('T')[0];
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
      
      console.log('🔍 Fecha seleccionada para actualizar (original):', updatedData.date);
      console.log('🔍 Fecha formateada para enviar:', formattedDate);
      
      const appointmentData = {
        ...appointmentToEdit,
        ...updatedData,
        date: formattedDate,
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
        description: error instanceof Error ? error.message : "No se pudo actualizar la cita. Por favor intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cancelar la edición
  const handleCancelEdit = () => {
    setIsEditingAppointment(false);
    setAppointmentToEdit(null);
    setShowEditForm(false);
  };

  // Función para restablecer el formulario
  const resetForm = () => {
    setFormData({
      patient: "",
      doctor: "",
      date: new Date(),
      timeBlock: "09:00-10:00", 
      status: "scheduled",
      notes: "",
      treatmentType: ""
    });
  };

  // Función para obtener el color según el estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el texto del estado en español
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'no-show':
        return 'No asistió';
      default:
        return status;
    }
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
                              // CORRECCIÓN: Preservar la fecha seleccionada sin conversiones
                              // Esto evita problemas de timezone al guardar
                              const year = date.getFullYear();
                              const month = date.getMonth();
                              const day = date.getDate();
                              
                              // Crear una nueva fecha a mediodía UTC para evitar conversiones
                              const localDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
                              
                              const formattedDate = 
                                `${localDate.getUTCFullYear()}-${
                                  (localDate.getUTCMonth() + 1).toString().padStart(2, '0')
                                }-${
                                  localDate.getUTCDate().toString().padStart(2, '0')
                                }`;
                                
                              console.log('Fecha seleccionada en calendario:', localDate);
                              console.log('Fecha UTC:', localDate.toUTCString());
                              console.log('Fecha ISO:', localDate.toISOString());
                              console.log('Fecha formateada:', formattedDate);
                              
                              handleChange("date", localDate);
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
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    "Crear Cita"
                  )}
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
              <div className="overflow-x-auto" style={{ width: '100%' }}>
                <table className="min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100 text-sm font-bold">
                      <th className="p-2 border-b w-1/6 text-left">Paciente</th>
                      <th className="p-2 border-b w-1/6 text-left">Doctor</th>
                      <th className="p-2 border-b w-1/6 text-left">Fecha</th>
                      <th className="p-2 border-b w-1/6 text-left">Hora</th>
                      <th className="p-2 border-b w-1/6 text-left">Tipo</th>
                      <th className="p-2 border-b w-1/6 text-left">Estado / Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium truncate">{appointment.patientName || appointment.patientId}</td>
                        <td className="p-2 truncate">{appointment.doctorName || appointment.doctorId}</td>
                        <td className="p-2 font-medium">{formatDisplayDate(appointment.date)}</td>
                        <td className="p-2">{appointment.startTime} - {appointment.endTime}</td>
                        <td className="p-2 truncate">
                          {appointment.treatmentType ? 
                            appointment.treatmentType === "consultation" ? "Consulta" :
                            appointment.treatmentType === "cleaning" ? "Limpieza" :
                            appointment.treatmentType === "filling" ? "Empaste" :
                            appointment.treatmentType === "extraction" ? "Extracción" :
                            appointment.treatmentType === "rootcanal" ? "Endodoncia" :
                            appointment.treatmentType === "orthodontics" ? "Ortodoncia" : appointment.treatmentType
                          : "-"}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col space-y-2">
                            <StatusBadge status={appointment.status} />
                            
                            <div className="flex flex-row gap-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditAppointment(appointment)}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-800"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
