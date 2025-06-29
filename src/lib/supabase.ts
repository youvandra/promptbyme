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
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          is_public_profile: boolean
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_public_profile?: boolean
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_public_profile?: boolean
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
          original_prompt_id: string | null
          fork_count: number | null
          folder_id: string | null
          current_version: number | null
          total_versions: number | null
          notes: string | null
          output_sample: string | null
          media_urls: string[] | null
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
          original_prompt_id?: string | null
          fork_count?: number | null
          folder_id?: string | null
          current_version?: number | null
          total_versions?: number | null
          notes?: string | null
          output_sample?: string | null
          media_urls?: string[] | null
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
          original_prompt_id?: string | null
          fork_count?: number | null
          folder_id?: string | null
          current_version?: number | null
          total_versions?: number | null
          notes?: string | null
          output_sample?: string | null
          media_urls?: string[] | null
        }
      }
      prompt_versions: {
        Row: {
          id: string
          prompt_id: string
          version_number: number
          title: string | null
          content: string
          commit_message: string | null
          created_by: string | null
          is_current: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          prompt_id: string
          version_number?: number
          title?: string | null
          content: string
          commit_message?: string | null
          created_by?: string | null
          is_current?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          prompt_id?: string
          version_number?: number
          title?: string | null
          content?: string
          commit_message?: string | null
          created_by?: string | null
          is_current?: boolean | null
          created_at?: string | null
        }
      }
      flow_nodes: {
        Row: {
          id: string
          project_id: string
          type: 'input' | 'prompt' | 'condition' | 'output'
          title: string
          content: string | null
          position_x: number
          position_y: number
          imported_prompt_id: string | null
          metadata: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          type: 'input' | 'prompt' | 'condition' | 'output'
          title: string
          content?: string | null
          position_x?: number
          position_y?: number
          imported_prompt_id?: string | null
          metadata?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          type?: 'input' | 'prompt' | 'condition' | 'output'
          title?: string
          content?: string | null
          position_x?: number
          position_y?: number
          imported_prompt_id?: string | null
          metadata?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      flow_connections: {
        Row: {
          id: string
          project_id: string
          source_node_id: string
          target_node_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          source_node_id: string
          target_node_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          source_node_id?: string
          target_node_id?: string
          created_at?: string | null
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          user_id: string
          parent_id: string | null
          position: number | null
          is_shared: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          user_id: string
          parent_id?: string | null
          position?: number | null
          is_shared?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          user_id?: string
          parent_id?: string | null
          position?: number | null
          is_shared?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      team_audit_log: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          action: string
          details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          action: string
          details?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          action?: string
          details?: any | null
          created_at?: string
        }
      }
    }
  }
  prompt_flows: {
    Row: {
      id: string
      user_id: string
      name: string
      description: string | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      description?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      user_id?: string
      name?: string
      description?: string | null
      created_at?: string | null
      updated_at?: string | null
    }
  }
  flow_steps: {
    Row: {
      id: string
      flow_id: string
      prompt_id: string
      order_index: number
      step_title: string
      created_at: string | null
    }
    Insert: {
      id?: string
      flow_id: string
      prompt_id: string
      order_index: number
      step_title: string
      created_at?: string | null
    }
    Update: {
      id?: string
      flow_id?: string
      prompt_id?: string
      order_index?: number
      step_title?: string
      created_at?: string | null
    }
  }
}