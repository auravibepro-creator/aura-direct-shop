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
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          image_url: string | null
          is_hot: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_hot?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_hot?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image: string | null
          line_total: number
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          variant: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          line_total?: number
          name: string
          order_id: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          variant?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          line_total?: number
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string | null
          commission_amount: number
          created_at: string
          currency: string
          customer_name: string
          customer_phone: string
          delivery_agent_id: string | null
          id: string
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          notes: string
          order_code: string
          payment_method: string
          payment_reference: string | null
          sales_agent_id: string | null
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          city?: string | null
          commission_amount?: number
          created_at?: string
          currency?: string
          customer_name: string
          customer_phone: string
          delivery_agent_id?: string | null
          id?: string
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          notes?: string
          order_code?: string
          payment_method?: string
          payment_reference?: string | null
          sales_agent_id?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          commission_amount?: number
          created_at?: string
          currency?: string
          customer_name?: string
          customer_phone?: string
          delivery_agent_id?: string | null
          id?: string
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          notes?: string
          order_code?: string
          payment_method?: string
          payment_reference?: string | null
          sales_agent_id?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string
          id: string
          images: string[]
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          rating: number
          sold_count: number
          stock: number
          tab_id: string | null
          updated_at: string
          variants: string[]
          video_url: string | null
        }
        Insert: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          name: string
          price?: number
          rating?: number
          sold_count?: number
          stock?: number
          tab_id?: string | null
          updated_at?: string
          variants?: string[]
          video_url?: string | null
        }
        Update: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          rating?: number
          sold_count?: number
          stock?: number
          tab_id?: string | null
          updated_at?: string
          variants?: string[]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          designation: string
          email: string | null
          full_name: string
          id: string
          must_change_credentials: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          designation?: string
          email?: string | null
          full_name?: string
          id: string
          must_change_credentials?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          designation?: string
          email?: string | null
          full_name?: string
          id?: string
          must_change_credentials?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff_designations: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_settings: {
        Row: {
          base_salary: number
          commission_percent: number
          created_at: string
          is_active: boolean
          monthly_target: number
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_salary?: number
          commission_percent?: number
          created_at?: string
          is_active?: boolean
          monthly_target?: number
          notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_salary?: number
          commission_percent?: number
          created_at?: string
          is_active?: boolean
          monthly_target?: number
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tabs: {
        Row: {
          commission_percent: number
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          commission_percent?: number
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          password_hash: string
          tab_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash: string
          tab_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          tab_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          scope: string
          vendor_username: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose: string
          scope: string
          vendor_username?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          scope?: string
          vendor_username?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          id: string
          label: string
          last_used_at: string | null
          public_key: string
          scope: string
          secret: string
          transports: string[]
          vendor_username: string | null
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          id?: string
          label?: string
          last_used_at?: string | null
          public_key: string
          scope: string
          secret: string
          transports?: string[]
          vendor_username?: string | null
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          id?: string
          label?: string
          last_used_at?: string | null
          public_key?: string
          scope?: string
          secret?: string
          transports?: string[]
          vendor_username?: string | null
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
      app_role: "admin" | "agent" | "sales" | "delivery" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "agent", "sales", "delivery", "user"],
    },
  },
} as const
