import React, { useState, useEffect, useRef } from 'react'
import { Save, GitBranch, Eye, EyeOff, History, Image, X, FileText, Upload, Trash2 } from 'lucide-react'
import { PromptVersionHistory } from './PromptVersionHistory'
import { PromptFolderSelector } from '../folders/PromptFolderSelector'
import { TagSelector } from '../tags/TagSelector'
import { useFolderStore } from '../../store/folderStore'
import { usePromptStore } from '../../store/promptStore'
import { motion, AnimatePresence } from 'framer-motion'

interface PromptEditorProps {
  promptId?: string
  initialTitle?: string
  initialContent?: string
  initialAccess?: 'public' | 'private'
  initialFolderId?: string | null
  initialTag?: string | null
  initialNotes?: string | null
  initialOutputSample?: string | null
  initialMediaUrls?: string[] | null
  onSave: (
    title: string, 
    content: string, 
    access: 'public' | 'private', 
    folderId?: string | null, 
    tags?: string[], 
    notes?: string | null,
    outputSample?: string | null,
    mediaUrls?: string[] | null
  ) => Promise<void>
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
  initialNotes = null,
  initialOutputSample = null,
  initialMediaUrls = null,
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
  const [notes, setNotes] = useState<string | null>(initialNotes)
  const [outputSample, setOutputSample] = useState<string | null>(initialOutputSample)
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialMediaUrls || [])
  const [saving, setSaving] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMediaPreview, setShowMediaPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { fetchFolders } = useFolderStore()
  const { uploadMedia, deleteMedia } = usePromptStore()

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
    const hasNotesChanges = notes !== initialNotes
    const hasOutputSampleChanges = outputSample !== initialOutputSample
    const hasMediaChanges = JSON.stringify(mediaUrls) !== JSON.stringify(initialMediaUrls)
    
    setHasChanges(
      hasContentChanges || 
      hasTitleChanges || 
      hasAccessChanges || 
      hasFolderChanges || 
      hasTagChanges || 
      hasNotesChanges || 
      hasOutputSampleChanges || 
      hasMediaChanges
    )
  }, [
    title, 
    content, 
    access, 
    folderId, 
    selectedTag, 
    notes, 
    outputSample, 
    mediaUrls, 
    initialTitle, 
    initialContent, 
    initialAccess, 
    initialFolderId, 
    initialTag, 
    initialNotes, 
    initialOutputSample, 
    initialMediaUrls
  ])

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
        await onSave(
          title, 
          content, 
          access, 
          folderId, 
          selectedTag ? [selectedTag] : [],
          notes,
          outputSample,
          mediaUrls.length > 0 ? mediaUrls : null
        )
      }
      
      // Reset change tracking
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingMedia(true)
    setUploadProgress(0)

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Process each file
      const totalFiles = files.length
      const newMediaUrls = [...mediaUrls]

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} exceeds the 5MB size limit.`)
          continue
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        if (!validTypes.includes(file.type)) {
          alert(`File ${file.name} has an unsupported format. Please use JPG, PNG, GIF, or PDF.`)
          continue
        }

        // Upload the file
        const url = await uploadMedia(file, user.id)
        newMediaUrls.push(url)
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      setMediaUrls(newMediaUrls)
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setUploadingMedia(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveMedia = async (urlToRemove: string) => {
    try {
      await deleteMedia(urlToRemove)
      setMediaUrls(mediaUrls.filter(url => url !== urlToRemove))
    } catch (error) {
      console.error('Error removing media:', error)
      alert('Failed to remove media. Please try again.')
    }
  }

  const handlePreviewMedia = (url: string) => {
    setPreviewUrl(url)
    setShowMediaPreview(true)
  }

  // Function to highlight variables in content
  const highlightVariables = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">{{$1}}</span>')
  }

  // Function to determine if a URL is an image
  const isImageUrl = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png)$/i) !== null
  }

  // Function to get file name from URL
  const getFileNameFromUrl = (url: string) => {
    const urlParts = url.split('/')
    return urlParts[urlParts.length - 1]
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

        {/* Content Textarea */}
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

        {/* Notes Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-indigo-400" />
            Notes <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={notes || ''}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes, context, or instructions about this prompt..."
            className="w-full min-h-[100px] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-y"
          />
        </div>

        {/* Media Upload Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
            <Image size={16} className="text-indigo-400" />
            Media Files <span className="text-zinc-500">(optional)</span>
          </label>
          
          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
            {/* Upload Button */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept="image/jpeg,image/png,image/gif,application/pdf"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all duration-200"
              >
                {uploadingMedia ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Uploading... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload Files</span>
                  </>
                )}
              </button>
              <p className="text-xs text-zinc-500 mt-1">
                Supported formats: JPG, PNG, GIF, PDF. Max size: 5MB per file.
              </p>
            </div>
            
            {/* Media Preview */}
            {mediaUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    {isImageUrl(url) ? (
                      <div 
                        className="aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => handlePreviewMedia(url)}
                      >
                        <img 
                          src={url} 
                          alt={`Uploaded media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div 
                        className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <FileText size={24} className="text-zinc-400" />
                        <span className="text-xs text-zinc-400 mt-2 px-2 truncate">
                          {getFileNameFromUrl(url)}
                        </span>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveMedia(url)}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500">
                <Image className="mx-auto mb-2 opacity-30" size={32} />
                <p>No media files attached</p>
              </div>
            )}
          </div>
        </div>

        {/* Output Sample Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
            <Eye size={16} className="text-indigo-400" />
            Output Sample <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={outputSample || ''}
            onChange={(e) => setOutputSample(e.target.value)}
            placeholder="Provide an example of the expected output from this prompt..."
            className="w-full min-h-[100px] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-y"
          />
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

      {/* Media Preview Modal */}
      <AnimatePresence>
        {showMediaPreview && previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <button
                onClick={() => setShowMediaPreview(false)}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full z-10"
              >
                <X size={20} />
              </button>
              <img 
                src={previewUrl} 
                alt="Media preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}