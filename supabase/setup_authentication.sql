-- Script para configurar autenticación en Dental Spark
-- Ejecutar este script en la consola SQL de Supabase

-- 1. Crear la función para crear la tabla clinic_staff si no existe
CREATE OR REPLACE FUNCTION create_staff_table_if_needed()
RETURNS void AS $$
BEGIN
  -- Verificar si la tabla clinic_staff existe
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'clinic_staff'
  ) THEN
    -- Crear la tabla si no existe
    CREATE TABLE public.clinic_staff (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'staff',
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Aplicar RLS a la tabla
    ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;
    
    -- Política que permite a los usuarios ver solo sus propios datos
    CREATE POLICY "Users can view their own staff data" 
      ON public.clinic_staff 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    -- Política que permite a los administradores ver todos los datos
    CREATE POLICY "Staff can view all staff data" 
      ON public.clinic_staff 
      FOR SELECT 
      USING (auth.uid() IN (
        SELECT cs.user_id FROM public.clinic_staff cs WHERE cs.role = 'admin'
      ));
      
    -- Política que permite insertar datos para el nuevo usuario (solo durante el registro)
    CREATE POLICY "Enable insert for authenticated users only" 
      ON public.clinic_staff 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Ejecutar la función para asegurarse de que la tabla existe
SELECT create_staff_table_if_needed();

-- 3. Configurar políticas para la tabla de pacientes
-- Asegurarse de que RLS está habilitado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos (si las hay)
DROP POLICY IF EXISTS "Staff can access patients" ON patients;
DROP POLICY IF EXISTS "Staff can insert patients" ON patients;
DROP POLICY IF EXISTS "Staff can update patients" ON patients;
DROP POLICY IF EXISTS "Staff can delete patients" ON patients;

-- Crear nuevas políticas
-- Política para permitir acceso de lectura a miembros del staff
CREATE POLICY "Staff can access patients"
  ON patients
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM clinic_staff));

-- Política para permitir a miembros del staff crear nuevos pacientes
CREATE POLICY "Staff can insert patients"
  ON patients
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM clinic_staff));

-- Política para permitir a miembros del staff actualizar pacientes
CREATE POLICY "Staff can update patients"
  ON patients
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM clinic_staff));

-- Política para permitir a miembros del staff eliminar pacientes
CREATE POLICY "Staff can delete patients"
  ON patients
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM clinic_staff));

-- 4. Insertar un usuario administrador para pruebas (opcional)
-- NOTA: Primero debes crear manualmente un usuario desde la interfaz de autenticación de Supabase
-- Luego, reemplaza 'ID-DEL-USUARIO-CREADO' con el UUID real del usuario

/* 
-- Descomentar y ejecutar después de crear el usuario
INSERT INTO clinic_staff (user_id, role, first_name, last_name)
VALUES 
  ('ID-DEL-USUARIO-CREADO', 'admin', 'Administrador', 'Dental Spark');
*/

-- 5. Agregar política temporal para permitir inserciones anónimas (solo para desarrollo)
-- NOTA: Esto es solo para desarrollo y pruebas, eliminar en producción
CREATE POLICY "Allow anonymous insert during dev"
  ON patients
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 6. Verificar configuración
SELECT 'Configuración completada. Por favor revisa las políticas RLS en Supabase.' as message; 