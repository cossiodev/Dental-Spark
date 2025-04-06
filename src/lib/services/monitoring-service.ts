// Servicio de monitoreo para modo producción
import { supabase } from "@/integrations/supabase/client";

// Determinar si estamos en modo producción
const isProduction = import.meta.env.PROD;

// Registrar información del entorno
console.log(`🌐 Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
console.log(`📊 Monitoreo ${isProduction ? 'ACTIVADO' : 'DESACTIVADO'}`);

// Objeto para almacenar estadísticas de rendimiento
const performanceStats = {
  apiCalls: 0,
  errors: 0,
  loadTimes: [] as number[],
  lastError: null as Error | null
};

// Función para registrar eventos de rendimiento
export const monitoringService = {
  // Registrar llamada a API
  logApiCall: (endpoint: string, durationMs: number, success: boolean) => {
    if (!isProduction) return;
    
    performanceStats.apiCalls++;
    performanceStats.loadTimes.push(durationMs);
    
    if (!success) {
      performanceStats.errors++;
    }
    
    // En producción, enviamos datos de telemetría a Supabase
    if (isProduction) {
      supabase.from('telemetry').insert({
        endpoint,
        duration_ms: durationMs,
        success,
        timestamp: new Date().toISOString()
      }).then(() => {
        // Silent success
      }).catch(err => {
        console.warn('Error enviando telemetría:', err);
      });
    }
  },

  // Registrar error
  logError: (source: string, error: Error) => {
    performanceStats.errors++;
    performanceStats.lastError = error;
    
    console.error(`[${source}] Error:`, error);
    
    // En producción, registramos los errores
    if (isProduction) {
      supabase.from('error_logs').insert({
        source,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }).then(() => {
        // Silent success
      }).catch(err => {
        console.warn('Error enviando registro de error:', err);
      });
    }
  },
  
  // Obtener estadísticas actuales
  getStats: () => {
    const avgLoadTime = performanceStats.loadTimes.length > 0 
      ? performanceStats.loadTimes.reduce((a, b) => a + b, 0) / performanceStats.loadTimes.length 
      : 0;
      
    return {
      apiCalls: performanceStats.apiCalls,
      errors: performanceStats.errors,
      avgLoadTimeMs: Math.round(avgLoadTime),
      errorRate: performanceStats.apiCalls > 0 
        ? (performanceStats.errors / performanceStats.apiCalls) * 100 
        : 0
    };
  }
}; 