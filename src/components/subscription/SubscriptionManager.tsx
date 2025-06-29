import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_customer_id: string
  stripe_subscription_id: string
}

export const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single()
      
      if (error) throw error
      
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // No subscription found is not an error
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    
    setCancelLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.stripe_subscription_id }
      })
      
      if (error) throw error
      
      if (data.success) {
        setSuccess('Your subscription has been canceled. You will still have access until the end of your billing period.')
        // Update local subscription state
        setSubscription({
          ...subscription,
          cancel_at_period_end: true
        })
      } else {
        throw new Error(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      setError('Failed to cancel subscription. Please try again or contact support.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    if (!subscription) return
    
    setCancelLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('resume-subscription', {
        body: { subscriptionId: subscription.stripe_subscription_id }
      })
      
      if (error) throw error
      
      if (data.success) {
        setSuccess('Your subscription has been resumed.')
        // Update local subscription state
        setSubscription({
          ...subscription,
          cancel_at_period_end: false
        })
      } else {
        throw new Error(data.error || 'Failed to resume subscription')
      }
    } catch (error) {
      console.error('Error resuming subscription:', error)
      setError('Failed to resume subscription. Please try again or contact support.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleManagePaymentMethod = async () => {
    if (!subscription) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { 
          customerId: subscription.stripe_customer_id,
          returnUrl: window.location.href
        }
      })
      
      if (error) throw error
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No portal URL returned')
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      setError('Failed to access billing portal. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPlanName = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'basic': return 'Basic Plan'
      case 'pro': return 'Pro Plan'
      case 'enterprise': return 'Enterprise Plan'
      default: return 'Free Plan'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-zinc-400">Loading subscription...</span>
        </div>
      </div>
    )
  }

  if (!subscription || subscription.status !== 'active') {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-4">No Active Subscription</h3>
          <p className="text-zinc-400 mb-6">
            You don't have an active subscription. Upgrade to a paid plan to access premium features.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            View Plans
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
      {/* Subscription Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {getPlanName(subscription.plan)}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                subscription.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {subscription.status.toUpperCase()}
              </span>
              {subscription.cancel_at_period_end && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                  Cancels on {formatDate(subscription.current_period_end)}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleManagePaymentMethod}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all duration-200 text-sm"
          >
            <CreditCard size={16} />
            <span>Manage Payment Method</span>
          </button>
        </div>
      </div>
      
      {/* Subscription Details */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={18} className="text-indigo-400" />
              <h4 className="text-sm font-medium text-white">Billing Period</h4>
            </div>
            <p className="text-zinc-300">
              Your subscription renews on <span className="text-white font-medium">{formatDate(subscription.current_period_end)}</span>
            </p>
          </div>
          
          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={18} className="text-indigo-400" />
              <h4 className="text-sm font-medium text-white">Payment Method</h4>
            </div>
            <p className="text-zinc-300">
              Manage your payment method through the Stripe portal
            </p>
          </div>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}
        
        {/* Cancel/Resume Subscription */}
        <div className="flex justify-end">
          {subscription.cancel_at_period_end ? (
            <button
              onClick={handleResumeSubscription}
              disabled={cancelLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Resume Subscription</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  <span>Cancel Subscription</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}