# Guía de Depuración para Dental Spark

Dental Spark incluye herramientas avanzadas de depuración diseñadas para trabajar con React Developer Tools y facilitar la identificación y resolución de problemas, especialmente relacionados con la autenticación.

## Herramientas de Depuración de Autenticación

### Activación de las Herramientas

Las herramientas de depuración están disponibles automáticamente en modo desarrollo (cuando se ejecuta con `npm run dev` o en `localhost`). Aparecerá un pequeño botón flotante en la esquina inferior derecha que dice "Auth Debug".

### Uso de las Herramientas de Depuración

1. **Visualización de Estado**: Al hacer clic en el botón de depuración, se abrirá un panel con información sobre el estado de autenticación actual, eventos y detalles de la sesión.

2. **Bypass de Autenticación**: Durante el desarrollo, puedes activar el modo bypass para saltar la verificación de autenticación. Esto te permite acceder a rutas protegidas sin necesidad de iniciar sesión.

3. **Registro de Eventos**: La pestaña "Eventos" muestra un registro detallado de todos los eventos de autenticación, incluyendo intentos de inicio de sesión, éxitos, fallos y verificaciones de sesión.

4. **Información de Sesión**: La pestaña "Sesión" proporciona detalles completos sobre la sesión actual del usuario, incluyendo tokens, fechas de expiración y datos de usuario.

## Integración con React Developer Tools

Las herramientas de depuración están diseñadas para integrarse con la extensión React Developer Tools de Chrome/Firefox:

1. **Instalación de React Developer Tools**: Asegúrate de tener instalada la extensión [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) en tu navegador.

2. **Componentes**: En la pestaña "Components" de React Developer Tools, puedes encontrar los componentes:
   - `AuthDebugDevTools`: Muestra el panel de depuración completo
   - `ProtectedRoute`: Contiene el estado de autenticación y bypass

3. **Profiler**: Puedes usar el Profiler para medir el rendimiento de los componentes relacionados con la autenticación.

## Depuración de Problemas Comunes

### Problemas de Inicio de Sesión

Si tienes problemas para iniciar sesión:

1. Abre las herramientas de depuración y observa los eventos en tiempo real al intentar iniciar sesión
2. Verifica los errores detallados que aparecen en la pestaña "Estado"
3. Usa la opción "Bypass" para acceder temporalmente mientras solucionas el problema

### Problemas de Sesión

Si la sesión se cierra inesperadamente o hay problemas para mantenerla:

1. Verifica la información de la sesión en la pestaña "Sesión"
2. Comprueba las fechas de expiración de los tokens
3. Observa los eventos relacionados con la verificación de la sesión

### Desarrollo sin Supabase

Para desarrollar sin conexión a Supabase:

1. Activa el modo "Bypass" en las herramientas de depuración
2. Esto te permitirá acceder a todas las rutas protegidas sin necesidad de autenticación real

## Eventos de Autenticación

Los eventos que puedes monitorear incluyen:

- `LOGIN_ATTEMPT`: Cuando se intenta iniciar sesión
- `LOGIN_SUCCESS`: Cuando el inicio de sesión es exitoso
- `LOGIN_FAILURE`: Cuando el inicio de sesión falla
- `LOGOUT`: Cuando se cierra sesión
- `SESSION_CHECK`: Cuando se verifica el estado de la sesión
- `SESSION_VALID`: Cuando la sesión es válida
- `SESSION_INVALID`: Cuando la sesión es inválida o ha expirado

## Console Logging

Además de las herramientas visuales, todos estos eventos se registran en la consola con información detallada cuando las herramientas de depuración están activadas.

## Notas para Producción

Las herramientas de depuración están desactivadas automáticamente en producción. Si necesitas depurar problemas en producción, puedes habilitar temporalmente las herramientas agregando `?debug=true` a la URL (solo funciona para administradores).

---

Para más información sobre el funcionamiento interno de la autenticación, consulta los archivos:
- `src/lib/services/auth-service.ts`
- `src/lib/hooks/useAuthDebug.tsx`
- `src/components/debug/AuthDebugTools.tsx`
- `src/components/auth/ProtectedRoute.tsx` 