import { supabase } from "@/integrations/supabase/client";
import type { Appointment, Patient } from "../models/types";

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
          treatmentType: appointment.treatment_type,
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
      console.log('Obteniendo todas las citas usando RPC...');
      
      // Usar la función RPC en lugar de una consulta directa a la tabla
      const { data, error } = await supabase
        .rpc('get_all_appointments');

      if (error) {
        console.error('Error al obtener citas usando RPC:', error);
        console.warn('Devolviendo datos de muestra debido a error de conexión');
        return SAMPLE_APPOINTMENTS;
      }

      // Procesar los resultados de la función
      console.log(`Recuperadas ${data?.length || 0} citas de Supabase usando RPC`);
      
      if (!data || data.length === 0) {
        console.log('No se encontraron citas en la base de datos');
        return [];
      }
      
      // Formatear los datos recibidos de la función RPC
      const appointments = data.map(item => {
        console.log(`Procesando cita ID=${item.id}, fecha="${item.date}"`);
        
        // Construir nombre completo de paciente y doctor
        const patientName = item.patient_first_name && item.patient_last_name 
          ? `${item.patient_first_name} ${item.patient_last_name}`
          : 'Paciente no encontrado';
          
        const doctorName = item.doctor_first_name && item.doctor_last_name
          ? `${item.doctor_first_name} ${item.doctor_last_name}`
          : 'Doctor no encontrado';
        
        return {
          id: item.id,
          patientId: item.patient_id,
          patientName: patientName,
          doctorId: item.doctor_id,
          doctorName: doctorName,
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
          status: item.status,
          notes: item.notes || '',
          treatmentType: item.treatment_type || '',
          createdAt: item.created_at
        } as Appointment;
      });

      return appointments;
    } catch (error) {
      console.error('Error en getAll:', error);
      console.warn('Devolviendo datos de muestra.');
      return SAMPLE_APPOINTMENTS;
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
        // Asegurar que se crea como YYYY-MM-DD sin componente de tiempo
        const year = appointment.date.getFullYear();
        const month = (appointment.date.getMonth() + 1).toString().padStart(2, '0');
        const day = appointment.date.getDate().toString().padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof appointment.date === 'string') {
        // Si es string, asegurar que tenga el formato correcto
        formattedDate = appointment.date.trim().split('T')[0];
      }
      
      console.log('🔴 CREACIÓN - Fecha original:', appointment.date);
      console.log('🔴 CREACIÓN - Fecha formateada para Supabase:', formattedDate);
      
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
      
      console.log('Datos completos para inserción en Supabase:', appointmentData);
      
      // Intentar varias opciones para crear la cita
      console.log('Intentando inserción directa en la tabla de citas...');
      
      // Opción 1: Inserción directa en la tabla appointments
      const { data: insertedData, error: insertError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('id')
        .single();
        
      if (insertError) {
        console.error('Error al crear cita en Supabase (inserción directa):', insertError);
        
        // Crear un ID simulado para desarrollo si hay errores de políticas RLS
        if (insertError.message && (
            insertError.message.includes('row-level security') || 
            insertError.message.includes('policy') || 
            insertError.message.includes('permission denied'))) {
          console.log('Error de política RLS. Generando ID de cita simulado para entorno de desarrollo.');
          
          // Generar un ID simulado para pruebas
          const simulatedId = 'temp_' + Math.random().toString(36).substring(2, 11);
          
          // Construir respuesta usando los datos que ya tenemos
          const createdAppointment = {
            id: simulatedId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            patientName: 'Cargando...',  // Se actualizará cuando se recargue la lista
            doctorName: 'Cargando...',   // Se actualizará cuando se recargue la lista
            date: formattedDate as string,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status || 'scheduled',
            notes: appointment.notes || '',
            treatmentType: appointment.treatmentType || ''
          };
          
          console.log('Datos de la cita simulada para desarrollo:', createdAppointment);
          return createdAppointment;
        }
        
        throw new Error(`Error al crear cita: ${insertError.message}`);
      }
      
      if (!insertedData) {
        console.error('No se recibió ID después de crear la cita');
        throw new Error('No se pudo crear la cita');
      }
      
      const newAppointmentId = insertedData.id;
      console.log('Cita creada exitosamente con ID:', newAppointmentId);
      
      // Breve espera para asegurar que la BD haya procesado completamente la inserción
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Construir respuesta usando los datos que ya tenemos
      const createdAppointment = {
        id: newAppointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        patientName: 'Cargando...',  // Se actualizará cuando se recargue la lista
        doctorName: 'Cargando...',   // Se actualizará cuando se recargue la lista
        date: formattedDate as string,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status || 'scheduled',
        notes: appointment.notes || '',
        treatmentType: appointment.treatmentType || ''
      };
      
      console.log('Datos completos de la cita creada:', createdAppointment);
      return createdAppointment;
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
  },

  // Actualizar una cita existente
  update: async (appointment: Appointment): Promise<Appointment> => {
    try {
      console.log('Actualizando cita con ID:', appointment.id, 'Datos:', appointment);
      
      // Verificar que tenemos los datos obligatorios
      if (!appointment.id || !appointment.patientId || !appointment.doctorId || 
          !appointment.date || !appointment.startTime || !appointment.endTime) {
        console.error('Error al actualizar cita: Datos obligatorios faltantes');
        throw new Error('Faltan datos obligatorios para actualizar la cita');
      }
      
      // Formatear fecha si es necesario
      let formattedDate = appointment.date;
      if (appointment.date instanceof Date) {
        // Asegurar que se crea como YYYY-MM-DD sin componente de tiempo
        const year = appointment.date.getFullYear();
        const month = (appointment.date.getMonth() + 1).toString().padStart(2, '0');
        const day = appointment.date.getDate().toString().padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof appointment.date === 'string') {
        // Si es string, asegurar que tenga el formato correcto
        formattedDate = appointment.date.trim().split('T')[0];
      }
      
      console.log('🔴 ACTUALIZACIÓN - Fecha original:', appointment.date);
      console.log('🔴 ACTUALIZACIÓN - Fecha formateada para Supabase:', formattedDate);
      
      // Preparar datos para Supabase
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
      
      // Actualizar la cita en Supabase
      const { error: updateError } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', appointment.id);
      
      if (updateError) {
        console.error('Error al actualizar cita en Supabase:', updateError);
        throw new Error(`Error al actualizar cita: ${updateError.message}`);
      }
      
      // Breve espera para asegurar que la BD haya procesado completamente la actualización
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Cita actualizada exitosamente');
      
      // Devolver el objeto actualizado con la fecha formateada
      return {
        ...appointment,
        date: formattedDate as string
      };
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      throw error;
    }
  },
  
  // Eliminar una cita por su ID
  delete: async (appointmentId: string): Promise<void> => {
    try {
      console.log('Eliminando cita con ID:', appointmentId);
      
      // Verificar si el usuario tiene permisos adecuados
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('Usuario actual:', userData?.user?.email);
      
      // Eliminar la cita en Supabase
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) {
        console.error('Error al eliminar cita en Supabase:', error);
        
        // Mensajes más descriptivos para problemas de permisos
        if (error.message.includes('permission denied') || 
            error.message.includes('policy') || 
            error.message.includes('not authorized')) {
          throw new Error(`No tienes permiso para eliminar esta cita. Por favor contacta al administrador o utiliza la cuenta admin@dentalspark.com con permisos de administrador.`);
        }
        
        throw new Error(`Error al eliminar cita: ${error.message}`);
      }
      
      console.log('Cita eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      throw error;
    }
  },

  // Método para verificar permisos del usuario
  checkUserPermissions: async (): Promise<{canEdit: boolean, canDelete: boolean, userEmail: string | null}> => {
    try {
      // Obtener información del usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error al verificar usuario:', userError);
        return { canEdit: false, canDelete: false, userEmail: null };
      }
      
      const userEmail = userData?.user?.email || null;
      console.log('Verificando permisos para usuario:', userEmail);
      
      // Intento de verificación básica
      try {
        // Intentar hacer una operación mínima para probar permisos (select)
        const { data, error } = await supabase
          .from('appointments')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Error al verificar permisos de lectura:', error);
          return { canEdit: false, canDelete: false, userEmail };
        }
        
        // Verificar si el usuario es administrador (esto depende de tu lógica de roles)
        // Aquí asumimos que ciertos correos tienen permisos completos
        const isAdmin = userEmail === 'admin@dentalspark.com' || 
                      userEmail === 'cossio.dev@gmail.com';
        
        return { 
          canEdit: isAdmin, 
          canDelete: isAdmin,
          userEmail
        };
      } catch (err) {
        console.error('Error durante verificación de permisos:', err);
        return { canEdit: false, canDelete: false, userEmail };
      }
    } catch (error) {
      console.error('Error general verificando permisos:', error);
      return { canEdit: false, canDelete: false, userEmail: null };
    }
  },

  // Obtener lista de pacientes para el selector
  getPatientsList: async (): Promise<Patient[]> => {
    try {
      console.log('Obteniendo lista de pacientes...');
      
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });
      
      if (error) {
        console.error('Error al obtener lista de pacientes:', error);
        throw new Error(`Error al obtener pacientes: ${error.message}`);
      }
      
      const formattedPatients = patients.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name
      }));
      
      console.log(`Obtenidos ${formattedPatients.length} pacientes`);
      return formattedPatients;
    } catch (error) {
      console.error('Error al obtener lista de pacientes:', error);
      return [];
    }
  }
};
