import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Edit } from "lucide-react";
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
  }, [patient, form, isEditDialogOpen]);

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) {
        setError("ID de paciente no válido");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const patientData = await patientService.getById(id);
        
        if (!patientData) {
          setError("No se encontró el paciente solicitado");
          setPatient(null);
          toast({
            title: "Error",
            description: "No se pudo encontrar el paciente solicitado",
            variant: "destructive"
          });
        } else {
          setPatient(patientData);
          setError(null);
        }
      } catch (err) {
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
          description: "Error al cargar datos del paciente",
          variant: "destructive",
        });
      }
    };

    if (patient) {
      loadData();
    }
  }, [patient, id, toast]);

  const handleUpdatePatient = async (data: PatientFormValues) => {
    try {
      if (!id) return;
      
      const updatedPatient = await patientService.update(id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        insurance: data.insurance,
        insuranceNumber: data.insuranceNumber,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies,
      });
      
      setPatient(updatedPatient);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Éxito",
        description: "Datos del paciente actualizados correctamente",
      });
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paciente",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {patient ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <Button onClick={() => setIsEditDialogOpen(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </div>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar paciente</DialogTitle>
                <DialogDescription>
                  Actualiza los datos del paciente
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdatePatient)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email" {...field} />
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
                            <Input placeholder="Teléfono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de nacimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar género" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="femenino">Femenino</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ciudad" {...field} />
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
                          <FormLabel>Código postal</FormLabel>
                          <FormControl>
                            <Input placeholder="Código postal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="insurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seguro médico</FormLabel>
                          <FormControl>
                            <Input placeholder="Seguro médico" {...field} />
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
                          <FormLabel>Número de seguro</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de seguro" {...field} />
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
                        <FormLabel>Historia médica</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Historia médica" className="h-20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button onClick={() => setIsEditDialogOpen(false)} variant="outline">
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar cambios</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="citas">Citas ({appointments.length})</TabsTrigger>
              <TabsTrigger value="tratamientos">Tratamientos ({treatments.length})</TabsTrigger>
              <TabsTrigger value="facturas">Facturas ({invoices.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="perfil" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información personal</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Fecha de nacimiento</p>
                    <p>{patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "dd/MM/yyyy") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Género</p>
                    <p>{patient.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p>{patient.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p>{patient.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dirección</p>
                    <p>{patient.address || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ciudad</p>
                    <p>{patient.city || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Código postal</p>
                    <p>{patient.postalCode || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Información médica</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Seguro médico</p>
                    <p>{patient.insurance || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Número de seguro</p>
                    <p>{patient.insuranceNumber || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium">Historia médica</p>
                    <p>{patient.medicalHistory || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium">Alergias</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        patient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="secondary">{allergy}</Badge>
                        ))
                      ) : (
                        <p>No registradas</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="citas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de citas</CardTitle>
                  <CardDescription>
                    Registro de citas programadas y completadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div>No hay citas registradas para este paciente.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
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
                            <TableCell>{appointment.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tratamientos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tratamientos</CardTitle>
                  <CardDescription>
                    Tratamientos planificados y realizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {treatments.length === 0 ? (
                    <div>No hay tratamientos registrados para este paciente.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha inicio</TableHead>
                          <TableHead>Costo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {treatments.map(treatment => (
                          <TableRow key={treatment.id}>
                            <TableCell>{treatment.type}</TableCell>
                            <TableCell>{treatment.doctorName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{treatment.status}</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(treatment.startDate), "dd/MM/yyyy")}</TableCell>
                            <TableCell>${treatment.cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="facturas" className="space-y-4">
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
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-yellow-500 mb-4">No se encontró información del paciente</div>
          <Button onClick={() => navigate('/patients')}>
            Volver a Pacientes
          </Button>
        </div>
      )}
    </div>
  );
};

export default PatientDetails; 