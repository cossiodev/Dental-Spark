-- Actualizar la tabla de citas para permitir status 'confirmed'
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'));

-- Asegurar que la función de actualización de citas funcione con todos los estados
CREATE OR REPLACE FUNCTION update_appointment_status(
  p_appointment_id UUID,
  p_status TEXT
) RETURNS VOID AS $$
BEGIN
  -- Validar el estado proporcionado
  IF p_status NOT IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show') THEN
    RAISE EXCEPTION 'Estado de cita no válido: %. Debe ser: scheduled, confirmed, completed, cancelled, o no-show', p_status;
  END IF;

  UPDATE appointments 
  SET status = p_status
  WHERE id = p_appointment_id;
  
  -- Si la cita se completó, actualizar la última visita del paciente
  IF p_status = 'completed' THEN
    UPDATE patients
    SET last_visit = CURRENT_TIMESTAMP
    WHERE id = (SELECT patient_id FROM appointments WHERE id = p_appointment_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Actualizar la función create_appointment para aceptar todos los estados
CREATE OR REPLACE FUNCTION create_appointment(
  p_patient_id UUID,
  p_doctor_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_treatment_type TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'scheduled'
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Validar el estado proporcionado
  IF p_status NOT IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show') THEN
    RAISE EXCEPTION 'Estado de cita no válido: %. Debe ser: scheduled, confirmed, completed, cancelled, o no-show', p_status;
  END IF;

  -- Insertar una nueva cita y devolver el ID generado
  INSERT INTO appointments (
    patient_id, 
    doctor_id, 
    date, 
    start_time, 
    end_time, 
    treatment_type, 
    notes, 
    status
  ) VALUES (
    p_patient_id, 
    p_doctor_id, 
    p_date, 
    p_start_time, 
    p_end_time, 
    p_treatment_type, 
    p_notes, 
    p_status
  ) RETURNING id INTO new_id;
  
  -- Devolver el ID de la cita recién creada
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener todas las citas sin usar relaciones directas
CREATE OR REPLACE FUNCTION get_all_appointments()
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  patient_first_name TEXT,
  patient_last_name TEXT,
  doctor_id UUID,
  doctor_first_name TEXT,
  doctor_last_name TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  status TEXT,
  notes TEXT,
  treatment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.patient_id,
    p.first_name AS patient_first_name,
    p.last_name AS patient_last_name,
    a.doctor_id,
    d.first_name AS doctor_first_name,
    d.last_name AS doctor_last_name,
    a.date,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    a.treatment_type,
    a.created_at
  FROM 
    appointments a
  LEFT JOIN patients p ON a.patient_id = p.id
  LEFT JOIN doctors d ON a.doctor_id = d.id
  ORDER BY a.date, a.start_time;
END;
$$ LANGUAGE plpgsql;

-- Agregar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_all_appointments() TO anon;
GRANT EXECUTE ON FUNCTION get_all_appointments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_appointments() TO service_role; 