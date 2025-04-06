-- Función para crear la tabla clinic_staff si no existe
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
  END IF;
END;
$$ LANGUAGE plpgsql; 