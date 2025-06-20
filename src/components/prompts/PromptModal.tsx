import React, { useState, useRef, useEffect } from 'react'
import { X, Copy, Edit3, Save, Eye, Lock, GitFork, ExternalLink, Calendar, User, History } from 'lucide-react'
import { marked } from 'marked'
import { Database } from '../lib/supabase'
import { getAppTagById } from '../../lib/appTags'
import { TagSelector } from '../tags/TagSelector'
import { PromptVersionHistory } from './PromptVersionHistory'
import { VariableFillModal } from './VariableFillModal'
import { supabase } from '../../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

interface PromptModalProps {
  prompt: Prompt | null
  isOpen: boolean
  onClose: () => void
  onSave?: (id: string, title: string, content: string, access: 'public' | 'private') => Promise<void>
  onDelete?: (id: string) => void
  showActions?: boolean
  isOwner?: boolean
}

export const PromptModal: React.FC<PromptModalProps> = ({
  prompt,
  isOpen,
  onClose,
  onSave,
  onDelete,
  showActions = true,
  isOwner = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editAccess, setEditAccess] = useState<'public' | 'private'>('private')
  const [editTag, setEditTag] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (prompt && isOpen) {
      setEditTitle(prompt.title || '')
      setEditContent(prompt.content)
      setEditAccess(prompt.access)
      setEditTag(prompt.tags?.[0] || null)
      setIsEditing(false)
    }
  }, [prompt, isOpen])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      adjustTextareaHeight()
    }
  }, [isEditing])

  // Get current user's display name for generating share links
  useEffect(() => {
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

    if (isOwner) {
      getCurrentUserDisplayName()
    }
  }, [isOwner])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`
    }
  }

  const handleSave = async () => {
    if (!prompt || !onSave) return
    
    setSaving(true)
    try {
      await onSave(prompt.id, editTitle, editContent, editAccess)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setSaving(false)
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

  const copyLink = async () => {
    if (!prompt || !userDisplayName) return
    const link = `${window.location.origin}/${userDisplayName}/${prompt.id}`
    await copyToClipboard(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  // Function to highlight variables in content
  const highlightVariables = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">{{$1}}</span>')
  }

  const renderContent = () => {
    if (!prompt) return { __html: '' }
    
    const content = isEditing ? editContent : prompt.content
    try {
      const html = marked(content, { breaks: true })
      const highlightedHtml = highlightVariables(html)
      return { __html: highlightedHtml }
    } catch {
      const plainTextWithBreaks = content.replace(/\n/g, '<br>')
      const highlightedText = highlightVariables(plainTextWithBreaks)
      return { __html: highlightedText }
    }
  }

  const isForkedPrompt = prompt?.original_prompt_id !== null
  const hasMultipleVersions = (prompt?.total_versions || 1) > 1

  if (!isOpen || !prompt) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50 flex-shrink-0">
            <div className="flex-1 min-w-0 mr-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Prompt title (optional)"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
              ) : (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 break-words">
                    {prompt.title || 'Untitled Prompt'}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
                    <div className="flex items-center gap-1">
                      {prompt.access === 'private' ? (
                        <Lock size={12} className="text-amber-400" />
                      ) : (
                        <Eye size={12} className="text-emerald-400" />
                      )}
                      <span className={prompt.access === 'private' ? 'text-amber-400' : 'text-emerald-400'}>
                        {prompt.access}
                      </span>
                    </div>
                    
                    {hasMultipleVersions && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <History size={12} className="text-indigo-400" />
                          <span className="text-indigo-400">v{prompt.current_version}</span>
                        </div>
                      </>
                    )}
                    
                    {isForkedPrompt && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <GitFork size={12} className="text-orange-400" />
                          <span className="text-orange-400">forked</span>
                        </div>
                      </>
                    )}
                    
                    {prompt.access === 'public' && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Eye size={12} />
                          <span>{formatViews(prompt.views || 0)} views</span>
                        </div>
                        {!isForkedPrompt && (prompt.fork_count || 0) > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <GitFork size={12} />
                              <span>{formatViews(prompt.fork_count || 0)} forks</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(prompt.created_at || '')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showActions && (
                <>
                  {/* Version History Button */}
                  {hasMultipleVersions && isOwner && (
                    <button
                      onClick={() => setShowVersionHistory(true)}
                      className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200"
                      title="View version history"
                    >
                      <History size={16} />
                    </button>
                  )}
                  
                  {/* Copy Content */}
                  <button
                    onClick={handleCopyClick}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                    title="Copy content"
                  >
                    <Copy size={16} />
                  </button>
                  
                  {/* Copy Link */}
                  {isOwner && userDisplayName && (
                    <button
                      onClick={copyLink}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                      title="Copy link"
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                  
                  {/* Edit (only for owners) */}
                  {isOwner && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200"
                      title="Edit prompt"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  
                  {/* Save (when editing) */}
                  {isEditing && (
                    <button
                      onClick={handleSave}
                      disabled={saving || !editContent.trim()}
                      className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save changes"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                    </button>
                  )}
                </>
              )}
              
              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Access Toggle (when editing) */}
          {isEditing && (
            <div className="px-4 sm:px-6 py-3 border-b border-zinc-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">Visibility:</span>
                <button
                  onClick={() => setEditAccess(editAccess === 'private' ? 'public' : 'private')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm ${
                    editAccess === 'private'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {editAccess === 'private' ? (
                    <>
                      <Lock size={14} />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      <span>Public</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tags Selection (when editing) */}
          {isEditing && (
            <div className="px-4 sm:px-6 py-3 border-b border-zinc-800/50 flex-shrink-0">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-zinc-300 whitespace-nowrap">
                  App Tag:
                </label>
                <div className="flex-1">
                  <TagSelector
                    selectedTag={editTag}
                    onTagChange={setEditTag}
                    placeholder="Select app..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value)
                    adjustTextareaHeight()
                  }}
                  placeholder="Enter your prompt content..."
                  className="w-full min-h-[200px] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none font-mono text-sm"
                />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editContent.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditTitle(prompt.title || '')
                      setEditContent(prompt.content)
                      setEditAccess(prompt.access)
                      setEditTag(prompt.tags?.[0] || null)
                    }}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors w-full sm:w-auto text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tags Display */}
                {prompt.tags && prompt.tags.length > 0 && prompt.tags[0] && (
                  <div className="mb-6">
                    {(() => {
                      const tag = getAppTagById(prompt.tags[0])
                      if (!tag) return null
                      
                      const Icon = tag.icon
                      return (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/30 rounded-lg w-fit">
                          <Icon 
                            size={14} 
                            style={{ color: tag.color }}
                          />
                          <span className="text-zinc-300 font-medium text-sm">{tag.name}</span>
                        </div>
                      )
                    })()}
                  </div>
                )}
                
                {/* Content */}
                <div 
                  className="prose prose-invert prose-lg max-w-none text-zinc-200 leading-relaxed break-words"
                  dangerouslySetInnerHTML={renderContent()}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                  }}
                />
              </div>
            )}
          </div>

          {/* Copy feedback */}
          {copied && (
            <div className="absolute top-4 right-16 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm animate-pulse z-10 pointer-events-none">
              Copied!
            </div>
          )}
        </div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && (
        <PromptVersionHistory
          promptId={prompt.id}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          isOwner={isOwner}
        />
      )}

      {/* Variable Fill Modal */}
      <VariableFillModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        promptContent={prompt?.content || ''}
        promptTitle={prompt?.title || undefined}
      />
    </>
  )
}