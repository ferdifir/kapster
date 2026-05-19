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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_daily: {
        Row: {
          avg_wait_min: number | null
          barber_stats_json: Json
          barbershop_id: string
          created_at: string
          date: string
          id: string
          revenue: number
          total_customers: number
          total_done: number
          total_skip: number
        }
        Insert: {
          avg_wait_min?: number | null
          barber_stats_json?: Json
          barbershop_id: string
          created_at?: string
          date: string
          id?: string
          revenue?: number
          total_customers?: number
          total_done?: number
          total_skip?: number
        }
        Update: {
          avg_wait_min?: number | null
          barber_stats_json?: Json
          barbershop_id?: string
          created_at?: string
          date?: string
          id?: string
          revenue?: number
          total_customers?: number
          total_done?: number
          total_skip?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          barbershop_id: string
          created_at: string
          display_name: string
          id: string
          invite_token: string | null
          is_active: boolean
          photo_url: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          display_name: string
          id?: string
          invite_token?: string | null
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          display_name?: string
          id?: string
          invite_token?: string | null
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          settings_json: Json
          slug: string
          updated_at: string
          wa_number: string | null
          wuzapi_user_id: string | null
          wuzapi_token: string | null
          wa_connected: boolean
          wa_phone_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          settings_json?: Json
          slug: string
          updated_at?: string
          wa_number?: string | null
          wuzapi_user_id?: string | null
          wuzapi_token?: string | null
          wa_connected?: boolean
          wa_phone_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          settings_json?: Json
          slug?: string
          updated_at?: string
          wa_number?: string | null
          wuzapi_user_id?: string | null
          wuzapi_token?: string | null
          wa_connected?: boolean
          wa_phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbershops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          barber_id: string | null
          barbershop_id: string
          created_at: string
          customer_name: string
          id: string
          notes: string | null
          phone: string
          scheduled_at: string
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          barbershop_id: string
          created_at?: string
          customer_name: string
          id?: string
          notes?: string | null
          phone: string
          scheduled_at: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          barbershop_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          notes?: string | null
          phone?: string
          scheduled_at?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          barbershop_id: string
          order_id: string
          amount: number
          plan: Database["public"]["Enums"]["plan_type"]
          status: string
          payment_method: string | null
          pakasir_response: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          barbershop_id: string
          order_id: string
          amount: number
          plan: Database["public"]["Enums"]["plan_type"]
          status?: string
          payment_method?: string | null
          pakasir_response?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          barbershop_id?: string
          order_id?: string
          amount?: number
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: string
          payment_method?: string | null
          pakasir_response?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          barber_id: string | null
          called_at: string | null
          customer_name: string
          done_at: string | null
          id: string
          joined_at: string
          notes: string | null
          number: number
          phone: string | null
          queue_id: string
          service_id: string | null
          serving_at: string | null
          status: Database["public"]["Enums"]["queue_entry_status"]
        }
        Insert: {
          barber_id?: string | null
          called_at?: string | null
          customer_name: string
          done_at?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          number: number
          phone?: string | null
          queue_id: string
          service_id?: string | null
          serving_at?: string | null
          status?: Database["public"]["Enums"]["queue_entry_status"]
        }
        Update: {
          barber_id?: string | null
          called_at?: string | null
          customer_name?: string
          done_at?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          number?: number
          phone?: string | null
          queue_id?: string
          service_id?: string | null
          serving_at?: string | null
          status?: Database["public"]["Enums"]["queue_entry_status"]
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          barbershop_id: string
          created_at: string
          date: string
          id: string
          is_open: boolean
          total_served: number
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          date?: string
          id?: string
          is_open?: boolean
          total_served?: number
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          date?: string
          id?: string
          is_open?: boolean
          total_served?: number
        }
        Relationships: [
          {
            foreignKeyName: "queues_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          duration_min: number
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          duration_min?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          id: string
          max_barbers: number
          max_queue_per_day: number
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          pakasir_order_id: string | null
          period_end: string | null
          period_start: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          id?: string
          max_barbers?: number
          max_queue_per_day?: number
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          pakasir_order_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          id?: string
          max_barbers?: number
          max_queue_per_day?: number
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          pakasir_order_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_notifications: {
        Row: {
          id: string
          barbershop_id: string | null
          customer_phone: string
          customer_name: string | null
          event_type: string
          message_body: string
          status: string
          wuzapi_message_id: string | null
          error_message: string | null
          retry_count: number | null
          created_at: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          barbershop_id?: string | null
          customer_phone: string
          customer_name?: string | null
          event_type: string
          message_body: string
          status?: string
          wuzapi_message_id?: string | null
          error_message?: string | null
          retry_count?: number | null
          created_at?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          barbershop_id?: string | null
          customer_phone?: string
          customer_name?: string | null
          event_type?: string
          message_body?: string
          status?: string
          wuzapi_message_id?: string | null
          error_message?: string | null
          retry_count?: number | null
          created_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_notifications_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_barber_invite: { Args: { p_token: string }; Returns: string }
      get_barbershop_analytics: {
        Args: { p_barbershop_id: string; p_days?: number }
        Returns: {
          avg_wait_min: number
          date: string
          total_customers: number
          total_done: number
          total_skip: number
        }[]
      }
      increment_queue_served: {
        Args: { p_queue_id: string }
        Returns: undefined
      }
      next_queue_number: { Args: { p_queue_id: string }; Returns: number }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "done"
      plan_type: "starter" | "basic" | "pro" | "enterprise"
      queue_entry_status: "waiting" | "called" | "serving" | "done" | "skip"
      subscription_status:
        | "active"
        | "inactive"
        | "trial"
        | "cancelled"
        | "past_due"
      user_role: "owner" | "barber" | "customer" | "superadmin"
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
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "done"],
      plan_type: ["starter", "basic", "pro", "enterprise"],
      queue_entry_status: ["waiting", "called", "serving", "done", "skip"],
      subscription_status: [
        "active",
        "inactive",
        "trial",
        "cancelled",
        "past_due",
      ],
      user_role: ["owner", "barber", "customer", "superadmin"],
    },
  },
} as const
