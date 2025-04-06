
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { Bell, Mail, MessageSquare, Send, User, Users } from "lucide-react";
import { patientService, Patient, appointmentService, Appointment } from "@/lib/data-service";

// Custom Badge component - renamed to CustomBadge to avoid conflict
const CustomBadge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
};

const Communication = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");

  // Load patient and appointment data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [patientsData, appointmentsData] = await Promise.all([
        patientService.getAll(),
        appointmentService.getUpcoming(20),
      ]);
      
      setPatients(patientsData);
      setUpcomingAppointments(appointmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [toast]);

  // Handle selecting a patient for reminders
  const handlePatientSelect = (patientId: string) => {
    if (selectedPatients.includes(patientId)) {
      setSelectedPatients(selectedPatients.filter(id => id !== patientId));
    } else {
      setSelectedPatients([...selectedPatients, patientId]);
    }
  };

  // Select all patients for reminders
  const handleSelectAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(patient => patient.id));
    }
  };

  // Handle appointment reminder template
  const handleAppointmentReminderTemplate = () => {
    setReminderSubject("Recordatorio de su cita dental");
    setReminderMessage(
      "Estimado paciente,\n\nLe recordamos que tiene una cita programada en Dental Spark. " +
      "Por favor, llegue 10 minutos antes de su hora para completar cualquier documentación necesaria.\n\n" +
      "Si necesita reprogramar, por favor llámenos con 24 horas de anticipación.\n\n" +
      "Atentamente,\nEquipo de Dental Spark"
    );
  };

  // Handle sending reminders
  const handleSendReminder = () => {
    if (selectedPatients.length === 0) {
      toast({
        title: "Error",
        description: "Por favor seleccione al menos un paciente",
        variant: "destructive",
      });
      return;
    }

    if (!reminderSubject || !reminderMessage) {
      toast({
        title: "Error",
        description: "Por favor complete el asunto y el mensaje",
        variant: "destructive",
      });
      return;
    }

    // In a real application, this would call an API to send emails or SMS
    // For demo purposes, we'll just show a success toast
    toast({
      title: "Recordatorios enviados",
      description: `Recordatorios enviados a ${selectedPatients.length} pacientes`,
    });

    // Reset form
    setSelectedPatients([]);
    setReminderSubject("");
    setReminderMessage("");
  };

  // Handle sending appointment reminder
  const handleSendAppointmentReminder = (appointment: Appointment) => {
    // In a real application, this would call an API to send emails or SMS
    // For demo purposes, we'll just show a success toast
    toast({
      title: "Recordatorio enviado",
      description: `Recordatorio enviado a ${appointment.patientName} para su cita del ${format(new Date(appointment.date), "dd/MM/yyyy")}`,
    });
  };

  // Handle saving WhatsApp API configuration
  const handleSaveWhatsAppConfig = () => {
    if (!apiEndpoint) {
      toast({
        title: "Error",
        description: "Por favor ingrese el punto de conexión de la API",
        variant: "destructive",
      });
      return;
    }

    // In a real application, this would save the API configuration
    toast({
      title: "Configuración guardada",
      description: "La configuración de WhatsApp se ha guardado correctamente",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Comunicación</h1>
      </div>

      <Tabs defaultValue="reminders">
        <TabsList>
          <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
          <TabsTrigger value="appointments">Citas Próximas</TabsTrigger>
          <TabsTrigger value="api">Configuración API</TabsTrigger>
        </TabsList>
        
        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Pacientes</CardTitle>
                <CardDescription>
                  Seleccione los pacientes a los que desea enviar recordatorios
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-medium">
                    {selectedPatients.length} pacientes seleccionados
                  </Label>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedPatients.length === patients.length 
                      ? "Deseleccionar Todos" 
                      : "Seleccionar Todos"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-4">Cargando pacientes...</div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-4">No hay pacientes disponibles</div>
                  ) : (
                    patients.map(patient => (
                      <div 
                        key={patient.id} 
                        className={`flex items-center p-2 rounded-md cursor-pointer border ${
                          selectedPatients.includes(patient.id) 
                            ? "bg-dental-primary/10 border-dental-primary" 
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handlePatientSelect(patient.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                        <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                          {selectedPatients.includes(patient.id) && (
                            <div className="h-2 w-2 rounded-sm bg-primary" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Componer Mensaje</CardTitle>
                <CardDescription>
                  Redacte el recordatorio que desea enviar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input
                    id="subject"
                    placeholder="Asunto del recordatorio"
                    value={reminderSubject}
                    onChange={(e) => setReminderSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    placeholder="Escriba el mensaje del recordatorio"
                    rows={8}
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plantillas</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAppointmentReminderTemplate}
                    >
                      Recordatorio de Cita
                    </Button>
                    <Button variant="outline" size="sm">
                      Seguimiento de Tratamiento
                    </Button>
                    <Button variant="outline" size="sm">
                      Factura Pendiente
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Método de envío" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSendReminder}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Recordatorios
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Upcoming Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Citas Próximas</CardTitle>
              <CardDescription>
                Envíe recordatorios para citas próximas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando citas...</div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-4">No hay citas próximas programadas</div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map(appointment => {
                    const appointmentDate = new Date(appointment.date);
                    const today = new Date();
                    const isToday = format(appointmentDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                    const isTomorrow = format(appointmentDate, "yyyy-MM-dd") === format(addDays(today, 1), "yyyy-MM-dd");
                    const daysUntil = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div 
                        key={appointment.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-dental-primary/10 p-2">
                            <Bell className="h-6 w-6 text-dental-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{appointment.patientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(appointmentDate, "EEEE, dd 'de' MMMM, yyyy")} | {appointment.startTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Dr. {appointment.doctorName} | {appointment.treatmentType || "Consulta"}
                            </p>
                            <div className="mt-1">
                              <CustomBadge className="bg-dental-primary/10 text-dental-primary border-dental-primary/20 font-normal">
                                {isToday 
                                  ? "Hoy" 
                                  : isTomorrow 
                                  ? "Mañana" 
                                  : `En ${daysUntil} días`}
                              </CustomBadge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendAppointmentReminder(appointment)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendAppointmentReminder(appointment)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            SMS
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Configuration Tab */}
        <TabsContent value="api">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de WhatsApp</CardTitle>
                <CardDescription>
                  Configure la integración con WhatsApp para enviar mensajes automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-api">API Endpoint</Label>
                  <Input
                    id="whatsapp-api"
                    placeholder="https://api.whatsapp.com/send"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingrese el punto de conexión de la API de WhatsApp proporcionado por su proveedor
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-token">Token de Acceso</Label>
                  <Input
                    id="whatsapp-token"
                    type="password"
                    placeholder="••••••••••••••••"
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingrese el token de acceso para autenticación
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-template">Plantilla Predeterminada</Label>
                  <Textarea
                    id="whatsapp-template"
                    placeholder="Hola {{nombre}}, le recordamos su cita para el {{fecha}} a las {{hora}}."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Defina una plantilla predeterminada para los mensajes de WhatsApp
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveWhatsAppConfig}>
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Email</CardTitle>
                <CardDescription>
                  Configure la integración con su proveedor de email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">Servidor SMTP</Label>
                  <Input
                    id="smtp-server"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Puerto</Label>
                    <Input
                      id="smtp-port"
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-security">Seguridad</Label>
                    <Select>
                      <SelectTrigger id="smtp-security">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">Ninguna</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Usuario</Label>
                  <Input
                    id="smtp-username"
                    placeholder="correo@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Contraseña</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="••••••••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Nombre del Remitente</Label>
                  <Input
                    id="sender-name"
                    placeholder="Dental Spark"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="mr-2">
                  Probar Conexión
                </Button>
                <Button>
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* SMS and Email Templates Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4">
            Gestionar Plantillas
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Plantillas de Comunicación</DialogTitle>
            <DialogDescription>
              Gestione las plantillas de comunicación para recordatorios y notificaciones
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nombre de la Plantilla</Label>
              <Input
                id="template-name"
                placeholder="Recordatorio de Cita"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-type">Tipo</Label>
              <Select>
                <SelectTrigger id="template-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-subject">Asunto (para email)</Label>
              <Input
                id="template-subject"
                placeholder="Recordatorio de su cita dental"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Contenido</Label>
              <Textarea
                id="template-content"
                placeholder="Estimado/a {{nombre}}, le recordamos su cita para el {{fecha}} a las {{hora}}."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Utilice {"{{nombre}}"}, {"{{fecha}}"}, {"{{hora}}"}, etc. como variables de plantilla
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Eliminar</Button>
            <Button>Guardar Plantilla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
