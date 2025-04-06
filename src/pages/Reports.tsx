import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Download, Filter } from "lucide-react";
import { 
  patientService, 
  appointmentService, 
  invoiceService,
  treatmentService,
  Patient,
  Appointment,
  Invoice,
  Treatment
} from "@/lib/data-service";

const Reports = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [appointmentData, setAppointmentData] = useState<any[]>([]);
  const [treatmentData, setTreatmentData] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      
      const [patientsData, appointmentsData, invoicesData, treatmentsData] = await Promise.all([
        patientService.getAll(),
        appointmentService.getAll(),
        invoiceService.getAll(),
        treatmentService.getAll(),
      ]);
      
      const filteredInvoices = invoicesData.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
      
      const filteredTreatments = treatmentsData.filter(treatment => {
        const treatmentDate = new Date(treatment.startDate);
        return treatmentDate >= startDate && treatmentDate <= endDate;
      });
      
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setInvoices(filteredInvoices);
      setTreatments(filteredTreatments);
      
      const revenueByDate = {};
      filteredInvoices.forEach(invoice => {
        const date = invoice.date;
        if (!revenueByDate[date]) {
          revenueByDate[date] = 0;
        }
        revenueByDate[date] += invoice.total;
      });
      
      const revenueData = Object.keys(revenueByDate).map(date => ({
        date,
        revenue: revenueByDate[date],
      }));
      setRevenueData(revenueData);
      
      const appointmentCountsByDate = {};
      appointmentsData.forEach(appointment => {
        const date = appointment.date;
        if (!appointmentCountsByDate[date]) {
          appointmentCountsByDate[date] = 0;
        }
        appointmentCountsByDate[date]++;
      });
      
      const appointmentData = Object.keys(appointmentCountsByDate).map(date => ({
        date,
        appointments: appointmentCountsByDate[date],
      }));
      setAppointmentData(appointmentData);
      
      const treatmentCountsByType = {};
      filteredTreatments.forEach(treatment => {
        const type = treatment.type;
        if (!treatmentCountsByType[type]) {
          treatmentCountsByType[type] = 0;
        }
        treatmentCountsByType[type]++;
      });
      
      const treatmentData = Object.keys(treatmentCountsByType).map(type => ({
        type,
        count: treatmentCountsByType[type],
      }));
      setTreatmentData(treatmentData);
    } catch (error) {
      console.error("Error loading reports data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de los informes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, toast]);

  const handleMonthChange = (month: Date) => {
    setSelectedMonth(month);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Informes</h1>
        <div className="flex items-center space-x-2">
          <Select onValueChange={(value) => handleMonthChange(new Date(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={format(selectedMonth, "MMMM yyyy")} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = subMonths(new Date(), i);
                return (
                  <SelectItem key={month.toISOString()} value={month.toISOString()}>
                    {format(month, "MMMM yyyy")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
        </TabsList>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales</CardTitle>
              <CardDescription>
                Ingresos totales del mes actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : revenueData.length === 0 ? (
                <div className="text-center py-4">No hay datos de ingresos para este mes</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd/MM")} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Citas Mensuales</CardTitle>
              <CardDescription>
                Número de citas programadas por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : appointmentData.length === 0 ? (
                <div className="text-center py-4">No hay datos de citas para este mes</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={appointmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd/MM")} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Treatments Tab */}
        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Tratamiento</CardTitle>
              <CardDescription>
                Distribución de los tipos de tratamiento realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : treatmentData.length === 0 ? (
                <div className="text-center py-4">No hay datos de tratamientos para este mes</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="count"
                      isAnimationActive={false}
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {treatmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes</CardTitle>
              <CardDescription>
                Información general sobre los pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div>Total de Pacientes:</div>
                    <div>{patients.length}</div>
                  </div>
                  {/* Add more patient-related data here */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
