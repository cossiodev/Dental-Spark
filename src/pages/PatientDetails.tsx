import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
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
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Edit, FileText, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  patientService, 
  appointmentService, 
  treatmentService, 
  invoiceService, 
  Patient, 
  Appointment, 
  Treatment, 
  Invoice
} from "@/lib/data-service";
import { Spinner } from "@/components/ui/spinner";

const patientFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.string().min(1, "El género es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  postalCode: z.string().min(1, "El código postal es requerido"),
  insurance: z.string().optional(),
  insuranceNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.array(z.string()).default([]),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("perfil");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      city: "",
      postalCode: "",
      insurance: "",
      insuranceNumber: "",
      medicalHistory: "",
      allergies: [],
    },
  });

  useEffect(() => {
    if (patient) {
      console.log("[DIAGNÓSTICO] Actualizando formulario con datos del paciente:", patient);
      setTimeout(() => {
        form.reset({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          email: patient.email || '',
          phone: patient.phone || '',
          dateOfBirth: patient.dateOfBirth || '',
          gender: patient.gender || '',
          address: patient.address || '',
          city: patient.city || '',
          postalCode: patient.postalCode || '',
          insurance: patient.insurance || '',
          insuranceNumber: patient.insuranceNumber || '',
          medicalHistory: patient.medicalHistory || '',
          allergies: patient.allergies || [],
        });
      }, 50); // Pequeño retraso para garantizar que el diálogo esté completamente abierto
    }
  }, [patient, form, isEditDialogOpen]); // Añadir isEditDialogOpen como dependencia

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) {
        setError("ID de paciente no válido");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[DIAGNÓSTICO] Solicitando datos del paciente con ID: ${id}`);
        setIsLoading(true);
        const patientData = await patientService.getById(id);
        
        if (!patientData) {
          console.error('[DIAGNÓSTICO] Paciente no encontrado');
          setError("No se encontró el paciente solicitado");
          setPatient(null);
          toast({
            title: "Error",
            description: "No se pudo encontrar el paciente solicitado",
            variant: "destructive"
          });
        } else {
          console.log(`[DIAGNÓSTICO] Paciente cargado correctamente: ${patientData.firstName} ${patientData.lastName}`);
          setPatient(patientData);
          setError(null);
        }
      } catch (err) {
        console.error('[DIAGNÓSTICO] Error al cargar el paciente:', err);
        setError("Error al cargar los datos del paciente");
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos del paciente",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [id, toast]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) {
          toast({
            title: "Error",
            description: "ID de paciente inválido",
            variant: "destructive",
          });
          return;
        }
        
        const [appointmentsData, treatmentsData, invoicesData] = await Promise.all([
          appointmentService.getByPatientId(id),
          treatmentService.getByPatientId(id),
          invoiceService.getByPatientId(id),
        ]);
        
        setAppointments(appointmentsData);
        setTreatments(treatmentsData);
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error loading patient details:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles del paciente",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [id, toast]);

  const handleUpdatePatient = async (data: PatientFormValues) => {
    if (!patient) return;

    try {
      console.log("[DIAGNÓSTICO] Actualizando paciente con ID:", patient.id);
      console.log("[DIAGNÓSTICO] Datos a actualizar:", data);
      console.log("[DIAGNÓSTICO] Valores del formulario:", form.getValues());

      // Mostrar toast de carga
      toast({
        title: "Actualizando paciente",
        description: "Guardando información del paciente...",
      });

      // Preparar los datos para actualización
      const updatedPatient: Partial<Patient> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        postalCode: data.postalCode || undefined,
        insurance: data.insurance || undefined,
        insuranceNumber: data.insuranceNumber || undefined,
        medicalHistory: data.medicalHistory || undefined,
        allergies: data.allergies || [],
      };

      // Actualizar el paciente
      const updatedData = await patientService.update(patient.id, updatedPatient);
      console.log("[DIAGNÓSTICO] Paciente actualizado:", updatedData);

      // Actualizar el estado local con los datos actualizados
      setPatient({
        ...patient,
        ...updatedData,
      });

      // Cerrar el diálogo
      setIsEditDialogOpen(false);

      // Mostrar mensaje de éxito
      toast({
        title: "Paciente actualizado",
        description: "La información del paciente ha sido actualizada correctamente",
      });
    } catch (error) {
      console.error("[DIAGNÓSTICO] Error al actualizar paciente:", error);
      toast({
        title: "Error",
        description: typeof error === 'string' 
          ? error 
          : "No se pudo actualizar la información del paciente. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = () => {
    // Asegurarse de que los datos del paciente estén cargados en el formulario antes de abrir el diálogo
    if (patient) {
      form.reset({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || '',
        address: patient.address || '',
        city: patient.city || '',
        postalCode: patient.postalCode || '',
        insurance: patient.insurance || '',
        insuranceNumber: patient.insuranceNumber || '',
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || [],
      });
      setIsEditDialogOpen(true);
    }
  };

  // Agregar un manejador para cuando cambia el estado del diálogo
  const handleDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    
    // Si el diálogo se está cerrando, no hacemos nada adicional
    if (!open) return;
    
    // Si el diálogo se está abriendo, aseguramos que los datos del formulario estén actualizados
    if (patient) {
      console.log("[DIAGNÓSTICO] Diálogo abierto, reiniciando formulario con datos del paciente");
      form.reset({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || '',
        address: patient.address || '',
        city: patient.city || '',
        postalCode: patient.postalCode || '',
        insurance: patient.insurance || '',
        insuranceNumber: patient.insuranceNumber || '',
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || [],
      });
    }
  };

  // Monitorear cambios en el formulario para fines de depuración
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("[DIAGNÓSTICO] Formulario actualizado:", value);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              {error || "No se pudo cargar el paciente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No se pudo encontrar el paciente con el ID especificado o ha ocurrido un error al cargar sus datos.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/pacientes")}>
              Volver a la lista de pacientes
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Detalles del Paciente
        </h1>
        <Button onClick={handleEditClick}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Paciente
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Detalles del Paciente</DialogTitle>
              <DialogDescription>
                Actualice la información del paciente
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdatePatient)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="correo@ejemplo.com" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-7890" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => {
                              console.log("[DIAGNÓSTICO] Campo fecha cambiado:", e.target.value);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => {
                      console.log("[DIAGNÓSTICO] Campo género:", field.value);
                      return (
                        <FormItem>
                          <FormLabel>Género</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              console.log("[DIAGNÓSTICO] Género seleccionado:", value);
                              field.onChange(value);
                            }}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un género" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                              <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle Principal 123" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seguro Médico</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del seguro" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="insuranceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Seguro</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de póliza" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historial Médico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Historial médico relevante"
                          className="h-24"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alergias</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="border rounded-md p-3 flex flex-wrap gap-2 bg-background">
                            {field.value && field.value.map((allergy, i) => (
                              <Badge key={i} variant="secondary" className="flex items-center gap-1">
                                {allergy}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => {
                                    const newAllergies = [...field.value];
                                    newAllergies.splice(i, 1);
                                    field.onChange(newAllergies);
                                  }}
                                />
                              </Badge>
                            ))}
                            <Input
                              className="border-0 flex-1 min-w-[150px] p-0 text-sm focus-visible:ring-0"
                              placeholder="Añadir alergia y presionar Enter"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                  e.preventDefault();
                                  const newAllergies = [...(field.value || []), e.currentTarget.value.trim()];
                                  field.onChange(newAllergies);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Paciente</CardTitle>
              <CardDescription>
                Detalles personales del paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium">Nombre</div>
                  <div>{patient.firstName} {patient.lastName}</div>
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div>{patient.email}</div>
                </div>
                <div>
                  <div className="font-medium">Teléfono</div>
                  <div>{patient.phone}</div>
                </div>
                <div>
                  <div className="font-medium">Fecha de Nacimiento</div>
                  <div>{format(new Date(patient.dateOfBirth), "dd/MM/yyyy")}</div>
                </div>
                <div>
                  <div className="font-medium">Género</div>
                  <div>{patient.gender}</div>
                </div>
                <div>
                  <div className="font-medium">Dirección</div>
                  <div>{patient.address}, {patient.city}, {patient.postalCode}</div>
                </div>
                <div>
                  <div className="font-medium">Doctor asignado</div>
                  <div>{patient.treatingDoctor ? `Dr. ${patient.treatingDoctor.firstName} ${patient.treatingDoctor.lastName}` : "No asignado"}</div>
                </div>
                <div>
                  <div className="font-medium">Seguro</div>
                  <div>{patient.insurance || "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium">Número de Seguro</div>
                  <div>{patient.insuranceNumber || "N/A"}</div>
                </div>
              </div>
              <div>
                <div className="font-medium">Historial Médico</div>
                <div>{patient.medicalHistory || "N/A"}</div>
              </div>
              <div>
                <div className="font-medium">Alergias</div>
                <div>
                  {patient.allergies.length > 0 ? (
                    patient.allergies.join(", ")
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Citas</CardTitle>
              <CardDescription>
                Citas programadas para este paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div>No hay citas programadas para este paciente.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map(appointment => (
                      <TableRow key={appointment.id}>
                        <TableCell>{format(new Date(appointment.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{appointment.startTime} - {appointment.endTime}</TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{appointment.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tratamientos</CardTitle>
              <CardDescription>
                Tratamientos realizados a este paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treatments.length === 0 ? (
                <div>No hay tratamientos registrados para este paciente.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.map(treatment => (
                      <TableRow key={treatment.id}>
                        <TableCell>{format(new Date(treatment.startDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{treatment.type}</TableCell>
                        <TableCell>{treatment.description}</TableCell>
                        <TableCell>${treatment.cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturas</CardTitle>
              <CardDescription>
                Facturas generadas para este paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div>No hay facturas generadas para este paciente.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell>{format(new Date(invoice.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>${invoice.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{invoice.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetails;
