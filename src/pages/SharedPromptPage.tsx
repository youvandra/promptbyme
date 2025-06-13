import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Terminal, Copy, Eye, Lock } from 'lucide-react'
import { marked } from 'marked'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { GlitchText } from '../components/GlitchText'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { usePromptStore } from '../store/promptStore'
import { Database } from '../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

export const SharedPromptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const { fetchPromptById, incrementViews } = usePromptStore()

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: '> Content copied to clipboard', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to copy content', type: 'error' })
    }
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
                <GlitchText text="Shared Prompt" />
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
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
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
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye size={14} className="text-purple-400" />
                    <span className="font-mono text-purple-400">{formatViews(prompt.views || 0)} views</span>
                  </div>
                  <span>•</span>
                  <span className="font-mono">{formatDate(prompt.created_at)}</span>
                </div>
              </div>
              
              <button
                onClick={() => copyToClipboard(prompt.content)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400/50 rounded-lg transition-all duration-300 font-mono text-sm flex-shrink-0"
              >
                <Copy size={16} />
                <span>Copy</span>
              </button>
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
                  Share My Prompt
                </Link>
                {' '}• A Sharing prompt platform
              </p>
            </div>
          </div>
        </div>
      </main>

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