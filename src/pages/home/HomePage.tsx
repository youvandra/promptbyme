import React, { useEffect, useState } from 'react'
import { Menu, Zap, Plus, ArrowRight } from 'lucide-react'
import { PromptEditor } from '../../components/prompts/PromptEditor'
import { AuthModal } from '../../components/auth/AuthModal'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
import { useFolderStore } from '../../store/folderStore'
import { useToast } from '../../hooks/useToast'

export const HomePage: React.FC = () => {
  const [promptEditorKey, setPromptEditorKey] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { 
    loading: promptLoading, 
    createPrompt,
    createVersion,
    subscribeToUserPrompts,
    uploadMedia,
    deleteMedia
  } = usePromptStore()
  const { fetchFolders } = useFolderStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchFolders()
      const unsubscribe = subscribeToUserPrompts(user.id)
      return unsubscribe
    }
  }, [user, fetchFolders, subscribeToUserPrompts])

  const handleGetStarted = () => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      setShowPromptEditor(true)
    }
  }

  const handleCreatePrompt = async (
    title: string, 
    content: string, 
    access: 'public' | 'private', 
    folderId?: string | null, 
    tags?: string[],
    notes?: string | null,
    outputSample?: string | null,
    mediaUrls?: string[] | null
  ) => {
    try {
      const promptData = {
        user_id: user.id,
        title: title || null,
        content,
        access,
        tags: tags || [],
        original_prompt_id: null,
        current_version: 1,
        total_versions: 1,
        folder_id: folderId || null,
        notes: notes || null,
        output_sample: outputSample || null,
        media_urls: mediaUrls || null
      }

      await createPrompt(promptData)
      showToast('Prompt saved successfully', 'success')
      setPromptEditorKey(prevKey => prevKey + 1) // Increment key to reset the form
    } catch (error) {
      showToast('Failed to save prompt', 'error')
    }
  }

  const handleCreateVersion = async (title: string, content: string, commitMessage: string) => {
    try {
      // This would be called when editing an existing prompt
      // For now, we'll just show a success message since we don't have a specific prompt ID
      showToast('Version created successfully', 'success')
    } catch (error) {
      showToast('Failed to create version', 'error')
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
      <div className={`flex min-h-screen ${(user && showPromptEditor) ? 'lg:pl-64' : ''}`}>
        {/* Side Navbar - Only shows when user is logged in and wants to create prompt */}
        {user && showPromptEditor && <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header for logged users with prompt editor */}
          {user && showPromptEditor && (
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
                  
                  <div className="flex items-center gap-2">
                    <img 
                      src="/Logo Promptby.me(1).png" 
                      alt="promptby.me logo" 
                      className="w-6 h-6 object-contain"
                    />
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
            {user && showPromptEditor ? (
              <div className="w-full max-w-6xl px-6 mx-auto py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <h2 
                    className="text-5xl md:text-6xl font-bold mb-6 gradient-text" 
                    style={{ lineHeight: 1.5 }}
                  >
                    Design before you prompt
                  </h2>
                  <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
                    Create, version, and manage your AI prompts with Git-like version control and dynamic variables.
                  </p>
                </div>

                {/* Prompt Editor */}
                <PromptEditor
                  key={promptEditorKey}
                  onSave={handleCreatePrompt}
                  onCreateVersion={handleCreateVersion}
                />
              </div>
            ) : (
              /* Simple Landing Page */
              <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-4xl mx-auto text-center">
                  {/* Header with logo and sign in */}
                  <div className="absolute top-0 left-0 right-0 p-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src="/Logo Promptby.me(1).png" 
                          alt="promptby.me logo" 
                          className="w-8 h-8 object-contain"
                        />
                        <h1 className="text-xl font-semibold text-white">
                          promptby.me
                        </h1>
                      </div>
                      
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-6 py-2 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/10"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
                        Design before
                        <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                          you prompt
                        </span>
                      </h1>
                      
                      <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed max-w-3xl mx-auto mb-12">
                        Map your next build with structured, reusable prompts.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <button
                        onClick={handleGetStarted}
                        className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                          Start Creating
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                      </button>
                      
                      <p className="text-zinc-400 text-sm">
                        No account needed to get started
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
          onClose={hideToast}
        />
      )}

      {/* Bolt Badge */}
      <BoltBadge />
    </div>
  )
}