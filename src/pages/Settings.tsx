
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Database, ShieldCheck, Key } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "",
    enableSsl: true,
  });
  
  const [apiSettings, setApiSettings] = useState({
    apiKey: "",
    apiEnabled: false,
  });

  const handleEmailSettingsSave = () => {
    // Here we would normally save to a backend
    toast({
      title: "Configuración de email guardada",
      description: "La configuración ha sido actualizada correctamente.",
    });
  };

  const handleApiSettingsSave = () => {
    // Here we would normally save to a backend
    toast({
      title: "Configuración de API guardada",
      description: "La configuración ha sido actualizada correctamente.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Administra la configuración general de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Nombre de la Clínica</Label>
                <Input id="clinic-name" placeholder="Mi Clínica Dental" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input id="currency" placeholder="$" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Copia de seguridad automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Realizar copias de seguridad automáticas diarias
                  </p>
                </div>
                <Switch id="auto-backup" />
              </div>
              
              <Button className="mt-4">Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuración de Email
              </CardTitle>
              <CardDescription>
                Configura el servidor SMTP para enviar emails a pacientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">Servidor SMTP</Label>
                  <Input 
                    id="smtp-server" 
                    placeholder="smtp.ejemplo.com" 
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Puerto SMTP</Label>
                  <Input 
                    id="smtp-port" 
                    placeholder="587" 
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Usuario SMTP</Label>
                  <Input 
                    id="smtp-username" 
                    placeholder="usuario@ejemplo.com" 
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Contraseña SMTP</Label>
                  <Input 
                    id="smtp-password" 
                    type="password" 
                    placeholder="********" 
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from-email">Email de Remitente</Label>
                <Input 
                  id="from-email" 
                  placeholder="clinica@ejemplo.com" 
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable-ssl" 
                  checked={emailSettings.enableSsl}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableSsl: checked})}
                />
                <Label htmlFor="enable-ssl">Habilitar SSL/TLS</Label>
              </div>
              
              <Button onClick={handleEmailSettingsSave}>Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuración de API
              </CardTitle>
              <CardDescription>
                Administra la integración con APIs externas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Clave de API</Label>
                <Input 
                  id="api-key" 
                  placeholder="api_key_12345" 
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Esta clave es usada para autenticar las peticiones a tu API
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="api-enabled" 
                  checked={apiSettings.apiEnabled}
                  onCheckedChange={(checked) => setApiSettings({...apiSettings, apiEnabled: checked})}
                />
                <Label htmlFor="api-enabled">Habilitar API</Label>
              </div>
              
              <Button onClick={handleApiSettingsSave}>Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración Avanzada
              </CardTitle>
              <CardDescription>
                Configuraciones avanzadas del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="database-connection">Conexión a Base de Datos</Label>
                <div className="flex items-center gap-2">
                  <Input id="database-connection" placeholder="postgresql://usuario:contraseña@localhost:5432/dentalspark" />
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Probar
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode">Modo de Depuración</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar logging detallado para resolución de problemas
                  </p>
                </div>
                <Switch id="debug-mode" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="security-level">Nivel de Seguridad</Label>
                <select 
                  id="security-level" 
                  className="w-full flex h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="standard">Estándar</option>
                  <option value="high">Alto</option>
                  <option value="extreme">Extremo</option>
                </select>
              </div>
              
              <Button variant="destructive" className="mt-4">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Realizar Prueba de Seguridad
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
