import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Zap, Shield, Users, Code, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { stripePromise, PRICE_IDS, PRODUCT_NAMES, PRODUCT_FEATURES, PRODUCT_PRICES } from '../../lib/stripe'

export const PricingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE' | null>(null)
  const [isYearly, setIsYearly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()

  // Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .single()
        
        if (!error && data && data.status === 'active') {
          setCurrentPlan(data.plan)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }
    
    fetchSubscription()
  }, [user])

  const handleSelectPlan = (plan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    setSelectedPlan(plan)
  }

  const handleCheckout = async () => {
    if (!selectedPlan || !user) {
      if (!user) {
        navigate('/login?redirect=/pricing')
      }
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Get the price ID based on the selected plan and billing cycle
      const priceId = PRICE_IDS[selectedPlan]
      
      // Call the Supabase Edge Function to create a checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setError('Failed to create checkout session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPriceDisplay = (plan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    const price = PRODUCT_PRICES[plan]
    return isYearly ? price : `${parseFloat(price.replace('$', '')) * 1.2}`;
  }

  const isCurrentPlan = (plan: string) => {
    if (!currentPlan) return false
    return currentPlan.toLowerCase() === plan.toLowerCase()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-7xl px-6 mx-auto py-12">
              {/* Page Header */}
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Choose Your Plan
                </h1>
                <p className="text-xl text-zinc-400 mb-8">
                  Unlock the full potential of promptby.me with our premium plans
                </p>
                
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className={`text-sm ${!isYearly ? 'text-white font-medium' : 'text-zinc-400'}`}>
                    Monthly
                  </span>
                  <button
                    onClick={() => setIsYearly(!isYearly)}
                    className="relative w-14 h-7 bg-zinc-700 rounded-full p-1 transition-colors duration-300"
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                        isYearly ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isYearly ? 'text-white font-medium' : 'text-zinc-400'}`}>
                      Yearly
                    </span>
                    <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                      Save 20%
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Basic Plan */}
                <motion.div
                  className={`bg-zinc-900/50 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                    selectedPlan === 'BASIC' 
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'border-zinc-800/50 hover:border-zinc-700/50'
                  }`}
                  whileHover={{ y: -5 }}
                  onClick={() => handleSelectPlan('BASIC')}
                >
                  <div className="p-6 border-b border-zinc-800/50">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {PRODUCT_NAMES.BASIC}
                    </h3>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-3xl font-bold text-white">
                        {getPriceDisplay('BASIC')}
                      </span>
                      <span className="text-zinc-400 mb-1">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      Perfect for individuals just getting started
                    </p>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3 mb-6">
                      {PRODUCT_FEATURES.BASIC.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout();
                      }}
                      disabled={isLoading || isCurrentPlan('basic')}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                        isCurrentPlan('basic')
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading && selectedPlan === 'BASIC' ? (
                        <Loader2 size={20} className="animate-spin mx-auto" />
                      ) : isCurrentPlan('basic') ? (
                        'Current Plan'
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Pro Plan */}
                <motion.div
                  className={`bg-zinc-900/50 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 transform scale-105 ${
                    selectedPlan === 'PRO' 
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'border-zinc-800/50 hover:border-zinc-700/50'
                  }`}
                  whileHover={{ y: -5 }}
                  onClick={() => handleSelectPlan('PRO')}
                >
                  <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-xs font-medium text-center py-1">
                    MOST POPULAR
                  </div>
                  <div className="p-6 border-b border-zinc-800/50 mt-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {PRODUCT_NAMES.PRO}
                    </h3>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-3xl font-bold text-white">
                        {getPriceDisplay('PRO')}
                      </span>
                      <span className="text-zinc-400 mb-1">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      For professionals who need more power
                    </p>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3 mb-6">
                      {PRODUCT_FEATURES.PRO.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout();
                      }}
                      disabled={isLoading || isCurrentPlan('pro')}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                        isCurrentPlan('pro')
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading && selectedPlan === 'PRO' ? (
                        <Loader2 size={20} className="animate-spin mx-auto" />
                      ) : isCurrentPlan('pro') ? (
                        'Current Plan'
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Enterprise Plan */}
                <motion.div
                  className={`bg-zinc-900/50 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                    selectedPlan === 'ENTERPRISE' 
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'border-zinc-800/50 hover:border-zinc-700/50'
                  }`}
                  whileHover={{ y: -5 }}
                  onClick={() => handleSelectPlan('ENTERPRISE')}
                >
                  <div className="p-6 border-b border-zinc-800/50">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {PRODUCT_NAMES.ENTERPRISE}
                    </h3>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-3xl font-bold text-white">
                        {getPriceDisplay('ENTERPRISE')}
                      </span>
                      <span className="text-zinc-400 mb-1">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      For teams and businesses with advanced needs
                    </p>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3 mb-6">
                      {PRODUCT_FEATURES.ENTERPRISE.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout();
                      }}
                      disabled={isLoading || isCurrentPlan('enterprise')}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                        isCurrentPlan('enterprise')
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading && selectedPlan === 'ENTERPRISE' ? (
                        <Loader2 size={20} className="animate-spin mx-auto" />
                      ) : isCurrentPlan('enterprise') ? (
                        'Current Plan'
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
                  {error}
                </div>
              )}

              {/* Features Comparison */}
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  Features Comparison
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800/50">
                        <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                        <th className="text-center py-4 px-4 text-zinc-400 font-medium">Free</th>
                        <th className="text-center py-4 px-4 text-zinc-400 font-medium">Basic</th>
                        <th className="text-center py-4 px-4 text-zinc-400 font-medium">Pro</th>
                        <th className="text-center py-4 px-4 text-zinc-400 font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white">Prompts per month</td>
                        <td className="py-4 px-4 text-center text-zinc-300">5</td>
                        <td className="py-4 px-4 text-center text-zinc-300">10</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Unlimited</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Unlimited</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white">Prompt templates</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Basic</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Basic</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Advanced</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Custom</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white">Team collaboration</td>
                        <td className="py-4 px-4 text-center text-zinc-300">
                          <X size={18} className="text-red-400 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center text-zinc-300">
                          <X size={18} className="text-red-400 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center text-zinc-300">Up to 3 members</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Unlimited</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white">API access</td>
                        <td className="py-4 px-4 text-center text-zinc-300">
                          <X size={18} className="text-red-400 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center text-zinc-300">
                          <X size={18} className="text-red-400 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center text-zinc-300">
                          <X size={18} className="text-red-400 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center text-zinc-300">
                          <Check size={18} className="text-emerald-400 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white">Support</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Community</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Email</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Priority email</td>
                        <td className="py-4 px-4 text-center text-zinc-300">Dedicated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Can I change my plan later?
                    </h3>
                    <p className="text-zinc-400">
                      Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the end of your current billing cycle.
                    </p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-2">
                      How do I cancel my subscription?
                    </h3>
                    <p className="text-zinc-400">
                      You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period.
                    </p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Do you offer refunds?
                    </h3>
                    <p className="text-zinc-400">
                      We offer a 14-day money-back guarantee for all plans. If you're not satisfied with our service, contact our support team within 14 days of your purchase for a full refund.
                    </p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-2">
                      What payment methods do you accept?
                    </h3>
                    <p className="text-zinc-400">
                      We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BoltBadge />
    </div>
  )
}