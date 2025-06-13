import React, { useState } from 'react'
import { Copy, Trash2, Eye, Lock, ExternalLink, Heart, GitFork } from 'lucide-react'
import { marked } from 'marked'
import { useAuthStore } from '../store/authStore'
import { useLikeStore } from '../store/likeStore'

interface PromptCardProps {
  id: string
  title?: string
  content: string
  access: 'public' | 'private'
  createdAt: string
  views?: number
  likeCount?: number
  forkCount?: number
  originalPromptId?: string | null
  onDelete?: (id: string) => void
  showActions?: boolean
}

export const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  content,
  access,
  createdAt,
  views = 0,
  likeCount = 0,
  forkCount = 0,
  originalPromptId = null,
  onDelete,
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  
  const { user } = useAuthStore()
  const { toggleLike, isLiked } = useLikeStore()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyLink = async () => {
    const link = `${window.location.origin}/p/${id}`
    await copyToClipboard(link)
  }

  const handleLike = async () => {
    if (!user || isLiking) return
    
    setIsLiking(true)
    try {
      await toggleLike(id, user.id)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const shouldTruncate = content.length > 150
  const displayContent = isExpanded ? content : truncateText(content)

  const renderContent = () => {
    try {
      const html = marked(displayContent, { breaks: true })
      return { __html: html }
    } catch {
      return { __html: displayContent.replace(/\n/g, '<br>') }
    }
  }

  const userHasLiked = user ? isLiked(id) : false
  const isForkedPrompt = originalPromptId !== null

  return (
    <div className="group relative bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 flex flex-col h-full">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-bold text-cyan-100 mb-2 font-mono truncate">
                {title}
              </h3>
            )}
            <div className="flex items-center gap-2 text-sm text-cyan-500/70 flex-wrap">
              <div className="flex items-center gap-1">
                {access === 'private' ? (
                  <Lock size={14} />
                ) : (
                  <Eye size={14} />
                )}
                <span className="font-mono">{access}</span>
              </div>
              
              {/* Fork indicator */}
              {isForkedPrompt && (
                <span>•</span>
              )}
              {isForkedPrompt && (
                <div className="flex items-center gap-1">
                  <GitFork size={14} className="text-orange-400" />
                  <span className="font-mono text-orange-400">forked prompt</span>
                </div>
              )}
              
              {access === 'public' && (
                <span>•</span>
              )}
              {access === 'public' && (
                <div className="flex items-center gap-1">
                  <Eye size={14} className="text-purple-400" />
                  <span className="font-mono text-purple-400">{formatViews(views)}</span>
                </div>
              )}
              {access === 'public' && (
                <span>•</span>
              )}
              {access === 'public' && (
                <div className="flex items-center gap-1">
                  <Heart size={14} className="text-red-400" />
                  <span className="font-mono text-red-400">{formatViews(likeCount)}</span>
                </div>
              )}
              
              {/* Fork count - only show for original prompts */}
              {access === 'public' && !isForkedPrompt && forkCount > 0 && (
                <span>•</span>
              )}
              {access === 'public' && !isForkedPrompt && forkCount > 0 && (
                <div className="flex items-center gap-1">
                  <GitFork size={14} className="text-green-400" />
                  <span className="font-mono text-green-400">{formatViews(forkCount)}</span>
                </div>
              )}
              
              <span>•</span>
              <span className="font-mono">{formatDate(createdAt)}</span>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2 flex-shrink-0">
              {/* Like button - only show for public prompts and authenticated users */}
              {access === 'public' && user && (
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    userHasLiked
                      ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                      : 'text-red-400/50 hover:text-red-400 hover:bg-red-500/20'
                  } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={userHasLiked ? 'Unlike' : 'Like'}
                >
                  <Heart size={16} className={userHasLiked ? 'fill-current' : ''} />
                </button>
              )}
              
              <button
                onClick={() => copyToClipboard(content)}
                className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all duration-200"
                title="Copy content"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={copyLink}
                className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
                title="Copy link"
              >
                <ExternalLink size={16} />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                  title="Delete prompt"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div 
            className="text-cyan-100/90 font-mono text-sm leading-relaxed prose prose-invert prose-cyan max-w-none flex-1"
            dangerouslySetInnerHTML={renderContent()}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
          />
          
          {/* Expand/Collapse button */}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-colors duration-200 self-start"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Copy feedback */}
      {copied && (
        <div className="absolute top-2 right-2 bg-green-500 text-black px-2 py-1 rounded text-xs font-mono animate-pulse z-20">
          Copied!
        </div>
      )}
    </div>
  )
}