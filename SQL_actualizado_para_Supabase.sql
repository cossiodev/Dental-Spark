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