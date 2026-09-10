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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activations: {
        Row: {
          id: string
          is_active: boolean | null
          roadmap_id: string | null
          started_at: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          roadmap_id?: string | null
          started_at?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          roadmap_id?: string | null
          started_at?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activations_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_events: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          team_id: string | null
          unique_trigger_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          team_id?: string | null
          unique_trigger_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          team_id?: string | null
          unique_trigger_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badge_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          best_response_id: string | null
          created_at: string | null
          handle: string | null
          id: string
          is_deleted: boolean | null
          team_id: string | null
          text: string
          thread_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          best_response_id?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          is_deleted?: boolean | null
          team_id?: string | null
          text: string
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          best_response_id?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          is_deleted?: boolean | null
          team_id?: string | null
          text?: string
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_best_response_id_fkey"
            columns: ["best_response_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          level: Database["public"]["Enums"]["notification_level"] | null
          link: string | null
          message: string | null
          metadata: Json | null
          read: boolean | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["notification_level"] | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["notification_level"] | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      point_events: {
        Row: {
          created_at: string | null
          id: string
          points: number
          reason: string | null
          team_id: string | null
          unique_trigger_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points: number
          reason?: string | null
          team_id?: string | null
          unique_trigger_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          reason?: string | null
          team_id?: string | null
          unique_trigger_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_course: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          has_active_team: boolean | null
          id: string
          is_premium: boolean | null
          location: string | null
          name: string | null
          onboarding_data: Json | null
          preferences: Json | null
          profile_complete: boolean | null
          schedule: Json | null
          updated_at: string | null
        }
        Insert: {
          active_course?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          has_active_team?: boolean | null
          id: string
          is_premium?: boolean | null
          location?: string | null
          name?: string | null
          onboarding_data?: Json | null
          preferences?: Json | null
          profile_complete?: boolean | null
          schedule?: Json | null
          updated_at?: string | null
        }
        Update: {
          active_course?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          has_active_team?: boolean | null
          id?: string
          is_premium?: boolean | null
          location?: string | null
          name?: string | null
          onboarding_data?: Json | null
          preferences?: Json | null
          profile_complete?: boolean | null
          schedule?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          activation_id: string | null
          completed_at: string | null
          id: string
          subunit_id: string | null
          user_id: string | null
        }
        Insert: {
          activation_id?: string | null
          completed_at?: string | null
          id?: string
          subunit_id?: string | null
          user_id?: string | null
        }
        Update: {
          activation_id?: string | null
          completed_at?: string | null
          id?: string
          subunit_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_tracking_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_tracking_subunit_id_fkey"
            columns: ["subunit_id"]
            isOneToOne: false
            referencedRelation: "subunits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string | null
          id: string
          make_admin: boolean | null
          message: string | null
          new_team_name: string | null
          recipient_id: string | null
          roadmap_id: string | null
          sender_id: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          team_id: string | null
          type: Database["public"]["Enums"]["request_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          make_admin?: boolean | null
          message?: string | null
          new_team_name?: string | null
          recipient_id?: string | null
          roadmap_id?: string | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          team_id?: string | null
          type: Database["public"]["Enums"]["request_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          make_admin?: boolean | null
          message?: string | null
          new_team_name?: string | null
          recipient_id?: string | null
          roadmap_id?: string | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          team_id?: string | null
          type?: Database["public"]["Enums"]["request_type"]
        }
        Relationships: [
          {
            foreignKeyName: "requests_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_paid: boolean | null
          is_public: boolean | null
          metadata: Json | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["roadmap_owner_type"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          owner_id: string
          owner_type?: Database["public"]["Enums"]["roadmap_owner_type"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["roadmap_owner_type"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subunits: {
        Row: {
          content_url: string | null
          created_at: string | null
          duration: string | null
          id: string
          sequence_order: number
          title: string
          type: string
          unit_id: string
        }
        Insert: {
          content_url?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          sequence_order: number
          title: string
          type: string
          unit_id: string
        }
        Update: {
          content_url?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          sequence_order?: number
          title?: string
          type?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subunits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_goals: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          start_date: string | null
          team_id: string | null
          type: string | null
          weeks: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          start_date?: string | null
          team_id?: string | null
          type?: string | null
          weeks?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          start_date?: string | null
          team_id?: string | null
          type?: string | null
          weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          activity_status: string | null
          avatar_url: string | null
          bio: string | null
          course_name: string | null
          created_at: string | null
          current_roadmap_id: string | null
          id: string
          last_active: string | null
          name: string
          resource_links: Json | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          activity_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          course_name?: string | null
          created_at?: string | null
          current_roadmap_id?: string | null
          id?: string
          last_active?: string | null
          name: string
          resource_links?: Json | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          activity_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          course_name?: string | null
          created_at?: string | null
          current_roadmap_id?: string | null
          id?: string
          last_active?: string | null
          name?: string
          resource_links?: Json | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          roadmap_id: string
          sequence_order: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          roadmap_id: string
          sequence_order: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          roadmap_id?: string
          sequence_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          access_type: string | null
          expires_at: string | null
          id: string
          roadmap_id: string | null
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          expires_at?: string | null
          id?: string
          roadmap_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          expires_at?: string | null
          id?: string
          roadmap_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_level: "info" | "success" | "warning" | "error"
      notification_type:
        | "TEAM_INVITE"
        | "NEW_MESSAGE"
        | "GOAL_COMPLETED"
        | "BADGE_EARNED"
        | "POINTS_EARNED"
        | "HANDLER_TRIGGERED"
        | "BEST_RESPONSE"
      request_status: "pending" | "accepted" | "rejected" | "expired"
      request_type: "CREATE_TEAM" | "INVITE_TO_TEAM" | "REQUEST_TO_JOIN"
      roadmap_owner_type: "USER" | "TEAM" | "THIRD_PARTY"
      user_role: "admin" | "member"
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
      notification_level: ["info", "success", "warning", "error"],
      notification_type: [
        "TEAM_INVITE",
        "NEW_MESSAGE",
        "GOAL_COMPLETED",
        "BADGE_EARNED",
        "POINTS_EARNED",
        "HANDLER_TRIGGERED",
        "BEST_RESPONSE",
      ],
      request_status: ["pending", "accepted", "rejected", "expired"],
      request_type: ["CREATE_TEAM", "INVITE_TO_TEAM", "REQUEST_TO_JOIN"],
      roadmap_owner_type: ["USER", "TEAM", "THIRD_PARTY"],
      user_role: ["admin", "member"],
    },
  },
} as const
