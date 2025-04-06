import { supabase } from "@/integrations/supabase/client";
import type { InventoryItem } from "../models/types";

// Datos de muestra para usar cuando la conexión a Supabase falla
const SAMPLE_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "sample-1",
    name: "Guantes de látex",
    category: "Materiales",
    quantity: 5,
    unit: "cajas",
    minQuantity: 10,
    price: 15.99,
    supplier: "Dental Supplies Inc.",
    lastRestocked: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-2",
    name: "Anestesia local",
    category: "Medicamentos",
    quantity: 3,
    unit: "cajas",
    minQuantity: 8,
    price: 45.50,
    supplier: "MediDent",
    lastRestocked: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

export const inventoryService = {
  getAll: async (): Promise<InventoryItem[]> => {
    try {
      console.log("Intentando obtener todos los items de inventario...");
      const { data: items, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) {
        console.error('Error obteniendo inventario:', error);
        console.log("Retornando datos de muestra para inventario");
        return SAMPLE_INVENTORY_ITEMS;
      }

      if (!items || items.length === 0) {
        console.log("No se encontraron items de inventario, retornando datos de muestra");
        return SAMPLE_INVENTORY_ITEMS;
      }

      console.log(`Obtenidos ${items.length} items de inventario`);
      return items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minQuantity: item.min_quantity,
        price: item.price,
        supplier: item.supplier,
        lastRestocked: item.last_restocked,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      return SAMPLE_INVENTORY_ITEMS;
    }
  },

  create: async (item: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<InventoryItem> => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          min_quantity: item.minQuantity,
          price: item.price,
          supplier: item.supplier,
          last_restocked: item.lastRestocked
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        minQuantity: data.min_quantity,
        price: data.price,
        supplier: data.supplier,
        lastRestocked: data.last_restocked,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error al crear item de inventario:', error);
      throw error;
    }
  },

  update: async (id: string, item: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>): Promise<InventoryItem> => {
    try {
      const updateData: any = {};
      
      if (item.name !== undefined) updateData.name = item.name;
      if (item.category !== undefined) updateData.category = item.category;
      if (item.quantity !== undefined) updateData.quantity = item.quantity;
      if (item.unit !== undefined) updateData.unit = item.unit;
      if (item.minQuantity !== undefined) updateData.min_quantity = item.minQuantity;
      if (item.price !== undefined) updateData.price = item.price;
      if (item.supplier !== undefined) updateData.supplier = item.supplier;
      if (item.lastRestocked !== undefined) updateData.last_restocked = item.lastRestocked;

      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        minQuantity: data.min_quantity,
        price: data.price,
        supplier: data.supplier,
        lastRestocked: data.last_restocked,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error actualizando item de inventario:', error);
      throw error;
    }
  },

  getLowStock: async (): Promise<InventoryItem[]> => {
    try {
      console.log("Intentando obtener items con bajo stock...");
      // Modificar la consulta para evitar errores de tipo
      const { data: items, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) {
        console.error('Error en consulta de inventario bajo:', error);
        // Retornar solo los elementos de muestra que tienen bajo stock
        return SAMPLE_INVENTORY_ITEMS.filter(item => item.quantity < item.minQuantity);
      }

      if (!items || items.length === 0) {
        console.log("No se encontraron items de inventario, retornando datos de muestra para bajo stock");
        return SAMPLE_INVENTORY_ITEMS.filter(item => item.quantity < item.minQuantity);
      }

      // Filtrar en JavaScript en lugar de en la base de datos para evitar errores de tipo
      const lowStockItems = items.filter(item => 
        typeof item.quantity === 'number' && 
        typeof item.min_quantity === 'number' && 
        item.quantity < item.min_quantity
      );

      console.log(`Encontrados ${lowStockItems.length} items con bajo stock`);
      return lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minQuantity: item.min_quantity,
        price: item.price,
        supplier: item.supplier,
        lastRestocked: item.last_restocked,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error al obtener inventario con stock bajo:', error);
      return SAMPLE_INVENTORY_ITEMS.filter(item => item.quantity < item.minQuantity);
    }
  }
};
