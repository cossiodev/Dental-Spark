import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FormMessage,
  FormDescription,
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
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Check, Filter, Plus, Search, X, Edit, Trash2, UserPlus, Baby, UserCog, ChevronUp, RefreshCw } from "lucide-react";
import { patientService, Patient } from "@/lib/data-service";

const patientFormSchema = z.object({
  firstName: z.string().min(1, ""),
  lastName: z.string().min(1, ""),
  email: z.string().optional(),
  phone: z.string().min(1, ""),
  dateOfBirth: z.string().optional(),
  gender: z.string().min(1, ""),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  insurance: z.string().optional(),
  insuranceNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  isPediatric: z.boolean().default(false),
  legalGuardian: z.object({
    name: z.string().min(1, ""),
    relationship: z.string().min(1, ""),
    phone: z.string().min(1, ""),
    email: z.string().optional(),
  }).optional(),
  treatingDoctorId: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const Patients = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "adult" | "pediatric">("all");
  const [sortField, setSortField] = useState<"name" | "lastVisit" | "dateOfBirth">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      isPediatric: false,
      legalGuardian: undefined,
    },
  });

  const isPediatric = form.watch("isPediatric");

  useEffect(() => {
    if (isPediatric) {
      form.setValue('legalGuardian', {
        name: '',
        relationship: '',
        phone: '',
        email: '',
      });
    } else {
      form.setValue('legalGuardian', undefined);
    }
  }, [isPediatric, form]);

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[DIAGNÓSTICO] Iniciando carga de pacientes...");
      
      // Limpiar el estado de pacientes primero para evitar datos antiguos
      setFilteredPatients([]);
      
      const data = await patientService.getAll();
      
      console.log(`[DIAGNÓSTICO] Pacientes cargados (${data.length}):`, 
        data.map(p => ({id: p.id, nombre: `${p.firstName} ${p.lastName}`})));
      
      if (data.length === 0) {
        console.warn("[DIAGNÓSTICO] No se encontraron pacientes en la base de datos");
        toast({
          title: "Información",
          description: "No hay pacientes registrados en el sistema",
        });
      }
      
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error("[DIAGNÓSTICO] Error cargando pacientes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes. Intente nuevamente.",
        variant: "destructive",
      });
      // Establecer un estado vacío para no mostrar datos antiguos
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    let filtered = patients;
    
    if (activeTab === "pediatric") {
      filtered = patients.filter(p => p.isPediatric);
    } else if (activeTab === "adult") {
      filtered = patients.filter(p => !p.isPediatric);
    }
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(query) ||
          patient.lastName.toLowerCase().includes(query) ||
          `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(query) ||
          patient.email.toLowerCase().includes(query) ||
          patient.phone.includes(query) ||
          (patient.treatingDoctor && `${patient.treatingDoctor.firstName} ${patient.treatingDoctor.lastName}`.toLowerCase().includes(query))
      );
    }
    
    // Sort the filtered results
    filtered = [...filtered].sort((a, b) => {
      if (sortField === "name") {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return sortDirection === "asc" 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } 
      else if (sortField === "lastVisit") {
        const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      else if (sortField === "dateOfBirth") {
        const dobA = new Date(a.dateOfBirth).getTime();
        const dobB = new Date(b.dateOfBirth).getTime();
        return sortDirection === "asc" ? dobA - dobB : dobB - dobA;
      }
      return 0;
    });
    
    setFilteredPatients(filtered);
  }, [searchQuery, patients, activeTab, sortField, sortDirection]);

  const handleSort = (field: "name" | "lastVisit" | "dateOfBirth") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddPatient = async (data: PatientFormValues) => {
    try {
      if (data.isPediatric) {
        if (!data.legalGuardian || !data.legalGuardian.name || !data.legalGuardian.phone || !data.legalGuardian.relationship) {
          toast({
            title: "Error",
            description: "La información del tutor legal es requerida para pacientes pediátricos",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Convertir alergias a array si es necesario
      let allergiesArray: string[] = [];
      if (typeof data.allergies === 'string') {
        allergiesArray = (data.allergies as unknown as string).split(',').map(item => item.trim()).filter(Boolean);
      } else {
        allergiesArray = data.allergies.filter(Boolean);
      }

      console.log("[DIAGNÓSTICO] Enviando datos del paciente:", {
        ...data,
        allergies: allergiesArray
      });
      
      // Mostrar toast de carga
      toast({
        title: "Creando paciente",
        description: "Guardando información del paciente...",
      });

      // Intentar crear el paciente
      const newPatient = await patientService.create({
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
        allergies: allergiesArray,
        isPediatric: data.isPediatric,
        legalGuardian: data.isPediatric && data.legalGuardian ? {
          name: data.legalGuardian.name,
          relationship: data.legalGuardian.relationship,
          phone: data.legalGuardian.phone,
          email: data.legalGuardian.email || undefined
        } : undefined,
      });
      
      console.log("[DIAGNÓSTICO] Paciente creado correctamente:", newPatient);
      console.log("[DIAGNÓSTICO] ID del paciente:", newPatient.id);

      // Cerrar el diálogo antes de actualizar la lista para evitar problemas de UI
      setIsAddDialogOpen(false);
      
      // Restablecer el formulario
      form.reset({
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
        isPediatric: false,
        legalGuardian: undefined,
      });
      
      // Verificar si el ID comienza con "sample-temp", lo que indica que es un paciente local
      const isLocalPatient = newPatient.id.startsWith('sample-temp');
      
      if (isLocalPatient) {
        toast({
          title: "Aviso",
          description: "El paciente se guardó localmente. Es posible que haya problemas de conexión con el servidor.",
          variant: "warning"
        });
      } else {
        toast({
          title: "Paciente agregado",
          description: "El paciente ha sido agregado exitosamente.",
        });
      }

      // Actualizar inmediatamente el estado local para mejor experiencia de usuario
      setPatients(prevPatients => {
        // Comprobamos si el paciente ya existe en la lista (por ID)
        const exists = prevPatients.some(p => p.id === newPatient.id);
        if (exists) {
          // Si existe, actualizamos el paciente existente
          return prevPatients.map(p => p.id === newPatient.id ? newPatient : p);
        } else {
          // Si no existe, agregamos el nuevo paciente
          console.log("[DIAGNÓSTICO] Agregando nuevo paciente a la lista local");
          const updatedPatients = [...prevPatients, newPatient];
          setFilteredPatients(updatedPatients); // Actualizar también filteredPatients
          return updatedPatients;
        }
      });
      
      // Recargar la lista completa después de una breve pausa para asegurarse
      // de que los cambios se hayan propagado en Supabase
      setTimeout(() => {
        console.log("[DIAGNÓSTICO] Recargando lista completa de pacientes...");
        loadPatients();
      }, 1500);
      
    } catch (error) {
      console.error("[DIAGNÓSTICO] Error agregando paciente:", error);
      
      let errorMessage = "No se pudo agregar el paciente";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      await patientService.delete(patientToDelete.id);
      
      toast({
        title: "Paciente eliminado",
        description: "El paciente ha sido eliminado exitosamente",
      });

      setPatients(patients.filter((p) => p.id !== patientToDelete.id));
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paciente",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">Gestiona los pacientes registrados en el sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPatients} className="h-10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar Lista
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <UserPlus className="mr-2 h-4 w-4" />
                Añadir Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
                <DialogDescription>
                  Complete el formulario para agregar un nuevo paciente al sistema.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddPatient)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <FormField
                      control={form.control}
                      name="isPediatric"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center">
                              <Baby className="h-4 w-4 mr-2" />
                              Paciente Pediátrico
                            </FormLabel>
                            <FormDescription>
                              Marque esta opción si el paciente es menor de edad y requiere un tutor legal.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="123-456-7890" {...field} />
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
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="ejemplo@correo.com"
                              {...field}
                            />
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
                          <FormLabel>Fecha de Nacimiento (opcional)</FormLabel>
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle Principal 123" {...field} />
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
                          <FormLabel>Ciudad (opcional)</FormLabel>
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
                          <FormLabel>Código Postal (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isPediatric && (
                    <div className="space-y-4 border p-4 rounded-md bg-muted/10">
                      <h3 className="font-medium">Información del Tutor Legal</h3>
                      
                      <FormField
                        control={form.control}
                        name="legalGuardian.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Tutor</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="legalGuardian.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relación</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo de relación" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Padre">Padre</SelectItem>
                                  <SelectItem value="Madre">Madre</SelectItem>
                                  <SelectItem value="Abuelo">Abuelo</SelectItem>
                                  <SelectItem value="Abuela">Abuela</SelectItem>
                                  <SelectItem value="Tío">Tío</SelectItem>
                                  <SelectItem value="Tía">Tía</SelectItem>
                                  <SelectItem value="Tutor legal">Tutor legal</SelectItem>
                                  <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="legalGuardian.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl>
                                <Input placeholder="123-456-7890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="legalGuardian.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="tutor@ejemplo.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="insurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seguro Dental (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre del seguro"
                              {...field}
                            />
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
                          <FormLabel>Número de Póliza (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Número de póliza"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alergias (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Alergias separadas por comas"
                            value={field.value.join(', ')}
                            onChange={(e) => field.onChange(e.target.value.split(',').map(item => item.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Ejemplo: Penicilina, Látex, Lidocaína
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Historial Médico (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ingrese información relevante del historial médico del paciente"
                            className="min-h-[100px]"
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
                    <Button type="submit">Guardar Paciente</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search" 
              placeholder="Buscar por nombre, email, teléfono o doctor..."
              className="pl-8 w-full md:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "adult" | "pediatric")} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="adult">Adultos</TabsTrigger>
              <TabsTrigger value="pediatric">Pediátricos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-primary" 
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Nombre
                        {sortField === "name" && (
                          <ChevronUp className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "transform rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary" 
                      onClick={() => handleSort("dateOfBirth")}
                    >
                      <div className="flex items-center">
                        F. Nacimiento
                        {sortField === "dateOfBirth" && (
                          <ChevronUp className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "transform rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <UserCog className="mr-2 h-4 w-4" />
                        Doctor asignado
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary" 
                      onClick={() => handleSort("lastVisit")}
                    >
                      <div className="flex items-center">
                        Última visita
                        {sortField === "lastVisit" && (
                          <ChevronUp className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "transform rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Cargando pacientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No se encontraron pacientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow 
                        key={patient.id} 
                        className="cursor-pointer hover:bg-muted/60"
                        onClick={() => handleRowClick(patient)}
                      >
                        <TableCell>
                          <div className="font-medium flex items-center">
                            {patient.isPediatric && (
                              <Baby className="mr-2 h-4 w-4 text-pink-500" />
                            )}
                            {patient.firstName} {patient.lastName}
                          </div>
                          {patient.isPediatric && patient.legalGuardian && (
                            <div className="text-xs text-muted-foreground">
                              Tutor: {patient.legalGuardian.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>
                          {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "dd/MM/yyyy") : ""}
                        </TableCell>
                        <TableCell>
                          {patient.treatingDoctor ? (
                            <div className="text-sm">
                              <span className="font-medium">Dr. {patient.treatingDoctor.firstName} {patient.treatingDoctor.lastName}</span>
                              {patient.treatingDoctor.specialization && (
                                <div className="text-xs text-muted-foreground">
                                  {patient.treatingDoctor.specialization}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No asignado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient.lastVisit
                            ? format(new Date(patient.lastVisit), "dd/MM/yyyy")
                            : "Sin visitas"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/patients/${patient.id}`);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(patient);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar al paciente{" "}
              {patientToDelete
                ? `${patientToDelete.firstName} ${patientToDelete.lastName}`
                : ""}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePatient}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
