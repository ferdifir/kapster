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
          about: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
           owner_id: string
           phone: string | null
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
          about?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
           name: string
           owner_id: string
           phone?: string | null
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
          about?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
           owner_id?: string
           phone?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          telegram_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      phone_otp_codes: {
        Row: {
          id: string
          phone: string
          code_hash: string
          purpose: "registration_verification" | "password_reset"
          profile_id: string | null
          attempts: number
          max_attempts: number
          expires_at: string
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          code_hash: string
          purpose: "registration_verification" | "password_reset"
          profile_id?: string | null
          attempts?: number
          max_attempts?: number
          expires_at?: string
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          code_hash?: string
          purpose?: "registration_verification" | "password_reset"
          profile_id?: string | null
          attempts?: number
          max_attempts?: number
          expires_at?: string
          verified_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_otp_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          id: string
          barbershop_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          current_period_start?: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          barbershop_id: string
          subscription_id: string | null
          pakasir_order_id: string
          amount: number
          status: Database["public"]["Enums"]["payment_status"]
          payment_method: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          subscription_id?: string | null
          pakasir_order_id: string
          amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          payment_method?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          subscription_id?: string | null
          pakasir_order_id?: string
          amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          payment_method?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          barbershop_id: string
          profile_id: string | null
          name: string
          category: string
          message: string
          screenshot_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          profile_id?: string | null
          name: string
          category: string
          message: string
          screenshot_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          profile_id?: string | null
          name?: string
          category?: string
          message?: string
          screenshot_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content_html: string
          excerpt: string
          meta_description: string
          keywords: string[]
          content_plan_id: string | null
          og_image_url: string | null
          topics: string[]
          status: "draft" | "published" | "cancelled"
          telegram_msg_id: number | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content_html: string
          excerpt?: string
          meta_description?: string
          keywords?: string[]
          content_plan_id?: string | null
          og_image_url?: string | null
          topics?: string[]
          status?: "draft" | "published" | "cancelled"
          telegram_msg_id?: number | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content_html?: string
          excerpt?: string
          meta_description?: string
          keywords?: string[]
          content_plan_id?: string | null
          og_image_url?: string | null
          topics?: string[]
          status?: "draft" | "published" | "cancelled"
          telegram_msg_id?: number | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_content_plan_id_fkey"
            columns: ["content_plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          id: string
          platform: "instagram" | "tiktok" | "both"
          caption: string
          topics: string[]
          content_type: "educational" | "solution" | "social_proof"
          trend_analysis: Json
          status: "draft" | "sent_to_telegram" | "posted_ig" | "posted_tt"
          telegram_msg_id: number | null
          post_url: string | null
          scheduled_date: string
          content_plan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: "instagram" | "tiktok" | "both"
          caption: string
          topics?: string[]
          content_type: "educational" | "solution" | "social_proof"
          trend_analysis?: Json
          status?: "draft" | "sent_to_telegram" | "posted_ig" | "posted_tt"
          telegram_msg_id?: number | null
          post_url?: string | null
          scheduled_date?: string
          content_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform?: "instagram" | "tiktok" | "both"
          caption?: string
          topics?: string[]
          content_type?: "educational" | "solution" | "social_proof"
          trend_analysis?: Json
          status?: "draft" | "sent_to_telegram" | "posted_ig" | "posted_tt"
          telegram_msg_id?: number | null
          post_url?: string | null
          scheduled_date?: string
          content_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_content_plan_id_fkey"
            columns: ["content_plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plans: {
        Row: {
          id: string
          brief: string
          status: string
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          brief: string
          status?: string
          created_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          brief?: string
          status?: string
          created_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      content_metrics: {
        Row: {
          id: string
          metric_date: string
          metric_name: string
          metric_value: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          metric_date?: string
          metric_name: string
          metric_value: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      demo_sessions: {
        Row: {
          id: string
          phone: string
          temp_password: string
          expires_at: string
          status: string
          created_at: string
          claimed_at: string
        }
        Insert: {
          id?: string
          phone: string
          temp_password: string
          expires_at: string
          status?: string
          created_at?: string
          claimed_at?: string
        }
        Update: {
          id?: string
          phone?: string
          temp_password?: string
          expires_at?: string
          status?: string
          created_at?: string
          claimed_at?: string
        }
        Relationships: []
      }
      demo_waitlist: {
        Row: {
          id: string
          phone: string
          notified_at: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          notified_at?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          notified_at?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          id: string
          name: string
          contact: string
          branches: string | null
          city: string | null
          instagram: string | null
          priority: string
          status: string
          notes: string | null
          last_contacted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact: string
          branches?: string | null
          city?: string | null
          instagram?: string | null
          priority?: string
          status?: string
          notes?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact?: string
          branches?: string | null
          city?: string | null
          instagram?: string | null
          priority?: string
          status?: string
          notes?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_lead_activities: {
        Row: {
          id: string
          lead_id: string
          activity_type: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          activity_type: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          activity_type?: string
          description?: string
          created_at?: string
        }
        Relationships: []
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
      exec_sql: { Args: { query_text: string }; Returns: Record<string, unknown>[] }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "done"
      queue_entry_status: "waiting" | "called" | "serving" | "done" | "skip"
      user_role: "owner" | "barber" | "customer" | "superadmin"
      subscription_status: "active" | "cancelled" | "expired"
      payment_status: "pending" | "completed" | "failed" | "expired"
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
      queue_entry_status: ["waiting", "called", "serving", "done", "skip"],
      user_role: ["owner", "barber", "customer", "superadmin"],
      subscription_status: ["active", "cancelled", "expired"],
      payment_status: ["pending", "completed", "failed", "expired"],
    },
  },
} as const
