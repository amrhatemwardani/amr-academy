// This is a manually maintained baseline of the database types.
// Regenerate after every schema change with:
//   npm run db:generate-types
// (requires supabase CLI and a running local/remote Supabase instance)

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
      profiles: {
        Row: {
          id: string
          role: 'teacher' | 'student'
          full_name: string
          locale: string
          avatar_url: string | null
          must_change_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'teacher' | 'student'
          full_name: string
          locale?: string
          avatar_url?: string | null
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      students: {
        Row: {
          id: string
          student_code: string
          phone: string | null
          parent_phone: string | null
          email: string | null
          avatar_path: string | null
          enrolled_on: string
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          archived_at: string | null
        }
        Insert: {
          id: string
          student_code?: string
          phone?: string | null
          parent_phone?: string | null
          email?: string | null
          avatar_path?: string | null
          enrolled_on?: string
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          archived_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      student_notes: {
        Row: {
          id: string
          student_id: string
          note: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          note: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['student_notes']['Insert']>
      }
      classes: {
        Row: {
          id: string
          name: string
          subject: string | null
          level: string | null
          description: string | null
          schedule: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject?: string | null
          level?: string | null
          description?: string | null
          schedule?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      enrollments: {
        Row: {
          id: string
          class_id: string
          student_id: string
          enrolled_on: string
          left_on: string | null
          fee_override: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          enrolled_on?: string
          left_on?: string | null
          fee_override?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['enrollments']['Insert']>
      }
      attendance: {
        Row: {
          id: string
          class_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          note: string | null
          marked_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          note?: string | null
          marked_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>
      }
      fee_structures: {
        Row: {
          id: string
          class_id: string
          name: string
          kind: 'monthly' | 'course' | 'other'
          amount: number
          active_from: string
          active_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          name: string
          kind?: 'monthly' | 'course' | 'other'
          amount: number
          active_from?: string
          active_to?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['fee_structures']['Insert']>
      }
      charges: {
        Row: {
          id: string
          student_id: string
          class_id: string | null
          kind: 'monthly' | 'course' | 'other'
          period: string | null
          description: string | null
          amount: number
          due_date: string
          voided_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          class_id?: string | null
          kind: 'monthly' | 'course' | 'other'
          period?: string | null
          description?: string | null
          amount: number
          due_date: string
          voided_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['charges']['Insert']>
      }
      payments: {
        Row: {
          id: string
          receipt_no: string
          student_id: string
          amount: number
          method: 'cash' | 'bank_transfer' | 'mobile_wallet' | 'card' | 'other'
          paid_at: string
          reference: string | null
          notes: string | null
          recorded_by: string | null
          voided_at: string | null
          void_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          receipt_no?: string
          student_id: string
          amount: number
          method: 'cash' | 'bank_transfer' | 'mobile_wallet' | 'card' | 'other'
          paid_at?: string
          reference?: string | null
          notes?: string | null
          recorded_by?: string | null
          voided_at?: string | null
          void_reason?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      exams: {
        Row: {
          id: string
          class_id: string
          title: string
          description: string | null
          instructions: string | null
          duration_minutes: number
          start_at: string
          end_at: string
          pass_marks: number
          shuffle_questions: boolean
          shuffle_options: boolean
          status: 'draft' | 'published' | 'closed'
          results_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          description?: string | null
          instructions?: string | null
          duration_minutes: number
          start_at: string
          end_at: string
          pass_marks?: number
          shuffle_questions?: boolean
          shuffle_options?: boolean
          status?: 'draft' | 'published' | 'closed'
          results_published?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
      }
      exam_attempts: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          started_at: string
          expires_at: string
          submitted_at: string | null
          status: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded'
          shuffle_seed: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          started_at?: string
          expires_at: string
          submitted_at?: string | null
          status?: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded'
          shuffle_seed?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['exam_attempts']['Insert']>
      }
      exam_results: {
        Row: {
          attempt_id: string
          exam_id: string
          student_id: string
          score: number
          total: number
          percentage: number
          passed: boolean
          fully_graded: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          attempt_id: string
          exam_id: string
          student_id: string
          score: number
          total: number
          percentage: number
          passed: boolean
          fully_graded?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['exam_results']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          read_at: string | null
          channel: 'in_app' | 'whatsapp' | 'email' | 'sms'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          read_at?: string | null
          channel?: 'in_app' | 'whatsapp' | 'email' | 'sms'
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
    }
    Views: {
      charge_status: {
        Row: {
          id: string
          student_id: string
          class_id: string | null
          kind: 'monthly' | 'course' | 'other'
          period: string | null
          description: string | null
          amount: number
          due_date: string
          voided_at: string | null
          created_at: string
          paid: number
          remaining: number
        }
      }
      student_balances: {
        Row: {
          student_id: string
          total_charged: number
          total_paid: number
          balance: number
          overdue: number
        }
      }
    }
    Functions: {
      is_teacher: {
        Args: Record<string, never>
        Returns: boolean
      }
      save_attendance: {
        Args: { p_class_id: string; p_date: string; p_rows: Json }
        Returns: void
      }
      record_payment: {
        Args: {
          p_student_id: string
          p_amount: number
          p_method: string
          p_paid_at?: string
          p_reference?: string
          p_notes?: string
          p_allocations?: Json
          p_allow_credit?: boolean
        }
        Returns: Json
      }
      void_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: void
      }
      generate_monthly_charges: {
        Args: { p_period: string }
        Returns: number
      }
      start_attempt: {
        Args: { p_exam_id: string }
        Returns: Json
      }
      get_attempt_questions: {
        Args: { p_attempt_id: string }
        Returns: Json
      }
      save_answers: {
        Args: { p_attempt_id: string; p_answers: Json }
        Returns: Json
      }
      submit_attempt: {
        Args: { p_attempt_id: string }
        Returns: Json
      }
      sweep_expired_attempts: {
        Args: Record<string, never>
        Returns: number
      }
      grade_answer: {
        Args: { p_attempt_id: string; p_question_id: string; p_marks: number; p_feedback?: string }
        Returns: void
      }
      publish_results: {
        Args: { p_exam_id: string }
        Returns: number
      }
      get_exam_review: {
        Args: { p_attempt_id: string }
        Returns: Json
      }
      dashboard_summary: {
        Args: { p_from?: string; p_to?: string; p_class_id?: string }
        Returns: Json
      }
      chart_student_growth: {
        Args: { p_months?: number }
        Returns: Json
      }
      chart_monthly_revenue: {
        Args: { p_months?: number }
        Returns: Json
      }
      chart_weekly_attendance: {
        Args: { p_weeks?: number; p_class_id?: string }
        Returns: Json
      }
      chart_exam_performance: {
        Args: { p_class_id?: string }
        Returns: Json
      }
      students_needing_attention: {
        Args: Record<string, never>
        Returns: Json
      }
    }
    Enums: {
      user_role: 'teacher' | 'student'
      student_status: 'active' | 'inactive' | 'archived'
      attendance_status: 'present' | 'absent' | 'late' | 'excused'
      pay_method: 'cash' | 'bank_transfer' | 'mobile_wallet' | 'card' | 'other'
      charge_kind: 'monthly' | 'course' | 'other'
      question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay'
      exam_status: 'draft' | 'published' | 'closed'
      attempt_status: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded'
      notification_channel: 'in_app' | 'whatsapp' | 'email' | 'sms'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
