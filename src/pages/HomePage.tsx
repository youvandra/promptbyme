import React, { useEffect, useState } from 'react'
import { Menu, Zap } from 'lucide-react'
import { TerminalInput } from '../components/TerminalInput'
import { AuthModal } from '../components/AuthModal'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { SideNavbar } from '../components/SideNavbar'
import { CinematicLandingPage } from '../components/CinematicLandingPage'
import { useAuthStore } from '../store/authStore'
import { usePromptStore } from '../store/promptStore'
import { useLikeStore } from '../store/likeStore'

export const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { 
    loading: promptLoading, 
    createPrompt,
    subscribeToUserPrompts 
  } = usePromptStore()
  const { fetchUserLikes } = useLikeStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchUserLikes(user.id)
      const unsubscribe = subscribeToUserPrompts(user.id)
      return unsubscribe
    }
  }, [user, fetchUserLikes, subscribeToUserPrompts])

  const handleCreatePrompt = async (title: string, content: string, access: 'public' | 'private') => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      await createPrompt({
        user_id: user.id,
        title: title || null,
        content,
        access,
        tags: [],
        original_prompt_id: null,
      })
      setToast({ message: 'Prompt saved successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to save prompt', type: 'error' })
    }
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
      <div className="flex min-h-screen">
        {/* Side Navbar - Only shows when user is logged in */}
        {user && <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen ${user ? '' : ''}`}>
          {/* Mobile Header for logged users */}
          {user && (
            <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-zinc-400 hover:text-white transition-colors p-1"
                  >
                    <Menu size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="text-white" size={12} />
                    </div>
                    <h1 className="text-lg font-semibold">
                      promptby.me
                    </h1>
                  </div>
                  
                  <div className="w-6" /> {/* Spacer for centering */}
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="relative z-10 flex-1">
            {user ? (
              <div className="w-full max-w-6xl pl-6 pr-6 mx-auto py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
                    Design before you prompt
                  </h2>
                  <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                    Map your next build with structured, reusable prompts.
                  </p>
                </div>

                {/* Terminal Input */}
                <div className="mb-12">
                  <TerminalInput 
                    onSubmit={handleCreatePrompt}
                    loading={promptLoading}
                  />
                </div>
              </div>
            ) : (
              /* ID LP-SCROLL : START FROM HERE */
              <CinematicLandingPage onSignInClick={() => setShowAuthModal(true)} />
            )}
          </main>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Bolt Badge */}
      <BoltBadge />
    </div>
  )
}