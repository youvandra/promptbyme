import React, { useState } from 'react'
import { Copy, Trash2, Eye, Lock, ExternalLink, GitFork, Maximize2, History, Edit3, Share2, FolderOpen, Move, Play } from 'lucide-react'
import { marked } from 'marked'
import { motion } from 'framer-motion'
import { getAppTagById } from '../../lib/appTags'
import { ContextMenu } from '../ui/ContextMenu'
import { supabase } from '../../lib/supabase'
import { VariableFillModal } from './VariableFillModal'
import { useNavigate } from 'react-router-dom'

interface Folder {
  id: string
  name: string
  color: string
}

interface PromptCardProps {
  id: string
  title?: string
  content: string
  access: 'public' | 'private'
  createdAt: string
  views?: number
  forkCount?: number
  originalPromptId?: string | null
  currentVersion?: number
  totalVersions?: number
  tags?: string[] | null
  folders?: Folder[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  onViewHistory?: (id: string) => void
  onMoveToFolder?: (promptId: string, folderId: string | null) => void
  onShare?: (id: string) => void
  showActions?: boolean
  enableContextMenu?: boolean
  showUseButton?: boolean
}

// Memoized date formatter to avoid repeated calculations
const formatDate = (() => {
  const cache = new Map<string, string>()
  return (dateString: string) => {
    if (cache.has(dateString)) {
      return cache.get(dateString)!
    }
    const formatted = new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    cache.set(dateString, formatted)
    return formatted
  }
})()

// Memoized view formatter to avoid repeated calculations
const formatViews = (() => {
  const cache = new Map<number, string>()
  return (count: number) => {
    if (cache.has(count)) {
      return cache.get(count)!
    }
    let formatted: string
    if (count === 0) formatted = '0'
    else if (count < 1000) formatted = count.toString()
    else if (count < 1000000) formatted = `${(count / 1000).toFixed(1)}k`
    else formatted = `${(count / 1000000).toFixed(1)}M`
    
    cache.set(count, formatted)
    return formatted
  }
})()

// Memoized content truncation
const truncateText = (() => {
  const cache = new Map<string, string>()
  return (text: string, maxLength: number = 200) => {
    const cacheKey = `${text.length}-${maxLength}`
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }
    const truncated = text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
    cache.set(cacheKey, truncated)
    return truncated
  }
})()

// Memoized variable highlighting
const highlightVariables = (() => {
  const cache = new Map<string, string>()
  return (text: string) => {
    if (cache.has(text)) {
      return cache.get(text)!
    }
    const highlighted = text.replace(/\{\{([^}]+)\}\}/g, '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">{{$1}}</span>')
    cache.set(text, highlighted)
    return highlighted
  }
})()

