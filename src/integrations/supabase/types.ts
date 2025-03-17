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
      clients: {
        Row: {
          bus: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          number: string | null
          phone: string | null
          postcode: string | null
          street: string | null
          type: string
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          bus?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          number?: string | null
          phone?: string | null
          postcode?: string | null
          street?: string | null
          type: string
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          bus?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          number?: string | null
          phone?: string | null
          postcode?: string | null
          street?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          account_number: string | null
          bank_name: string | null
          bus: string | null
          city: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_website: string | null
          country: string | null
          created_at: string | null
          default_currency: string | null
          iban: string | null
          id: string
          invoice_number_type: string | null
          invoice_prefix: string | null
          logo_url: string | null
          number: string | null
          postal_code: string | null
          street: string | null
          swift: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
          yuki_email: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          bus?: string | null
          city?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: string | null
          iban?: string | null
          id?: string
          invoice_number_type?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          number?: string | null
          postal_code?: string | null
          street?: string | null
          swift?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
          yuki_email?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          bus?: string | null
          city?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: string | null
          iban?: string | null
          id?: string
          invoice_number_type?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          number?: string | null
          postal_code?: string | null
          street?: string | null
          swift?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
          yuki_email?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          invoice_id: string
          item_id: string
          quantity: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          invoice_id: string
          item_id: string
          quantity?: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          invoice_id?: string
          item_id?: string
          quantity?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          id: string
          price: number
          title: string
          user_id: string | null
          vat: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          title: string
          user_id?: string | null
          vat: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          title?: string
          user_id?: string | null
          vat?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_vat_fkey"
            columns: ["vat"]
            isOneToOne: false
            referencedRelation: "vats"
            referencedColumns: ["title"]
          },
        ]
      }
      vats: {
        Row: {
          amount: number | null
          title: string
        }
        Insert: {
          amount?: number | null
          title: string
        }
        Update: {
          amount?: number | null
          title?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
