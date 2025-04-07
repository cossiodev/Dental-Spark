-- Crear tabla de doctores
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pacientes
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  insurance TEXT,
  insurance_number TEXT,
  allergies TEXT[],
  medical_history TEXT,
  is_child BOOLEAN DEFAULT FALSE,
  legal_guardian JSONB,
  treating_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de citas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  treatment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tratamientos
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT,
  teeth INTEGER[],
  status TEXT NOT NULL CHECK (status IN ('planned', 'in-progress', 'completed')),
  cost DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de odontogramas
CREATE TABLE odontograms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  teeth JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, date)
);

-- Crear tabla de inventario
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 10,
  price DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de facturas
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_odontograms_patient_id ON odontograms(patient_id);

-- Crear vistas para estadísticas
CREATE VIEW appointment_stats AS
SELECT 
  status, 
  COUNT(*) as count
FROM appointments
GROUP BY status;

CREATE VIEW treatment_stats AS
SELECT 
  type, 
  COUNT(*) as count
FROM treatments
GROUP BY type;

CREATE VIEW monthly_revenue AS
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(total) as revenue
FROM invoices
WHERE status = 'paid'
GROUP BY month
ORDER BY month;

CREATE VIEW inventory_by_category AS
SELECT 
  category, 
  SUM(quantity) as total_quantity
FROM inventory
GROUP BY category;

-- Crear funciones para operaciones comunes
-- Función para registrar una nueva cita
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

-- Comentario: Esta función usa SECURITY DEFINER para ejecutarse con los privilegios del creador
-- de la función, evitando así las políticas de seguridad a nivel de fila (RLS) que
-- podrían estar bloqueando las inserciones directas en la tabla appointments.

-- Agregar política de permisos a la función
GRANT EXECUTE ON FUNCTION create_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION create_appointment TO anon;

-- Nota para los administradores:
-- 1. Asegúrate de que esta función esté expuesta a través de la API de Supabase habilitándola en
--    el panel de Database > Functions
-- 2. Verifica que la tabla appointments tenga las columnas correctas
-- 3. Puedes modificar esta función según tus necesidades específicas

-- Función para actualizar el estado de una cita
CREATE OR REPLACE FUNCTION update_appointment_status(
  p_appointment_id UUID,
  p_status TEXT
) RETURNS VOID AS $$
BEGIN
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

-- Función para crear una factura a partir de tratamientos
CREATE OR REPLACE FUNCTION create_invoice_from_treatments(
  p_patient_id UUID,
  p_treatment_ids UUID[],
  p_status TEXT DEFAULT 'draft',
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_items JSONB := '[]';
  v_subtotal DECIMAL(10, 2) := 0;
  v_tax DECIMAL(10, 2) := 0;
  v_total DECIMAL(10, 2) := 0;
  v_treatment RECORD;
  v_invoice_id UUID;
BEGIN
  -- Generar items de la factura a partir de los tratamientos
  FOR v_treatment IN 
    SELECT id, type, description, cost 
    FROM treatments 
    WHERE id = ANY(p_treatment_ids)
  LOOP
    v_items := v_items || jsonb_build_object(
      'id', gen_random_uuid(),
      'description', COALESCE(v_treatment.description, v_treatment.type),
      'quantity', 1,
      'unitPrice', v_treatment.cost,
      'total', v_treatment.cost,
      'treatmentId', v_treatment.id
    );
    
    v_subtotal := v_subtotal + v_treatment.cost;
  END LOOP;
  
  -- Calcular impuestos y total
  v_tax := v_subtotal * 0.21; -- 21% IVA
  v_total := v_subtotal + v_tax;
  
  -- Crear la factura
  INSERT INTO invoices (
    patient_id, date, due_date, items, subtotal,
    tax, total, status, notes
  ) VALUES (
    p_patient_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 
    v_items, v_subtotal, v_tax, v_total, p_status, p_notes
  ) RETURNING id INTO v_invoice_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar un pago
CREATE OR REPLACE FUNCTION register_payment(
  p_invoice_id UUID,
  p_amount DECIMAL(10, 2)
) RETURNS VOID AS $$
BEGIN
  UPDATE invoices
  SET 
    status = 'paid',
    paid_amount = p_amount,
    paid_date = CURRENT_DATE
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Políticas de seguridad Row Level Security (RLS)
-- Habilitar RLS en todas las tablas
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Crear políticas (adaptarlas según la estructura de usuarios y roles de su sistema)
-- Política de ejemplo: solo el staff de la clínica puede ver todos los pacientes
CREATE POLICY staff_can_access_patients ON patients
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM clinic_staff));

-- Trigger para actualizar facturas vencidas
CREATE OR REPLACE FUNCTION update_overdue_invoices() RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE AND status = 'sent';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_overdue_check
  AFTER INSERT OR UPDATE ON invoices
  EXECUTE FUNCTION update_overdue_invoices();

-- Trigger para verificar stock mínimo
CREATE OR REPLACE FUNCTION check_min_stock() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.min_quantity AND OLD.quantity > OLD.min_quantity THEN
    -- Aquí se podría enviar una notificación
    -- Por ejemplo, insertando en una tabla de notificaciones
    INSERT INTO notifications (type, message)
    VALUES ('low_stock', 'El producto ' || NEW.name || ' está por debajo del stock mínimo');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_min_stock_check
  AFTER UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_min_stock();

-- Políticas específicas para las citas
-- Al habilitar RLS, por defecto se deniega todo acceso
-- Creamos políticas para permitir acciones específicas

-- Permitir a todos los usuarios autenticados ver todas las citas
CREATE POLICY "Todos pueden ver citas" ON appointments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir a todos los usuarios autenticados insertar citas
CREATE POLICY "Todos pueden crear citas" ON appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir a todos los usuarios autenticados modificar citas
CREATE POLICY "Todos pueden modificar citas" ON appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Permitir a usuarios anónimos ver citas (útil para demo/desarrollo)
CREATE POLICY "Anónimos pueden ver citas" ON appointments
    FOR SELECT USING (auth.role() = 'anon');

-- Permitir a usuarios anónimos insertar citas (útil para demo/desarrollo)
CREATE POLICY "Anónimos pueden crear citas" ON appointments
    FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Permitir a usuarios anónimos modificar citas (útil para demo/desarrollo)
CREATE POLICY "Anónimos pueden modificar citas" ON appointments
    FOR UPDATE USING (auth.role() = 'anon');

-- NOTA: Para entornos de producción, deberías limitar estas políticas
-- a roles o usuarios específicos
