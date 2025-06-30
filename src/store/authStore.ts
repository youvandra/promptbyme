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
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Handle invalid refresh token errors
      if (error && (
        error.message.includes('Invalid Refresh Token') || 
        error.message.includes('Refresh Token Not Found')
      )) {
        // Clear the invalid session
        await supabase.auth.signOut()
        set({ user: null, loading: false })
        return
      }
      
      set({ user: session?.user ?? null, loading: false })

      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null, loading: false })
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      // If there's any other error during initialization, clear the session
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('Error clearing session:', signOutError)
      }
      set({ loading: false })
    }
  },
}))