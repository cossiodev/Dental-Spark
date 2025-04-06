-- Asegurarse de que RLS está habilitado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

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