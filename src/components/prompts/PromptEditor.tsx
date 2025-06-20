import React, { useState, useEffect } from 'react'
import { Save, GitBranch, Eye, EyeOff, History } from 'lucide-react'
import { PromptVersionHistory } from './PromptVersionHistory'
import { PromptFolderSelector } from '../folders/PromptFolderSelector'
import { TagSelector } from '../tags/TagSelector'
import { useFolderStore } from '../../store/folderStore'

interface PromptEditorProps {
  promptId?: string
  initialTitle?: string
  initialContent?: string
  initialAccess?: 'public' | 'private'
  initialFolderId?: string | null
  initialTag?: string | null
  onSave: (title: string, content: string, access: 'public' | 'private', folderId?: string | null, tags?: string[]) => Promise<void>
  onCreateVersion?: (title: string, content: string, commitMessage: string) => Promise<void>
  onRevertVersion?: (versionNumber: number) => Promise<void>
  isOwner?: boolean
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  promptId,
  initialTitle = '',
  initialContent = '',
  initialAccess = 'private',
  initialFolderId = null,
  initialTag = null,
  onSave,
  onCreateVersion,
  onRevertVersion,
  isOwner = true
}) => {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [access, setAccess] = useState<'public' | 'private'>(initialAccess)
  const [folderId, setFolderId] = useState<string | null>(initialFolderId)
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag)
  const [saving, setSaving] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const { fetchFolders } = useFolderStore()

  // Load folders when component mounts
  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // Track changes for versioning
  useEffect(() => {
    const hasContentChanges = content !== initialContent
    const hasTitleChanges = title !== initialTitle
    const hasAccessChanges = access !== initialAccess
    const hasFolderChanges = folderId !== initialFolderId
    const hasTagChanges = selectedTag !== initialTag
    
    setHasChanges(hasContentChanges || hasTitleChanges || hasAccessChanges || hasFolderChanges || hasTagChanges)
  }, [title, content, access, folderId, selectedTag, initialTitle, initialContent, initialAccess, initialFolderId, initialTag])

  const handleSave = async () => {
    if (!content.trim()) return
    
    setSaving(true)
    try {
      // If this is an existing prompt with changes, create a new version
      if (promptId && hasChanges && onCreateVersion) {
        const commitMessage = `Updated ${title || 'prompt'}`
        await onCreateVersion(title, content, commitMessage)
      } else {
        // Otherwise, just save normally
        await onSave(title, content, access, folderId, selectedTag ? [selectedTag] : [])
      }
      
      // Reset change tracking
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setSaving(false)
    }
  }

  // Function to highlight variables in content
  const highlightVariables = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">{{$1}}</span>')
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Editor Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Title and App Tag Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Title <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your prompt a descriptive title..."
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              App Tag <span className="text-zinc-500">(optional)</span>
            </label>
            <TagSelector
              selectedTag={selectedTag}
              onTagChange={setSelectedTag}
              placeholder="Select app..."
            />
          </div>
        </div>

        {/* Content Textarea - Reduced height */}
        <div>
          <label className="block text-sm font-medium text-zinc-100 mb-3">
            Prompt Content
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your prompt here...
Examples:
• Use **bold** and *italic* for emphasis
• Add ```code blocks``` for technical content
• Include {{variables}} for dynamic content

Write clear, specific instructions for the best AI results."
              className="w-full min-h-[250px] max-h-[400px] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-y font-mono text-sm leading-relaxed"
            />
            
            {/* Character count */}
            <div className="absolute bottom-3 right-3 text-xs text-zinc-500 bg-zinc-800/80 backdrop-blur-sm px-2 py-1 rounded">
              {content.length} characters
            </div>
          </div>
        </div>


        {/* Live preview of variables */}
        {content && content.includes('{{') && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
            <h4 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
              Variables detected
            </h4>
            <div 
              className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightVariables(content.substring(0, 200) + (content.length > 200 ? '...' : '')) }}
            />
          </div>
        )}

        {/* Change indicator for existing prompts */}
        {hasChanges && promptId && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-1">
              <GitBranch size={14} />
              <span>Changes detected</span>
            </div>
            <p className="text-xs text-orange-300/80">
              Saving will create a new version of this prompt
            </p>
          </div>
        )}

        {/* Bottom Controls Row - Folder, Visibility and Save Button */}
        <div className="pt-4 border-t border-zinc-800/50">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Left side - Visibility, Folder and Version History */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Visibility Setting */}
              <div className="w-full sm:w-36">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Visibility
                </label>
                <button
                  onClick={() => setAccess(access === 'private' ? 'public' : 'private')}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                    access === 'private'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {access === 'private' ? (
                    <>
                      <EyeOff size={16} />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      <span>Public</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-zinc-500 mt-1">
                  {access === 'private' ? 'Only you can see this' : 'Anyone can view & fork'}
                </p>
              </div>

              {/* Folder Selection */}
              <div className="w-full sm:w-36">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Folder
                </label>
                <PromptFolderSelector
                  selectedFolderId={folderId}
                  onFolderSelect={setFolderId}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Organize your prompts
                </p>
              </div>


              {/* Version History (if editing existing prompt) */}
              {promptId && isOwner && (
                <div className="w-full sm:w-36">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Versions
                  </label>
                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
                  >
                    <History size={16} />
                    <span>History</span>
                  </button>
                  <p className="text-xs text-zinc-500 mt-1">
                    Track & revert changes
                  </p>
                </div>
              )}
            </div>

            {/* Right side - Save Button */}
            <div className="w-full lg:w-auto lg:min-w-[200px]">
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className={`w-full flex items-center justify-center gap-3 px-6 py-3 font-semibold rounded-xl transition-all duration-200 text-base ${
                  hasChanges && promptId
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25'
                } disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    {hasChanges && promptId ? <GitBranch size={20} /> : <Save size={20} />}
                    <span>
                      {hasChanges && promptId ? 'Save as New Version' : 'Save Prompt'}
                    </span>
                  </>
                )}
              </button>
              
              {!promptId && (
                <p className="text-center text-xs text-zinc-500 mt-2">
                  Saved to your gallery
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && promptId && (
        <PromptVersionHistory
          promptId={promptId}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onRevert={onRevertVersion}
          onCreateVersion={onCreateVersion}
          isOwner={isOwner}
        />
      )}
    </div>
  )
}