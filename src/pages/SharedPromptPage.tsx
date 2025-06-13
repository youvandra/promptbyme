import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Terminal, Copy, Eye, Lock, Heart, GitFork } from 'lucide-react'
import { marked } from 'marked'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { GlitchText } from '../components/GlitchText'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { AuthModal } from '../components/AuthModal'
import { usePromptStore } from '../store/promptStore'
import { useAuthStore } from '../store/authStore'
import { useLikeStore } from '../store/likeStore'
import { Database } from '../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

export const SharedPromptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isLiking, setIsLiking] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'like' | 'fork' | null>(null)
  
  const { fetchPromptById, incrementViews, forkPrompt } = usePromptStore()
  const { user, initialize } = useAuthStore()
  const { toggleLike, isLiked, fetchUserLikes } = useLikeStore()

  // Initialize auth state when component mounts
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) {
        setError('Invalid prompt ID')
        setLoading(false)
        return
      }

      try {
        const promptData = await fetchPromptById(id)
        if (!promptData) {
          setError('Prompt not found')
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
  }, [id, fetchPromptById, incrementViews])

  // Load user likes when user is available
  useEffect(() => {
    if (user) {
      fetchUserLikes(user.id)
      
      // If user just logged in and there was a pending action, execute it
      if (pendingAction && prompt) {
        setPendingAction(null)
        if (pendingAction === 'like') {
          handleLike()
        } else if (pendingAction === 'fork') {
          handleFork()
        }
      }
    }
  }, [user, fetchUserLikes])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: '> Content copied to clipboard', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to copy content', type: 'error' })
    }
  }

  const handleLike = async () => {
    if (!prompt) return

    // If user is not authenticated, show auth modal
    if (!user) {
      setPendingAction('like')
      setShowAuthModal(true)
      return
    }

    if (isLiking) return
    
    setIsLiking(true)
    try {
      const newLikeStatus = await toggleLike(prompt.id, user.id)
      
      // Update local prompt state to reflect the change immediately
      setPrompt(prev => prev ? {
        ...prev,
        like_count: (prev.like_count || 0) + (newLikeStatus ? 1 : -1)
      } : null)
      
      setToast({ 
        message: newLikeStatus ? '> Prompt liked' : '> Prompt unliked', 
        type: 'success' 
      })
    } catch (error) {
      console.error('Failed to toggle like:', error)
      setToast({ message: 'Failed to update like', type: 'error' })
    } finally {
      setIsLiking(false)
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
      
      setToast({ message: '> Prompt forked to your gallery', type: 'success' })
    } catch (error: any) {
      console.error('Failed to fork prompt:', error)
      setToast({ message: error.message || 'Failed to fork prompt', type: 'error' })
    } finally {
      setIsForking(false)
    }
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

  const userHasLiked = user && prompt ? isLiked(prompt.id) : false
  const isForkedPrompt = prompt?.original_prompt_id !== null
  const canFork = prompt && !isForkedPrompt

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-cyan-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span>Decrypting prompt...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-black text-cyan-100 relative overflow-hidden">
        <AnimatedBackground />
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="mb-8">
              <Lock className="mx-auto text-red-400 mb-4" size={64} />
              <h1 className="text-4xl font-bold font-mono text-red-400 mb-4">
                <GlitchText text="Access Denied" />
              </h1>
              <p className="text-xl text-red-300/80 font-mono">
                {error}
              </p>
            </div>
            
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft size={16} />
              <span>Return to Terminal</span>
            </Link>
          </div>
        </div>
        
        <BoltBadge />
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
            <Link
              to="/"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
            >
              <ArrowLeft size={20} />
              <span>Back to Terminal</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Terminal className="text-cyan-400" size={24} />
              <h1 className="text-xl font-bold font-mono">
                <GlitchText text="promptby.me" />
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Prompt Card */}
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
              <div className="flex-1 min-w-0">
                {prompt.title && (
                  <h2 className="text-2xl md:text-3xl font-bold text-cyan-100 mb-4 font-mono break-words">
                    {prompt.title}
                  </h2>
                )}
                <div className="flex items-center gap-3 text-sm text-cyan-500/70 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Eye size={14} />
                    <span className="font-mono">Public</span>
                  </div>
                  
                  {/* Fork indicator */}
                  {isForkedPrompt && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <GitFork size={14} className="text-orange-400" />
                        <span className="font-mono text-orange-400">forked prompt</span>
                      </div>
                    </>
                  )}
                  
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye size={14} className="text-purple-400" />
                    <span className="font-mono text-purple-400">{formatViews(prompt.views || 0)} views</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Heart size={14} className="text-red-400" />
                    <span className="font-mono text-red-400">{formatViews(prompt.like_count || 0)} likes</span>
                  </div>
                  
                  {/* Fork count - only show for original prompts */}
                  {canFork && (prompt.fork_count || 0) > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <GitFork size={14} className="text-green-400" />
                        <span className="font-mono text-green-400">{formatViews(prompt.fork_count || 0)} forks</span>
                      </div>
                    </>
                  )}
                  
                  <span>•</span>
                  <span className="font-mono">{formatDate(prompt.created_at || '')}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 lg:flex-shrink-0">
                {/* Fork button - only show for original prompts */}
                {canFork && (
                  <button
                    onClick={handleFork}
                    disabled={isForking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 font-mono text-sm transform hover:scale-105 ${
                      isForking 
                        ? 'opacity-50 cursor-not-allowed bg-green-500/10 border-green-500/30 text-green-400/50'
                        : 'bg-green-500/10 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/20 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20'
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
                
                {/* Like button */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 font-mono text-sm group transform hover:scale-105 ${
                    userHasLiked
                      ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20'
                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20'
                  } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={user ? (userHasLiked ? 'Unlike this prompt' : 'Like this prompt') : 'Sign in to like this prompt'}
                >
                  <Heart 
                    size={16} 
                    className={`transition-all duration-200 ${
                      userHasLiked 
                        ? 'fill-current scale-110' 
                        : 'group-hover:scale-110'
                    }`} 
                  />
                  <span>
                    {isLiking 
                      ? '...'
                      : user 
                        ? (userHasLiked ? 'Liked' : 'Like')
                        : 'Like'
                    }
                  </span>
                </button>
                
                {/* Copy button */}
                <button
                  onClick={() => copyToClipboard(prompt.content)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400/50 rounded-lg transition-all duration-300 font-mono text-sm transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-black/20 border border-cyan-500/20 rounded-lg p-6">
              <div 
                className="text-cyan-100/90 font-mono leading-relaxed prose prose-invert prose-cyan max-w-none"
                dangerouslySetInnerHTML={renderContent()}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              />
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-cyan-500/20">
              <p className="text-center text-cyan-500/70 font-mono text-sm">
                Created with{' '}
                <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  promptby.me
                </Link>
                {' '}• AI prompt sharing platform
              </p>
            </div>
          </div>

          {/* Call to action for non-authenticated users */}
          {!user && (
            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-cyan-100 mb-2 font-mono">
                  Join the Community
                </h3>
                <p className="text-cyan-300/80 font-mono mb-4">
                  Sign up to like prompts, fork them to your gallery, and share your own AI prompts with the world.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

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