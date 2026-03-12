export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          mobile_number: string | null
          name: string
          password: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          mobile_number?: string | null
          name: string
          password: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          mobile_number?: string | null
          name?: string
          password?: string
          username?: string
        }
        Relationships: []
      }
      electrical_issues: {
        Row: {
          created_at: string
          description: string
          id: string
          roll_number: string
          room_number: string
          status: string | null
          student_id: string | null
          student_name: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          roll_number: string
          room_number: string
          status?: string | null
          student_id?: string | null
          student_name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          roll_number?: string
          room_number?: string
          status?: string | null
          student_id?: string | null
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "electrical_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      food_selections: {
        Row: {
          id: string
          student_id: string | null
          student_name: string
          roll_number: string
          food_item: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          student_name: string
          roll_number: string
          food_item: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          student_name?: string
          roll_number?: string
          food_item?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_selections_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      food_issues: {
        Row: {
          created_at: string
          description: string
          id: string
          roll_number: string
          status: string | null
          student_id: string | null
          student_name: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          roll_number: string
          status?: string | null
          student_id?: string | null
          student_name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          roll_number?: string
          status?: string | null
          student_id?: string | null
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_transactions: {
        Row: {
          academic_year: string | null
          amount: number
          id: string
          payment_date: string
          remarks: string | null
          student_id: string
        }
        Insert: {
          academic_year?: string | null
          amount: number
          id?: string
          payment_date?: string
          remarks?: string | null
          student_id: string
        }
        Update: {
          academic_year?: string | null
          amount?: number
          id?: string
          payment_date?: string
          remarks?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_passes: {
        Row: {
          branch: string
          created_at: string
          id: string
          in_date: string
          in_time: string | null
          out_date: string
          out_time: string | null
          parent_mobile: string | null
          purpose: string
          roll_number: string
          status: string | null
          student_email: string | null
          student_id: string | null
          student_mobile: string | null
          student_name: string
        }
        Insert: {
          branch: string
          created_at?: string
          id?: string
          in_date: string
          in_time?: string | null
          out_date: string
          out_time?: string | null
          parent_mobile?: string | null
          purpose: string
          roll_number: string
          status?: string | null
          student_email?: string | null
          student_id?: string | null
          student_mobile?: string | null
          student_name: string
        }
        Update: {
          branch?: string
          created_at?: string
          id?: string
          in_date?: string
          in_time?: string | null
          out_date?: string
          out_time?: string | null
          parent_mobile?: string | null
          purpose?: string
          roll_number?: string
          status?: string | null
          student_email?: string | null
          student_id?: string | null
          student_mobile?: string | null
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_passes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_applications: {
        Row: {
          ac_type: string
          branch: string
          created_at: string
          email: string | null
          father_name: string | null
          gender: string
          id: string
          months: number | null
          parent_phone_number: string | null
          phone_number: string
          photo_url: string | null
          price: number
          room_type: string
          signature_url: string | null
          status: string | null
          student_name: string
          terms_accepted: boolean | null
        }
        Insert: {
          ac_type: string
          branch: string
          created_at?: string
          email?: string | null
          father_name?: string | null
          gender: string
          id?: string
          months?: number | null
          parent_phone_number?: string | null
          phone_number: string
          photo_url?: string | null
          price: number
          room_type: string
          signature_url?: string | null
          status?: string | null
          student_name: string
          terms_accepted?: boolean | null
        }
        Update: {
          ac_type?: string
          branch?: string
          created_at?: string
          email?: string | null
          father_name?: string | null
          gender?: string
          id?: string
          months?: number | null
          parent_phone_number?: string | null
          phone_number?: string
          photo_url?: string | null
          price?: number
          room_type?: string
          signature_url?: string | null
          status?: string | null
          student_name?: string
          terms_accepted?: boolean | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_available: boolean | null
          name: string
          warden_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          warden_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          warden_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "wardens"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_alerts: {
        Row: {
          created_at: string
          id: string
          issue_type: string
          roll_number: string
          room_number: string | null
          status: string | null
          student_id: string | null
          student_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_type: string
          roll_number: string
          room_number?: string | null
          status?: string | null
          student_id?: string | null
          student_name: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_type?: string
          roll_number?: string
          room_number?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          student_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      parents: {
        Row: {
          created_at: string
          id: string
          mobile_number: string
          parent_name: string
          password: string
          student_roll_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          mobile_number: string
          parent_name: string
          password: string
          student_roll_number: string
        }
        Update: {
          created_at?: string
          id?: string
          mobile_number?: string
          parent_name?: string
          password?: string
          student_roll_number?: string
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          id: string
          student_id: string
          student_name: string
          roll_number: string
          branch: string
          year: string
          hostel_fee: number
          amount_paid: number
          payment_date: string
          payment_method: string
          transaction_id: string
          receipt_url: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          student_name: string
          roll_number: string
          branch: string
          year: string
          hostel_fee: number
          amount_paid: number
          payment_date: string
          payment_method: string
          transaction_id: string
          receipt_url: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string
          roll_number?: string
          branch?: string
          year?: string
          hostel_fee?: number
          amount_paid?: number
          payment_date?: string
          payment_method?: string
          transaction_id?: string
          receipt_url?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_identifier: string
          user_type: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_identifier: string
          user_type: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_identifier?: string
          user_type?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          ac_type: string
          closed_beds: number | null
          created_at: string
          floor_number: string
          id: string
          occupied_beds: number | null
          pending_beds: number | null
          room_number: string
          room_type: string
          total_beds: number
        }
        Insert: {
          ac_type: string
          closed_beds?: number | null
          created_at?: string
          floor_number: string
          id?: string
          occupied_beds?: number | null
          pending_beds?: number | null
          room_number: string
          room_type: string
          total_beds: number
        }
        Update: {
          ac_type?: string
          closed_beds?: number | null
          created_at?: string
          floor_number?: string
          id?: string
          occupied_beds?: number | null
          pending_beds?: number | null
          room_number?: string
          room_type?: string
          total_beds?: number
        }
        Relationships: []
      }
      students: {
        Row: {
          branch: string
          created_at: string
          email: string | null
          floor_number: string | null
          gender: string
          hostel_room_number: string | null
          id: string
          paid_fee: number | null
          password: string | null
          pending_fee: number | null
          photo_url: string | null
          remarks: string | null
          roll_number: string
          room_allotted: boolean | null
          student_name: string
          total_fee: number | null
          updated_at: string
          validity_from: string | null
          validity_to: string | null
          year: string
        }
        Insert: {
          branch: string
          created_at?: string
          email?: string | null
          floor_number?: string | null
          gender: string
          hostel_room_number?: string | null
          id?: string
          paid_fee?: number | null
          password?: string | null
          pending_fee?: number | null
          photo_url?: string | null
          remarks?: string | null
          roll_number: string
          room_allotted?: boolean | null
          student_name: string
          total_fee?: number | null
          updated_at?: string
          validity_from?: string | null
          validity_to?: string | null
          year: string
        }
        Update: {
          branch?: string
          created_at?: string
          email?: string | null
          floor_number?: string | null
          gender?: string
          hostel_room_number?: string | null
          id?: string
          paid_fee?: number | null
          password?: string | null
          pending_fee?: number | null
          photo_url?: string | null
          remarks?: string | null
          roll_number?: string
          room_allotted?: boolean | null
          student_name?: string
          total_fee?: number | null
          updated_at?: string
          validity_from?: string | null
          validity_to?: string | null
          year?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          branch: string
          created_at: string
          drive_link: string | null
          file_url: string | null
          id: string
          subject_name: string
          warden_id: string | null
          year: string
        }
        Insert: {
          branch: string
          created_at?: string
          drive_link?: string | null
          file_url?: string | null
          id?: string
          subject_name: string
          warden_id?: string | null
          year: string
        }
        Update: {
          branch?: string
          created_at?: string
          drive_link?: string | null
          file_url?: string | null
          id?: string
          subject_name?: string
          warden_id?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_warden_id_fkey"
            columns: ["warden_id"]
            isOneToOne: false
            referencedRelation: "wardens"
            referencedColumns: ["id"]
          },
        ]
      }
      warden_registration_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          used_at: string | null
          warden_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          used_at?: string | null
          warden_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
          warden_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warden_registration_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      wardens: {
        Row: {
          approval_status: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          mobile_number: string | null
          name: string
          password: string
          rejected_reason: string | null
          signature_url: string | null
          username: string
          warden_type: string
        }
        Insert: {
          approval_status?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          mobile_number?: string | null
          name: string
          password: string
          rejected_reason?: string | null
          signature_url?: string | null
          username: string
          warden_type: string
        }
        Update: {
          approval_status?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          mobile_number?: string | null
          name?: string
          password?: string
          rejected_reason?: string | null
          signature_url?: string | null
          username?: string
          warden_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
