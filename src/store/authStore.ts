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
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.')
        }
        throw new Error(error.message)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.')
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.')
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      })
      
      if (error) {
        // Handle specific Supabase errors with user-friendly messages
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please try signing in instead.')
        }
        if (error.message.includes('Database error saving new user')) {
          throw new Error('Unable to create account at this time. Please try again in a few moments, or contact support if the issue persists.')
        }
        if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.')
        }
        if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.')
        }
        
        // Generic fallback for other errors
        throw new Error(`Account creation failed: ${error.message}`)
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error('Failed to sign out. Please try again.')
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw error
    }
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