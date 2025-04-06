
import { supabase } from "@/integrations/supabase/client";
import type { Odontogram } from "../models/types";

export const odontogramService = {
  getByPatientId: async (patientId: string): Promise<Odontogram[]> => {
    try {
      const { data: odontograms, error } = await supabase
        .from('odontograms')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      return odontograms.map(odontogram => ({
        id: odontogram.id,
        patientId: odontogram.patient_id,
        date: odontogram.date,
        teeth: odontogram.teeth as Record<number, any>, // Type casting to match expected type
        notes: odontogram.notes,
        isPediatric: odontogram.is_child,
      }));
    } catch (error) {
      console.error('Error fetching odontograms:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Odontogram> => {
    try {
      const { data: odontogram, error } = await supabase
        .from('odontograms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!odontogram) throw new Error('Odontogram not found');

      return {
        id: odontogram.id,
        patientId: odontogram.patient_id,
        date: odontogram.date,
        teeth: odontogram.teeth as Record<number, any>, // Type casting to match expected type
        notes: odontogram.notes,
        isPediatric: odontogram.is_child,
      };
    } catch (error) {
      console.error('Error fetching odontogram:', error);
      throw error;
    }
  },

  create: async (odontogram: Omit<Odontogram, 'id'>): Promise<Odontogram> => {
    try {
      const { data, error } = await supabase
        .from('odontograms')
        .upsert({
          patient_id: odontogram.patientId,
          date: odontogram.date,
          teeth: odontogram.teeth, // This should be an object
          notes: odontogram.notes,
          is_child: odontogram.isPediatric,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create odontogram');

      return {
        id: data.id,
        patientId: data.patient_id,
        date: data.date,
        teeth: data.teeth as Record<number, any>, // Type casting to match expected type
        notes: data.notes,
        isPediatric: data.is_child,
      };
    } catch (error) {
      console.error('Error creating odontogram:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('odontograms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting odontogram:', error);
      throw error;
    }
  }
};
