import { useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/lib/services/auth-service";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Verificando autenticación...</span>
      </div>
    );
  }

  // Redireccionar al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Renderizar los componentes hijos si está autenticado
  return <>{children}</>;
};

export default ProtectedRoute; 