import { supabase } from "@/integrations/supabase/client";
import type { Treatment } from "../models/types";

// Datos de muestra para cuando falle la conexión a Supabase
const SAMPLE_TREATMENTS: Treatment[] = [
  {
    id: '1',
    patientId: '101',
    patientName: 'Juan Pérez',
    doctorId: '201',
    doctorName: 'Dra. María Rodríguez',
    type: 'Endodoncia',
    description: 'Tratamiento de conducto en premolar',
    teeth: [15],
    status: 'completado',
    cost: 350.00,
    startDate: '2023-10-15',
    endDate: '2023-10-28',
    notes: 'Paciente siguió todas las indicaciones post-tratamiento'
  },
  {
    id: '2',
    patientId: '102',
    patientName: 'Ana García',
    doctorId: '202',
    doctorName: 'Dr. Carlos Sánchez',
    type: 'Limpieza',
    description: 'Limpieza dental profunda',
    teeth: [],
    status: 'completado',
    cost: 120.00,
    startDate: '2023-11-05',
    endDate: '2023-11-05',
    notes: 'Recomendación: revisión en 6 meses'
  },
  {
    id: '3',
    patientId: '101',
    patientName: 'Juan Pérez',
    doctorId: '201',
    doctorName: 'Dra. María Rodríguez',
    type: 'Ortodoncia',
    description: 'Colocación de brackets',
    teeth: [11, 12, 13, 14, 15, 21, 22, 23, 24, 25],
    status: 'en_progreso',
    cost: 1200.00,
    startDate: '2023-09-20',
    endDate: null,
    notes: 'Tratamiento planificado para 18 meses'
  }
];

export const treatmentService = {
  getByPatientId: async (patientId: string): Promise<Treatment[]> => {
    try {
      console.log(`Intentando obtener tratamientos para el paciente ${patientId}...`);
      
      const { data: treatments, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', patientId);

      if (error) {
        console.error('Error al obtener tratamientos por paciente:', error);
        // Devolver tratamientos de ejemplo filtrados por patientId
        const sampleTreatments = SAMPLE_TREATMENTS.filter(t => t.patientId === patientId);
        console.log(`Devolviendo ${sampleTreatments.length} tratamientos de ejemplo para el paciente ${patientId}`);
        return sampleTreatments;
      }

      const result = treatments.map(treatment => ({
        id: treatment.id,
        patientId: treatment.patient_id,
        doctorId: treatment.doctor_id,
        type: treatment.type,
        description: treatment.description,
        teeth: treatment.teeth,
        status: treatment.status,
        cost: treatment.cost,
        startDate: treatment.start_date,
        endDate: treatment.end_date,
        notes: treatment.notes,
      }));
      
      console.log(`Obtenidos ${result.length} tratamientos para el paciente ${patientId}`);
      return result;
    } catch (error) {
      console.error('Error al obtener tratamientos por paciente:', error);
      // Devolver tratamientos de ejemplo filtrados por patientId
      const sampleTreatments = SAMPLE_TREATMENTS.filter(t => t.patientId === patientId);
      console.log(`Devolviendo ${sampleTreatments.length} tratamientos de ejemplo para el paciente ${patientId}`);
      return sampleTreatments;
    }
  },

  getAll: async (): Promise<Treatment[]> => {
    try {
      console.log('Intentando obtener todos los tratamientos...');
      
      const { data: treatments, error } = await supabase
        .from('treatments')
        .select(`
          *,
          patients (
            first_name,
            last_name
          ),
          doctors (
            first_name,
            last_name
          )
        `);

      if (error) {
        console.error('Error al obtener todos los tratamientos:', error);
        console.log(`Devolviendo ${SAMPLE_TREATMENTS.length} tratamientos de ejemplo`);
        return SAMPLE_TREATMENTS;
      }

      const result = treatments.map(treatment => ({
        id: treatment.id,
        patientId: treatment.patient_id,
        patientName: treatment.patients.first_name + ' ' + treatment.patients.last_name,
        doctorId: treatment.doctor_id,
        doctorName: treatment.doctors ? treatment.doctors.first_name + ' ' + treatment.doctors.last_name : null,
        type: treatment.type,
        description: treatment.description,
        teeth: treatment.teeth,
        status: treatment.status,
        cost: treatment.cost,
        startDate: treatment.start_date,
        endDate: treatment.end_date,
        notes: treatment.notes,
      }));
      
      console.log(`Obtenidos ${result.length} tratamientos en total`);
      return result;
    } catch (error) {
      console.error('Error al obtener todos los tratamientos:', error);
      console.log(`Devolviendo ${SAMPLE_TREATMENTS.length} tratamientos de ejemplo`);
      return SAMPLE_TREATMENTS;
    }
  },

  create: async (treatment: Omit<Treatment, 'id'>): Promise<Treatment> => {
    console.log('Intentando crear un nuevo tratamiento con datos:', treatment);
      
    const { data, error } = await supabase
      .from('treatments')
      .insert({
        patient_id: treatment.patientId,
        doctor_id: treatment.doctorId,
        type: treatment.type,
        description: treatment.description,
        teeth: treatment.teeth,
        status: treatment.status,
        cost: treatment.cost,
        start_date: treatment.startDate,
        end_date: treatment.endDate,
        notes: treatment.notes
      })
      .select(`
        *,
        patients (
          first_name,
          last_name
        ),
        doctors (
          first_name,
          last_name
        )
      `)
      .single();

    if (error) {
      console.error('Error detallado al crear tratamiento:', error);
      // En lugar de devolver datos de ejemplo, lanzamos el error para poder verlo
      throw error;
    }

    const result = {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patients.first_name + ' ' + data.patients.last_name,
      doctorId: data.doctor_id,
      doctorName: data.doctors ? data.doctors.first_name + ' ' + data.doctors.last_name : null,
      type: data.type,
      description: data.description,
      teeth: data.teeth,
      status: data.status,
      cost: data.cost,
      startDate: data.start_date,
      endDate: data.end_date,
      notes: data.notes,
    };
    
    console.log('Tratamiento creado exitosamente:', result);
    return result;
  }
};
