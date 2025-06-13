import React, { useEffect, useState } from 'react'
import { User, LogOut, Terminal, FolderOpen, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { GlitchText } from '../components/GlitchText'
import { TerminalInput } from '../components/TerminalInput'
import { PromptCard } from '../components/PromptCard'
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
        original_prompt_id: null,
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
      
      {/* Side Navbar - Only shows when user is logged in */}
      {user && <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      
      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Menu button for logged in users */}
              {user && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-cyan-400 hover:text-cyan-300 transition-colors mr-3"
                >
                  <Menu size={24} />
                </button>
              )}
              <Terminal className="text-cyan-400" size={32} />
              <h1 className="text-2xl md:text-3xl font-bold font-mono">
                <GlitchText text="promptby.me" />
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Quick nav for logged in users */}
                  <div className="hidden md:flex items-center gap-3">
                    <Link
                      to="/gallery"
                      className="flex items-center gap-2 px-3 py-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 font-mono text-sm"
                    >
                      <FolderOpen size={16} />
                      <span>Gallery</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-all duration-200 font-mono text-sm"
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <User size={16} className="text-cyan-400" />
                    <span className="text-cyan-300 hidden sm:inline">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 font-mono text-sm"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Exit</span>
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

        {/* User's Prompts - Show recent prompts if logged in */}
        {user && prompts.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex-1" />
                <h3 className="text-xl font-bold font-mono text-cyan-300">
                  Recent Prompts ({Math.min(prompts.length, 6)})
                </h3>
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex-1" />
              </div>
              
              {prompts.length > 6 && (
                <Link
                  to="/gallery"
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors"
                >
                  View All ({prompts.length})
                </Link>
              )}
            </div>

            {promptLoading ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono">
                  <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                  <span>Loading archive...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.slice(0, 6).map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    title={prompt.title}
                    content={prompt.content}
                    access={prompt.access}
                    createdAt={prompt.created_at}
                    views={prompt.views}
                    likeCount={prompt.like_count}
                    forkCount={prompt.fork_count}
                    originalPromptId={prompt.original_prompt_id}
                    onDelete={handleDeletePrompt}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Getting Started Guide for new users */}
        {!user && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-cyan-100 mb-4 font-mono text-center">
                Welcome to the Terminal
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Terminal className="text-cyan-400" size={24} />
                  </div>
                  <h4 className="font-mono font-bold text-cyan-100 mb-2">Create</h4>
                  <p className="text-cyan-300/80 font-mono text-sm">
                    Write and save your AI prompts with markdown support
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <User className="text-purple-400" size={24} />
                  </div>
                  <h4 className="font-mono font-bold text-cyan-100 mb-2">Share</h4>
                  <p className="text-cyan-300/80 font-mono text-sm">
                    Make prompts public and share them with the community
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="text-green-400" size={24} />
                  </div>
                  <h4 className="font-mono font-bold text-cyan-100 mb-2">Organize</h4>
                  <p className="text-cyan-300/80 font-mono text-sm">
                    Keep your prompts organized in your personal gallery
                  </p>
                </div>
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
                >
                  Join the Collective
                </button>
              </div>
            </div>
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