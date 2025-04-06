
// This is now a barrel file that exports all services
import { Patient, Appointment, Treatment, Invoice, InventoryItem, Odontogram } from './models/types';

// Re-export types
export type {
  Patient,
  Appointment,
  Treatment,
  Invoice,
  InventoryItem,
  Odontogram
};

// Re-export services
export { patientService } from './services/patient-service';
export { appointmentService } from './services/appointment-service';
export { treatmentService } from './services/treatment-service';
export { invoiceService } from './services/invoice-service';
export { odontogramService } from './services/odontogram-service';
export { inventoryService } from './services/inventory-service';
