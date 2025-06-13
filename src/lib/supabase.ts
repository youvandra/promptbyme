import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          content: string
          access: 'public' | 'private'
          created_at: string | null
          tags: string[] | null
          views: number | null
          like_count: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          content: string
          access?: 'public' | 'private'
          created_at?: string | null
          tags?: string[] | null
          views?: number | null
          like_count?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          content?: string
          access?: 'public' | 'private'
          created_at?: string | null
          tags?: string[] | null
          views?: number | null
          like_count?: number | null
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          prompt_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_id?: string
          created_at?: string
        }
      }
    }
  }
}