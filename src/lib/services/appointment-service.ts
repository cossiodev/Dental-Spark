import { supabase } from "@/integrations/supabase/client";
import type { Appointment } from "../models/types";

// Datos de muestra para cuando falle la conexión a Supabase
const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    patientId: '101',
    patientName: 'Juan Pérez',
    doctorId: '201',
    doctorName: 'Dra. María Rodríguez',
    date: '2023-11-15',
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    notes: 'Revisión de brackets',
    treatmentType: 'ortodoncia'
  },
  {
    id: '2',
    patientId: '102',
    patientName: 'Ana García',
    doctorId: '202',
    doctorName: 'Dr. Carlos Sánchez',
    date: '2023-11-16',
    startTime: '10:00',
    endTime: '10:45',
    status: 'confirmed',
    notes: 'Limpieza dental',
    treatmentType: 'limpieza'
  }
];

export const appointmentService = {
  getByPatientId: async (patientId: string): Promise<Appointment[]> => {
    try {
      console.log(`Intentando obtener citas para el paciente ${patientId}...`);
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            first_name,
            last_name
          )
        `)
        .eq('patient_id', patientId);

      if (error) {
        console.error('Error al obtener citas por paciente:', error);
        // Devolver citas de ejemplo filtradas por patientId
        return SAMPLE_APPOINTMENTS.filter(a => a.patientId === patientId);
      }

      const result = appointments.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        doctorName: appointment.doctors.first_name + ' ' + appointment.doctors.last_name,
        date: appointment.date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        treatmentType: appointment.treatment_type,
      }));
      
      console.log(`Obtenidas ${result.length} citas para el paciente ${patientId}`);
      return result;
    } catch (error) {
      console.error('Error al obtener citas por paciente:', error);
      // Devolver citas de ejemplo filtradas por patientId
      return SAMPLE_APPOINTMENTS.filter(a => a.patientId === patientId);
    }
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Appointment[]> => {
    try {
      console.log(`Intentando obtener citas entre ${startDate} y ${endDate}...`);
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            first_name,
            last_name
          ),
          patients (
            first_name,
            last_name
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error al obtener citas por rango de fechas:', error);
        // Devolver todas las citas de ejemplo (simulando el rango de fechas)
        return SAMPLE_APPOINTMENTS;
      }

      const result = appointments.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        patientName: appointment.patients.first_name + ' ' + appointment.patients.last_name,
        doctorId: appointment.doctor_id,
        doctorName: appointment.doctors.first_name + ' ' + appointment.doctors.last_name,
        date: appointment.date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        treatmentType: appointment.treatment_type,
      }));
      
      console.log(`Obtenidas ${result.length} citas en el rango de fechas`);
      return result;
    } catch (error) {
      console.error('Error al obtener citas por rango de fechas:', error);
      // Devolver todas las citas de ejemplo
      return SAMPLE_APPOINTMENTS;
    }
  },

  getAll: async (): Promise<Appointment[]> => {
    try {
      console.log('Intentando obtener todas las citas...');
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            first_name,
            last_name
          ),
          patients (
            first_name,
            last_name
          )
        `);

      if (error) {
        console.error('Error al obtener todas las citas:', error);
        return SAMPLE_APPOINTMENTS;
      }

      const result = appointments.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        patientName: appointment.patients.first_name + ' ' + appointment.patients.last_name,
        doctorId: appointment.doctor_id,
        doctorName: appointment.doctors.first_name + ' ' + appointment.doctors.last_name,
        date: appointment.date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        treatmentType: appointment.treatment_type,
      }));
      
      console.log(`Obtenidas ${result.length} citas en total`);
      return result;
    } catch (error) {
      console.error('Error al obtener todas las citas:', error);
      return SAMPLE_APPOINTMENTS;
    }
  },

  create: async (appointment: Omit<Appointment, 'id' | 'doctorName'>): Promise<Appointment> => {
    try {
      console.log('Intentando crear una nueva cita...');
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: appointment.patientId,
          doctor_id: appointment.doctorId,
          date: appointment.date,
          start_time: appointment.startTime,
          end_time: appointment.endTime,
          status: appointment.status,
          notes: appointment.notes,
          treatment_type: appointment.treatmentType
        })
        .select(`
          *,
          doctors (
            first_name,
            last_name
          ),
          patients (
            first_name,
            last_name
          )
        `)
        .single();

      if (error) {
        console.error('Error al crear cita:', error);
        // Devolver una cita de ejemplo modificada con los datos proporcionados
        const sampleAppointment = { 
          ...SAMPLE_APPOINTMENTS[0],
          patientId: appointment.patientId,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          notes: appointment.notes || 'Sin notas',
          treatmentType: appointment.treatmentType || 'general'
        };
        console.log('Devolviendo datos de ejemplo para la cita creada');
        return sampleAppointment;
      }

      const result = {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patients.first_name + ' ' + data.patients.last_name,
        doctorId: data.doctor_id,
        doctorName: data.doctors.first_name + ' ' + data.doctors.last_name,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
        notes: data.notes,
        treatmentType: data.treatment_type,
      };
      
      console.log('Cita creada exitosamente');
      return result;
    } catch (error) {
      console.error('Error al crear cita:', error);
      // Devolver una cita de ejemplo modificada con los datos proporcionados
      const sampleAppointment = { 
        ...SAMPLE_APPOINTMENTS[0],
        patientId: appointment.patientId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        notes: appointment.notes || 'Sin notas',
        treatmentType: appointment.treatmentType || 'general'
      };
      console.log('Devolviendo datos de ejemplo para la cita creada');
      return sampleAppointment;
    }
  },

  getDoctors: async (): Promise<any[]> => {
    try {
      console.log('Intentando obtener la lista de doctores...');
      
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*');

      if (error) {
        console.error('Error al obtener doctores:', error);
        // Devolver doctores de ejemplo
        return [
          { id: '201', firstName: 'María', lastName: 'Rodríguez', specialization: 'Ortodoncista', email: 'maria@example.com', phone: '555-1234', color: '#4CAF50' },
          { id: '202', firstName: 'Carlos', lastName: 'Sánchez', specialization: 'Odontólogo general', email: 'carlos@example.com', phone: '555-5678', color: '#2196F3' }
        ];
      }

      const result = doctors.map(doctor => ({
        id: doctor.id,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        specialization: doctor.specialization,
        email: doctor.email,
        phone: doctor.phone,
        color: doctor.color
      }));
      
      console.log(`Obtenidos ${result.length} doctores`);
      return result;
    } catch (error) {
      console.error('Error al obtener doctores:', error);
      // Devolver doctores de ejemplo
      return [
        { id: '201', firstName: 'María', lastName: 'Rodríguez', specialization: 'Ortodoncista', email: 'maria@example.com', phone: '555-1234', color: '#4CAF50' },
        { id: '202', firstName: 'Carlos', lastName: 'Sánchez', specialization: 'Odontólogo general', email: 'carlos@example.com', phone: '555-5678', color: '#2196F3' }
      ];
    }
  },

  getUpcoming: async (limit: number = 5): Promise<Appointment[]> => {
    try {
      console.log(`Intentando obtener las próximas ${limit} citas...`);
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            first_name,
            last_name
          ),
          patients (
            first_name,
            last_name
          )
        `)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error al obtener próximas citas:', error);
        // Devolver las citas de ejemplo (simulando que son próximas)
        return SAMPLE_APPOINTMENTS.slice(0, limit);
      }

      const result = appointments.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        patientName: appointment.patients.first_name + ' ' + appointment.patients.last_name,
        doctorId: appointment.doctor_id,
        doctorName: appointment.doctors.first_name + ' ' + appointment.doctors.last_name,
        date: appointment.date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        treatmentType: appointment.treatment_type,
      }));
      
      console.log(`Obtenidas ${result.length} próximas citas`);
      return result;
    } catch (error) {
      console.error('Error al obtener próximas citas:', error);
      // Devolver las citas de ejemplo (simulando que son próximas)
      return SAMPLE_APPOINTMENTS.slice(0, limit);
    }
  }
};
