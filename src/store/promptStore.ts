import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

interface PromptState {
  prompts: Prompt[]
  loading: boolean
  fetchUserPrompts: (userId: string) => Promise<void>
  fetchPublicPrompts: () => Promise<void>
  fetchPromptById: (id: string) => Promise<Prompt | null>
  createPrompt: (prompt: Omit<Prompt, 'id' | 'created_at' | 'views'>) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  incrementViews: (id: string) => Promise<void>
  subscribeToUserPrompts: (userId: string) => () => void
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  loading: false,

  fetchUserPrompts: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ prompts: data || [] })
    } catch (error) {
      console.error('Error fetching user prompts:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchPublicPrompts: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('access', 'public')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ prompts: data || [] })
    } catch (error) {
      console.error('Error fetching public prompts:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchPromptById: async (id: string) => {
    try {
      // First try to get the prompt without any filters to see if it exists
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching prompt by ID:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error fetching prompt:', error)
      return null
    }
  },

  createPrompt: async (prompt) => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert([{ ...prompt, views: 0 }])
        .select()
        .single()

      if (error) throw error

      // Automatically add the new prompt to the local state
      const { prompts } = get()
      set({ prompts: [data, ...prompts] })
    } catch (error) {
      console.error('Error creating prompt:', error)
      throw error
    }
  },

  deletePrompt: async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      const { prompts } = get()
      set({ prompts: prompts.filter(p => p.id !== id) })
    } catch (error) {
      console.error('Error deleting prompt:', error)
      throw error
    }
  },

  incrementViews: async (id: string) => {
    try {
      // First get the current view count
      const { data: currentPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('views')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Increment the view count
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ views: (currentPrompt.views || 0) + 1 })
        .eq('id', id)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error incrementing views:', error)
      // Don't throw error to prevent breaking the UI if view tracking fails
    }
  },

  subscribeToUserPrompts: (userId: string) => {
    const subscription = supabase
      .channel('user-prompts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { prompts } = get()
          
          if (payload.eventType === 'INSERT') {
            set({ prompts: [payload.new as Prompt, ...prompts] })
          } else if (payload.eventType === 'DELETE') {
            set({ prompts: prompts.filter(p => p.id !== payload.old.id) })
          } else if (payload.eventType === 'UPDATE') {
            set({
              prompts: prompts.map(p =>
                p.id === payload.new.id ? payload.new as Prompt : p
              )
            })
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  },
}))