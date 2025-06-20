import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Eye, Lock, GitFork, Zap, Play } from 'lucide-react'
import { marked } from 'marked'
import { Toast } from '../../components/ui/Toast'
import { getAppTagById } from '../../lib/appTags'
import { PromptModal } from '../../components/prompts/PromptModal'
import { VariableFillModal } from '../../components/prompts/VariableFillModal'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { AuthModal } from '../../components/auth/AuthModal'
import { usePromptStore } from '../../store/promptStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

export const SharedPromptPage: React.FC = () => {
  const { username, id } = useParams<{ username: string; id: string }>()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [promptOwner, setPromptOwner] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isForking, setIsForking] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'fork' | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  
  const { fetchPromptById, incrementViews, forkPrompt } = usePromptStore()
  const { user, initialize } = useAuthStore()

  // Initialize auth state when component mounts
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id || !username) {
        setError('Invalid prompt URL')
        setLoading(false)
        return
      }

      try {
        // First, get the user by username to verify the route
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, display_name, email, is_public_profile')
          .eq('display_name', username)
          .single()

        if (userError || !userData) {
          setError('User not found')
          setLoading(false)
          return
        }

        // Check if user has public profile enabled
        if (userData.is_public_profile === false) {
          setError('This user has disabled their public profile')
          setLoading(false)
          return
        }

        setPromptOwner(userData)

        // Then get the prompt and verify it belongs to this user
        const promptData = await fetchPromptById(id)
        if (!promptData) {
          setError('Prompt not found')
        } else if (promptData.user_id !== userData.id) {
          setError('Prompt does not belong to this user')
        } else if (promptData.access === 'private') {
          setError('This prompt is private and cannot be accessed')
        } else {
          setPrompt(promptData)
          // Increment view count for public prompts
          await incrementViews(id)
        }
      } catch (err) {
        console.error('Error loading prompt:', err)
        setError('Failed to load prompt')
      } finally {
        setLoading(false)
      }
    }

    loadPrompt()
  }, [id, username, fetchPromptById, incrementViews])

  // Load user likes when user is available
  useEffect(() => {
    if (user) {
      
      // If user just logged in and there was a pending action, execute it
      if (pendingAction && prompt) {
        setPendingAction(null)
        if (pendingAction === 'fork') {
          handleFork()
        }
      }
    }
  }, [user])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: 'Content copied to clipboard', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to copy content', type: 'error' })
    }
  }

  const copyLink = async () => {
    if (!prompt || !promptOwner) return
    const link = `${window.location.origin}/${promptOwner.display_name}/${prompt.id}`
    await copyToClipboard(link)
    setToast({ message: 'Link copied to clipboard', type: 'success' })
  }

  const handleCopyClick = () => {
    if (!prompt) return
    
    // Check if content has variables
    const hasVariables = /\{\{([^}]+)\}\}/.test(prompt.content)
    
    if (hasVariables) {
      setShowVariableModal(true)
    } else {
      copyToClipboard(prompt.content)
    }
  }

  const handleFork = async () => {
    if (!prompt) return

    // If user is not authenticated, show auth modal
    if (!user) {
      setPendingAction('fork')
      setShowAuthModal(true)
      return
    }

    if (isForking) return

    // Check if this is already a forked prompt
    if (prompt.original_prompt_id !== null) {
      setToast({ message: 'Cannot fork a forked prompt. Only original prompts can be forked.', type: 'error' })
      return
    }

    setIsForking(true)
    try {
      await forkPrompt(prompt.id, user.id)
      
      // Update local prompt state to reflect the fork count increase
      setPrompt(prev => prev ? {
        ...prev,
        fork_count: (prev.fork_count || 0) + 1
      } : null)
      
      setToast({ message: 'Prompt forked to your gallery', type: 'success' })
    } catch (error: any) {
      console.error('Failed to fork prompt:', error)
      setToast({ message: error.message || 'Failed to fork prompt', type: 'error' })
    } finally {
      setIsForking(false)
    }
  }

  const handleRunInApp = async () => {
    if (!prompt || !prompt.tags || prompt.tags.length === 0) return
    
    const tag = getAppTagById(prompt.tags[0])
    if (!tag || !tag.runUrl) return
    
    setIsRunning(true)
    
    try {
      // Check if content has variables
      const hasVariables = /\{\{([^}]+)\}\}/.test(prompt.content)
      
      if (hasVariables) {
        setShowVariableModal(true)
      } else {
        await runPromptInApp(prompt.content, tag)
      }
    } catch (error) {
      setToast({ message: 'Failed to run prompt', type: 'error' })
    } finally {
      setIsRunning(false)
    }
  }

  const runPromptInApp = async (content: string, tag: any) => {
    try {
      // Copy content to clipboard
      await navigator.clipboard.writeText(content)
      
      // Open the app URL
      let url = tag.runUrl
      
      // For apps that support query parameters, append the content
      if (tag.id === 'chatgpt' || tag.id === 'claude' || tag.id === 'perplexity') {
        url += encodeURIComponent(content)
      }
      
      window.open(url, '_blank')
      setToast({ message: `Prompt copied and ${tag.name} opened`, type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to copy prompt', type: 'error' })
    }
  }

  const handleVariablesFilled = async (filledContent: string) => {
    if (!prompt || !prompt.tags || prompt.tags.length === 0) return
    
    const tag = getAppTagById(prompt.tags[0])
    if (!tag || !tag.runUrl) return
    
    await runPromptInApp(filledContent, tag)
    setShowVariableModal(false)
  }

  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    setPendingAction(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatViews = (count: number) => {
    if (count === 0) return '0'
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 1000000).toFixed(1)}M`
  }

  const renderContent = () => {
    if (!prompt) return { __html: '' }
    
    try {
      const html = marked(prompt.content, { breaks: true })
      return { __html: html }
    } catch {
      return { __html: prompt.content.replace(/\n/g, '<br>') }
    }
  }

  const isForkedPrompt = prompt?.original_prompt_id !== null
  const canFork = prompt && !isForkedPrompt
  const canRunInApp = prompt && prompt.tags && prompt.tags.length > 0 && prompt.tags[0] && getAppTagById(prompt.tags[0])?.runUrl

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative z-10 text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading prompt...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !prompt || !promptOwner) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="mb-8">
              <Lock className="mx-auto text-red-400 mb-4" size={64} />
              <h1 className="text-4xl font-bold text-red-400 mb-4">
                Access Denied
              </h1>
              <p className="text-xl text-red-300 mb-8">
                {error === 'This user has disabled their public profile'
                  ? 'This user has chosen to keep their profile and prompts private.'
                  : error
                }
              </p>
            </div>
            
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
            >
              <ArrowLeft size={16} />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
        
        <BoltBadge />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <img 
                src="/Logo Promptby.me(1).png" 
                alt="promptby.me logo" 
                className="w-6 h-6 object-contain"
              />
              <h1 className="text-lg font-semibold">
                promptby.me
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Prompt Card */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
              <div className="flex-1 min-w-0">
                {/* Tags Display */}
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {prompt.tags.map((tagId) => {
                      const tag = getAppTagById(tagId)
                      if (!tag) return null
                      
                      const Icon = tag.icon
                      return (
                        <div
                          key={tagId}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/30 rounded-lg"
                        >
                          <Icon 
                            size={14} 
                            style={{ color: tag.color }}
                          />
                          <span className="text-zinc-300 font-medium text-sm">{tag.name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Author info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {promptOwner.display_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{promptOwner.display_name}</p>
                    <p className="text-zinc-400 text-sm">@{username}</p>
                  </div>
                </div>

                {prompt.title && (
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 break-words">
                    {prompt.title}
                  </h2>
                )}
                <div className="flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Eye size={14} />
                    <span>Public</span>
                  </div>
                  
                  {/* Fork indicator */}
                  {isForkedPrompt && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <GitFork size={14} className="text-orange-400" />
                        <span className="text-orange-400">forked prompt</span>
                      </div>
                    </>
                  )}
                  
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye size={14} className="text-purple-400" />
                    <span className="text-purple-400">{formatViews(prompt.views || 0)} views</span>
                  </div>
                  
                  {/* Fork count - only show for original prompts */}
                  {canFork && (prompt.fork_count || 0) > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <GitFork size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">{formatViews(prompt.fork_count || 0)} forks</span>
                      </div>
                    </>
                  )}
                  
                  <span>•</span>
                  <span>{formatDate(prompt.created_at || '')}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 lg:flex-shrink-0">
                {/* Run in App button */}
                {canRunInApp && (
                  <button
                    onClick={handleRunInApp}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-medium transform hover:scale-105 ${
                      isRunning 
                        ? 'opacity-50 cursor-not-allowed bg-purple-500/10 border-purple-500/30 text-purple-400/50'
                        : 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 btn-hover'
                    }`}
                  >
                    <Play size={16} />
                    <span>
                      {isRunning 
                        ? 'Running...'
                        : `Run in ${getAppTagById(prompt.tags[0])?.name}`
                      }
                    </span>
                  </button>
                )}

                {/* Fork button - only show for original prompts */}
                {canFork && (
                  <button
                    onClick={handleFork}
                    disabled={isForking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-medium transform hover:scale-105 ${
                      isForking 
                        ? 'opacity-50 cursor-not-allowed bg-emerald-500/10 border-emerald-500/30 text-emerald-400/50'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 btn-hover'
                    }`}
                    title={user ? 'Fork this prompt to your gallery' : 'Sign in to fork this prompt'}
                  >
                    <GitFork size={16} />
                    <span>
                      {isForking 
                        ? 'Forking...'
                        : 'Fork'
                      }
                    </span>
                  </button>
                )}
                
                {/* Copy button */}
                <button
                  onClick={handleCopyClick}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all duration-200 text-sm font-medium transform hover:scale-105 btn-hover"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6 cursor-pointer hover:border-zinc-600/50 transition-all duration-200"
              onClick={() => setShowModal(true)}
            >
              <div 
                className="text-zinc-200 leading-relaxed prose prose-invert max-w-none line-clamp-6"
                dangerouslySetInnerHTML={renderContent()}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              />
              <div className="mt-4 text-center">
                <span className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
                  Click to view full content →
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-zinc-800/50">
              <p className="text-center text-zinc-500 text-sm">
                Created with{' '}
                <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  promptby.me
                </Link>
              </p>
            </div>
          </div>

          {/* Call to action for non-authenticated users */}
          {!user && (
            <div className="mt-8 text-center">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Join the Community
                </h3>
                <p className="text-zinc-400 mb-4">
                  Sign up to like prompts, fork them to your gallery, and share your own AI prompts with the world.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Prompt Modal */}
      <PromptModal
        prompt={prompt}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        showActions={false}
        isOwner={false}
      />

      {/* Variable Fill Modal */}
      <VariableFillModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        promptContent={prompt?.content || ''}
        promptTitle={prompt?.title || undefined}
        onVariablesFilled={handleVariablesFilled}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthModalClose} 
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