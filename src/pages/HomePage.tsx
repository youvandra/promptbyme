import React, { useEffect, useState } from 'react'
import { User, LogOut, Terminal } from 'lucide-react'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { GlitchText } from '../components/GlitchText'
import { TerminalInput } from '../components/TerminalInput'
import { PromptCard } from '../components/PromptCard'
import { AuthModal } from '../components/AuthModal'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { useAuthStore } from '../store/authStore'
import { usePromptStore } from '../store/promptStore'
import { useLikeStore } from '../store/likeStore'

export const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const { user, loading: authLoading, signOut, initialize } = useAuthStore()
  const { 
    prompts, 
    loading: promptLoading, 
    fetchUserPrompts, 
    createPrompt, 
    deletePrompt,
    subscribeToUserPrompts 
  } = usePromptStore()
  const { fetchUserLikes } = useLikeStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      fetchUserLikes(user.id)
      const unsubscribe = subscribeToUserPrompts(user.id)
      return unsubscribe
    }
  }, [user, fetchUserPrompts, fetchUserLikes, subscribeToUserPrompts])

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
      })
      setToast({ message: '> Prompt saved. ::Sync complete', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to save prompt', type: 'error' })
    }
  }

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt(id)
      setToast({ message: '> Prompt deleted. ::Archive updated', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to delete prompt', type: 'error' })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setToast({ message: '> Session terminated. ::Goodbye', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to sign out', type: 'error' })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span>Initializing terminal...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-cyan-100 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="text-cyan-400" size={32} />
              <h1 className="text-2xl md:text-3xl font-bold font-mono">
                <GlitchText text="promptby.me" />
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <User size={16} className="text-cyan-400" />
                    <span className="text-cyan-300">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 font-mono text-sm"
                  >
                    <LogOut size={16} />
                    <span>Exit</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
                >
                  Access Terminal
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold font-mono mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Command Center
          </h2>
          <p className="text-xl text-cyan-300/80 font-mono max-w-2xl mx-auto leading-relaxed">
            Share your AI prompts with the collective. Save, organize, and distribute your most powerful commands.
          </p>
        </div>

        {/* Terminal Input */}
        <div className="mb-16">
          <TerminalInput 
            onSubmit={handleCreatePrompt}
            loading={promptLoading}
          />
        </div>

        {/* User's Prompts */}
        {user && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex-1" />
              <h3 className="text-xl font-bold font-mono text-cyan-300">
                Your Archive ({prompts.length})
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex-1" />
            </div>

            {promptLoading ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono">
                  <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                  <span>Loading archive...</span>
                </div>
              </div>
            ) : prompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    title={prompt.title}
                    content={prompt.content}
                    access={prompt.access}
                    createdAt={prompt.created_at}
                    views={prompt.views}
                    likeCount={prompt.like_count}
                    onDelete={handleDeletePrompt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-cyan-500/70 font-mono">
                  No prompts in archive. Create your first prompt above.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

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