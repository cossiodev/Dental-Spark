import React, { useState, useEffect } from 'react';
import { authService, AUTH_EVENTS } from '@/lib/services/auth-service';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, ChevronDown, X, Bug, ToggleLeft } from 'lucide-react';
import useAuthDebug from '@/lib/hooks/useAuthDebug';

// Componente DevTools para React Developer Tools
// Nombrar componentes con DevTools facilita su identificación en la extensión
const AuthDebugDevTools: React.FC = () => {
  // No renderizar durante SSR
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Establecer isBrowser a true cuando estamos en el navegador
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Si estamos en SSR, no renderizamos nada
  if (!isBrowser) {
    return null;
  }
  
  // El resto del componente no cambia
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('status');
  
  // Usar el hook que expone los estados para React Developer Tools
  const {
    isAuthenticated,
    isLoading,
    session,
    user,
    bypassActive,
    lastError,
    lastEvent,
    events,
    toggleBypass,
    refreshSession
  } = useAuthDebug();

  // Función para formatear timestamps
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };

  // Componente para mostrar badges según tipo de evento
  const EventBadge: React.FC<{type: string}> = ({ type }) => {
    const color = type.includes('success') || type.includes('valid')
      ? 'bg-green-500'
      : type.includes('failure') || type.includes('invalid') || type.includes('error')
        ? 'bg-red-500'
        : type.includes('attempt') || type.includes('check')
          ? 'bg-blue-500'
          : 'bg-gray-500';

    return (
      <Badge className={`${color} text-white`} id={`event-${type}`}>
        {type.replace('auth:', '')}
      </Badge>
    );
  };

  // Vista compacta cuando está colapsado
  if (!expanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg cursor-pointer z-50 flex items-center"
        onClick={() => setExpanded(true)}
        data-testid="auth-debug-collapsed"
      >
        <Bug className="h-5 w-5 text-amber-500 mr-2" />
        <span className="text-sm">Auth Debug</span>
        {isAuthenticated && <Badge className="ml-2 bg-green-500">Logged In</Badge>}
        {bypassActive && <Badge className="ml-2 bg-amber-500">Bypass</Badge>}
      </div>
    );
  }

  // Lista de eventos formateada para React DevTools
  const EventsList: React.FC = () => (
    <div className="space-y-2" data-testid="auth-events-list">
      {events.length === 0 ? (
        <p className="text-xs text-gray-500">No hay eventos registrados.</p>
      ) : (
        events.map((event, idx) => (
          <div 
            key={idx} 
            className="border-b border-gray-100 dark:border-gray-800 pb-1 mb-1 last:border-0"
            data-event-type={event.detail?.type}
            data-event-time={event.detail?.timestamp}
          >
            <div className="flex justify-between items-center">
              <EventBadge type={event.detail?.type || 'unknown'} />
              <span className="text-xs text-gray-500">{formatTimestamp(event.detail?.timestamp)}</span>
            </div>
            {event.detail?.data && (
              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-1 rounded mt-1 overflow-x-auto">
                {JSON.stringify(event.detail.data, null, 2)}
              </pre>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Vista expandida
  return (
    <Card 
      className="fixed bottom-4 right-4 w-96 shadow-2xl z-50 border border-amber-400 overflow-hidden"
      data-testid="auth-debug-expanded"
    >
      <CardHeader className="bg-amber-50 dark:bg-gray-800 p-3 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-sm flex items-center">
            <Bug className="h-4 w-4 text-amber-500 mr-2" />
            Auth DevTools
            {isAuthenticated && <Badge className="ml-2 bg-green-500">✓</Badge>}
          </CardTitle>
          <CardDescription className="text-xs mt-0">
            {user?.email || 'No hay sesión activa'}
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={() => setExpanded(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-3 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="status" className="text-xs">Estado</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Eventos</TabsTrigger>
            <TabsTrigger value="session" className="text-xs">Sesión</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-3 max-h-80 overflow-y-auto">
          <TabsContent value="status" className="mt-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Bypass autenticación:</span>
                <Switch 
                  checked={bypassActive} 
                  onCheckedChange={toggleBypass}
                  id="auth-bypass-toggle"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Sesión activa:</span>
                <span className="text-xs">
                  {isAuthenticated ? (
                    <Badge className="bg-green-500 text-white">Activa</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white">Inactiva</Badge>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Estado:</span>
                <span className="text-xs">
                  {isLoading ? (
                    <Badge className="bg-blue-500 text-white">Cargando</Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white">Listo</Badge>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Último evento:</span>
                <span className="text-xs">
                  {lastEvent?.type ? (
                    <EventBadge type={lastEvent.type} />
                  ) : (
                    <Badge variant="outline">Ninguno</Badge>
                  )}
                </span>
              </div>
              
              {lastError && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-red-500">Último error:</p>
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs mt-1 overflow-x-auto">
                    {lastError.message || JSON.stringify(lastError)}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <EventsList />
          </TabsContent>

          <TabsContent value="session" className="mt-0">
            <div className="space-y-2">
              {session ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Usuario:</span>
                    <span className="text-xs">{session.user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">ID:</span>
                    <span className="text-xs">{session.user?.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Expira:</span>
                    <span className="text-xs">{new Date(session.expires_at * 1000).toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs mb-2">No hay sesión activa</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={refreshSession} 
                    className="text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Verificar sesión
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </CardContent>

        <CardFooter className="p-2 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-500">React Developer Tools integration</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={refreshSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </CardFooter>
      </Tabs>
    </Card>
  );
};

export default AuthDebugDevTools; 