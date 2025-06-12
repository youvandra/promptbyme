import React, { useState } from 'react'
import { Copy, Trash2, Eye, Lock, ExternalLink } from 'lucide-react'
import { marked } from 'marked'

interface PromptCardProps {
  id: string
  title?: string
  content: string
  access: 'public' | 'private'
  createdAt: string
  onDelete?: (id: string) => void
  showActions?: boolean
}

export const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  content,
  access,
  createdAt,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
            <div className="flex items-center gap-2 text-sm text-cyan-500/70">
              {access === 'private' ? (
                <Lock size={14} />
              ) : (
                <Eye size={14} />
              )}
              <span className="font-mono">{access}</span>
              <span>•</span>
              <span className="font-mono">{formatDate(createdAt)}</span>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2 flex-shrink-0">
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