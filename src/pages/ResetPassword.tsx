import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/services/auth-service";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  LockKeyhole
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

// Esquema de validación para el formulario
const resetPasswordSchema = z.object({
  password: z.string().min(8, { 
    message: "La contraseña debe tener al menos 8 caracteres" 
  }),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Verificar el token al cargar la página
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Intentar obtener la sesión actual para confirmar que el token es válido
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error al verificar token:", error);
          setIsValidToken(false);
          setTokenError("El enlace de restablecimiento no es válido o ha expirado");
          return;
        }
        
        if (!data.session) {
          setIsValidToken(false);
          setTokenError("El enlace de restablecimiento no es válido o ha expirado");
          return;
        }
        
        // Token válido
        setIsValidToken(true);
      } catch (error) {
        console.error("Error verificando token:", error);
        setIsValidToken(false);
        setTokenError("Ha ocurrido un error al validar el enlace de restablecimiento");
      }
    };
    
    checkResetToken();
  }, []);

  // Configurar react-hook-form con zod
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);

    try {
      await authService.updatePasswordWithToken(values.password);
      setIsSubmitted(true);
      
      toast({
        title: "Contraseña actualizada",
        description: "Su contraseña ha sido restablecida correctamente."
      });
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      
      let errorMessage = "No se pudo restablecer la contraseña";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar un estado de carga mientras verificamos el token
  if (isValidToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-gray-600">
              Verificando enlace de restablecimiento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar un error si el token no es válido
  if (isValidToken === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-red-600">
              Enlace no válido
            </CardTitle>
            <CardDescription>
              El enlace de restablecimiento no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {tokenError || "El enlace que ha utilizado no es válido o ha expirado. Por favor solicite un nuevo enlace de restablecimiento."}
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-4">
            <Button onClick={() => navigate("/forgot-password")}>
              Solicitar nuevo enlace
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isSubmitted ? "Contraseña restablecida" : "Crear nueva contraseña"}
          </CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "Su contraseña ha sido actualizada correctamente" 
              : "Ingrese su nueva contraseña para su cuenta"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <Alert className="bg-green-50">
                <AlertTitle>¡Éxito!</AlertTitle>
                <AlertDescription>
                  Su contraseña ha sido actualizada correctamente. Será redirigido 
                  a la página de inicio de sesión en unos segundos.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center mt-4">
                <Button 
                  variant="default" 
                  onClick={() => navigate("/login")}
                >
                  Ir a inicio de sesión
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="********" 
                          type="password" 
                          disabled={isLoading} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="********" 
                          type="password" 
                          disabled={isLoading} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Restableciendo contraseña...
                    </>
                  ) : (
                    "Restablecer contraseña"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-4">
          <Button
            variant="link"
            onClick={() => navigate("/login")}
            className="text-sm text-primary hover:underline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword; 