export const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  content,
  access,
  createdAt,
  views = 0,
  forkCount = 0,
  originalPromptId = null,
  currentVersion = 1,
  totalVersions = 1,
  tags = null,
  folders = [],
  onEdit,
  onDelete,
  onView,
  onViewHistory,
  onMoveToFolder,
  onShare,
  showActions = true,
  enableContextMenu = false,
  showUseButton = false,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
  }>({
    isOpen: false,
    x: 0,
    y: 0
  })
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  
  const navigate = useNavigate()
  
  // Memoize expensive calculations
  const isForkedPrompt = React.useMemo(() => originalPromptId !== null, [originalPromptId])
  const hasMultipleVersions = React.useMemo(() => totalVersions > 1, [totalVersions])
  const shouldTruncate = React.useMemo(() => content.length > 200, [content.length])
  const displayContent = React.useMemo(() => truncateText(content), [content])

  // Memoize rendered content to avoid re-processing markdown
  const renderedContent = React.useMemo(() => {
    try {
      const html = marked(displayContent, { breaks: true })
      const highlightedHtml = highlightVariables(html)
      return { __html: highlightedHtml }
    } catch {
      const plainTextWithBreaks = displayContent.replace(/\n/g, '<br>')
      const highlightedText = highlightVariables(plainTextWithBreaks)
      return { __html: highlightedText }
    }
  }, [displayContent])

  // Memoize formatted values
  const formattedDate = React.useMemo(() => formatDate(createdAt), [createdAt])
  const formattedViews = React.useMemo(() => formatViews(views), [views])
  const formattedForks = React.useMemo(() => formatViews(forkCount), [forkCount])

  React.useEffect(() => {
    const getCurrentUserDisplayName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', user.id)
            .single()
          
          if (userData?.display_name) {
            setUserDisplayName(userData.display_name)
          }
        }
      } catch (error) {
        console.error('Error getting user display name:', error)
      }
    }

    if (enableContextMenu) {
      getCurrentUserDisplayName()
    }
  }, [enableContextMenu])

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!enableContextMenu) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if right-clicking or clicking on action buttons
    if (e.button === 2 || (e.target as HTMLElement).closest('button')) {
      return
    }
    
    if (onView) {
      onView(id)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyContent = () => {
    // Check if content has variables
    const hasVariables = /\{\{([^}]+)\}\}/.test(content)
    
    if (hasVariables) {
      setShowVariableModal(true)
    } else {
      copyToClipboard(content)
    }
  }

  const handleShareLink = async () => {
    if (!userDisplayName) return
    const link = `${window.location.origin}/${userDisplayName}/${id}`
    await copyToClipboard(link)
  }

  const handleRunInApp = async (content: string) => {
    if (!tags || tags.length === 0 || !tags[0]) return
    
    const tag = getAppTagById(tags[0])
    if (!tag || !tag.runUrl) return
    
    setIsRunning(true)
    
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
    } catch (error) {
      console.error('Failed to run in app:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunClick = () => {
    // Check if content has variables
    const hasVariables = /\{\{([^}]+)\}\}/.test(content)
    
    if (hasVariables) {
      setShowVariableModal(true)
    } else {
      handleRunInApp(content)
    }
  }

  const handleVariablesFilled = (filledContent: string) => {
    handleRunInApp(filledContent)
    setShowVariableModal(false)
  }

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleCopyContent()
  }

  const handleUsePrompt = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Navigate to playground with the prompt data
    navigate('/playground', { 
      state: { 
        selectedPrompt: {
          id,
          title,
          content
        }
      }
    })
  }

  const copyLink = async () => {
    if (!userDisplayName) return
    const link = `${window.location.origin}/${userDisplayName}/${id}`
    await copyToClipboard(link)
  }

  // Memoize context menu items to avoid recreation on every render
  const contextMenuItems = React.useMemo(() => [
    {
      id: 'run',
      label: 'Run',
      icon: <Play size={16} />,
      onClick: () => {}, // Placeholder, will be handled by submenu
      submenu: [
        {
          id: 'run-playground',
          label: 'Run in Playground',
          icon: <Play size={14} />,
          onClick: () => {
            navigate('/playground', { 
              state: { 
                selectedPrompt: {
                  id,
                  title,
                  content
                }
              }
            })
          }
        },
        ...(tags && tags.length > 0 && tags[0] && getAppTagById(tags[0])?.runUrl ? [{
          id: 'run-app',
          label: `Run in ${getAppTagById(tags[0])?.name}`,
          icon: React.createElement(getAppTagById(tags[0])!.icon, { size: 14 }),
          onClick: handleRunClick
        }] : [])
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit3 size={16} />,
      onClick: () => onEdit?.(id)
    },
    {
      id: 'copy',
      label: 'Copy Content',
      icon: <Copy size={16} />,
      onClick: handleCopyContent
    },
    {
      id: 'share',
      label: 'Share Link',
      icon: <Share2 size={16} />,
      onClick: handleShareLink
    },
    {
      id: 'move',
      label: 'Move to Folder',
      icon: <Move size={16} />,
      submenu: [
        {
          id: 'root',
          label: 'Root Level',
          icon: <FolderOpen size={14} />,
          onClick: () => onMoveToFolder?.(id, null)
        },
        ...folders.map(folder => ({
          id: folder.id,
          label: folder.name,
          icon: <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: folder.color }} />,
          onClick: () => onMoveToFolder?.(id, folder.id)
        }))
      ]
    },
    {
      id: 'history',
      label: 'Version History',
      icon: <History size={16} />,
      onClick: () => onViewHistory?.(id)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: () => {
        if (window.confirm('Are you sure you want to delete this prompt?')) {
          onDelete?.(id)
        }
      },
      variant: 'danger' as const
    }
  ], [id, folders, tags, title, content, onEdit, onDelete, onViewHistory, onMoveToFolder, navigate, handleRunClick])

  const CardWrapper = enableContextMenu ? motion.div : 'div'
  const cardProps = enableContextMenu ? {
    whileHover: { y: -2 },
    transition: { duration: 0.2 }
  } : {}

  return (
    <>
      <CardWrapper 
        className="group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 sm:p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 flex flex-col h-full cursor-pointer select-none"
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        {...cardProps}
      >
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2 break-words">
                  {title}
                </h3>
              )}
              <div className="text-xs sm:text-sm text-zinc-500">
                {formattedDate}
              </div>
            </div>
            
            {/* Quick Actions (visible on hover) */}
            {showActions && !enableContextMenu && (
              <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 self-start sm:self-auto">
                {/* Version History Button */}
                {hasMultipleVersions && onViewHistory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewHistory(id)
                    }}
                    className="p-1.5 sm:p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200 touch-manipulation"
                    title="View version history"
                  >
                    <History size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onView) onView(id)
                  }}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 touch-manipulation"
                  title="View full prompt"
                >
                  <Maximize2 size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={handleCopyClick}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 touch-manipulation"
                  title="Copy content"
                >
                  <Copy size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyLink()
                  }}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 touch-manipulation"
                  title="Copy link"
                >
                  <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(id)
                    }}
                    className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 touch-manipulation"
                    title="Delete prompt"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Context Menu Actions (visible on hover for context menu enabled cards) */}
            {showActions && enableContextMenu && (
              <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 self-start sm:self-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onView) onView(id)
                  }}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                  title="View full prompt"
                >
                  <Maximize2 size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyContent()
                  }}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                  title="Copy content"
                >
                  <Copy size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col mb-4">
            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {tags.slice(0, 3).map((tagId) => {
                  const tag = getAppTagById(tagId)
                  if (!tag) return null
                  
                  const Icon = tag.icon
                  return (
                    <div
                      key={tagId}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-800/30 border border-zinc-700/30 rounded text-xs"
                      title={tag.name}
                    >
                      <Icon 
                        size={10} 
                        style={{ color: tag.color }}
                      />
                      <span className="text-zinc-300 font-medium">{tag.name}</span>
                    </div>
                  )
                })}
                {tags.length > 3 && (
                  <div className="px-2 py-1 bg-zinc-800/30 border border-zinc-700/30 rounded text-xs text-zinc-400">
                    +{tags.length - 3} more
                  </div>
                )}
              </div>
            )}
            
            <div 
              className="text-zinc-300 text-sm sm:text-base leading-relaxed prose prose-invert prose-sm sm:prose-base max-w-none flex-1"
              dangerouslySetInnerHTML={renderedContent}
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
              }}
            />
            {shouldTruncate && (
              <div className="mt-2 text-xs text-zinc-500">
                Click to view full content...
              </div>
            )}
          </div>

          {/* Bottom section with stats */}
          <div className="mt-auto">
            {/* Version info */}
            {hasMultipleVersions && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded">
                  <History size={10} />
                  <span>v{currentVersion}</span>
                </div>
                <span className="text-zinc-500">
                  {totalVersions} version{totalVersions !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mb-3">
              {/* Access indicator */}
              <div className="flex items-center gap-1">
                {access === 'private' ? (
                  <Lock size={10} className="sm:w-3 sm:h-3 text-amber-400" />
                ) : (
                  <Eye size={10} className="sm:w-3 sm:h-3 text-emerald-400" />
                )}
                <span className={`text-xs ${access === 'private' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {access}
                </span>
              </div>

              {/* Fork indicator */}
              {isForkedPrompt && (
                <>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <GitFork size={10} className="sm:w-3 sm:h-3 text-orange-400" />
                    <span className="text-orange-400 text-xs">forked</span>
                  </div>
                </>
              )}

              {/* Public prompt stats */}
              {access === 'public' && (
                <>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Eye size={10} className="sm:w-3 sm:h-3 text-zinc-400" />
                    <span className="text-zinc-400 text-xs">{formattedViews}</span>
                  </div>
                  
                  {/* Fork count - only show for original prompts */}
                  {!isForkedPrompt && forkCount > 0 && (
                    <>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1">
                        <GitFork size={10} className="sm:w-3 sm:h-3 text-zinc-400" />
                        <span className="text-zinc-400 text-xs">{formattedForks}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Copy feedback */}
        {copied && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs z-50 pointer-events-none"
          >
            Copied!
          </motion.div>
        )}

        {/* Right-click indicator */}
        {enableContextMenu && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity duration-300 text-xs text-zinc-500 pointer-events-none">
            Right-click for options
          </div>
        )}
      </CardWrapper>

      {/* Context Menu */}
      {enableContextMenu && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}

      {/* Variable Fill Modal */}
      <VariableFillModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        promptContent={content}
        promptTitle={title}
        onVariablesFilled={handleVariablesFilled}
      />
    </>
  )
}