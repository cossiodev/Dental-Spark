import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Check, Filter, Package, Plus, Search, X } from "lucide-react";
import { inventoryService, InventoryItem } from "@/lib/data-service";

const itemUnits = ["Unidad", "Caja", "Pack", "Litro", "Kg", "Gramo"];
const itemCategories = ["Materiales", "Instrumental", "Equipos", "Medicamentos", "Higiene", "Oficina"];

const inventoryFormSchema = z.object({
  name: z.string({
    required_error: "El nombre es requerido",
  }),
  category: z.string({
    required_error: "La categoría es requerida",
  }),
  quantity: z.number({
    required_error: "La cantidad es requerida",
  }).min(0, "La cantidad no puede ser negativa"),
  unit: z.string({
    required_error: "La unidad es requerida",
  }),
  minQuantity: z.number({
    required_error: "La cantidad mínima es requerida",
  }).min(0, "La cantidad mínima no puede ser negativa"),
  price: z.number({
    required_error: "El precio es requerido",
  }).min(0, "El precio no puede ser negativo"),
  supplier: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

const Inventory = () => {
  const { toast } = useToast();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      minQuantity: 0,
      price: 0,
      supplier: "",
    },
  });

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(inventoryItems);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = inventoryItems.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.supplier && item.supplier.toLowerCase().includes(query))
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, inventoryItems]);

  const loadInventoryItems = async () => {
    try {
      setIsLoading(true);
      const items = await inventoryService.getAll();
      setInventoryItems(items);
      setFilteredItems(items);
    } catch (error) {
      console.error("Error loading inventory items:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los items del inventario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryItems();
  }, [toast]);

  const handleRestockItem = async () => {
    if (!selectedItem) return;

    try {
      const newQuantity = selectedItem.quantity + restockQuantity;
      
      const updatedItem = await inventoryService.update(selectedItem.id, {
        quantity: newQuantity,
      });
      
      setInventoryItems(inventoryItems.map(item => item.id === updatedItem.id ? updatedItem : item));
      setSelectedItem(null);
      setIsRestockDialogOpen(false);
      
      toast({
        title: "Item restockeado",
        description: `Se han agregado ${restockQuantity} unidades a ${selectedItem.name}`,
      });
    } catch (error) {
      console.error("Error restocking item:", error);
      toast({
        title: "Error",
        description: "No se pudo restockear el item",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async (data: InventoryFormValues) => {
    try {
      const newItem = await inventoryService.create({
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        minQuantity: data.minQuantity,
        price: data.price,
        supplier: data.supplier || ""
      });
      
      setInventoryItems([...inventoryItems, newItem]);
      setIsAddDialogOpen(false);
      
      toast({
        title: "Item agregado",
        description: "El item ha sido agregado al inventario",
      });
      
      form.reset();
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el item al inventario",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Item al Inventario</DialogTitle>
              <DialogDescription>
                Complete el formulario para agregar un nuevo item al inventario
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAddItem)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {itemCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una unidad" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {itemUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
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
                    name="minQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad Mínima</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Cantidad Mínima"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Precio"
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
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Proveedor (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Agregar Item</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Items</CardTitle>
          <CardDescription>
            Items disponibles en el inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Cargando items...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No se encontraron items
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.quantity}
                      {item.quantity <= item.minQuantity && (
                        <Badge variant="destructive" className="ml-2">
                          Bajo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>${item.price}</TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isRestockDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                          if (!open) {
                            setSelectedItem(null);
                            setIsRestockDialogOpen(false);
                          }
                        }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsRestockDialogOpen(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Restock
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle>Restockear Item</DialogTitle>
                            <DialogDescription>
                              Ingrese la cantidad a agregar al inventario
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="space-y-2">
                              <Label htmlFor="restockQuantity">
                                Cantidad a agregar
                              </Label>
                              <Input
                                type="number"
                                id="restockQuantity"
                                placeholder="Cantidad"
                                value={restockQuantity}
                                onChange={(e) =>
                                  setRestockQuantity(Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(null);
                                setIsRestockDialogOpen(false);
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleRestockItem}>
                              Restockear
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
