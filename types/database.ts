export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      game_chats: {
        Row: {
          created_at: string | null;
          game_id: string;
          id: string;
          message: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          game_id: string;
          id?: string;
          message: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          game_id?: string;
          id?: string;
          message?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_chats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_chats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_logs: {
        Row: {
          event_type: string;
          game_id: string | null;
          id: string;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          event_type: string;
          game_id?: string | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          event_type?: string;
          game_id?: string | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_logs_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_participants: {
        Row: {
          game_id: string;
          user_id: string;
        };
        Insert: {
          game_id: string;
          user_id: string;
        };
        Update: {
          game_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_sessions: {
        Row: {
          created_at: string | null;
          duration_minutes: number;
          end_time: string | null;
          id: string;
          rest_interval: number;
          start_time: string | null;
          status: string;
          team_id: string | null;
          team_life: number;
        };
        Insert: {
          created_at?: string | null;
          duration_minutes?: number;
          end_time?: string | null;
          id?: string;
          rest_interval?: number;
          start_time?: string | null;
          status?: string;
          team_id?: string | null;
          team_life?: number;
        };
        Update: {
          created_at?: string | null;
          duration_minutes?: number;
          end_time?: string | null;
          id?: string;
          rest_interval?: number;
          start_time?: string | null;
          status?: string;
          team_id?: string | null;
          team_life?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_sessions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_color: string;
          avatar_face: number;
          created_at: string | null;
          email: string | null;
          id: string;
          personal_points: number;
          user_name: string;
        };
        Insert: {
          avatar_color?: string;
          avatar_face?: number;
          created_at?: string | null;
          email?: string | null;
          id: string;
          personal_points?: number;
          user_name: string;
        };
        Update: {
          avatar_color?: string;
          avatar_face?: number;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          personal_points?: number;
          user_name?: string;
        };
        Relationships: [];
      };
      shop_items: {
        Row: {
          buff_effect: string | null;
          created_at: string | null;
          id: string;
          item_name: string;
          item_type: string;
          placing_type: string;
          price: number;
        };
        Insert: {
          buff_effect?: string | null;
          created_at?: string | null;
          id?: string;
          item_name: string;
          item_type: string;
          placing_type?: string;
          price?: number;
        };
        Update: {
          buff_effect?: string | null;
          created_at?: string | null;
          id?: string;
          item_name?: string;
          item_type?: string;
          placing_type?: string;
          price?: number;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          joined_at: string | null;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string | null;
          role?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string | null;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_rooms: {
        Row: {
          id: string;
          item_id: string | null;
          placed_at: number | null;
          purchased_by: string | null;
          team_id: string | null;
        };
        Insert: {
          id?: string;
          item_id?: string | null;
          placed_at?: number | null;
          purchased_by?: string | null;
          team_id?: string | null;
        };
        Update: {
          id?: string;
          item_id?: string | null;
          placed_at?: number | null;
          purchased_by?: string | null;
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_rooms_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_rooms_purchased_by_fkey";
            columns: ["purchased_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_rooms_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string | null;
          id: string;
          max_members: number;
          name: string;
          owner_id: string | null;
          room_points: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          max_members?: number;
          name: string;
          owner_id?: string | null;
          room_points?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          max_members?: number;
          name?: string;
          owner_id?: string | null;
          room_points?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          created_at: string | null;
          game_id: string | null;
          id: string;
          target_id: string | null;
          voter_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          game_id?: string | null;
          id?: string;
          target_id?: string | null;
          voter_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          game_id?: string | null;
          id?: string;
          target_id?: string | null;
          voter_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "votes_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_team_ids: { Args: never; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
