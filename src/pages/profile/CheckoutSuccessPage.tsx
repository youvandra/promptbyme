import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'

export const CheckoutSuccessPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [countdown, setCountdown] = useState(5)

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
          {/* Content */}
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="w-full max-w-md px-6 py-12 text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-zinc-300 mb-8">
                Thank you for your subscription. Your account has been successfully upgraded.
              </p>
              
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