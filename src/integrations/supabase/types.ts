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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      contacts: {
        Row: {
          ai_enabled: boolean
          anuncio_origem: string | null
          assigned_agent_id: string | null
          channel: string
          channel_tag: string
          created_at: string
          email: string | null
          id: string
          id_canal_externo: string | null
          last_message_at: string | null
          name: string
          phone: string | null
          pipeline_stage: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          anuncio_origem?: string | null
          assigned_agent_id?: string | null
          channel?: string
          channel_tag?: string
          created_at?: string
          email?: string | null
          id?: string
          id_canal_externo?: string | null
          last_message_at?: string | null
          name: string
          phone?: string | null
          pipeline_stage?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          anuncio_origem?: string | null
          assigned_agent_id?: string | null
          channel?: string
          channel_tag?: string
          created_at?: string
          email?: string | null
          id?: string
          id_canal_externo?: string | null
          last_message_at?: string | null
          name?: string
          phone?: string | null
          pipeline_stage?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          canal: string | null
          contact_id: string
          content: string
          created_at: string
          id: string
          id_mensagem_externa: string | null
          parent_id_mensagem_externa: string | null
          sender_name: string | null
          sender_type: string
          sender_user_id: string | null
        }
        Insert: {
          canal?: string | null
          contact_id: string
          content: string
          created_at?: string
          id?: string
          id_mensagem_externa?: string | null
          parent_id_mensagem_externa?: string | null
          sender_name?: string | null
          sender_type: string
          sender_user_id?: string | null
        }
        Update: {
          canal?: string | null
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          id_mensagem_externa?: string | null
          parent_id_mensagem_externa?: string | null
          sender_name?: string | null
          sender_type?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_tag: string
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          agent_tag?: string
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          agent_tag?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reengagement_rules: {
        Row: {
          add_tag_after: string | null
          created_at: string
          id: string
          inactivity_unit: string
          inactivity_value: number
          is_active: boolean
          message: string
          name: string
          reactivate_ai: boolean
          required_tags: string[]
          updated_at: string
        }
        Insert: {
          add_tag_after?: string | null
          created_at?: string
          id?: string
          inactivity_unit?: string
          inactivity_value?: number
          is_active?: boolean
          message: string
          name: string
          reactivate_ai?: boolean
          required_tags?: string[]
          updated_at?: string
        }
        Update: {
          add_tag_after?: string | null
          created_at?: string
          id?: string
          inactivity_unit?: string
          inactivity_value?: number
          is_active?: boolean
          message?: string
          name?: string
          reactivate_ai?: boolean
          required_tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          is_channel_tag: boolean
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_channel_tag?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_channel_tag?: boolean
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendente"
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
      app_role: ["admin", "atendente"],
    },
  },
} as const
