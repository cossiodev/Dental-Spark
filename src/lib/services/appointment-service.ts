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
      console.log(`Obteniendo citas entre ${startDate} y ${endDate}...`);
      
      // Asegurarse de que las fechas estén en formato correcto
      if (!startDate || !endDate) {
        console.error('Fechas inválidas para búsqueda de citas');
        throw new Error('Fechas inválidas para búsqueda de citas');
      }
      
      // Consulta a Supabase con más trazas de depuración
      console.log(`Ejecutando consulta a Supabase para fechas: ${startDate} - ${endDate}`);
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
        throw new Error(`Error al obtener citas: ${error.message}`);
      }

      if (!appointments || appointments.length === 0) {
        console.log(`No se encontraron citas entre ${startDate} y ${endDate}`);
        return [];
      }

      console.log(`Se encontraron ${appointments.length} citas entre ${startDate} y ${endDate}`);
      console.log('Datos crudos de citas:', appointments);
      
      // Mapear los resultados al formato esperado por la aplicación
      const result = appointments.map(appointment => {
        // Verificar que los datos relacionados existan
        const hasPatient = appointment.patients && 
                          appointment.patients.first_name && 
                          appointment.patients.last_name;
        
        const hasDoctor = appointment.doctors && 
                         appointment.doctors.first_name && 
                         appointment.doctors.last_name;
        
        return {
          id: appointment.id,
          patientId: appointment.patient_id,
          patientName: hasPatient 
            ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
            : 'Paciente no encontrado',
          doctorId: appointment.doctor_id,
          doctorName: hasDoctor 
            ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
            : 'Doctor no encontrado',
          date: appointment.date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          status: appointment.status,
          notes: appointment.notes || '',
          treatmentType: appointment.treatment_type || '',
        };
      });
      
      console.log(`Datos de citas procesados correctamente: ${result.length} citas`);
      return result;
    } catch (error) {
      console.error('Error al obtener citas por rango de fechas:', error);
      throw error; // Re-lanzar el error para manejarlo en el componente
    }
  },

  getAll: async (): Promise<Appointment[]> => {
    try {
      console.log('Obteniendo todas las citas...');
      
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
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error al obtener todas las citas:', error);
        throw new Error(`Error al obtener citas: ${error.message}`);
      }

      if (!appointments || appointments.length === 0) {
        console.log('No se encontraron citas en la base de datos');
        return [];
      }

      console.log(`Se encontraron ${appointments.length} citas en total`);
      
      // Mapear los resultados al formato esperado por la aplicación
      const result = appointments.map(appointment => {
        // Verificar que los datos relacionados existan
        const hasPatient = appointment.patients && 
                          appointment.patients.first_name && 
                          appointment.patients.last_name;
        
        const hasDoctor = appointment.doctors && 
                         appointment.doctors.first_name && 
                         appointment.doctors.last_name;
        
        return {
          id: appointment.id,
          patientId: appointment.patient_id,
          patientName: hasPatient 
            ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
            : 'Paciente no encontrado',
          doctorId: appointment.doctor_id,
          doctorName: hasDoctor 
            ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
            : 'Doctor no encontrado',
          date: appointment.date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          status: appointment.status,
          notes: appointment.notes || '',
          treatmentType: appointment.treatment_type || '',
        };
      });
      
      console.log('Datos de citas procesados correctamente');
      return result;
    } catch (error) {
      console.error('Error al obtener todas las citas:', error);
      throw error; // Re-lanzar el error para manejarlo en el componente
    }
  },

  create: async (appointment: Omit<Appointment, 'id' | 'doctorName' | 'patientName'>): Promise<Appointment> => {
    try {
      console.log('Creando nueva cita con datos:', appointment);
      
      // Asegurarse de que todos los campos obligatorios estén presentes
      if (!appointment.patientId || !appointment.doctorId || !appointment.date || !appointment.startTime || !appointment.endTime) {
        console.error('Error al crear cita: Datos obligatorios faltantes');
        throw new Error('Faltan datos obligatorios para crear la cita');
      }
      
      // Formatear fecha si es necesario
      let formattedDate = appointment.date;
      if (appointment.date instanceof Date) {
        formattedDate = appointment.date.toISOString().split('T')[0];
      }
      
      const appointmentData = {
        patient_id: appointment.patientId,
        doctor_id: appointment.doctorId,
        date: formattedDate,
        start_time: appointment.startTime,
        end_time: appointment.endTime,
        status: appointment.status || 'scheduled',
        notes: appointment.notes || '',
        treatment_type: appointment.treatmentType || ''
      };
      
      console.log('Datos formateados para Supabase:', appointmentData);
      
      // Primero insertar sin select para evitar el error de seguridad de fila
      const { data: insertedData, error: insertError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('id'); // Solo seleccionar el ID para confirmar la inserción

      if (insertError) {
        console.error('Error al crear cita en Supabase:', insertError);
        throw new Error(`Error al crear cita: ${insertError.message}`);
      }
      
      if (!insertedData || insertedData.length === 0) {
        console.error('No se devolvió ID después de crear la cita');
        throw new Error('No se pudo crear la cita');
      }
      
      const newAppointmentId = insertedData[0].id;
      console.log('Cita creada con ID:', newAppointmentId);
      
      // Esperar un momento para que la BD procese la inserción
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Luego consultar los datos completos de la cita recién creada por su ID
      const { data: appointmentDetail, error: selectError } = await supabase
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
        .eq('id', newAppointmentId)
        .single();

      if (selectError) {
        console.error('Error al obtener los detalles de la cita recién creada:', selectError);
        // Como ya tenemos el ID, podemos construir un objeto básico de respuesta
        return {
          id: newAppointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          patientName: 'Paciente',
          doctorName: 'Doctor',
          date: formattedDate as string,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status || 'scheduled',
          notes: appointment.notes || '',
          treatmentType: appointment.treatmentType || ''
        };
      }

      if (!appointmentDetail) {
        console.log('No se encontró la cita recién creada, pero se creó exitosamente con ID:', newAppointmentId);
        // Proporcionar datos básicos usando el ID real
        return {
          id: newAppointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          patientName: 'Paciente',
          doctorName: 'Doctor',
          date: formattedDate as string,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status || 'scheduled',
          notes: appointment.notes || '',
          treatmentType: appointment.treatmentType || ''
        };
      }

      console.log('Cita creada exitosamente en Supabase, detalles completos:', appointmentDetail);
      
      // Verificar que los datos relacionados existan
      const hasPatient = appointmentDetail.patients && 
                       appointmentDetail.patients.first_name && 
                       appointmentDetail.patients.last_name;
      
      const hasDoctor = appointmentDetail.doctors && 
                      appointmentDetail.doctors.first_name && 
                      appointmentDetail.doctors.last_name;
      
      // Transformar los datos al formato que espera la aplicación
      const result = {
        id: appointmentDetail.id,
        patientId: appointmentDetail.patient_id,
        patientName: hasPatient 
          ? `${appointmentDetail.patients.first_name} ${appointmentDetail.patients.last_name}`
          : 'Paciente',
        doctorId: appointmentDetail.doctor_id,
        doctorName: hasDoctor 
          ? `${appointmentDetail.doctors.first_name} ${appointmentDetail.doctors.last_name}`
          : 'Doctor',
        date: appointmentDetail.date,
        startTime: appointmentDetail.start_time,
        endTime: appointmentDetail.end_time,
        status: appointmentDetail.status,
        notes: appointmentDetail.notes || '',
        treatmentType: appointmentDetail.treatment_type || '',
      };
      
      console.log('Cita creada y formateada para la aplicación:', result);
      return result;
    } catch (error) {
      console.error('Error al crear cita:', error);
      // Re-lanzar el error para manejo adecuado en el componente
      throw error;
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
