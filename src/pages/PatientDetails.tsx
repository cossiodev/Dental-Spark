import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Check, Edit, FileText, Plus } from "lucide-react";
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
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        if (!id) {
          toast({
            title: "Error",
            description: "ID de paciente inválido",
            variant: "destructive",
          });
          return;
        }
        
        const [patientData, appointmentsData, treatmentsData, invoicesData] = await Promise.all([
          patientService.getById(id),
          appointmentService.getByPatientId(id),
          treatmentService.getByPatientId(id),
          invoiceService.getByPatientId(id),
        ]);
        
        setPatient(patientData);
        setAppointments(appointmentsData);
        setTreatments(treatmentsData);
        setInvoices(invoicesData);
        
        form.reset({
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          phone: patientData.phone,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          address: patientData.address,
          city: patientData.city,
          postalCode: patientData.postalCode,
          insurance: patientData.insurance || "",
          insuranceNumber: patientData.insuranceNumber || "",
          medicalHistory: patientData.medicalHistory || "",
          allergies: patientData.allergies,
        });
      } catch (error) {
        console.error("Error loading patient details:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles del paciente",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, toast, form]);

  const handleUpdatePatient = async (data: PatientFormValues) => {
    try {
      if (!id) {
        toast({
          title: "Error",
          description: "ID de paciente inválido",
          variant: "destructive",
        });
        return;
      }
      
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
        insurance: data.insurance || "",
        insuranceNumber: data.insuranceNumber || "",
        medicalHistory: data.medicalHistory || "",
        allergies: data.allergies,
      });
      
      setPatient(updatedPatient);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Paciente actualizado",
        description: "Los detalles del paciente han sido actualizados exitosamente",
      });
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los detalles del paciente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Detalles del Paciente
        </h1>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Detalles del Paciente</DialogTitle>
              <DialogDescription>
                Actualice la información del paciente
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleUpdatePatient)}
                className="space-y-4"
              >
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="correo@ejemplo.com"
                            {...field}
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
                          <Input placeholder="Teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un género" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Femenino</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="Código Postal" {...field} />
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
                        <FormLabel>Seguro</FormLabel>
                        <FormControl>
                          <Input placeholder="Seguro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="insuranceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Seguro</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de Seguro" {...field} />
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
                          placeholder="Historial Médico"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent>Cargando detalles del paciente...</CardContent>
        </Card>
      ) : patient ? (
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
      ) : (
        <Card>
          <CardContent>Paciente no encontrado.</CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientDetails;
