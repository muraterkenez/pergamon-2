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
      animals: {
        Row: {
          id: string
          tag_number: string
          name: string | null
          birth_date: string
          gender: string
          breed: string
          color: string
          source: string
          weight: number | null
          purchase_date: string | null
          purchase_price: number | null
          mother_tag: string | null
          father_tag: string | null
          health_status: string
          vaccination_status: boolean
          status: string
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          tag_number: string
          name?: string | null
          birth_date: string
          gender: string
          breed: string
          color?: string
          source?: string
          weight?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          mother_tag?: string | null
          father_tag?: string | null
          health_status?: string
          vaccination_status?: boolean
          status?: string
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          tag_number?: string
          name?: string | null
          birth_date?: string
          gender?: string
          breed?: string
          color?: string
          source?: string
          weight?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          mother_tag?: string | null
          father_tag?: string | null
          health_status?: string
          vaccination_status?: boolean
          status?: string
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      milk_productions: {
        Row: {
          id: string
          animal_id: string
          date: string
          amount: number
          quality_score: number | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          animal_id: string
          date: string
          amount: number
          quality_score?: number | null
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          animal_id?: string
          date?: string
          amount?: number
          quality_score?: number | null
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      health_records: {
        Row: {
          id: string
          animal_id: string
          date: string
          type: string
          description: string
          treatment: string | null
          cost: number | null
          next_check_date: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          animal_id: string
          date: string
          type: string
          description: string
          treatment?: string | null
          cost?: number | null
          next_check_date?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          animal_id?: string
          date?: string
          type?: string
          description?: string
          treatment?: string | null
          cost?: number | null
          next_check_date?: string | null
          created_at?: string
          user_id?: string
        }
      }
      expenses: {
        Row: {
          id: string
          date: string
          category: string
          description: string
          amount: number
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          date: string
          category: string
          description: string
          amount: number
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          date?: string
          category?: string
          description?: string
          amount?: number
          created_at?: string
          user_id?: string
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
  }
}