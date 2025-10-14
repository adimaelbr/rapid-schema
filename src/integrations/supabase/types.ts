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
      api_routes: {
        Row: {
          created_at: string
          database_id: string
          http_method: Database["public"]["Enums"]["http_method"]
          id: string
          is_private: boolean
          password_hash: string | null
          project_id: string
          route_name: string
          route_path: string
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          database_id: string
          http_method: Database["public"]["Enums"]["http_method"]
          id?: string
          is_private?: boolean
          password_hash?: string | null
          project_id: string
          route_name: string
          route_path: string
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          database_id?: string
          http_method?: Database["public"]["Enums"]["http_method"]
          id?: string
          is_private?: boolean
          password_hash?: string | null
          project_id?: string
          route_name?: string
          route_path?: string
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_routes_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "databases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_routes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_routes_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      databases: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "databases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      db_tables: {
        Row: {
          created_at: string
          database_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          database_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          database_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "db_tables_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "databases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      table_columns: {
        Row: {
          column_order: number
          created_at: string
          data_type: string
          default_value: string | null
          id: string
          is_auto_increment: boolean
          is_nullable: boolean
          is_primary_key: boolean
          is_unique: boolean
          name: string
          table_id: string
        }
        Insert: {
          column_order?: number
          created_at?: string
          data_type: string
          default_value?: string | null
          id?: string
          is_auto_increment?: boolean
          is_nullable?: boolean
          is_primary_key?: boolean
          is_unique?: boolean
          name: string
          table_id: string
        }
        Update: {
          column_order?: number
          created_at?: string
          data_type?: string
          default_value?: string | null
          id?: string
          is_auto_increment?: boolean
          is_nullable?: boolean
          is_primary_key?: boolean
          is_unique?: boolean
          name?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_columns_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_relationships: {
        Row: {
          created_at: string
          id: string
          relationship_strength: Database["public"]["Enums"]["relationship_strength"]
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          source_column_id: string
          source_table_id: string
          target_column_id: string
          target_table_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_strength?: Database["public"]["Enums"]["relationship_strength"]
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          source_column_id: string
          source_table_id: string
          target_column_id: string
          target_table_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship_strength?: Database["public"]["Enums"]["relationship_strength"]
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          source_column_id?: string
          source_table_id?: string
          target_column_id?: string
          target_table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_source_column"
            columns: ["source_column_id"]
            isOneToOne: false
            referencedRelation: "table_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_source_table"
            columns: ["source_table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_target_column"
            columns: ["target_column_id"]
            isOneToOne: false
            referencedRelation: "table_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_target_table"
            columns: ["target_table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_relationships_source_column_id_fkey"
            columns: ["source_column_id"]
            isOneToOne: false
            referencedRelation: "table_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_relationships_source_table_id_fkey"
            columns: ["source_table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_relationships_target_column_id_fkey"
            columns: ["target_column_id"]
            isOneToOne: false
            referencedRelation: "table_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_relationships_target_table_id_fkey"
            columns: ["target_table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
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
      http_method: "GET" | "POST" | "PUT" | "DELETE"
      relationship_strength: "strong" | "weak"
      relationship_type: "one_to_one" | "one_to_many" | "many_to_many"
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
      http_method: ["GET", "POST", "PUT", "DELETE"],
      relationship_strength: ["strong", "weak"],
      relationship_type: ["one_to_one", "one_to_many", "many_to_many"],
    },
  },
} as const
