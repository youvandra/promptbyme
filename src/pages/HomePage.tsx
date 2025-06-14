import React, { useEffect, useState } from 'react'
import { Menu, Zap } from 'lucide-react'
import { TerminalInput } from '../components/TerminalInput'
import { AuthModal } from '../components/AuthModal'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { SideNavbar } from '../components/SideNavbar'
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
          {/* Header - Only show for non-logged users */}
          {!user && (
            <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="text-white" size={16} />
                    </div>
                    <h1 className="text-xl font-semibold">
                      promptby.me
                    </h1>
                  </div>
                  
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 btn-hover"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </header>
          )}

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
            <div className={`w-full ${user ? 'max-w-6xl pl-6 pr-6' : 'max-w-6xl px-4'} mx-auto py-12`}>
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text" style={{ lineHeight: "1.5" }}>
                  Design before you prompt
                </h2>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  Map out your next build with structured, reusable prompts. Ready for solo or team workflows.
                </p>
              </div>

              {/* Terminal Input */}
              <div className="mb-12">
                <TerminalInput 
                  onSubmit={handleCreatePrompt}
                  loading={promptLoading}
                />
              </div>

              {/* ID LP-SCROLL : START FROM HERE */}
              
            </div>
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