import { useState } from "react";
import { Link } from "react-router-dom";
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
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Esquema de validación para el formulario
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" })
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  // Configurar react-hook-form con zod
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setEmail(values.email);

    try {
      await authService.requestPasswordReset(values.email);
      setIsSubmitted(true);
      
      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado un correo con instrucciones para restablecer su contraseña."
      });
    } catch (error) {
      console.error("Error al solicitar restablecimiento:", error);
      
      let errorMessage = "No se pudo enviar la solicitud de restablecimiento";
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Recuperar contraseña</CardTitle>
          <CardDescription>
            Ingrese su correo electrónico para recibir instrucciones de recuperación
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <MailCheck className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <Alert>
                <AlertTitle>Correo enviado</AlertTitle>
                <AlertDescription>
                  Hemos enviado un correo electrónico a <strong>{email}</strong> con 
                  instrucciones para restablecer su contraseña. Por favor revise su 
                  bandeja de entrada.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-gray-500 mt-2">
                <p>Si no recibe el correo en unos minutos, verifique su carpeta de spam 
                o solicite un nuevo correo de recuperación.</p>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                  Intentar con otro correo
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => onSubmit(form.getValues())}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>Reenviar correo</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="correo@ejemplo.com" 
                          type="email" 
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
                      Enviando solicitud...
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-4">
          <Link 
            to="/login" 
            className="text-sm text-primary hover:underline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword; 