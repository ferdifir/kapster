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
          about: string | null
          address: string | null
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
          wa_connected: boolean | null
          wa_number: string | null
          wa_pairing_code: string | null
          wa_phone_number: string | null
          wuzapi_token: string | null
          wuzapi_user_id: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
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
          wa_connected?: boolean | null
          wa_number?: string | null
          wa_pairing_code?: string | null
          wa_phone_number?: string | null
          wuzapi_token?: string | null
          wuzapi_user_id?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
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
          wa_connected?: boolean | null
          wa_number?: string | null
          wa_pairing_code?: string | null
          wa_phone_number?: string | null
          wuzapi_token?: string | null
          wuzapi_user_id?: string | null
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
      blog_posts: {
        Row: {
          content_html: string
          content_plan_id: string | null
          created_at: string
          excerpt: string
          id: string
          keywords: string[] | null
          meta_description: string
          og_image_url: string | null
          published_at: string | null
          slug: string
          status: string
          telegram_msg_id: number | null
          title: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          content_html: string
          content_plan_id?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          keywords?: string[] | null
          meta_description?: string
          og_image_url?: string | null
          published_at?: string | null
          slug: string
          status?: string
          telegram_msg_id?: number | null
          title: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          content_html?: string
          content_plan_id?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          keywords?: string[] | null
          meta_description?: string
          og_image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          telegram_msg_id?: number | null
          title?: string
          topics?: string[] | null
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
      content_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_date: string
          metric_name: string
          metric_value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_name: string
          metric_value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_name?: string
          metric_value?: number
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          brief: string
          created_at: string | null
          id: string
          status: string | null
          used_at: string | null
        }
        Insert: {
          brief: string
          created_at?: string | null
          id?: string
          status?: string | null
          used_at?: string | null
        }
        Update: {
          brief?: string
          created_at?: string | null
          id?: string
          status?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      demo_sessions: {
        Row: {
          auth_user_id: string | null
          claimed_at: string | null
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          phone: string
          status: string | null
          temp_password: string
        }
        Insert: {
          auth_user_id?: string | null
          claimed_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          phone: string
          status?: string | null
          temp_password: string
        }
        Update: {
          auth_user_id?: string | null
          claimed_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          phone?: string
          status?: string | null
          temp_password?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          barbershop_id: string
          category: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          name: string
          profile_id: string | null
          screenshot_url: string | null
        }
        Insert: {
          barbershop_id: string
          category: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          profile_id?: string | null
          screenshot_url?: string | null
        }
        Update: {
          barbershop_id?: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          profile_id?: string | null
          screenshot_url?: string | null
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
      marketing_lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          lead_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "marketing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          branches: string | null
          city: string | null
          contact: string
          created_at: string
          id: string
          instagram: string | null
          last_contacted_at: string | null
          name: string
          notes: string | null
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          branches?: string | null
          city?: string | null
          contact: string
          created_at?: string
          id?: string
          instagram?: string | null
          last_contacted_at?: string | null
          name: string
          notes?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          branches?: string | null
          city?: string | null
          contact?: string
          created_at?: string
          id?: string
          instagram?: string | null
          last_contacted_at?: string | null
          name?: string
          notes?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          barbershop_id: string
          created_at: string
          id: string
          paid_at: string | null
          pakasir_order_id: string
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
        }
        Insert: {
          amount?: number
          barbershop_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pakasir_order_id: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          barbershop_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pakasir_order_id?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
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
          },
        ]
      }
      payout_requests: {
        Row: {
          amount: number
          bank_info: Json | null
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          referral_code_id: string
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount: number
          bank_info?: Json | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          referral_code_id: string
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount?: number
          bank_info?: Json | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          referral_code_id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otp_codes: {
        Row: {
          attempts: number | null
          code_hash: string
          created_at: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          phone: string
          profile_id: string | null
          purpose: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          code_hash: string
          created_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          phone: string
          profile_id?: string | null
          purpose: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          code_hash?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          phone?: string
          profile_id?: string | null
          purpose?: string
          verified_at?: string | null
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
      referral_codes: {
        Row: {
          access_token: string
          balance: number
          code: string
          created_at: string
          id: string
          name: string | null
          profile_id: string | null
          total_earned: number
          total_withdrawn: number
          wa_number: string | null
        }
        Insert: {
          access_token?: string
          balance?: number
          code: string
          created_at?: string
          id?: string
          name?: string | null
          profile_id?: string | null
          total_earned?: number
          total_withdrawn?: number
          wa_number?: string | null
        }
        Update: {
          access_token?: string
          balance?: number
          code?: string
          created_at?: string
          id?: string
          name?: string | null
          profile_id?: string | null
          total_earned?: number
          total_withdrawn?: number
          wa_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          barbershop_id: string
          commission: number
          created_at: string
          earned_at: string | null
          id: string
          paid_at: string | null
          referral_code_id: string
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          barbershop_id: string
          commission?: number
          created_at?: string
          earned_at?: string | null
          id?: string
          paid_at?: string | null
          referral_code_id: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          barbershop_id?: string
          commission?: number
          created_at?: string
          earned_at?: string | null
          id?: string
          paid_at?: string | null
          referral_code_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
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
      social_posts: {
        Row: {
          caption: string
          content_plan_id: string | null
          content_type: string
          created_at: string
          id: string
          platform: string
          post_url: string | null
          scheduled_date: string
          status: string
          telegram_msg_id: number | null
          topics: string[] | null
          trend_analysis: Json | null
          updated_at: string
        }
        Insert: {
          caption: string
          content_plan_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          platform: string
          post_url?: string | null
          scheduled_date?: string
          status?: string
          telegram_msg_id?: number | null
          topics?: string[] | null
          trend_analysis?: Json | null
          updated_at?: string
        }
        Update: {
          caption?: string
          content_plan_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          platform?: string
          post_url?: string | null
          scheduled_date?: string
          status?: string
          telegram_msg_id?: number | null
          topics?: string[] | null
          trend_analysis?: Json | null
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
      subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_notifications: {
        Row: {
          barbershop_id: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          error_message: string | null
          event_type: string
          id: string
          message_body: string
          retry_count: number | null
          sent_at: string | null
          status: string
          wuzapi_message_id: string | null
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          error_message?: string | null
          event_type: string
          id?: string
          message_body: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          wuzapi_message_id?: string | null
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          error_message?: string | null
          event_type?: string
          id?: string
          message_body?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          wuzapi_message_id?: string | null
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
      exec_sql: { Args: { query_text: string }; Returns: Json[] }
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
      increment_referral_balance: {
        Args: { p_amount: number; p_referral_code_id: string }
        Returns: undefined
      }
      lookup_referral_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          id: string
          name: string
          profile_id: string
        }[]
      }
      next_queue_number: { Args: { p_queue_id: string }; Returns: number }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "done"
      payment_status: "pending" | "completed" | "failed" | "expired"
      payout_status: "pending" | "paid" | "cancelled"
      queue_entry_status: "waiting" | "called" | "serving" | "done" | "skip"
      referral_status: "pending" | "earned" | "paid"
      subscription_status: "active" | "cancelled" | "expired"
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
      payment_status: ["pending", "completed", "failed", "expired"],
      payout_status: ["pending", "paid", "cancelled"],
      queue_entry_status: ["waiting", "called", "serving", "done", "skip"],
      referral_status: ["pending", "earned", "paid"],
      subscription_status: ["active", "cancelled", "expired"],
      user_role: ["owner", "barber", "customer", "superadmin"],
    },
  },
} as const
