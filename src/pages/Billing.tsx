import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoiceService, patientService, Patient, Invoice } from "@/lib/data-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, CheckCircle, XCircle, FileText } from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const generateInvoiceNumber = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
};

const Billing = () => {
  const { toast } = useToast();
  const { search } = useLocation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateInvoiceNumber(), description: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<string>("unpaid");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidDate, setPaidDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const patientId = params.get("patientId");

    if (patientId) {
      setSelectedPatient(patientId);
    }
  }, [search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const patientsData = await patientService.getAll();
        setPatients(patientsData);

        if (selectedPatient) {
          const patient = patientsData.find((p) => p.id === selectedPatient);
          setCurrentPatient(patient || null);

          const patientInvoices = await invoiceService.getByPatientId(selectedPatient);
          setInvoices(patientInvoices);
        } else {
          const allInvoices = await invoiceService.getAll();
          setInvoices(allInvoices);
        }
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

    loadData();
  }, [selectedPatient, toast]);

  useEffect(() => {
    const newSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    setSubtotal(newSubtotal);

    const newTotal = newSubtotal + tax - discount;
    setTotal(newTotal);
  }, [items, tax, discount]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: generateInvoiceNumber(), description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };
          newItem.total = newItem.quantity * newItem.unitPrice;
          return newItem;
        }
        return item;
      })
    );
  };

  const handleCreateInvoice = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Por favor seleccione un paciente",
        variant: "destructive",
      });
      return;
    }

    try {
      const invoiceData: Omit<Invoice, "id" | "patientName"> = {
        patientId: selectedPatient,
        date: date,
        dueDate: dueDate,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: total,
        status: status,
        paidAmount: paidAmount,
        paidDate: paidDate,
        notes: notes,
      };

      await invoiceService.create(invoiceData);

      toast({
        title: "Factura creada",
        description: "La factura ha sido creada exitosamente",
      });

      setIsCreateDialogOpen(false);

      const patientInvoices = await invoiceService.getByPatientId(selectedPatient);
      setInvoices(patientInvoices);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la factura",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedInvoiceId) return;

    try {
      await invoiceService.markAsPaid(selectedInvoiceId, paidDate);

      toast({
        title: "Factura marcada como pagada",
        description: "La factura ha sido marcada como pagada exitosamente",
      });

      setIsMarkAsPaidDialogOpen(false);

      if (selectedPatient) {
        const patientInvoices = await invoiceService.getByPatientId(selectedPatient);
        setInvoices(patientInvoices);
      } else {
        const allInvoices = await invoiceService.getAll();
        setInvoices(allInvoices);
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar la factura como pagada",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Factura
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Facturas</CardTitle>
          <CardDescription>
            Visualice y gestione las facturas de sus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente</Label>
              <Select
                value={selectedPatient}
                onValueChange={(value) => {
                  setSelectedPatient(value);
                }}
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Ver todas las facturas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-invoices">Ver todas las facturas</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id || `patient-${patient.firstName}-${patient.lastName}`}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {invoices.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.patientName || "No Patient"}
                      </TableCell>
                      <TableCell>{format(new Date(invoice.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>${invoice.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {invoice.status === "paid" ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Pagada
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Pendiente
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status === "unpaid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoiceId(invoice.id);
                              setIsMarkAsPaidDialogOpen(true);
                            }}
                          >
                            Marcar como Pagada
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No hay facturas registradas para este paciente</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Factura</DialogTitle>
            <DialogDescription>
              Ingrese los detalles de la factura para el paciente seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente</Label>
                <Select
                  value={selectedPatient}
                  onValueChange={(value) => setSelectedPatient(value)}
                >
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Seleccione un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length > 0 ? (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id || `patient-${patient.firstName}-${patient.lastName}`}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-patients">No hay pacientes disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-6 gap-4 items-center">
                    <Input
                      type="text"
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, "quantity", parseFloat(e.target.value))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Precio Unitario"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(item.id, "unitPrice", parseFloat(e.target.value))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Total"
                      value={item.quantity * item.unitPrice}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={handleAddItem}>
                  Agregar Item
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="number"
                  value={subtotal.toFixed(2)}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Impuestos</Label>
                <Input
                  id="tax"
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Descuento</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input id="total" type="number" value={total.toFixed(2)} readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCreateInvoice}>Crear Factura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Marcar Factura como Pagada</DialogTitle>
            <DialogDescription>
              Ingrese la fecha de pago para marcar la factura como pagada
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidDate">Fecha de Pago</Label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleMarkAsPaid}>Marcar como Pagada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
