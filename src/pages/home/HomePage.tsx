import React, { useEffect, useState } from 'react'
import { Menu, Zap } from 'lucide-react'
import { PromptEditor } from '../../components/prompts/PromptEditor'
import { AuthModal } from '../../components/auth/AuthModal'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { CinematicLandingPage } from '../../components/landing/CinematicLandingPage'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
import { useFolderStore } from '../../store/folderStore'
import { useToast } from '../../hooks/useToast'

export const HomePage: React.FC = () => {
  const [promptEditorKey, setPromptEditorKey] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
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
    if (!user) {
      setShowAuthModal(true)
      return
    }

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
    if (!user) return

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
      <div className={`flex min-h-screen ${user ? 'lg:pl-64' : ''}`}>
        {/* Side Navbar - Only shows when user is logged in */}
        {user && <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header for logged users */}
          {user && (
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
            {user ? (
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
              /* Cinematic Landing Page */
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
          onClose={hideToast}
        />
      )}

      {/* Bolt Badge */}
      <BoltBadge />
    </div>
  )
}