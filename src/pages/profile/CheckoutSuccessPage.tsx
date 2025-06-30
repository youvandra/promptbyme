import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { PRODUCTS } from '../../stripe-config'

export const CheckoutSuccessPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [countdown, setCountdown] = useState(5)

  // Fetch subscription details
  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails()
    }
  }, [user])

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true)
      
      // Check if user has a Stripe subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (!subscriptionError && subscriptionData) {
        setSubscriptionDetails(subscriptionData)
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Redirect to profile page after 5 seconds
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      navigate('/profile')
    }
  }, [countdown, navigate])

  // If user is not authenticated, redirect to home
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  if (!user) {
    return null // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
                    {subscriptionDetails.price_id === PRODUCTS.BASIC_SUBSCRIPTION.priceId ? 'Basic' : 
                     subscriptionDetails.price_id === PRODUCTS.PRO_SUBSCRIPTION.priceId ? 'Pro' : 
                     subscriptionDetails.price_id === PRODUCTS.PRO_TEAMS_SUBSCRIPTION.priceId ? 'Pro Teams' : 
                     'Unknown Plan'}
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-zinc-300 mb-4">
                Thank you for your subscription! Your account has been successfully upgraded.
              </p>
              
              {subscriptionDetails && (
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-zinc-400 mb-2">
                    Your subscription is now <span className="text-emerald-400 font-medium">active</span>
                  </p>
                  <p className="text-sm text-zinc-400">
                    Plan: <span className="text-white font-medium">
                      {subscriptionDetails.price_id === 'price_1RfI93DBQ23Gbj5CiqTXSOek' ? 'Basic' : 
                       subscriptionDetails.price_id === 'price_1RfX9LDBQ23Gbj5Chxtu1qWh' ? 'Pro' : 
                       'Subscription'}
                    </span>
                  </p>
                </div>
              )}
              
              <p className="text-zinc-400 mb-8">
                Redirecting to your profile in {countdown} seconds...
              </p>
              
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft size={16} />
                <span>Go to Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <BoltBadge />
    </div>
  )
}