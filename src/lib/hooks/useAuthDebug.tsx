import { useState, useEffect, useCallback } from 'react';
import { authService, AUTH_EVENTS } from '@/lib/services/auth-service';

/**
 * Hook para integrar la depuración de autenticación con React Developer Tools.
 * Expone el estado de autenticación como props/estados de React para mejor visibilidad.
 */
const useAuthDebug = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    user: null,
    bypassActive: false,
    lastError: null,
    lastEvent: null
  });

  const [events, setEvents] = useState<any[]>([]);

  // Actualizar estado cuando ocurren eventos de autenticación
  useEffect(() => {
    const updateDebugState = () => {
      const debugData = window.__DENTAL_SPARK_DEBUG__?.auth || {};
      
      setAuthState(prev => ({
        ...prev,
        session: debugData.session,
        lastError: debugData.lastError,
        lastEvent: debugData.lastEvent,
        bypassActive: !!debugData.bypassEnabled
      }));

      if (debugData.events) {
        setEvents(debugData.events);
      }
    };

    // Inicializar estado
    updateDebugState();

    // Escuchar eventos de autenticación
    const handleAuthEvent = (event: CustomEvent) => {
      updateDebugState();
    };

    window.addEventListener('react-auth-event', handleAuthEvent as EventListener);

    return () => {
      window.removeEventListener('react-auth-event', handleAuthEvent as EventListener);
    };
  }, []);

  // Check session status
  useEffect(() => {
    const checkSession = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        const user = authenticated ? await authService.getCurrentUser() : null;
        
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: authenticated,
          isLoading: false,
          user
        }));
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          lastError: error
        }));
      }
    };

    checkSession();
  }, []);

  // Togglear bypass de autenticación
  const toggleBypass = useCallback((state?: boolean) => {
    const newState = state !== undefined ? state : !authState.bypassActive;
    authService.enableDebugMode(newState);
    
    setAuthState(prev => ({
      ...prev,
      bypassActive: newState
    }));
  }, [authState.bypassActive]);

  // Verificar sesión manualmente
  const refreshSession = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const session = await authService.getCurrentSession();
      const user = session ? await authService.getCurrentUser() : null;
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: !!session,
        session,
        user
      }));
      
      return session;
    } catch (error) {
      setAuthState(prev => ({
        ...prev, 
        isLoading: false,
        lastError: error
      }));
      return null;
    }
  }, []);

  return {
    ...authState,
    events,
    toggleBypass,
    refreshSession
  };
};

export default useAuthDebug; 