import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  appointmentService, 
  patientService, 
  invoiceService, 
  inventoryService,
  Appointment,
  Patient,
  Invoice,
  InventoryItem
} from "@/lib/data-service";
import { format } from "date-fns";
import { 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  User, 
  AlertTriangle 
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  className?: string;
}

const StatCard = ({ title, value, description, icon, className }: StatCardProps) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const COLORS = ["#4cc2d0", "#0a6e81", "#ff9800", "#4caf50", "#7e57c2", "#ec407a", "#ef5350"];

// Mock data for statistics service
const statisticsService = {
  getAppointmentsByStatus: async () => [
    { name: "Programada", value: 45 },
    { name: "Completada", value: 30 },
    { name: "Cancelada", value: 15 },
    { name: "En espera", value: 10 }
  ],
  getTreatmentsByType: async () => [
    { name: "Limpieza", value: 35 },
    { name: "Extracción", value: 20 },
    { name: "Ortodoncia", value: 25 },
    { name: "Endodoncia", value: 15 },
    { name: "Implantes", value: 5 }
  ],
  getMonthlyRevenue: async () => [
    { name: "Ene", value: 2500 },
    { name: "Feb", value: 3200 },
    { name: "Mar", value: 4100 },
    { name: "Abr", value: 3800 },
    { name: "May", value: 4500 },
    { name: "Jun", value: 5200 },
    { name: "Jul", value: 4800 },
    { name: "Ago", value: 5100 },
    { name: "Sep", value: 5800 },
    { name: "Oct", value: 6200 },
    { name: "Nov", value: 5900 },
    { name: "Dic", value: 6500 }
  ],
  getInventoryByCategory: async () => [
    { name: "Materiales", value: 40 },
    { name: "Instrumentos", value: 30 },
    { name: "Medicamentos", value: 20 },
    { name: "Equipos", value: 10 }
  ]
};

// Mock treatment service
const treatmentService = {
  getAll: async () => []
};

