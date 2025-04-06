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

// Definición de eventos de autenticación
export const AUTH_EVENTS = {
  LOGIN_ATTEMPT: 'auth:login_attempt',
  LOGIN_SUCCESS: 'auth:login_success',
  LOGIN_FAILURE: 'auth:login_failure',
  LOGOUT: 'auth:logout',
  SESSION_CHECK: 'auth:session_check',
  SESSION_VALID: 'auth:session_valid',
  SESSION_INVALID: 'auth:session_invalid',
  STAFF_CHECK: 'auth:staff_check',
  STAFF_VALID: 'auth:staff_valid',
  STAFF_INVALID: 'auth:staff_invalid',
  ERROR: 'auth:error',
  PASSWORD_RESET_REQUEST: 'auth:password_reset_request',
  PASSWORD_RESET_SUCCESS: 'auth:password_reset_success',
  PASSWORD_RESET_FAILURE: 'auth:password_reset_failure',
  PASSWORD_UPDATE_REQUEST: 'auth:password_update_request',
  PASSWORD_UPDATE_SUCCESS: 'auth:password_update_success',
  PASSWORD_UPDATE_FAILURE: 'auth:password_update_failure'
};

// Emitir eventos de autenticación para depuración
export function emitAuthEvent(type: string, data?: any) {
  const timestamp = new Date().toISOString();
  const detail = { type, timestamp, data };
  
  console.log(`[Auth Event] ${type}`, detail);
  
  // Solo ejecutar en el navegador, no durante SSR
  if (typeof window !== 'undefined') {
    // Emitir evento personalizado
    try {
      const event = new CustomEvent('react-auth-event', { detail });
      window.dispatchEvent(event);
      
      // Actualizar estado de depuración global
      if (!window.__DENTAL_SPARK_DEBUG__) {
        window.__DENTAL_SPARK_DEBUG__ = {};
      }
      
      if (!window.__DENTAL_SPARK_DEBUG__.auth) {
        window.__DENTAL_SPARK_DEBUG__.auth = {
          events: [],
          bypassEnabled: false,
          lastEvent: null,
          lastError: null,
          session: null
        };
      }
      
      window.__DENTAL_SPARK_DEBUG__.auth.lastEvent = detail;
      window.__DENTAL_SPARK_DEBUG__.auth.events = 
        [detail, ...(window.__DENTAL_SPARK_DEBUG__.auth.events || [])].slice(0, 50);
    } catch (e) {
      console.error('Error emitiendo evento de autenticación', e);
    }
  }
}

// Helper para acceder a window.__DENTAL_SPARK_DEBUG__ de forma segura
const getDebugState = () => {
  if (typeof window === 'undefined') return {};
  if (!window.__DENTAL_SPARK_DEBUG__) window.__DENTAL_SPARK_DEBUG__ = {};
  if (!window.__DENTAL_SPARK_DEBUG__.auth) {
    window.__DENTAL_SPARK_DEBUG__.auth = {
      events: [],
      bypassEnabled: false,
      lastEvent: null,
      lastError: null,
      session: null
    };
  }
  return window.__DENTAL_SPARK_DEBUG__.auth;
};

