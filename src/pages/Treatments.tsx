import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Check, Download, Edit, FileText, Plus, Search, X, User } from "lucide-react";
import ToothIcon from "@/components/icons/ToothIcon";
import { 
  patientService, 
  treatmentService, 
  Patient, 
  Treatment 
} from "@/lib/data-service";

// Mock service for doctors since it doesn't exist
const appointmentService = {
  getDoctors: async () => {
    return [
      { id: "1", firstName: "Juan", lastName: "Pérez" },
      { id: "2", firstName: "María", lastName: "González" },
      { id: "3", firstName: "Carlos", lastName: "Rodríguez" }
    ];
  }
};

// Schema for treatment form
const treatmentFormSchema = z.object({
  patientId: z.string({
    required_error: "Por favor seleccione un paciente",
  }),
  doctorId: z.string({
    required_error: "Por favor seleccione un doctor",
  }),
  type: z.string({
    required_error: "Por favor seleccione un tipo de tratamiento",
  }),
  description: z.string().min(1, {
    message: "Por favor ingrese una descripción",
  }),
  teeth: z.string().optional(),
  status: z.enum(["planned", "in-progress", "completed"], {
    required_error: "Por favor seleccione un estado",
  }),
  cost: z.number({
    required_error: "Por favor ingrese el costo",
    invalid_type_error: "Por favor ingrese un número válido",
  }).min(0, {
    message: "El costo no puede ser negativo",
  }),
  startDate: z.string({
    required_error: "Por favor seleccione una fecha de inicio",
  }),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type TreatmentFormValues = z.infer<typeof treatmentFormSchema>;

const Treatments = () => {
  const { toast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);

  // Form setup
  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      type: "",
      description: "",
      teeth: "",
      status: "planned",
      cost: 0,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      notes: "",
    },
  });

  // Load all data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [treatmentsData, patientsData, doctorsData] = await Promise.all([
        treatmentService.getAll(),
        patientService.getAll(),
        appointmentService.getDoctors(),
      ]);
      
      setTreatments(treatmentsData);
      setFilteredTreatments(treatmentsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading treatments data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de tratamientos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [toast]);

  // Filter treatments based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTreatments(treatments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = treatments.filter(
        treatment =>
          treatment.patientName.toLowerCase().includes(query) ||
          treatment.doctorName.toLowerCase().includes(query) ||
          treatment.type.toLowerCase().includes(query) ||
          treatment.description.toLowerCase().includes(query)
      );
      setFilteredTreatments(filtered);
    }
  }, [searchQuery, treatments]);

  // Handle treatment creation
  const handleAddTreatment = async (data: TreatmentFormValues) => {
    try {
      // Find patient and doctor names
      const patient = patients.find(p => p.id === data.patientId);
      const doctor = doctors.find(d => d.id === data.doctorId);
      
      if (!patient || !doctor) {
        toast({
          title: "Error",
          description: "Paciente o doctor no encontrado",
          variant: "destructive",
        });
        return;
      }
      
      // Parse teeth array from comma-separated string
      const teethArray = data.teeth
        ? data.teeth.split(",").map(t => parseInt(t.trim(), 10)).filter(t => !isNaN(t))
        : [];
      
      // Create the treatment
      const newTreatment = await treatmentService.create({
        patientId: data.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorId: data.doctorId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        type: data.type,
        description: data.description,
        teeth: teethArray,
        status: data.status,
        cost: data.cost,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        notes: data.notes,
      });
      
      toast({
        title: "Tratamiento agregado",
        description: "El tratamiento ha sido agregado exitosamente",
      });
      
      setTreatments(prev => [...prev, newTreatment]);
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding treatment:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el tratamiento",
        variant: "destructive",
      });
    }
  };

  // Get status badge based on treatment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planificado</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En Progreso</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tratamientos</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tratamiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Tratamiento</DialogTitle>
              <DialogDescription>
                Complete el formulario para agregar un nuevo tratamiento
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAddTreatment)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paciente</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un paciente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map(patient => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.firstName} {patient.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctors.map(doctor => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                Dr. {doctor.firstName} {doctor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Tratamiento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Limpieza Dental">Limpieza Dental</SelectItem>
                            <SelectItem value="Extracción">Extracción</SelectItem>
                            <SelectItem value="Empaste">Empaste</SelectItem>
                            <SelectItem value="Corona">Corona</SelectItem>
                            <SelectItem value="Tratamiento de Conducto">Tratamiento de Conducto</SelectItem>
                            <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                            <SelectItem value="Implante">Implante</SelectItem>
                            <SelectItem value="Revisión">Revisión</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planned">Planificado</SelectItem>
                            <SelectItem value="in-progress">En Progreso</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa el tratamiento"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="teeth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dientes (números separados por comas)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: 1, 2, 13, 14" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5">$</span>
                            <Input
                              type="number"
                              className="pl-6"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Finalización (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas adicionales sobre el tratamiento"
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
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Tratamiento</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tratamientos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="planned">Planificados</TabsTrigger>
          <TabsTrigger value="in-progress">En Progreso</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TreatmentsList
            treatments={filteredTreatments}
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="planned">
          <TreatmentsList
            treatments={filteredTreatments.filter(t => t.status === "planned")}
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="in-progress">
          <TreatmentsList
            treatments={filteredTreatments.filter(t => t.status === "in-progress")}
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="completed">
          <TreatmentsList
            treatments={filteredTreatments.filter(t => t.status === "completed")}
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// TreatmentsList component
interface TreatmentsListProps {
  treatments: Treatment[];
  isLoading: boolean;
  getStatusBadge: (status: string) => JSX.Element;
}

const TreatmentsList = ({ treatments, isLoading, getStatusBadge }: TreatmentsListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center text-muted-foreground">Cargando tratamientos...</div>
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center text-muted-foreground">No se encontraron tratamientos</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {treatments.map(treatment => (
        <Card key={treatment.id} className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{treatment.type}</CardTitle>
              {getStatusBadge(treatment.status)}
            </div>
            <CardDescription>
              {format(new Date(treatment.startDate), "dd/MM/yyyy")}
              {treatment.endDate && ` - ${format(new Date(treatment.endDate), "dd/MM/yyyy")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{treatment.patientName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Dr. {treatment.doctorName}</span>
            </div>
            
            {treatment.teeth && treatment.teeth.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <ToothIcon className="h-4 w-4 text-muted-foreground" />
                <span>Dientes: {treatment.teeth.join(", ")}</span>
              </div>
            )}
            
            <div className="text-sm mt-2">{treatment.description}</div>
            
            {treatment.notes && (
              <div className="text-sm text-muted-foreground mt-1">{treatment.notes}</div>
            )}
            
            <div className="mt-2 font-medium">Costo: ${treatment.cost.toFixed(2)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Treatments;
