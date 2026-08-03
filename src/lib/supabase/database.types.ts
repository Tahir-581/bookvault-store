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
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          display_name: string | null
          email: string
          id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      books_catalog: {
        Row: {
          author: string
          base_price: number
          cover_url: string
          created_at: string
          description: string
          gallery_urls: Json
          genre: string
          id: string
          is_custom_allowed: boolean
          is_featured: boolean
          original_language: string
          page_count: number
          slug: string
          status: string
          target_language: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          base_price: number
          cover_url?: string
          created_at?: string
          description?: string
          gallery_urls?: Json
          genre: string
          id?: string
          is_custom_allowed?: boolean
          is_featured?: boolean
          original_language: string
          page_count?: number
          slug: string
          status?: string
          target_language: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          base_price?: number
          cover_url?: string
          created_at?: string
          description?: string
          gallery_urls?: Json
          genre?: string
          id?: string
          is_custom_allowed?: boolean
          is_featured?: boolean
          original_language?: string
          page_count?: number
          slug?: string
          status?: string
          target_language?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      books_contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      books_custom_requests: {
        Row: {
          author: string
          book_title: string
          created_at: string
          format: string
          id: string
          isbn: string | null
          notes: string | null
          source_language: string
          status: string
          target_language: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author?: string
          book_title: string
          created_at?: string
          format?: string
          id?: string
          isbn?: string | null
          notes?: string | null
          source_language: string
          status?: string
          target_language: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author?: string
          book_title?: string
          created_at?: string
          format?: string
          id?: string
          isbn?: string | null
          notes?: string | null
          source_language?: string
          status?: string
          target_language?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      books_order_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          source?: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "books_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      books_order_items: {
        Row: {
          author_snapshot: string
          book_id: string | null
          created_at: string
          custom_book_details: Json | null
          format: string
          id: string
          is_custom_request: boolean
          line_total: number
          order_id: string
          quantity: number
          target_language: string
          title_snapshot: string
          unit_price: number
        }
        Insert: {
          author_snapshot?: string
          book_id?: string | null
          created_at?: string
          custom_book_details?: Json | null
          format?: string
          id?: string
          is_custom_request?: boolean
          line_total: number
          order_id: string
          quantity?: number
          target_language: string
          title_snapshot: string
          unit_price: number
        }
        Update: {
          author_snapshot?: string
          book_id?: string | null
          created_at?: string
          custom_book_details?: Json | null
          format?: string
          id?: string
          is_custom_request?: boolean
          line_total?: number
          order_id?: string
          quantity?: number
          target_language?: string
          title_snapshot?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "books_order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "books_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      books_orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_total: number
          grand_total: number
          id: string
          notes: string | null
          payment_method_snapshot: Json | null
          payment_status: string
          public_order_number: string
          referral_code_id: string | null
          referral_code_snapshot: string | null
          shipping_address: Json
          shipping_fee: number
          status: string
          subtotal: number
          tax: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string
          discount_total?: number
          grand_total: number
          id?: string
          notes?: string | null
          payment_method_snapshot?: Json | null
          payment_status?: string
          public_order_number: string
          referral_code_id?: string | null
          referral_code_snapshot?: string | null
          shipping_address?: Json
          shipping_fee?: number
          status?: string
          subtotal: number
          tax?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          payment_method_snapshot?: Json | null
          payment_status?: string
          public_order_number?: string
          referral_code_id?: string | null
          referral_code_snapshot?: string | null
          shipping_address?: Json
          shipping_fee?: number
          status?: string
          subtotal?: number
          tax?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_orders_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "books_referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      books_referral_codes: {
        Row: {
          code: string
          created_at: string
          discount_kind: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_kind: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_kind?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      books_referral_redemptions: {
        Row: {
          created_at: string
          customer_email: string
          discount_amount: number
          id: string
          order_id: string
          referral_code_id: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          discount_amount: number
          id?: string
          order_id: string
          referral_code_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          discount_amount?: number
          id?: string
          order_id?: string
          referral_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_referral_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "books_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_referral_redemptions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "books_referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      books_reviews: {
        Row: {
          created_at: string
          customer_name: string
          customer_role: string
          id: string
          image_url: string | null
          is_featured: boolean
          rating: number
          review_text: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_role?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          rating: number
          review_text: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_role?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          rating?: number
          review_text?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      books_site_content: {
        Row: {
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          content: Json
          slug: string
          updated_at: string
        }
        Insert: {
          content?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          content?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_kind: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_kind: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_kind?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      day_completions: {
        Row: {
          completed_at: string
          day_number: number
          run_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          run_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_completions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "project_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          allow_backorder: boolean
          id: string
          low_stock_threshold: number
          product_id: string
          sku: string
          status: Database["public"]["Enums"]["inventory_status"]
          stock_quantity: number
          track_inventory: boolean
          updated_at: string
        }
        Insert: {
          allow_backorder?: boolean
          id?: string
          low_stock_threshold?: number
          product_id: string
          sku: string
          status?: Database["public"]["Enums"]["inventory_status"]
          stock_quantity?: number
          track_inventory?: boolean
          updated_at?: string
        }
        Update: {
          allow_backorder?: boolean
          id?: string
          low_stock_threshold?: number
          product_id?: string
          sku?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          stock_quantity?: number
          track_inventory?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          admin_user_id: string | null
          change_quantity: number
          created_at: string
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          reason: string
          source: string
        }
        Insert: {
          admin_user_id?: string | null
          change_quantity: number
          created_at?: string
          id?: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          reason: string
          source: string
        }
        Update: {
          admin_user_id?: string | null
          change_quantity?: number
          created_at?: string
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          reason?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          created_at: string
          file_name: string
          file_type: string
          id: string
          mime_type: string
          path: string
          public_url: string
          size_bytes: number
          updated_at: string
          uploaded_by: string | null
          usage_type: string
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          mime_type: string
          path: string
          public_url: string
          size_bytes?: number
          updated_at?: string
          uploaded_by?: string | null
          usage_type?: string
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          mime_type?: string
          path?: string
          public_url?: string
          size_bytes?: number
          updated_at?: string
          uploaded_by?: string | null
          usage_type?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          add_ons: string[]
          created_at: string
          id: string
          image_snapshot: string
          line_total: number
          milk: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          size: string
          sweetness: string
          unit_price: number
        }
        Insert: {
          add_ons?: string[]
          created_at?: string
          id?: string
          image_snapshot: string
          line_total: number
          milk: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          size: string
          sweetness: string
          unit_price: number
        }
        Update: {
          add_ons?: string[]
          created_at?: string
          id?: string
          image_snapshot?: string
          line_total?: number
          milk?: string
          order_id?: string
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          size?: string
          sweetness?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          source: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          source?: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json | null
          delivery_fee: number
          discount_total: number
          grand_total: number
          id: string
          notes: string | null
          order_method: string
          payment_invoice_path: string | null
          payment_provider: string
          payment_provider_payment_intent_id: string | null
          payment_provider_session_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_wallet: string | null
          pickup_time: string | null
          public_order_number: string
          service_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_total: number
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: Json | null
          delivery_fee?: number
          discount_total?: number
          grand_total: number
          id?: string
          notes?: string | null
          order_method: string
          payment_invoice_path?: string | null
          payment_provider?: string
          payment_provider_payment_intent_id?: string | null
          payment_provider_session_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_wallet?: string | null
          pickup_time?: string | null
          public_order_number: string
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_total?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json | null
          delivery_fee?: number
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          order_method?: string
          payment_invoice_path?: string | null
          payment_provider?: string
          payment_provider_payment_intent_id?: string | null
          payment_provider_session_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_wallet?: string | null
          pickup_time?: string | null
          public_order_number?: string
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          provider: string
          provider_payment_intent_id: string | null
          provider_session_id: string | null
          raw_event_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          provider: string
          provider_payment_intent_id?: string | null
          provider_session_id?: string | null
          raw_event_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_payment_intent_id?: string | null
          provider_session_id?: string | null
          raw_event_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          label: string
          price_delta: number
          product_id: string
          variant_type: string
          variant_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          price_delta?: number
          product_id: string
          variant_type: string
          variant_value: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          price_delta?: number
          product_id?: string
          variant_type?: string
          variant_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergy_note: string | null
          alt_text: string | null
          available_add_ons: Json
          available_milk_options: Json
          available_sizes: Json
          available_sweetness_levels: Json
          base_price: number
          category: string
          created_at: string
          currency: string
          fulfillment_method: string | null
          gallery_images: Json
          id: string
          image_path: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean
          is_bestseller: boolean
          is_featured: boolean
          long_description: string
          name: string
          nutrition: string | null
          nutrition_json: Json | null
          price_from: boolean | null
          short_description: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          allergy_note?: string | null
          alt_text?: string | null
          available_add_ons?: Json
          available_milk_options?: Json
          available_sizes?: Json
          available_sweetness_levels?: Json
          base_price: number
          category: string
          created_at?: string
          currency?: string
          fulfillment_method?: string | null
          gallery_images?: Json
          id: string
          image_path: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          long_description: string
          name: string
          nutrition?: string | null
          nutrition_json?: Json | null
          price_from?: boolean | null
          short_description: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          allergy_note?: string | null
          alt_text?: string | null
          available_add_ons?: Json
          available_milk_options?: Json
          available_sizes?: Json
          available_sweetness_levels?: Json
          base_price?: number
          category?: string
          created_at?: string
          currency?: string
          fulfillment_method?: string | null
          gallery_images?: Json
          id?: string
          image_path?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          long_description?: string
          name?: string
          nutrition?: string | null
          nutrition_json?: Json | null
          price_from?: boolean | null
          short_description?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      project_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          planned_end_at: string
          project_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          planned_end_at: string
          project_id: string
          started_at: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          planned_end_at?: string
          project_id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          age_range: string | null
          city: string | null
          consent_given: boolean
          created_at: string | null
          current_routine: string | null
          email: string
          id: string
          interest_level: string | null
          monthly_spend: string | null
          name: string
          optional_message: string | null
          skin_concerns: string[] | null
          skin_type: string | null
          source: string | null
          struggle_duration: string | null
          testing_preference: string | null
          whatsapp: string | null
        }
        Insert: {
          age_range?: string | null
          city?: string | null
          consent_given?: boolean
          created_at?: string | null
          current_routine?: string | null
          email: string
          id?: string
          interest_level?: string | null
          monthly_spend?: string | null
          name: string
          optional_message?: string | null
          skin_concerns?: string[] | null
          skin_type?: string | null
          source?: string | null
          struggle_duration?: string | null
          testing_preference?: string | null
          whatsapp?: string | null
        }
        Update: {
          age_range?: string | null
          city?: string | null
          consent_given?: boolean
          created_at?: string | null
          current_routine?: string | null
          email?: string
          id?: string
          interest_level?: string | null
          monthly_spend?: string | null
          name?: string
          optional_message?: string | null
          skin_concerns?: string[] | null
          skin_type?: string | null
          source?: string | null
          struggle_duration?: string | null
          testing_preference?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      reel_suggestions: {
        Row: {
          created_at: string
          hook: string
          id: string
          notes: string | null
          script: string
          status: string | null
          talking_points: Json
          topic: string
        }
        Insert: {
          created_at?: string
          hook: string
          id?: string
          notes?: string | null
          script: string
          status?: string | null
          talking_points: Json
          topic: string
        }
        Update: {
          created_at?: string
          hook?: string
          id?: string
          notes?: string | null
          script?: string
          status?: string | null
          talking_points?: Json
          topic?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          customer_role_or_location: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          rating: number
          review_text: string
          sort_order: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_role_or_location?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          rating: number
          review_text: string
          sort_order?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_role_or_location?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          rating?: number
          review_text?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      store_addresses: {
        Row: {
          city: string
          country: string
          county: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          phone: string | null
          postcode: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          county?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          phone?: string | null
          postcode: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          county?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          phone?: string | null
          postcode?: string
          user_id?: string
        }
        Relationships: []
      }
      store_admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      store_authors: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      store_book_categories: {
        Row: {
          book_id: string
          category_id: string
        }
        Insert: {
          book_id: string
          category_id: string
        }
        Update: {
          book_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_book_categories_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_book_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_book_formats: {
        Row: {
          book_id: string
          compare_at_price: number | null
          format: string
          id: string
          is_active: boolean
          price: number
          sku: string | null
          stock: number
        }
        Insert: {
          book_id: string
          compare_at_price?: number | null
          format: string
          id?: string
          is_active?: boolean
          price: number
          sku?: string | null
          stock?: number
        }
        Update: {
          book_id?: string
          compare_at_price?: number | null
          format?: string
          id?: string
          is_active?: boolean
          price?: number
          sku?: string | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_book_formats_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
        ]
      }
      store_book_images: {
        Row: {
          alt: string | null
          book_id: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          book_id: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          book_id?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_book_images_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
        ]
      }
      store_books: {
        Row: {
          author_id: string | null
          author_name: string
          avg_rating: number
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_audible_exclusive: boolean
          is_bestseller: boolean
          is_featured: boolean
          is_first_reads: boolean
          is_new_release: boolean
          is_prime_eligible: boolean
          isbn: string | null
          language: string | null
          page_count: number | null
          publication_date: string | null
          publisher: string | null
          review_count: number
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          avg_rating?: number
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_audible_exclusive?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_first_reads?: boolean
          is_new_release?: boolean
          is_prime_eligible?: boolean
          isbn?: string | null
          language?: string | null
          page_count?: number | null
          publication_date?: string | null
          publisher?: string | null
          review_count?: number
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          avg_rating?: number
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_audible_exclusive?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_first_reads?: boolean
          is_new_release?: boolean
          is_prime_eligible?: boolean
          isbn?: string | null
          language?: string | null
          page_count?: number | null
          publication_date?: string | null
          publisher?: string | null
          review_count?: number
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "store_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_content_pages: {
        Row: {
          body: string
          id: string
          is_published: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          email: string
          id: string
          order_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          email: string
          id?: string
          order_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          email?: string
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "store_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_kind: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          use_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_kind: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          use_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_kind?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          use_count?: number
        }
        Relationships: []
      }
      store_deals: {
        Row: {
          book_id: string
          created_at: string
          deal_price: number
          ends_at: string
          format_id: string | null
          id: string
          is_active: boolean
          starts_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          deal_price: number
          ends_at: string
          format_id?: string | null
          id?: string
          is_active?: boolean
          starts_at: string
        }
        Update: {
          book_id?: string
          created_at?: string
          deal_price?: number
          ends_at?: string
          format_id?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_deals_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_deals_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "store_book_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      store_homepage_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          section_type: string
          sort_order: number
          subtitle: string | null
          title: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_type: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_type?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      store_memberships: {
        Row: {
          benefits: Json
          description: string | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          updated_at: string
        }
        Insert: {
          benefits?: Json
          description?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          updated_at?: string
        }
        Update: {
          benefits?: Json
          description?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_navigation_menus: {
        Row: {
          id: string
          items: Json
          label: string
          menu_key: string
          updated_at: string
        }
        Insert: {
          id?: string
          items?: Json
          label: string
          menu_key: string
          updated_at?: string
        }
        Update: {
          id?: string
          items?: Json
          label?: string
          menu_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_order_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          author: string
          book_id: string | null
          cover_url: string | null
          format: string
          format_id: string | null
          id: string
          order_id: string
          quantity: number
          title: string
          unit_price: number
        }
        Insert: {
          author: string
          book_id?: string | null
          cover_url?: string | null
          format: string
          format_id?: string | null
          id?: string
          order_id: string
          quantity?: number
          title: string
          unit_price: number
        }
        Update: {
          author?: string
          book_id?: string | null
          cover_url?: string | null
          format?: string
          format_id?: string | null
          id?: string
          order_id?: string
          quantity?: number
          title?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "store_book_formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          currency: string
          delivery_speed: string | null
          discount_total: number
          email: string
          gift_message: string | null
          gift_wrap: boolean
          grand_total: number
          id: string
          order_number: string
          payment_status: string
          shipping_address: Json
          shipping_fee: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          delivery_speed?: string | null
          discount_total?: number
          email: string
          gift_message?: string | null
          gift_wrap?: boolean
          grand_total?: number
          id?: string
          order_number: string
          payment_status?: string
          shipping_address?: Json
          shipping_fee?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          delivery_speed?: string | null
          discount_total?: number
          email?: string
          gift_message?: string | null
          gift_wrap?: boolean
          grand_total?: number
          id?: string
          order_number?: string
          payment_status?: string
          shipping_address?: Json
          shipping_fee?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      store_reviews: {
        Row: {
          author_name: string
          body: string
          book_id: string
          created_at: string
          helpful_count: number
          id: string
          is_verified_purchase: boolean
          rating: number
          status: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          author_name: string
          body: string
          book_id: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified_purchase?: boolean
          rating: number
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string
          body?: string
          book_id?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified_purchase?: boolean
          rating?: number
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
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
      store_user_memberships: {
        Row: {
          ends_at: string | null
          id: string
          membership_id: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          ends_at?: string | null
          id?: string
          membership_id: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          ends_at?: string | null
          id?: string
          membership_id?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_user_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      store_wishlist_items: {
        Row: {
          added_at: string
          book_id: string
          format: string | null
          id: string
          wishlist_id: string
        }
        Insert: {
          added_at?: string
          book_id: string
          format?: string | null
          id?: string
          wishlist_id: string
        }
        Update: {
          added_at?: string
          book_id?: string
          format?: string | null
          id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_wishlist_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "store_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "store_wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      store_wishlists: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      summary_jobs: {
        Row: {
          book_export: Json
          chunk_current: number | null
          chunk_total: number | null
          completed_at: string | null
          elapsed_seconds: number | null
          error: string | null
          hybrid_job_dir_relative: string | null
          id: string
          language_label: string
          manifest_relative_path: string | null
          pdf_relative_path: string | null
          started_at: string
          status: string
          stderr_tail: string | null
          stdout_tail: string | null
          summary_text: string | null
          txt_relative_path: string | null
          updated_at: string
          upload_id: string | null
        }
        Insert: {
          book_export?: Json
          chunk_current?: number | null
          chunk_total?: number | null
          completed_at?: string | null
          elapsed_seconds?: number | null
          error?: string | null
          hybrid_job_dir_relative?: string | null
          id: string
          language_label: string
          manifest_relative_path?: string | null
          pdf_relative_path?: string | null
          started_at: string
          status: string
          stderr_tail?: string | null
          stdout_tail?: string | null
          summary_text?: string | null
          txt_relative_path?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Update: {
          book_export?: Json
          chunk_current?: number | null
          chunk_total?: number | null
          completed_at?: string | null
          elapsed_seconds?: number | null
          error?: string | null
          hybrid_job_dir_relative?: string | null
          id?: string
          language_label?: string
          manifest_relative_path?: string | null
          pdf_relative_path?: string | null
          started_at?: string
          status?: string
          stderr_tail?: string | null
          stdout_tail?: string | null
          summary_text?: string | null
          txt_relative_path?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          run_id: string
          task_key: string
        }
        Insert: {
          completed_at?: string
          run_id: string
          task_key: string
        }
        Update: {
          completed_at?: string
          run_id?: string
          task_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "project_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_jobs: {
        Row: {
          book_export: Json
          chunk_current: number | null
          chunk_total: number | null
          completed_at: string | null
          elapsed_seconds: number | null
          enhancement_chunk_current: number | null
          enhancement_chunk_total: number | null
          enhancement_error: string | null
          enhancement_status: string | null
          error: string | null
          hybrid_job_dir_relative: string | null
          id: string
          language_label: string
          manifest_relative_path: string | null
          pdf_relative_path: string | null
          prompt_profile: string
          refinement_tier: string | null
          started_at: string
          status: string
          stderr_tail: string | null
          stdout_tail: string | null
          translated_text: string | null
          txt_relative_path: string | null
          updated_at: string
          upload_id: string | null
        }
        Insert: {
          book_export?: Json
          chunk_current?: number | null
          chunk_total?: number | null
          completed_at?: string | null
          elapsed_seconds?: number | null
          enhancement_chunk_current?: number | null
          enhancement_chunk_total?: number | null
          enhancement_error?: string | null
          enhancement_status?: string | null
          error?: string | null
          hybrid_job_dir_relative?: string | null
          id: string
          language_label: string
          manifest_relative_path?: string | null
          pdf_relative_path?: string | null
          prompt_profile?: string
          refinement_tier?: string | null
          started_at: string
          status: string
          stderr_tail?: string | null
          stdout_tail?: string | null
          translated_text?: string | null
          txt_relative_path?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Update: {
          book_export?: Json
          chunk_current?: number | null
          chunk_total?: number | null
          completed_at?: string | null
          elapsed_seconds?: number | null
          enhancement_chunk_current?: number | null
          enhancement_chunk_total?: number | null
          enhancement_error?: string | null
          enhancement_status?: string | null
          error?: string | null
          hybrid_job_dir_relative?: string | null
          id?: string
          language_label?: string
          manifest_relative_path?: string | null
          pdf_relative_path?: string | null
          prompt_profile?: string
          refinement_tier?: string | null
          started_at?: string
          status?: string
          stderr_tail?: string | null
          stdout_tail?: string | null
          translated_text?: string | null
          txt_relative_path?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          id: string
          original_name: string
          size_bytes: number
          stored_relative_path: string
        }
        Insert: {
          created_at?: string
          id: string
          original_name: string
          size_bytes: number
          stored_relative_path: string
        }
        Update: {
          created_at?: string
          id?: string
          original_name?: string
          size_bytes?: number
          stored_relative_path?: string
        }
        Relationships: []
      }
      waitlist_submissions: {
        Row: {
          city: string | null
          created_at: string | null
          email: string
          id: string
          launch_option: string | null
          main_concern: string | null
          name: string
          source: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          launch_option?: string | null
          main_concern?: string | null
          name: string
          source?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          launch_option?: string | null
          main_concern?: string | null
          name?: string
          source?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      website_content_blocks: {
        Row: {
          created_at: string
          field_key: string
          field_type: Database["public"]["Enums"]["content_field_type"]
          id: string
          media_asset_id: string | null
          section_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          value_json: Json | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          field_key: string
          field_type?: Database["public"]["Enums"]["content_field_type"]
          id?: string
          media_asset_id?: string | null
          section_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          value_json?: Json | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          field_key?: string
          field_type?: Database["public"]["Enums"]["content_field_type"]
          id?: string
          media_asset_id?: string | null
          section_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          value_json?: Json | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_content_blocks_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_blocks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "website_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      website_pages: {
        Row: {
          created_at: string
          id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      website_sections: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          section_key: string
          section_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id: string
          section_key: string
          section_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          section_key?: string
          section_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "website_pages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      books_is_admin: { Args: never; Returns: boolean }
      books_referral_email_used: {
        Args: { p_email: string; p_referral_code_id: string }
        Returns: boolean
      }
      get_books_order_by_number: { Args: { order_num: string }; Returns: Json }
      get_store_order_by_number: {
        Args: { p_order_number: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      store_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      content_field_type:
        | "text"
        | "rich_text"
        | "heading"
        | "button_label"
        | "button_url"
        | "image"
        | "gallery"
        | "json"
      inventory_status: "in_stock" | "low_stock" | "out_of_stock"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready_for_pickup"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
        | "refunded"
      payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded"
      product_status: "draft" | "active" | "archived"
      review_status: "draft" | "published" | "archived"
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
      content_field_type: [
        "text",
        "rich_text",
        "heading",
        "button_label",
        "button_url",
        "image",
        "gallery",
        "json",
      ],
      inventory_status: ["in_stock", "low_stock", "out_of_stock"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
        "completed",
        "cancelled",
        "refunded",
      ],
      payment_status: ["unpaid", "pending", "paid", "failed", "refunded"],
      product_status: ["draft", "active", "archived"],
      review_status: ["draft", "published", "archived"],
    },
  },
} as const
