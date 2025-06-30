import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'inactive'

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end?: string | null
  created_at?: string
  updated_at?: string
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch the user's subscription from the database
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching subscription:', error)
          setError('Failed to fetch subscription data')
          
          // If no subscription exists, create a free one
          if (error.code === 'PGRST116') {
            await createFreeSubscription()
          }
        } else if (data) {
          setSubscription(data)
        } else {
          // No subscription found, create a free one
          await createFreeSubscription()
        }
      } catch (err) {
        console.error('Error in subscription fetch:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const createFreeSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: user.id,
          plan: 'free',
          status: 'active'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating free subscription:', error)
        setError('Failed to create subscription')
      } else {
        setSubscription(data)
      }
    } catch (err) {
      console.error('Error creating subscription:', err)
      setError('An unexpected error occurred')
    }
  }

  const isBasicOrHigher = () => {
    if (!subscription) return false
    if (subscription.status !== 'active') return false
    
    return ['basic', 'pro', 'enterprise'].includes(subscription.plan)
  }

  const isProOrHigher = () => {
    if (!subscription) return false
    if (subscription.status !== 'active') return false
    
    return ['pro', 'enterprise'].includes(subscription.plan)
  }

  const isEnterprise = () => {
    if (!subscription) return false
    if (subscription.status !== 'active') return false
    
    return subscription.plan === 'enterprise'
  }

  const getPlanName = () => {
    if (!subscription) return 'Free'
    
    switch (subscription.plan) {
      case 'free': return 'Free'
      case 'basic': return 'Basic'
      case 'pro': return 'Pro'
      case 'enterprise': return 'Enterprise'
      default: return 'Unknown'
    }
  }

  return {
    subscription,
    loading,
    error,
    isBasicOrHigher,
    isProOrHigher,
    isEnterprise,
    getPlanName
  }
}