const Dashboard = () => {
  const { toast } = useToast();
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointmentsToday: 0,
    totalTreatments: 0,
    totalRevenue: 0,
  });

  const [appointmentStats, setAppointmentStats] = useState<any[]>([]);
  const [treatmentStats, setTreatmentStats] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Cargando datos del dashboard...");
        
        // Agregamos manejo de errores individual para cada operación
        let patients: Patient[] = [];
        try {
          patients = await patientService.getAll();
          console.log(`Cargados ${patients.length} pacientes`);
        } catch (error) {
          console.error("Error cargando pacientes:", error);
          patients = [];
        }
        
        let todayAppointments: Appointment[] = [];
        try {
          const today = format(new Date(), "yyyy-MM-dd");
          todayAppointments = await appointmentService.getByDateRange(today, today);
          console.log(`Cargadas ${todayAppointments.length} citas para hoy`);
        } catch (error) {
          console.error("Error cargando citas:", error);
          todayAppointments = [];
        }
        
        // Datos estadísticos base o mock si hay error
        const treatments = []; // Usar mock data por ahora
        const paidInvoices: Invoice[] = []; // Usar mock data por ahora
        
        setStats({
          totalPatients: patients.length,
          totalAppointmentsToday: todayAppointments.length,
          totalTreatments: treatments.length,
          totalRevenue: paidInvoices.reduce((acc, inv) => acc + inv.total, 0),
        });

        setTodayAppointments(
          todayAppointments.sort((a, b) => 
            (a.startTime || "").localeCompare(b.startTime || "")
          ).slice(0, 5)
        );
        
        // Cargar pacientes recientes con manejo de errores
        try {
          const recentPatientsData = await patientService.getRecent(5);
          setRecentPatients(recentPatientsData);
          console.log(`Cargados ${recentPatientsData.length} pacientes recientes`);
        } catch (error) {
          console.error("Error cargando pacientes recientes:", error);
          setRecentPatients([]);
        }
        
        // Cargar datos de inventario con manejo de errores
        try {
          console.log("Intentando obtener inventario bajo...");
          const lowStockItemsData = await inventoryService.getLowStock();
          console.log("Inventario bajo obtenido:", lowStockItemsData.length, "ítems");
          setLowStockItems(lowStockItemsData);
        } catch (error) {
          console.error("Error cargando inventario bajo:", error);
          setLowStockItems([]);
        }
        
        // Cargar facturas impagas con manejo de errores
        try {
          const unpaidInvoicesData = await invoiceService.getUnpaid();
          setUnpaidInvoices(unpaidInvoicesData);
        } catch (error) {
          console.error("Error cargando facturas impagas:", error);
          setUnpaidInvoices([]);
        }

        // Usar datos de ejemplo para estadísticas
        setAppointmentStats(await statisticsService.getAppointmentsByStatus());
        setTreatmentStats(await statisticsService.getTreatmentsByType());
        setRevenueStats(await statisticsService.getMonthlyRevenue());
        setInventoryStats(await statisticsService.getInventoryByCategory());
      } catch (error) {
        console.error("Error general cargando datos del dashboard:", error);
        toast({
          title: "Error",
          description: "Hubo un problema al cargar los datos del dashboard. Usando datos de muestra.",
          variant: "destructive",
        });
        // Inicializar con datos vacíos
        setStats({
          totalPatients: 0,
          totalAppointmentsToday: 0,
          totalTreatments: 0,
          totalRevenue: 0,
        });
        setTodayAppointments([]);
        setRecentPatients([]);
        setLowStockItems([]);
        setUnpaidInvoices([]);
      }
    };

    fetchData();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            {format(new Date(), "EEEE, dd 'de' MMMM, yyyy")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pacientes totales"
          value={stats.totalPatients}
          description="Pacientes registrados en el sistema"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Citas hoy"
          value={stats.totalAppointmentsToday}
          description={`Para ${format(new Date(), "dd/MM/yyyy")}`}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Tratamientos"
          value={stats.totalTreatments}
          description="Tratamientos registrados"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ingresos totales"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          description="De facturas pagadas"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Citas de hoy</CardTitle>
                <CardDescription>Próximas citas programadas para hoy</CardDescription>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay citas programadas para hoy</p>
                ) : (
                  <div className="space-y-2">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{appointment.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.startTime} - {appointment.endTime}
                          </p>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Dr. {appointment.doctorName}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link to="/appointments">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver todas las citas
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacientes recientes</CardTitle>
                <CardDescription>Últimos pacientes registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <div className="rounded-full bg-dental-primary/20 text-dental-primary p-1 mr-2">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(patient.createdAt), "dd/MM/yyyy")}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link to="/patients">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver todos los pacientes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estado de citas</CardTitle>
                <CardDescription>Distribución de citas por estado</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {appointmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingresos mensuales</CardTitle>
                <CardDescription>Últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Ingresos"]} />
                    <Bar dataKey="value" fill="#4cc2d0" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tratamientos por tipo</CardTitle>
                <CardDescription>Distribución de tipos de tratamiento</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treatmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {treatmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventario por categoría</CardTitle>
                <CardDescription>Distribución de inventario por categorías</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {inventoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Inventario bajo</CardTitle>
                  {lowStockItems.length > 0 && (
                    <div className="rounded-full bg-dental-warning/20 text-dental-warning p-1">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <CardDescription>Productos con stock por debajo del mínimo</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay productos con bajo stock</p>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-dental-warning">
                            {item.quantity}/{item.minQuantity} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link to="/inventory">
                        <Button variant="outline" size="sm" className="w-full">
                          Ir a Inventario
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Facturas pendientes</CardTitle>
                  {unpaidInvoices.length > 0 && (
                    <div className="rounded-full bg-dental-warning/20 text-dental-warning p-1">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <CardDescription>Facturas por cobrar</CardDescription>
              </CardHeader>
              <CardContent>
                {unpaidInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay facturas pendientes</p>
                ) : (
                  <div className="space-y-2">
                    {unpaidInvoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{invoice.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.date), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-dental-error">${invoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link to="/billing">
                        <Button variant="outline" size="sm" className="w-full">
                          Ir a Facturación
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
