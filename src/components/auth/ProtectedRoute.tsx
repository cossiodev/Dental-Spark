import { useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/lib/services/auth-service";
import { Loader2 } from "lucide-react";
import AuthDebugDevTools from "@/components/debug/AuthDebugTools";
import useAuthDebug from "@/lib/hooks/useAuthDebug";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Usar el hook de depuración para integración con React Developer Tools
  const { 
    isAuthenticated, 
    isLoading, 
    bypassActive,
    checkAuth 
  } = useAuthDebug();

  // Determinar si estamos en modo desarrollo y en navegador (no SSR)
  const isDevelopment = typeof window !== 'undefined' && 
    (import.meta.env.DEV || window.location.hostname === 'localhost');

  // Verificar autenticación al cargar
  useEffect(() => {
    // Solo ejecutar en el cliente, no durante SSR
    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, [checkAuth]);

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Verificando autenticación...</span>
      </div>
    );
  }

  // Redireccionar al login si no está autenticado y no tiene bypass
  if (!isAuthenticated && !bypassActive) {
    return <Navigate to="/login" replace />;
  }

  // Renderizar los componentes hijos si está autenticado o con bypass
  return (
    <>
      {children}
      {/* Mostrar herramientas de depuración solo en desarrollo */}
      {isDevelopment && <AuthDebugDevTools />}
    </>
  );
};

export default ProtectedRoute; 