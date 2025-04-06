import type { Json } from "@/integrations/supabase/types";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  insurance?: string;
  insuranceNumber?: string;
  medicalHistory?: string;
  allergies: string[];
  lastVisit?: string;
  isPediatric: boolean;
  legalGuardian?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  treatingDoctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  treatmentType?: string;
  createdAt: string;
}

export interface Treatment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  type: string;
  description: string;
  teeth: number[];
  status: 'planned' | 'in-progress' | 'completed';
  cost: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  suggestedByOdontogram?: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  treatmentId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  price: number;
  supplier?: string;
  lastRestocked?: string;
  createdAt: string;
}

export interface Odontogram {
  id: string;
  patientId: string;
  date: string;
  teeth: Record<string, ToothCondition>;
  notes?: string;
  isPediatric?: boolean;
  createdAt: string;
}

export interface ToothCondition {
  status: 'healthy' | 'caries' | 'filling' | 'crown' | 'extraction' | 'implant' | 'root-canal';
  notes?: string;
  surfaces?: ('top' | 'bottom' | 'left' | 'right' | 'center')[];
}
