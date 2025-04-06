# Configuración de Autenticación en Dental Spark

Este documento explica cómo configurar la autenticación y las políticas de seguridad para Dental Spark utilizando Supabase.

## Requisitos previos

1. Tener acceso al proyecto Supabase: [https://app.supabase.com/project/fdhanpamtgtyeaqskikh](https://app.supabase.com/project/fdhanpamtgtyeaqskikh)
2. Tener permisos para ejecutar consultas SQL y configurar políticas en el proyecto

## Pasos para configurar la autenticación

### 1. Crear un usuario en Supabase

1. Accede al panel de Supabase > **Authentication** > **Users**
2. Haz clic en "Add User" o "Invite"
3. Proporciona un email y contraseña para el nuevo usuario
4. Toma nota del ID del usuario que se generará (lo necesitarás más adelante)

### 2. Ejecutar el script SQL para configurar políticas

1. Accede al panel de Supabase > **SQL Editor**
2. Copia y pega el contenido completo del archivo `supabase/setup_authentication.sql`
3. Ejecuta el script (esto creará la tabla `clinic_staff` y configurará las políticas)
4. Verifica que no haya errores en la ejecución

### 3. Registrar al usuario como miembro del staff (método 1)

1. En el script SQL, descomenta la sección "Insertar un usuario administrador para pruebas"
2. Reemplaza `'ID-DEL-USUARIO-CREADO'` con el UUID real del usuario que creaste
3. Ejecuta solo esa sección del script

Alternativamente (método 2), puedes acceder a:

1. Supabase > **Table Editor** > **clinic_staff**
2. Haz clic en "Insert row"
3. Completa los campos:
   - `user_id`: ID del usuario creado
   - `role`: "admin" (para acceso completo) o "staff" (para acceso limitado)
   - `first_name` y `last_name`: Nombre y apellido del usuario

### 4. Probar la autenticación

1. Inicia la aplicación Dental Spark
2. Accede a la URL de la aplicación (debería redirigirte a la pantalla de login)
3. Ingresa las credenciales del usuario que creaste
4. Si todo está configurado correctamente, deberías poder acceder al dashboard y demás funcionalidades

## Políticas de seguridad (RLS)

El sistema utiliza políticas de Row Level Security (RLS) de Supabase para proteger los datos:

1. **Tabla `patients`**:
   - Solo los miembros del staff pueden ver, crear, actualizar y eliminar pacientes
   - Las políticas verifican que el usuario esté autenticado y sea miembro del staff

2. **Tabla `clinic_staff`**:
   - Los usuarios solo pueden ver sus propios datos en esta tabla
   - Los administradores pueden ver datos de todos los miembros
   - Los usuarios pueden insertar su propio registro cuando inician sesión por primera vez

## Modo desarrollo vs. Producción

En modo desarrollo, hay una política adicional que permite inserciones anónimas en la tabla `patients`. Para cambiar a modo producción:

1. Accede a Supabase > **Authentication** > **Policies**
2. Elimina la política "Allow anonymous insert during dev" de la tabla `patients`

## Solución de problemas

Si experimentas problemas con la autenticación:

1. **Error "Usuario no autorizado como staff"**:
   - Asegúrate de que el usuario exista en la tabla `clinic_staff`
   - Verifica que el `user_id` coincida exactamente con el ID del usuario en Authentication

2. **No se pueden crear pacientes**:
   - Verifica que las políticas RLS estén correctamente configuradas
   - Asegúrate de que el usuario esté autenticado antes de intentar crear pacientes

3. **Problemas para ver datos**:
   - Confirma que las políticas SELECT estén configuradas correctamente
   - Verifica los permisos del usuario (debe ser miembro del staff)

## Contacto para soporte

Si necesitas ayuda adicional con la configuración de autenticación, por favor contacta al equipo de desarrollo:

- Correo: soporte@dental-spark.app 