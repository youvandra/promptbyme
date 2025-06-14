import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Eye, Lock, Heart, GitFork, Zap } from 'lucide-react'
import { marked } from 'marked'
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
      setToast({ message: 'Content copied to clipboard', type: 'success' })
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
        message: newLikeStatus ? 'Prompt liked' : 'Prompt unliked', 
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
      
      setToast({ message: 'Prompt forked to your gallery', type: 'success' })
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

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="mb-8">
              <Lock className="mx-auto text-red-400 mb-4" size={64} />
              <h1 className="text-4xl font-bold text-red-400 mb-4">
                Access Denied
              </h1>
              <p className="text-xl text-red-300">
                {error}
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
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white" size={12} />
              </div>
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
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Heart size={14} className="text-pink-400" />
                    <span className="text-pink-400">{formatViews(prompt.like_count || 0)} likes</span>
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
                
                {/* Like button */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-medium group transform hover:scale-105 ${
                    userHasLiked
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                      : 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20'
                  } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'btn-hover'}`}
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
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all duration-200 text-sm font-medium transform hover:scale-105 btn-hover"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
              <div 
                className="text-zinc-200 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={renderContent()}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              />
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