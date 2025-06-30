import React, { useState } from 'react'
import { Menu, CheckCircle, X, DollarSign, Zap, Shield, Users, FolderOpen, Code, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { PRODUCTS } from '../../stripe-config'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { Toast } from '../../components/ui/Toast'

export const PricingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const { user } = useAuthStore()
  const { showToast } = useToast()

  const handleSubscribe = async () => {
    if (!user) return
    
    try {
      setCheckoutLoading(prev => ({ ...prev, [PRODUCTS.BASIC_SUBSCRIPTION.priceId]: true }))
      
      // Call the Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: PRODUCTS.BASIC_SUBSCRIPTION.priceId,
          success_url: `${window.location.origin}/profile?checkout=success`,
          cancel_url: `${window.location.origin}/profile?checkout=canceled`,
          mode: 'subscription'
        }
      })
      
      if (error) {
        console.error('Stripe checkout error:', error)
        showToast('Failed to create checkout session. Please try again.', 'error')
        throw error
      }
      
      if (!data || !data.url) {
        console.error('Invalid response from checkout function:', data)
        showToast('Failed to create checkout session. Please try again.', 'error')
        return
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      showToast('Failed to create checkout session. Please try again.', 'error')
      setToast({ message: 'Failed to create checkout session. Please try again.', type: 'error' })
    } finally {
      setCheckoutLoading(prev => ({ ...prev, [PRODUCTS.BASIC_SUBSCRIPTION.priceId]: false }))
    }
  }

  const handleSubscribePro = async () => {
    if (!user) return
    
    try {
      setCheckoutLoading(prev => ({ ...prev, [PRODUCTS.PRO_SUBSCRIPTION.priceId]: true }))
      
      // Call the Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: PRODUCTS.PRO_SUBSCRIPTION.priceId,
          success_url: `${window.location.origin}/profile?checkout=success`,
          cancel_url: `${window.location.origin}/profile?checkout=canceled`,
          mode: 'subscription'
        }
      })
      
      if (error) {
        console.error('Stripe checkout error:', error)
        showToast('Failed to create checkout session. Please try again.', 'error')
        throw error
      }
      
      if (!data || !data.url) {
        console.error('Invalid response from checkout function:', data)
        showToast('Failed to create checkout session. Please try again.', 'error')
        return
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      showToast('Failed to create checkout session. Please try again.', 'error')
      setToast({ message: 'Failed to create checkout session. Please try again.', type: 'error' })
    } finally {
      setCheckoutLoading(prev => ({ ...prev, [PRODUCTS.PRO_SUBSCRIPTION.priceId]: false }))
    }
  }

  const handleSubscribeProTeams = async () => {
    if (!user) return
    
    try {
      setCheckoutLoading(prev => ({ ...prev, [PRODUCTS.PRO_TEAMS_SUBSCRIPTION.priceId]: true }))
      
      // Call the Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: PRODUCTS.PRO_TEAMS_SUBSCRIPTION.priceId,
          success_url: `${window.location.origin}/profile?checkout=success`,
          cancel_url: `${window.location.origin}/profile?checkout=canceled`,
          mode: 'subscription'
        }
      })
      
      if (error) {
        console.error('Stripe checkout error:', error)
        showToast('Failed to create checkout session. Please try again.', 'error')
        throw error
      }
      
      if (!data || !data.url) {
        console.error('Invalid response from checkout function:', data)
        showToast('Failed to create checkout session. Please try again.', 'error')
        return
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      showToast('Failed to create checkout session. Please try again.', 'error')
      setToast({ message: 'Failed to create checkout session. Please try again.', type: 'error' })
    } finally {
      setCheckoutLoading(prev => ({ ...prev, [PRODUCTS.PRO_TEAMS_SUBSCRIPTION.priceId]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Basic features to get started',
      features: [
        '5 prompt gallery',
        '1 team',
        '2 prompt flow',
        'Basic version control',
        'Public sharing'
      ],
      buttonText: 'Current Plan',
      buttonAction: () => {},
      buttonDisabled: true,
      priceId: '',
      highlighted: false,
      icon: <Zap className="text-zinc-400" size={24} />
    },
    {
      name: 'Basic Plan',
      price: '$10',
      period: 'per month',
      description: 'Perfect for individual creators',
      features: [
        '20 prompt gallery',
        '3 teams',
        '10 prompt flows',
        'Full version control',
        'Private sharing',
      ],
      priceId: PRODUCTS.BASIC_SUBSCRIPTION.priceId,
      buttonText: user ? 'Subscribe Now' : 'Sign In to Subscribe',
      buttonAction: user ? handleSubscribe : () => {},
      buttonDisabled: checkoutLoading[PRODUCTS.BASIC_SUBSCRIPTION.priceId] || !user,
      highlighted: true,
      icon: <Shield className="text-indigo-400" size={24} />
    },
    {
      name: 'Pro Plan',
      price: '$30',
      period: 'per month',
      description: 'For teams and power users',
      features: [
        'Everything in Basic',
        'Unlimited prompt',
        'Unlimited prompt flows',
        'Team collaboration',
        'Playground access'
        '10 team members'
      ],
      priceId: PRODUCTS.PRO_SUBSCRIPTION.priceId,
      buttonText: user ? 'Subscribe Now' : 'Sign In to Subscribe',
      buttonAction: user ? handleSubscribePro : () => {},
      buttonDisabled: checkoutLoading[PRODUCTS.PRO_SUBSCRIPTION.priceId] || !user,
      highlighted: false,
      icon: <Shield className="text-purple-400" size={24} />
    },
    {
      name: 'Pro Teams Plan',
      price: '$100',
      period: 'per month',
      description: 'Enterprise-grade solution',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'API access',
        'Dedicated support',
      ],
      priceId: PRODUCTS.PRO_TEAMS_SUBSCRIPTION.priceId,
      buttonText: user ? 'Subscribe Now' : 'Sign In to Subscribe',
      buttonAction: user ? handleSubscribeProTeams : () => {},
      buttonDisabled: checkoutLoading[PRODUCTS.PRO_TEAMS_SUBSCRIPTION.priceId] || !user,
      highlighted: false,
      icon: <Shield className="text-blue-400" size={24} />
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  data-menu-button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <Menu size={20} />
                </button>
                
                <h1 className="text-lg font-semibold text-white">
                  Pricing
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-7xl px-6 mx-auto py-12">
              {/* Running Text Banner */}
              <div className="bg-indigo-600/80 text-white font-bold py-3 mb-8 rounded-xl overflow-hidden text-center">
                <div className="running-text text-lg">
                   All users are on the Pro Plan during the "World's Largest Hackathon organized by Bolt" is currently underway
                </div>
              </div>
              
              {/* Page Header */}
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Upgrade your plan!
                </h1>
                <p className="text-xl text-zinc-400">
                  Choose the plan that fits your needs
                </p>
              </div>
              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {plans.map((plan, index) => (
                  <div 
                    key={index}
                    className={`relative bg-zinc-900/50 border rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                      plan.highlighted 
                        ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                        : 'border-zinc-800/50'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-xs font-bold py-1 text-center">
                        RECOMMENDED
                      </div>
                    )}
                    
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-xl ${plan.highlighted ? 'bg-indigo-600/20' : 'bg-zinc-800/50'}`}>
                          {plan.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          <span className="text-zinc-400 ml-2">{plan.period}</span>
                        </div>
                        <p className="text-zinc-400 mt-2">{plan.description}</p>
                      </div>
                      
                      <div className="space-y-4 mb-8">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle size={18} className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-indigo-400' : 'text-emerald-400'}`} />
                            <span className="text-zinc-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={plan.buttonAction}
                        disabled={plan.buttonDisabled}
                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                          plan.highlighted
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50 disabled:cursor-not-allowed'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:bg-zinc-800/50'
                        } disabled:cursor-not-allowed`}
                      >
                        {checkoutLoading[plan.priceId] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          plan.buttonText
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            
            </div>
          </div>
          
 
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BoltBadge />
    </div>
  )
}