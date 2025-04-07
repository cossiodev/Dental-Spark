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

// Importar el nuevo componente TimePickerInput
import { TimePickerInput } from "@/components/appointments/TimePickerInput";

// Importar el nuevo componente TimeBlockSelector
import { TimeBlockSelector } from "@/components/appointments/TimeBlockSelector";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "PPP", { locale: es });
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
    scheduled: { label: "Programada", variant: "outline" },
    confirmed: { label: "Confirmada", variant: "secondary" },
    completed: { label: "Completada", variant: "default" },
    cancelled: { label: "Cancelada", variant: "destructive" },
  };

  const { label, variant } = statusMap[status] || { label: status, variant: "outline" };
  
  return <Badge variant={variant}>{label}</Badge>;
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
    timeBlock: "09:00-10:00", // Nuevo campo para bloque de tiempo
    status: "scheduled",
    notes: "",
    treatmentType: ""
  });

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

  // Fetch appointments
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    refetch: refetchAppointments
  } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => appointmentService.getAll(),
    refetchOnWindowFocus: false,
  });

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
  
  // Efecto para recargar las citas al cambiar de pestaña
  useEffect(() => {
    refetchAppointments();
    console.log("Recargando citas al cambiar pestaña:", selectedTab);
  }, [selectedTab, refetchAppointments]);

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
    
    try {
      const formattedDate = format(formData.date, "yyyy-MM-dd");
      
      // Extraer horas de inicio y fin del timeBlock
      const [startTime, endTime] = formData.timeBlock.split('-');
      
      console.log('Enviando datos de cita:', {
        patientId: formData.patient,
        doctorId: formData.doctor,
        date: formattedDate,
        startTime,
        endTime,
        status: formData.status,
        notes: formData.notes || '',
        treatmentType: formData.treatmentType || ''
      });
      
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
      
      // Refresh appointments list y automáticamente mostrar "hoy" si la cita es para hoy
      await refetchAppointments();
      const today = new Date().toISOString().split("T")[0];
      if (formattedDate === today && selectedTab !== "today") {
        setSelectedTab("today");
      } else {
        console.log("Cita creada, recargando lista...");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Nueva Cita</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cita</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la nueva cita. Todos los campos marcados con * son obligatorios.
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
                          onSelect={(date) => handleChange("date", date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
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
                      Bloque de Tiempo *
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No hay citas programadas para este período</p>
                <Button variant="outline" onClick={() => setOpen(true)}>
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
