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
      user_profiles: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string | null
        }
        Insert: {
          id: string
          username: string
          email: string
          created_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string | null
        }
      }
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
        }
      }
    }
  }
}