// Servicio de autenticación
export const authService = {
  // Iniciar sesión
  login: async (email: string, password: string): Promise<StaffUser> => {
    try {
      emitAuthEvent(AUTH_EVENTS.LOGIN_ATTEMPT, { email });
      console.log('Intentando autenticar usuario:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Error de autenticación:', error);
        monitoringService.logError('authService.login', new Error(error.message));
        emitAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { 
          error: error.message, 
          code: error.code, 
          status: error.status 
        });
        
        if (typeof window !== 'undefined') {
          getDebugState().lastError = error;
        }
        
        // Traducir errores comunes de Supabase
        if (error.message === "Invalid login credentials") {
          throw new Error("Credenciales inválidas. Por favor verifique su correo y contraseña.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Correo electrónico no confirmado. Por favor verifique su bandeja de entrada.");
        } else if (error.message.includes("too many requests")) {
          throw new Error("Demasiados intentos fallidos. Por favor intente nuevamente más tarde.");
        } else if (error.message.includes("rate limit")) {
          throw new Error("Límite de intentos excedido. Por favor espere unos minutos.");
        }
        
        throw error;
      }
      
      if (!data.user) {
        const noUserError = new Error('No se pudo obtener información del usuario');
        emitAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { error: noUserError.message });
        
        if (typeof window !== 'undefined') {
          getDebugState().lastError = noUserError;
        }
        
        throw noUserError;
      }

      emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { 
        userId: data.user.id,
        email: data.user.email,
        sessionExpiresAt: data.session?.expires_at
      });
      
      if (typeof window !== 'undefined') {
        getDebugState().session = data.session;
      }
      
      // Verificar si el usuario es parte del staff
      console.log('Verificando si el usuario es miembro del staff...');
      emitAuthEvent(AUTH_EVENTS.STAFF_CHECK, { userId: data.user.id });
      
      const { data: staffData, error: staffError } = await supabase
        .from('clinic_staff')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
        
      if (staffError) {
        console.error('Error verificando permisos de staff:', staffError);
        emitAuthEvent(AUTH_EVENTS.STAFF_INVALID, { 
          error: staffError.message, 
          code: staffError.code,
          details: staffError.details,
          hint: staffError.hint
        });
        
        // Si la tabla no existe, podría ser un error específico
        if (staffError.code === '42P01') {
          console.warn('La tabla clinic_staff no existe, creando estructura temporal...');
          emitAuthEvent(AUTH_EVENTS.ERROR, { 
            message: 'Tabla clinic_staff no existe', 
            code: staffError.code 
          });
          
          // Crear tabla clinic_staff si no existe
          try {
            await supabase.rpc('create_staff_table_if_needed');
            
            // Intentar agregar al usuario como miembro del staff
            const { error: insertError } = await supabase.from('clinic_staff').insert({
              user_id: data.user.id,
              role: 'admin'
            });
            
            if (insertError) {
              emitAuthEvent(AUTH_EVENTS.ERROR, { 
                message: 'Error creando registro de staff', 
                error: insertError 
              });
            } else {
              emitAuthEvent(AUTH_EVENTS.STAFF_VALID, { 
                userId: data.user.id, 
                role: 'admin',
                message: 'Usuario agregado como admin en clinic_staff' 
              });
            }
            
            // Devolver usuario con rol por defecto
            return {
              id: data.user.id,
              email: data.user.email || '',
              role: 'admin'
            };
          } catch (rpcError) {
            console.error('Error ejecutando RPC:', rpcError);
            emitAuthEvent(AUTH_EVENTS.ERROR, { message: 'Error en RPC', error: rpcError });
            await supabase.auth.signOut();
            throw new Error('Error configurando permisos de usuario: ' + rpcError);
          }
        }
        
        // Si no hay datos del staff
        emitAuthEvent(AUTH_EVENTS.ERROR, { 
          message: 'Usuario no autorizado como staff', 
          userId: data.user.id 
        });
        
        await supabase.auth.signOut();
        throw new Error('Usuario no autorizado como staff');
      }
      
      if (!staffData) {
        console.warn('Usuario no es miembro del staff, intentando agregarlo...');
        emitAuthEvent(AUTH_EVENTS.STAFF_INVALID, { 
          userId: data.user.id, 
          message: 'Usuario no es miembro del staff' 
        });
        
        // Intentar agregar al usuario como miembro del staff
        const { error: insertError } = await supabase.from('clinic_staff').insert({
          user_id: data.user.id,
          role: 'staff'
        });
        
        if (insertError) {
          emitAuthEvent(AUTH_EVENTS.ERROR, { 
            message: 'Error agregando usuario a staff', 
            error: insertError 
          });
          await supabase.auth.signOut();
          throw new Error('Error agregando usuario a staff: ' + insertError.message);
        }
        
        emitAuthEvent(AUTH_EVENTS.STAFF_VALID, { 
          userId: data.user.id, 
          role: 'staff',
          message: 'Usuario agregado como staff' 
        });
        
        return {
          id: data.user.id,
          email: data.user.email || '',
          role: 'staff'
        };
      }
      
      console.log('Usuario autenticado correctamente como staff:', staffData);
      emitAuthEvent(AUTH_EVENTS.STAFF_VALID, { 
        userId: data.user.id, 
        role: staffData.role,
        staffData 
      });
      
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
      emitAuthEvent(AUTH_EVENTS.ERROR, { 
        message: 'Error crítico en proceso de autenticación', 
        error 
      });
      
      if (typeof window !== 'undefined') {
        getDebugState().lastError = error;
      }
      
      throw error;
    }
  },
  
  // Cerrar sesión
  logout: async () => {
    try {
      emitAuthEvent(AUTH_EVENTS.LOGOUT, { timestamp: new Date().toISOString() });
      const { error } = await supabase.auth.signOut();
      if (error) {
        emitAuthEvent(AUTH_EVENTS.ERROR, { message: 'Error al cerrar sesión', error });
        throw error;
      }
      console.log('Sesión cerrada correctamente');
      
      if (typeof window !== 'undefined') {
        getDebugState().session = null;
      }
      
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      monitoringService.logError('authService.logout', error as Error);
      emitAuthEvent(AUTH_EVENTS.ERROR, { message: 'Error al cerrar sesión', error });
      return false;
    }
  },
  
  // Obtener sesión actual
  getCurrentSession: async () => {
    try {
      emitAuthEvent(AUTH_EVENTS.SESSION_CHECK, {});
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        emitAuthEvent(AUTH_EVENTS.SESSION_INVALID, { error });
        throw error;
      }
      
      if (data.session) {
        emitAuthEvent(AUTH_EVENTS.SESSION_VALID, { 
          userId: data.session.user.id,
          expiresAt: data.session.expires_at
        });
        if (typeof window !== 'undefined') {
          getDebugState().session = data.session;
        }
      } else {
        emitAuthEvent(AUTH_EVENTS.SESSION_INVALID, { message: 'No hay sesión activa' });
      }
      
      return data.session;
    } catch (error) {
      console.error('Error al obtener sesión:', error);
      monitoringService.logError('authService.getCurrentSession', error as Error);
      emitAuthEvent(AUTH_EVENTS.ERROR, { message: 'Error obteniendo sesión', error });
      return null;
    }
  },
  
  // Comprobar si hay un usuario autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      emitAuthEvent(AUTH_EVENTS.SESSION_CHECK, {});
      const { data } = await supabase.auth.getSession();
      
      const isValid = !!data.session;
      
      if (isValid) {
        emitAuthEvent(AUTH_EVENTS.SESSION_VALID, { 
          userId: data.session?.user.id,
          expiresAt: data.session?.expires_at
        });
        if (typeof window !== 'undefined') {
          getDebugState().session = data.session;
        }
      } else {
        emitAuthEvent(AUTH_EVENTS.SESSION_INVALID, { message: 'Sesión no válida o expirada' });
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      emitAuthEvent(AUTH_EVENTS.ERROR, { message: 'Error verificando autenticación', error });
      return false;
    }
  },
  
  // Obtener el usuario actual
  getCurrentUser: async (): Promise<StaffUser | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        emitAuthEvent(AUTH_EVENTS.SESSION_INVALID, { 
          error: error || 'No hay usuario en la sesión' 
        });
        return null;
      }
      
      // Obtener datos del staff
      const { data: staffData, error: staffError } = await supabase
        .from('clinic_staff')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (staffError || !staffData) {
        emitAuthEvent(AUTH_EVENTS.STAFF_INVALID, { 
          userId: data.user.id,
          error: staffError || 'Usuario no es miembro del staff'
        });
        return null;
      }
      
      emitAuthEvent(AUTH_EVENTS.STAFF_VALID, { 
        userId: data.user.id,
        staffData
      });
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        role: staffData.role || 'staff',
        firstName: staffData.first_name,
        lastName: staffData.last_name
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      emitAuthEvent(AUTH_EVENTS.ERROR, { message: 'Error obteniendo usuario actual', error });
      return null;
    }
  },
  
  // Método para depuración - activar bypass de autenticación
  enableDebugMode: (bypass: boolean = false) => {
    getDebugState().bypassEnabled = bypass;
    emitAuthEvent('auth:debug_mode', { bypass });
    console.warn(`🔧 Modo depuración ${bypass ? 'ACTIVADO' : 'DESACTIVADO'}`);
    if (bypass) {
      console.warn('⚠️ BYPASS DE AUTENTICACIÓN ACTIVADO - NO USAR EN PRODUCCIÓN');
    }
    return bypass;
  },
  
  // Método para obtener estado de depuración
  getDebugState: () => {
    return getDebugState();
  },
  
  // Solicitar cambio de contraseña
  requestPasswordReset: async (email: string): Promise<boolean> => {
    try {
      emitAuthEvent(AUTH_EVENTS.PASSWORD_RESET_REQUEST, { email });
      console.log('Solicitando restablecimiento de contraseña para:', email);
      
      // Configurar la URL de redirección según el entorno
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
      const baseUrl = isDev 
        ? window.location.origin 
        : 'https://dental-spark.vercel.app';
      
      const redirectTo = `${baseUrl}/reset-password`;
      
      // Enviar email de recuperación
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      if (error) {
        console.error('Error solicitando restablecimiento:', error);
        monitoringService.logError('authService.requestPasswordReset', new Error(error.message));
        emitAuthEvent(AUTH_EVENTS.PASSWORD_RESET_FAILURE, { 
          error: error.message, 
          code: error.code, 
          status: error.status 
        });
        
        if (typeof window !== 'undefined') {
          getDebugState().lastError = error;
        }
        
        throw error;
      }
      
      emitAuthEvent(AUTH_EVENTS.PASSWORD_RESET_SUCCESS, { email });
      console.log('Email de recuperación enviado a:', email);
      return true;
    } catch (error) {
      console.error('Error solicitando restablecimiento:', error);
      monitoringService.logError('authService.requestPasswordReset', error as Error);
      emitAuthEvent(AUTH_EVENTS.ERROR, { 
        message: 'Error solicitando restablecimiento', 
        error 
      });
      
      if (typeof window !== 'undefined') {
        getDebugState().lastError = error;
      }
      
      throw error;
    }
  },
  
  // Actualizar contraseña con un token
  updatePasswordWithToken: async (newPassword: string): Promise<boolean> => {
    try {
      emitAuthEvent(AUTH_EVENTS.PASSWORD_UPDATE_REQUEST, {});
      console.log('Actualizando contraseña con token...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Error actualizando contraseña:', error);
        monitoringService.logError('authService.updatePasswordWithToken', new Error(error.message));
        emitAuthEvent(AUTH_EVENTS.PASSWORD_UPDATE_FAILURE, { 
          error: error.message, 
          code: error.code, 
          status: error.status 
        });
        
        if (typeof window !== 'undefined') {
          getDebugState().lastError = error;
        }
        
        throw error;
      }
      
      emitAuthEvent(AUTH_EVENTS.PASSWORD_UPDATE_SUCCESS, {});
      console.log('Contraseña actualizada correctamente');
      return true;
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      monitoringService.logError('authService.updatePasswordWithToken', error as Error);
      emitAuthEvent(AUTH_EVENTS.ERROR, { 
        message: 'Error actualizando contraseña', 
        error 
      });
      
      if (typeof window !== 'undefined') {
        getDebugState().lastError = error;
      }
      
      throw error;
    }
  },
};

// Declarar el tipo para la ventana extendida con datos de depuración
declare global {
  interface Window {
    __DENTAL_SPARK_DEBUG__: {
      auth: {
        events: Array<{
          type: string;
          timestamp: string;
          data: any;
        }>;
        lastEvent: {
          type: string;
          timestamp: string;
          data: any;
        } | null;
        lastError: any;
        session: any;
        bypassEnabled?: boolean;
      }
    }
  }
} 