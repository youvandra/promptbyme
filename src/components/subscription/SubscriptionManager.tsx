import React, { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, AlertTriangle, Zap, Shield, Clock, DollarSign } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { PRODUCTS } from '../../stripe-config'
import { useNavigate } from 'react-router-dom'

const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      
      // Check if user has a Stripe subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError)
        // Default to free plan if there's an error
        setSubscription({
          id: 'free',
          plan: 'free',
          status: 'active'
        })
        return
      }

      if (subscriptionData && subscriptionData.subscription_id) {
        // User has a subscription
        const status = subscriptionData.subscription_status === 'active' ? 'active' : 
                      subscriptionData.subscription_status === 'past_due' ? 'past_due' : 
                      'canceled'
        
        // Determine plan based on price_id
        let plan: 'free' | 'basic' | 'pro' | 'enterprise' = 'free'
        
        if (subscriptionData.price_id === PRODUCTS.PRO_SUBSCRIPTION.priceId) {
+          plan = 'pro'
+        } else if (subscriptionData.price_id === PRODUCTS.BASIC_SUBSCRIPTION.priceId) {
           plan = 'basic'
         }
        
        setSubscription({
          id: subscriptionData.subscription_id,
          plan,
          status,
          current_period_end: subscriptionData.current_period_end ? 
            new Date(subscriptionData.current_period_end * 1000).toISOString() : 
            undefined
        })
      } else {
        // No subscription, default to free plan
        setSubscription({
          id: 'free',
          plan: 'free',
          status: 'active'
        })
      }
    } catch (error) {
      console.error('Error in subscription fetch:', error)
      // Default to free plan if there's an error
      setSubscription({
        id: 'free',
        plan: 'free',
        status: 'active'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) return
    
    try {
      setCheckoutLoading(true)
      
      // Call the Stripe checkout edge function
      const { data: { sessionId, url }, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: PRODUCTS.BASIC_SUBSCRIPTION.priceId,
          success_url: `${window.location.origin}/profile?checkout=success`,
          cancel_url: `${window.location.origin}/profile?checkout=canceled`,
          mode: 'subscription'
        }
      })
      
      if (error) {
        throw error
      }
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleSubscribePro = async () => {
    if (!user) return
    try {
       setCheckoutLoading(true)
       
       // Call the Stripe checkout edge function
       const { data: { sessionId, url }, error } = await supabase.functions.invoke('stripe-checkout', {
         body: {
           price_id: PRODUCTS.PRO_SUBSCRIPTION.priceId,
           success_url: `${window.location.origin}/profile?checkout=success`,
           cancel_url: `${window.location.origin}/profile?checkout=canceled`,
           mode: 'subscription'
             
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case 'free':
        return {
          name: 'Free Plan',
          color: 'bg-zinc-600',
          icon: <Zap className="text-zinc-400" />,
          features: ['5 prompts', 'Basic version control', 'Public sharing']
        }
      case 'basic':
        return {
          name: 'Basic Plan',
          color: 'bg-blue-600',
          icon: <Shield className="text-blue-400" />,
          features: ['Unlimited prompts', 'Full version control', 'Private sharing', 'API access']
        }
      case 'pro':
        return {
          name: 'Pro Plan',
          color: 'bg-indigo-600',
          icon: <Shield className="text-indigo-400" />,
          features: ['Unlimited prompts', 'Team collaboration', 'Advanced analytics', 'Priority support']
        }
      case 'enterprise':
        return {
          name: 'Enterprise Plan',
          color: 'bg-purple-600',
          icon: <Shield className="text-purple-400" />,
          features: ['Custom solutions', 'Dedicated support', 'SLA guarantees', 'Custom integrations']
        }
      default:
        return {
          name: 'Unknown Plan',
          color: 'bg-zinc-600',
          icon: <Zap className="text-zinc-400" />,
          features: []
        }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full text-xs">
            <CheckCircle size={12} />
            <span>Active</span>
          </div>
        )
      case 'past_due':
        return (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full text-xs">
            <AlertTriangle size={12} />
            <span>Past Due</span>
          </div>
        )
      case 'canceled':
        return (
          <div className="flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full text-xs">
            <AlertTriangle size={12} />
            <span>Canceled</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 text-zinc-400 bg-zinc-500/10 border border-zinc-500/30 px-2 py-1 rounded-full text-xs">
            <Clock size={12} />
            <span>Inactive</span>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-zinc-400">Loading subscription...</span>
        </div>
      </div>
    )
  }

  const planDetails = subscription ? getPlanDetails(subscription.plan) : getPlanDetails('free')

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${planDetails.color} rounded-lg`}>
              {planDetails.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{planDetails.name}</h3>
              {subscription && (
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(subscription.status)}
                  {subscription.current_period_end && subscription.status === 'active' && (
                    <div className="text-xs text-zinc-400">
                      Renews: {formatDate(subscription.current_period_end)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {subscription?.status === 'active' && subscription.plan !== 'free' && (
            <button
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
              onClick={() => window.open('https://billing.stripe.com/p/login/test_28o5nA9Rl9Oi9OM288', '_blank')}
            >
              Manage Subscription
            </button>
          )}
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Features:</h4>
          <ul className="space-y-2">
            {planDetails.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                <CheckCircle size={14} className="text-emerald-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upgrade Options */}
      {(subscription?.plan === 'free' || !subscription) && (
        <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upgrade Your Plan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="bg-zinc-800/50 border border-zinc-700/50 hover:border-indigo-500/50 rounded-lg p-4 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-600/20 rounded-md">
                  <Shield size={16} className="text-blue-400" />
                </div>
                <h4 className="font-medium text-white">Monthly Subscription</h4>
              </div>
              <p className="text-sm text-zinc-400 mb-3">Perfect for individual creators.</p>
              <div className="text-lg font-bold text-white mb-3">$10.00<span className="text-sm font-normal text-zinc-400">/month</span></div>
              <button
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                onClick={handleSubscribe}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
          {subscription?.status === 'active' && subscription.plan !== 'free' && (
            <button
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              onClick={() => window.open('https://billing.stripe.com/p/login/test_28o5nA9Rl9Oi9OM288', '_blank')}
            >
              Manage
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
          <CreditCard size={20} className="text-zinc-400" />
          <div>
            <p className="text-sm text-zinc-300">Payment methods are managed through Stripe</p>
            <p className="text-xs text-zinc-500">Your payment information is securely stored by our payment provider</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionManager