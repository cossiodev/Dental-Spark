import { supabase } from "@/integrations/supabase/client";
import { monitoringService } from "./monitoring-service";

// Estructura del usuario autenticado
export interface StaffUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

// Servicio de autenticación
export const authService = {
  // Iniciar sesión
  login: async (email: string, password: string): Promise<StaffUser> => {
    try {
      console.log('Intentando autenticar usuario:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Error de autenticación:', error);
        monitoringService.logError('authService.login', new Error(error.message));
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No se pudo obtener información del usuario');
      }
      
      // Verificar si el usuario es parte del staff
      console.log('Verificando si el usuario es miembro del staff...');
      const { data: staffData, error: staffError } = await supabase
        .from('clinic_staff')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
        
      if (staffError) {
        console.error('Error verificando permisos de staff:', staffError);
        
        // Si la tabla no existe, podría ser un error 404
        if (staffError.code === '42P01') {
          console.warn('La tabla clinic_staff no existe, creando estructura temporal...');
          
          // Crear tabla clinic_staff si no existe
          await supabase.rpc('create_staff_table_if_needed');
          
          // Intentar agregar al usuario como miembro del staff
          await supabase.from('clinic_staff').insert({
            user_id: data.user.id,
            role: 'admin'
          });
          
          // Devolver usuario con rol por defecto
          return {
            id: data.user.id,
            email: data.user.email || '',
            role: 'admin'
          };
        }
        
        // Si no hay datos del staff
        await supabase.auth.signOut();
        throw new Error('Usuario no autorizado como staff');
      }
      
      if (!staffData) {
        console.warn('Usuario no es miembro del staff, intentando agregarlo...');
        
        // Intentar agregar al usuario como miembro del staff
        await supabase.from('clinic_staff').insert({
          user_id: data.user.id,
          role: 'staff'
        });
        
        return {
          id: data.user.id,
          email: data.user.email || '',
          role: 'staff'
        };
      }
      
      console.log('Usuario autenticado correctamente como staff:', staffData);
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        role: staffData.role || 'staff',
        firstName: staffData.first_name,
        lastName: staffData.last_name
      };
    } catch (error) {
      console.error('Error en proceso de autenticación:', error);
      monitoringService.logError('authService.login', error as Error);
      throw error;
    }
  },
  
  // Cerrar sesión
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Sesión cerrada correctamente');
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      monitoringService.logError('authService.logout', error as Error);
      return false;
    }
  },
  
  // Obtener sesión actual
  getCurrentSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Error al obtener sesión:', error);
      monitoringService.logError('authService.getCurrentSession', error as Error);
      return null;
    }
  },
  
  // Comprobar si hay un usuario autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  },
  
  // Obtener el usuario actual
  getCurrentUser: async (): Promise<StaffUser | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      // Obtener datos del staff
      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (!staffData) {
        return null;
      }
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        role: staffData.role || 'staff',
        firstName: staffData.first_name,
        lastName: staffData.last_name
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }
}; 