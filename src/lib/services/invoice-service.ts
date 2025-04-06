
import { supabase } from "@/integrations/supabase/client";
import type { Invoice } from "../models/types";

export const invoiceService = {
  getByPatientId: async (patientId: string): Promise<Invoice[]> => {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      return invoices.map(invoice => ({
        id: invoice.id,
        patientId: invoice.patient_id,
        date: invoice.date,
        dueDate: invoice.due_date,
        items: Array.isArray(invoice.items) ? invoice.items : [], // Ensure items is an array
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        paidAmount: invoice.paid_amount,
        paidDate: invoice.paid_date,
        notes: invoice.notes,
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  getAll: async (): Promise<Invoice[]> => {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients (
            first_name,
            last_name
          )
        `);

      if (error) throw error;

      return invoices.map(invoice => ({
        id: invoice.id,
        patientId: invoice.patient_id,
        patientName: invoice.patients ? invoice.patients.first_name + ' ' + invoice.patients.last_name : 'No Patient',
        date: invoice.date,
        dueDate: invoice.due_date,
        items: Array.isArray(invoice.items) ? invoice.items : [], // Ensure items is an array
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        paidAmount: invoice.paid_amount,
        paidDate: invoice.paid_date,
        notes: invoice.notes,
      }));
    } catch (error) {
      console.error('Error fetching all invoices:', error);
      throw error;
    }
  },

  create: async (invoice: Omit<Invoice, 'id' | 'patientName'>): Promise<Invoice> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          patient_id: invoice.patientId,
          date: invoice.date,
          due_date: invoice.dueDate,
          items: invoice.items, // Should be an array of items
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          discount: invoice.discount,
          total: invoice.total,
          status: invoice.status,
          paid_amount: invoice.paidAmount,
          paid_date: invoice.paidDate,
          notes: invoice.notes
        })
        .select(`
          *,
          patients (
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patients ? data.patients.first_name + ' ' + data.patients.last_name : 'No Patient',
        date: data.date,
        dueDate: data.due_date,
        items: Array.isArray(data.items) ? data.items : [], // Ensure items is an array
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        status: data.status,
        paidAmount: data.paid_amount,
        paidDate: data.paid_date,
        notes: data.notes,
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  markAsPaid: async (id: string, paidDate: string): Promise<Invoice> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: paidDate
        })
        .eq('id', id)
        .select(`
          *,
          patients (
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patients ? data.patients.first_name + ' ' + data.patients.last_name : 'No Patient',
        date: data.date,
        dueDate: data.due_date,
        items: Array.isArray(data.items) ? data.items : [], // Ensure items is an array
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        status: data.status,
        paidAmount: data.paid_amount,
        paidDate: data.paid_date,
        notes: data.notes,
      };
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  },

  getUnpaid: async (limit: number = 5): Promise<Invoice[]> => {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients (
            first_name,
            last_name
          )
        `)
        .eq('status', 'unpaid')
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return invoices.map(invoice => ({
        id: invoice.id,
        patientId: invoice.patient_id,
        patientName: invoice.patients ? invoice.patients.first_name + ' ' + invoice.patients.last_name : 'No Patient',
        date: invoice.date,
        dueDate: invoice.due_date,
        items: Array.isArray(invoice.items) ? invoice.items : [], // Ensure items is an array
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        paidAmount: invoice.paid_amount,
        paidDate: invoice.paid_date,
        notes: invoice.notes,
      }));
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
      throw error;
    }
  }
};
