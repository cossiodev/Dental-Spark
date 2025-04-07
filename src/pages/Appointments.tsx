import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, PlusCircle, Edit, Trash2, RefreshCw } from "lucide-react";
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
  
  if (typeof date === 'object' && date instanceof Date) {
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

// Función para formatear la hora de 24h a formato 12h con AM/PM
const formatTimeToAMPM = (time: string): string => {
  if (!time) return '';
  
  // Dividir la hora en horas y minutos
  const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
  
  // Determinar AM o PM
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convertir a formato 12h
  const hour12 = hours % 12 || 12; // 0 se convierte en 12
  
  // Devolver la hora formateada
  return `${hour12}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}${period}`;
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
        appointmentDate = appointment.date.split('T')[0];
      } else if (typeof appointment.date === 'object') {
        try {
          appointmentDate = (appointment.date as Date).toISOString().split('T')[0];
        } catch (e) {
          console.error('Error al convertir fecha:', e);
          return false;
        }
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
    
    if (typeof formData.date === 'object' && formData.date instanceof Date) {
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
      formattedDate = formData.date.split('T')[0];
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
  type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";

  // Función para cambiar el estado de una cita
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      setIsLoading(true);
      
      console.log(`Cambiando estado de cita ${id} a: ${newStatus}`);
      const updatedAppointment = { 
        id, 
        status: newStatus,
        // Añadir los campos requeridos con valores para manejar el error de tipo
        patientId: '',
        patientName: '',
        doctorId: '',
        doctorName: '',
        date: '',
        startTime: '',
        endTime: ''
      };
      
      await appointmentService.update(updatedAppointment);
      
      toast({
        title: "Estado actualizado",
        description: `La cita ahora está ${
          newStatus === 'scheduled' ? 'programada' :
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' : 
          newStatus === 'no-show' ? 'marcada como no asistida' : newStatus
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
      
      // Preparar datos para actualización
      const appointmentUpdate = {
        id: appointmentToEdit.id,
        patientId: updatedData.patientId || appointmentToEdit.patientId,
        doctorId: updatedData.doctorId || appointmentToEdit.doctorId,
        
        // Preservar la fecha original si no se cambió explícitamente
        date: updatedData.date || appointmentToEdit.date,
        
        status: updatedData.status || appointmentToEdit.status,
        notes: updatedData.notes !== undefined ? updatedData.notes : appointmentToEdit.notes,
        treatmentType: updatedData.treatmentType || appointmentToEdit.treatmentType,
        startTime: updatedData.startTime || appointmentToEdit.startTime,
        endTime: updatedData.endTime || appointmentToEdit.endTime,
        patientName: appointmentToEdit.patientName, // Preservar datos adicionales
        doctorName: appointmentToEdit.doctorName,   // Preservar datos adicionales
      };
      
      console.log(`Actualizando cita ${appointmentToEdit.id}:`, appointmentUpdate);
      
      // Enviar actualización a la API
      await appointmentService.update(appointmentUpdate);
      
      toast({
        title: "Cita actualizada",
        description: "La cita ha sido actualizada correctamente",
      });
      
      // Ocultar formulario de edición
      setIsEditingAppointment(false);
      setAppointmentToEdit(null);
      
      // Refrescar datos de citas
      refetchAppointments();
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita. Inténtelo de nuevo.",
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

  // Función para obtener la variante del Badge según el estado
  const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'outline';
      case 'confirmed':
        return 'outline';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'outline';
      case 'no-show':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Función para obtener el color personalizado según el estado
  const getStatusClassNames = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'no-show':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  // Función para obtener el texto del estado en español
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'confirmed':
        return 'Confirmada';
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
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Cita</DialogTitle>
              <DialogDescription>
                Complete el formulario para agregar una nueva cita al sistema.
              </DialogDescription>
            </DialogHeader>
            
            <AppointmentForm
              onSubmit={(data) => {
                const [startTime, endTime] = data.timeBlock?.split('-') || ["09:00", "10:00"];
                
                const appointmentData = {
                  patientId: data.patientId,
                  doctorId: data.doctorId,
                  date: data.date instanceof Date 
                    ? formatDateToYYYYMMDD(data.date) 
                    : typeof data.date === 'string' ? data.date : '',
                  startTime,
                  endTime,
                  status: data.status as AppointmentStatus || 'scheduled',
                  notes: data.notes || '',
                  treatmentType: data.treatmentType || '',
                };
                
                setIsLoading(true);
                
                appointmentService.create(appointmentData)
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
                    setTimeout(() => refetchAppointments(), 1000);
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
              }}
              onCancel={() => setOpen(false)}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de edición de cita */}
      <Dialog open={isEditingAppointment} onOpenChange={(open) => {
        if (!open) handleCancelEdit();
        setIsEditingAppointment(open);
      }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la cita seleccionada.
            </DialogDescription>
          </DialogHeader>
          
          {appointmentToEdit && (
            <AppointmentForm 
              initialData={appointmentToEdit}
              onSubmit={handleUpdateAppointment}
              onCancel={handleCancelEdit}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="today" value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="tomorrow">Mañana</TabsTrigger>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetchAppointments()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar Lista
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {isLoadingAppointments ? (
              <div className="flex justify-center py-8">
                <p>Cargando citas...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="relative w-full overflow-auto">
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
                      <TableRow 
                        key={appointment.id} 
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <TableCell className="font-medium">{appointment.patientName || appointment.patientId}</TableCell>
                        <TableCell>{appointment.doctorName || appointment.doctorId}</TableCell>
                        <TableCell>{formatDisplayDate(appointment.date)}</TableCell>
                        <TableCell>{formatTimeToAMPM(appointment.startTime)} - {formatTimeToAMPM(appointment.endTime)}</TableCell>
                        <TableCell>{appointment.treatmentType ? 
                            appointment.treatmentType === "consultation" ? "Consulta" :
                            appointment.treatmentType === "cleaning" ? "Limpieza" :
                            appointment.treatmentType === "filling" ? "Empaste" :
                            appointment.treatmentType === "extraction" ? "Extracción" :
                            appointment.treatmentType === "rootcanal" ? "Endodoncia" :
                            appointment.treatmentType === "orthodontics" ? "Ortodoncia" : appointment.treatmentType
                          : "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`font-normal ${getStatusClassNames(appointment.status)}`}
                          >
                            {getStatusText(appointment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
