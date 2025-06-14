import React, { useState } from 'react'
import { Copy, Trash2, Eye, Lock, ExternalLink, GitFork } from 'lucide-react'
import { marked } from 'marked'

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    
    // Only toggle if content should be truncated
    if (shouldTruncate) {
      setIsExpanded(!isExpanded)
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

  const isForkedPrompt = originalPromptId !== null

  return (
    <div 
      className={`group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-200 transform hover:scale-[1.02] flex flex-col h-full card-hover ${
        shouldTruncate ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-white mb-2 truncate">
                {title}
              </h3>
            )}
            <div className="text-sm text-zinc-500">
              {formatDate(createdAt)}
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2 flex-shrink-0">
              <button
                onClick={() => copyToClipboard(content)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                title="Copy content"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={copyLink}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                title="Copy link"
              >
                <ExternalLink size={16} />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
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
            className="text-zinc-300 text-sm leading-relaxed prose prose-invert max-w-none flex-1"
            dangerouslySetInnerHTML={renderContent()}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
          />
        </div>

        {/* Bottom section with stats and show more button */}
        <div className="mt-4 flex items-center justify-between gap-4">
          {/* Stats on the left */}
          <div className="flex items-center gap-3 text-xs">
            {/* Access indicator */}
            <div className="flex items-center gap-1">
              {access === 'private' ? (
                <Lock size={12} className="text-amber-400" />
              ) : (
                <Eye size={12} className="text-emerald-400" />
              )}
              <span className={`${access === 'private' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {access}
              </span>
            </div>

            {/* Fork indicator */}
            {isForkedPrompt && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1">
                  <GitFork size={12} className="text-orange-400" />
                  <span className="text-orange-400">forked</span>
                </div>
              </>
            )}

            {/* Public prompt stats */}
            {access === 'public' && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1">
                  <Eye size={12} className="text-zinc-400" />
                  <span className="text-zinc-400">{formatViews(views)}</span>
                </div>
                
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400">{formatViews(likeCount)} likes</span>
                </div>
                
                {/* Fork count - only show for original prompts */}
                {!isForkedPrompt && forkCount > 0 && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <div className="flex items-center gap-1">
                      <GitFork size={12} className="text-zinc-400" />
                      <span className="text-zinc-400">{formatViews(forkCount)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Show more/less button on the right */}
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors duration-200 flex-shrink-0"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Copy feedback */}
      {copied && (
        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs animate-pulse z-50">
          Copied!
        </div>
      )}
    </div>
  )
}