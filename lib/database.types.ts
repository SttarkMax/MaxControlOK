export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number_of_series: number | null
          is_paid: boolean
          name: string
          notes: string
          series_id: string | null
          total_installments_in_series: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number_of_series?: number | null
          is_paid?: boolean
          name: string
          notes?: string
          series_id?: string | null
          total_installments_in_series?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number_of_series?: number | null
          is_paid?: boolean
          name?: string
          notes?: string
          series_id?: string | null
          total_installments_in_series?: number | null
          updated_at?: string
        }
      }
      app_users: {
        Row: {
          created_at: string
          full_name: string
          id: string
          password_hash: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          password_hash: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
        }
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          address: string
          cnpj: string
          created_at: string
          email: string
          id: string
          instagram: string
          logo_url_dark_bg: string | null
          logo_url_light_bg: string | null
          name: string
          phone: string
          updated_at: string
          website: string
        }
        Insert: {
          address?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string
          logo_url_dark_bg?: string | null
          logo_url_light_bg?: string | null
          name: string
          phone?: string
          updated_at?: string
          website?: string
        }
        Update: {
          address?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string
          logo_url_dark_bg?: string | null
          logo_url_light_bg?: string | null
          name?: string
          phone?: string
          updated_at?: string
          website?: string
        }
      }
      customer_down_payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          description: string
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          date: string
          description?: string
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          description?: string
          id?: string
        }
      }
      customers: {
        Row: {
          address: string
          city: string
          created_at: string
          document_number: string
          document_type: string
          email: string
          id: string
          name: string
          phone: string
          postal_code: string
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          document_number?: string
          document_type?: string
          email?: string
          id?: string
          name: string
          phone: string
          postal_code?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          document_number?: string
          document_type?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          postal_code?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string
          custom_card_price: number | null
          custom_cash_price: number | null
          description: string
          id: string
          name: string
          pricing_model: string
          supplier_cost: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          custom_card_price?: number | null
          custom_cash_price?: number | null
          description?: string
          id?: string
          name: string
          pricing_model: string
          supplier_cost?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          custom_card_price?: number | null
          custom_cash_price?: number | null
          description?: string
          id?: string
          name?: string
          pricing_model?: string
          supplier_cost?: number | null
          unit?: string
          updated_at?: string
        }
      }
      quote_items: {
        Row: {
          created_at: string
          height: number | null
          id: string
          item_count_for_area_calc: number | null
          pricing_model: string
          product_id: string | null
          product_name: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          item_count_for_area_calc?: number | null
          pricing_model: string
          product_id?: string | null
          product_name: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          item_count_for_area_calc?: number | null
          pricing_model?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
          width?: number | null
        }
      }
      quotes: {
        Row: {
          client_contact: string
          client_name: string
          company_info_snapshot: Json
          created_at: string
          customer_id: string | null
          delivery_deadline: string | null
          discount_amount_calculated: number
          discount_type: string
          discount_value: number
          down_payment_applied: number
          id: string
          notes: string
          payment_date: string | null
          quote_number: string
          salesperson_full_name: string
          salesperson_username: string
          selected_payment_method: string
          status: string
          subtotal: number
          subtotal_after_discount: number
          total_card: number
          total_cash: number
          updated_at: string
        }
        Insert: {
          client_contact?: string
          client_name: string
          company_info_snapshot: Json
          created_at?: string
          customer_id?: string | null
          delivery_deadline?: string | null
          discount_amount_calculated?: number
          discount_type?: string
          discount_value?: number
          down_payment_applied?: number
          id?: string
          notes?: string
          payment_date?: string | null
          quote_number: string
          salesperson_full_name?: string
          salesperson_username: string
          selected_payment_method?: string
          status?: string
          subtotal?: number
          subtotal_after_discount?: number
          total_card?: number
          total_cash?: number
          updated_at?: string
        }
        Update: {
          client_contact?: string
          client_name?: string
          company_info_snapshot?: Json
          created_at?: string
          customer_id?: string | null
          delivery_deadline?: string | null
          discount_amount_calculated?: number
          discount_type?: string
          discount_value?: number
          down_payment_applied?: number
          id?: string
          notes?: string
          payment_date?: string | null
          quote_number?: string
          salesperson_full_name?: string
          salesperson_username?: string
          selected_payment_method?: string
          status?: string
          subtotal?: number
          subtotal_after_discount?: number
          total_card?: number
          total_cash?: number
          updated_at?: string
        }
      }
      supplier_credits: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          supplier_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description?: string
          id?: string
          supplier_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          supplier_id?: string
        }
      }
      supplier_debts: {
        Row: {
          created_at: string
          date_added: string
          description: string
          id: string
          supplier_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          date_added: string
          description?: string
          id?: string
          supplier_id: string
          total_amount: number
        }
        Update: {
          created_at?: string
          date_added?: string
          description?: string
          id?: string
          supplier_id?: string
          total_amount?: number
        }
      }
      suppliers: {
        Row: {
          address: string
          cnpj: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
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