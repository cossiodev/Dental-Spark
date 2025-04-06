# Modo Producción - Dental Spark

Este documento explica cómo funciona el modo producción en Dental Spark y cómo se realiza el despliegue automático.

## Arquitectura

Dental Spark utiliza la siguiente arquitectura para el modo producción:

1. **GitHub**: Alojamiento del código fuente y control de versiones
2. **GitHub Actions**: Automatización del despliegue continuo
3. **Vercel**: Hosting de la aplicación en producción
4. **Supabase**: Base de datos y backend serverless

## Flujo de Trabajo Automático

El flujo de trabajo es completamente automático:

1. Desarrollas en tu entorno local
2. Haces commit de tus cambios y push a GitHub
3. GitHub Actions detecta el push y activa el workflow de despliegue
4. Vercel recibe el código y lo despliega automáticamente
5. La aplicación se actualiza en producción sin intervención manual

## URLs Importantes

- **Aplicación en producción**: [https://dental-spark.vercel.app](https://dental-spark.vercel.app)
- **Repositorio GitHub**: [https://github.com/cossiodev/Dental-Spark](https://github.com/cossiodev/Dental-Spark)
- **Dashboard de Vercel**: [https://vercel.com/elvis-cossios-projects-ca2df045/dental-spark](https://vercel.com/elvis-cossios-projects-ca2df045/dental-spark)
- **Supabase**: [https://app.supabase.com/project/fdhanpamtgtyeaqskikh](https://app.supabase.com/project/fdhanpamtgtyeaqskikh)

## Herramientas de Despliegue

### Script Github-Auto

Para facilitar el despliegue, hemos creado un script `github-auto.ps1` que automatiza el proceso:

```powershell
.\github-auto.ps1 -CommitMessage "Tu mensaje personalizado"
```

Este script:
1. Agrega todos los cambios al stage
2. Crea un commit con un mensaje (por defecto incluye fecha y hora)
3. Hace push a GitHub, lo que desencadena el despliegue automático

## Monitoreo en Producción

La aplicación incluye un sistema de monitoreo que:

1. Registra llamadas a la API y sus tiempos de respuesta
2. Captura errores y los almacena en Supabase
3. Proporciona estadísticas de rendimiento

Todo esto está implementado en el servicio `monitoring-service.ts`.

## Manejo de Errores en Producción

Para asegurar que la aplicación no falle en producción:

1. Todos los servicios tienen manejo de errores mejorado
2. El servicio de inventario proporciona datos de muestra cuando hay problemas de conexión
3. Los errores se registran centralizadamente para su posterior análisis

## Supabase en Producción

Estamos usando Supabase en modo producción con las siguientes características:

- URL: `https://fdhanpamtgtyeaqskikh.supabase.co`
- Todos los servicios están configurados para trabajar con esta instancia
- Los datos de muestra solo se usan si hay problemas de conexión

## Actualizaciones y Mantenimiento

Para actualizar la aplicación en producción, simplemente:

1. Realiza tus cambios localmente
2. Ejecuta `.\github-auto.ps1`
3. Verifica el estado del despliegue en GitHub Actions

No es necesario ejecutar comandos adicionales ni gestionar tokens manualmente. 