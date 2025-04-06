export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
          doctor_id: string | null
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          start_time: string
          status: string
          treatment_type: string | null
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id?: string | null
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          start_time: string
          status: string
          treatment_type?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          start_time?: string
          status?: string
          treatment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_doctors_with_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          color: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_admin: boolean | null
          last_name: string
          phone: string | null
          specialization: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_admin?: boolean | null
          last_name: string
          phone?: string | null
          specialization?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_admin?: boolean | null
          last_name?: string
          phone?: string | null
          specialization?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          id: string
          last_restocked: string
          min_quantity: number
          name: string
          price: number
          quantity: number
          supplier: string | null
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_restocked?: string
          min_quantity: number
          name: string
          price: number
          quantity: number
          supplier?: string | null
          unit: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_restocked?: string
          min_quantity?: number
          name?: string
          price?: number
          quantity?: number
          supplier?: string | null
          unit?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          date: string
          discount: number
          doctor_id: string | null
          due_date: string
          id: string
          items: Json
          notes: string | null
          paid_amount: number
          paid_date: string | null
          patient_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          created_at?: string
          date: string
          discount: number
          doctor_id?: string | null
          due_date: string
          id?: string
          items: Json
          notes?: string | null
          paid_amount: number
          paid_date?: string | null
          patient_id?: string | null
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Update: {
          created_at?: string
          date?: string
          discount?: number
          doctor_id?: string | null
          due_date?: string
          id?: string
          items?: Json
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          patient_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_doctors_with_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograms: {
        Row: {
          created_at: string
          date: string
          id: string
          is_child: boolean | null
          notes: string | null
          patient_id: string
          teeth: Json
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_child?: boolean | null
          notes?: string | null
          patient_id: string
          teeth: Json
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_child?: boolean | null
          notes?: string | null
          patient_id?: string
          teeth?: Json
        }
        Relationships: [
          {
            foreignKeyName: "odontograms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          insurance: string | null
          insurance_number: string | null
          is_child: boolean | null
          last_name: string
          last_visit: string | null
          medical_history: string | null
          phone: string | null
          postal_code: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          insurance?: string | null
          insurance_number?: string | null
          is_child?: boolean | null
          last_name: string
          last_visit?: string | null
          medical_history?: string | null
          phone?: string | null
          postal_code?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          insurance?: string | null
          insurance_number?: string | null
          is_child?: boolean | null
          last_name?: string
          last_visit?: string | null
          medical_history?: string | null
          phone?: string | null
          postal_code?: string | null
        }
        Relationships: []
      }
      treatments: {
        Row: {
          cost: number
          created_at: string
          description: string | null
          doctor_id: string | null
          end_date: string | null
          id: string
          notes: string | null
          patient_id: string
          start_date: string
          status: string
          teeth: number[] | null
          type: string
        }
        Insert: {
          cost: number
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          start_date: string
          status: string
          teeth?: number[] | null
          type: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          start_date?: string
          status?: string
          teeth?: number[] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_doctors_with_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_doctors_with_credentials: {
        Row: {
          color: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_admin: boolean | null
          last_name: string | null
          password_hash: string | null
          phone: string | null
          specialization: string | null
          user_id: string | null
        }
        Relationships: []
      }
      appointment_stats: {
        Row: {
          count: number | null
          status: string | null
        }
        Relationships: []
      }
      inventory_by_category: {
        Row: {
          category: string | null
          total_quantity: number | null
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          month: string | null
          revenue: number | null
        }
        Relationships: []
      }
      monthly_revenue_by_doctor: {
        Row: {
          doctor_id: string | null
          month: string | null
          revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_doctors_with_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_stats: {
        Row: {
          count: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_admin_doctor_from_api: {
        Args: {
          first_name: string
          last_name: string
          email: string
          password: string
          specialization?: string
          phone?: string
          color?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
