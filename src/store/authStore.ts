import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  },

  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false })

      supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user ?? null
        set({ user, loading: false })

        // Create user profile when user signs up or signs in for the first time
        if (user && (event === 'SIGNED_IN' || event === 'SIGNED_UP')) {
          try {
            // Check if user profile already exists
            const { data: existingProfile, error: selectError } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle()

            // If there's an error checking for existing profile, log it but don't throw
            if (selectError && selectError.code !== 'PGRST116') {
              console.error('Error checking existing user profile:', selectError)
              return
            }

            // If no profile exists, create one
            if (!existingProfile) {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
                })

              if (profileError) {
                console.error('Error creating user profile:', profileError)
                // Don't throw the error to prevent blocking the auth flow
              }
            }
          } catch (error) {
            console.error('Error handling user profile:', error)
            // Don't throw the error to prevent blocking the auth flow
          }
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },
}))