import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/services/auth-service';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Hook personalizado para integrar la depuración de autenticación con React Developer Tools
 */
const useAuthDebug = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [bypassActive, setBypassActive] = useState<boolean>(false);
  const [lastError, setLastError] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  // Inicializar el estado de depuración global si no existe
  useEffect(() => {
    // No ejecutar durante SSR
    if (typeof window === 'undefined') return;
    
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
  }, []);

  // Función para escuchar eventos de autenticación
  useEffect(() => {
    // No ejecutar durante SSR
    if (typeof window === 'undefined') return;
    
    const handleAuthEvent = (event: any) => {
      const { detail } = event;
      
      // Actualizar el estado basado en eventos
      if (detail.type === 'auth:login_success' || 
          detail.type === 'auth:session_valid') {
        setIsAuthenticated(true);
      } else if (detail.type === 'auth:login_failure' || 
                detail.type === 'auth:session_invalid' || 
                detail.type === 'auth:logout') {
        setIsAuthenticated(false);
      }
      
      // Actualizar último evento
      setLastEvent(detail);
      
      // Actualizar lista de eventos
      setEvents(prev => [detail, ...prev].slice(0, 50));
    };
    
    // Suscribirse a eventos de autenticación
    window.addEventListener('react-auth-event', handleAuthEvent);
    
    // Obtener estado inicial
    const debugState = getDebugState();
    if (debugState) {
      const { bypassEnabled, lastEvent, lastError, events = [], session } = debugState;
      setBypassActive(!!bypassEnabled);
      setLastEvent(lastEvent);
      setLastError(lastError);
      setEvents(events || []);
      setSession(session);
      
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
    }
    
    return () => {
      window.removeEventListener('react-auth-event', handleAuthEvent);
    };
  }, []);

  // Función para verificar autenticación
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Verificar si el bypass está activo
      const bypassEnabled = typeof window !== 'undefined' ? getDebugState().bypassEnabled : false;
      if (bypassEnabled) {
        setIsAuthenticated(true);
        setBypassActive(true);
        setIsLoading(false);
        return true;
      }
      
      // Verificar sesión
      const session = await authService.getCurrentSession();
      setSession(session);
      
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setLastError(error);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Función para activar/desactivar bypass
  const toggleBypass = useCallback(() => {
    const newState = !bypassActive;
    setBypassActive(newState);
    
    if (typeof window !== 'undefined') {
      getDebugState().bypassEnabled = newState;
    }
    
    return authService.enableDebugMode(newState);
  }, [bypassActive]);

  // Función para refrescar sesión
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    await checkAuth();
    setIsLoading(false);
  }, [checkAuth]);

  // Ejecutar checkAuth en el cliente, no durante SSR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      // Durante SSR, establecer isLoading en false para evitar estado de carga infinito
      setIsLoading(false);
    }
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    session,
    user,
    bypassActive,
    lastError,
    lastEvent,
    events,
    checkAuth,
    toggleBypass,
    refreshSession
  };
};

export default useAuthDebug; 