import React, { useState, useEffect, useRef } from 'react'
import { Save, GitBranch, Plus, Eye, EyeOff, History, Image, X, FileText, Upload, Trash2, Download } from 'lucide-react'
import { PromptVersionHistory } from './PromptVersionHistory'
import { PromptFolderSelector } from '../folders/PromptFolderSelector'
import { TagSelector } from '../tags/TagSelector'
import { useFolderStore } from '../../store/folderStore'
import { usePromptStore } from '../../store/promptStore'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

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
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'output' | 'media'>('content')

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

  const downloadMedia = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = getFileNameFromUrl(url)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      <div className="bg-f3f3f3 border-2 border-black rounded-[28px] p-6 sm:p-8 space-y-6 shadow-neo-brutalism">
        {/* Title and App Tag Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-black mb-3">
              Title <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your prompt a descriptive title..."
              className="w-full bg-white border-2 border-black rounded-[28px] px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 shadow-neo-brutalism-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              App Tag <span className="text-zinc-500">(optional)</span>
            </label>
            <TagSelector
              selectedTag={selectedTag}
              onTagChange={setSelectedTag}
              placeholder="Select app..."
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-black -mx-8 px-8 pb-2">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'content'
                  ? 'bg-highlight text-black border-2 border-black'
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'notes'
                  ? 'bg-highlight text-black border-2 border-black'
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              Notes
              {notes && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'output'
                  ? 'bg-highlight text-black border-2 border-black'
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              Output Sample
              {outputSample && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'media'
                  ? 'bg-highlight text-black border-2 border-black'
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              Media
              {mediaUrls.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'content' && (
            <div>
              <label className="block text-sm font-medium text-black mb-3">
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
                  className="w-full min-h-[250px] max-h-[400px] bg-white border-2 border-black rounded-[28px] px-4 py-4 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 resize-y font-mono text-sm leading-relaxed shadow-neo-brutalism-sm"
                />
                
                {/* Character count */}
                <div className="absolute bottom-3 right-3 text-xs text-black bg-white px-2 py-1 rounded border-2 border-black">
                  {content.length} characters
                </div>
              </div>

              {/* Live preview of variables */}
              {content && content.includes('{{') && (
                <div className="bg-white border-2 border-black rounded-[28px] p-4 mt-4 shadow-neo-brutalism-sm">
                  <h4 className="text-sm font-medium text-black mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-black rounded-full"></span>
                    Variables detected
                  </h4>
                  <div 
                    className="text-black text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightVariables(content.substring(0, 200) + (content.length > 200 ? '...' : '')) }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-medium text-black mb-3 flex items-center gap-2">
                <FileText size={16} className="text-black" />
                Notes <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, context, or instructions about this prompt..."
                className="w-full min-h-[250px] bg-white border-2 border-black rounded-[28px] px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 resize-y shadow-neo-brutalism-sm"
              />
              <p className="text-xs text-gray-600 mt-2">
                Notes are helpful for documenting your thought process, use cases, or any other context that might be useful later.
              </p>
            </div>
          )}

          {activeTab === 'output' && (
            <div>
              <label className="block text-sm font-medium text-black mb-3 flex items-center gap-2">
                <Eye size={16} className="text-black" />
                Output Sample <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={outputSample || ''}
                onChange={(e) => setOutputSample(e.target.value)}
                placeholder="Provide an example of the expected output from this prompt..."
                className="w-full min-h-[250px] bg-white border-2 border-black rounded-[28px] px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 resize-y shadow-neo-brutalism-sm"
              />
              <p className="text-xs text-gray-600 mt-2">
                Adding an output sample helps others understand what to expect when using this prompt.
              </p>
            </div>
          )}

          {activeTab === 'media' && (
            <div>
              <label className="block text-sm font-medium text-black mb-3 flex items-center gap-2">
                <Image size={16} className="text-black" />
                Media Files <span className="text-zinc-500">(optional)</span>
              </label>
              
              <div className="bg-white border-2 border-black rounded-[28px] p-4 shadow-neo-brutalism-sm">
                {/* Upload Button - Centered when no media, small + button when media exists */}
                {mediaUrls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
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
                      className="flex flex-col items-center gap-3 px-6 py-4 bg-highlight text-black border-2 border-black rounded-xl transition-all duration-200 mb-3 shadow-neo-brutalism-sm"
                    >
                      {uploadingMedia ? (
                        <>
                          <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>Uploading... {uploadProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} />
                          <span>Upload Files</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-600">
                      Supported formats: JPG, PNG, GIF, PDF. Max size: 5MB per file.
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {mediaUrls.length} file{mediaUrls.length !== 1 ? 's' : ''} attached
                    </p>
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
                      className="flex items-center gap-2 p-2 bg-highlight text-black border-2 border-black rounded-lg transition-all duration-200 shadow-neo-brutalism-sm"
                      title="Add more files"
                    >
                      {uploadingMedia ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </div>
                )}
                
                {/* Media Preview */}
                {mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        {isImageUrl(url) ? (
                          <div 
                            className="aspect-square bg-white border-2 border-black rounded-lg overflow-hidden cursor-pointer shadow-neo-brutalism-sm"
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
                            className="aspect-square bg-white border-2 border-black rounded-lg flex flex-col items-center justify-center cursor-pointer p-2 shadow-neo-brutalism-sm"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <FileText size={24} className="text-gray-600 mb-2" />
                            <span className="text-xs text-gray-600 text-center truncate w-full">
                              {getFileNameFromUrl(url)}
                            </span>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Download button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadMedia(url);
                            }}
                            className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 border-2 border-black"
                            title="Download"
                          >
                            <Download size={12} />
                          </button>
                          
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia(url);
                            }}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 border-2 border-black"
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Change indicator for existing prompts */}
        {hasChanges && promptId && (
          <div className="bg-white border-2 border-black rounded-[28px] p-4 shadow-neo-brutalism-sm">
            <div className="flex items-center gap-2 text-black text-sm font-medium mb-1">
              <GitBranch size={14} />
              <span>Changes detected</span>
            </div>
            <p className="text-xs text-gray-600">
              Saving will create a new version of this prompt
            </p>
          </div>
        )}

        {/* Bottom Controls Row - Folder, Visibility and Save Button */}
        <div className="pt-4 border-t-2 border-black">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Left side - Visibility, Folder and Version History */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Visibility Setting */}
              <div className="w-full sm:w-36">
                <label className="block text-sm font-medium text-black mb-2">
                  Visibility
                </label>
                <button
                  onClick={() => setAccess(access === 'private' ? 'public' : 'private')}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                    access === 'private'
                      ? 'bg-white border-2 border-black text-black hover:bg-gray-200 shadow-neo-brutalism-sm'
                      : 'bg-highlight border-2 border-black text-black hover:bg-highlight/80 shadow-neo-brutalism-sm'
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
                <p className="text-xs text-gray-600 mt-1">
                  {access === 'private' ? 'Only you can see this' : 'Anyone can view & fork'}
                </p>
              </div>

              {/* Folder Selection */}
              <div className="w-full sm:w-36">
                <label className="block text-sm font-medium text-black mb-2">
                  Folder
                </label>
                <PromptFolderSelector
                  selectedFolderId={folderId}
                  onFolderSelect={setFolderId}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Organize your prompts
                </p>
              </div>


              {/* Version History (if editing existing prompt) */}
              {promptId && isOwner && (
                <div className="w-full sm:w-36">
                  <label className="block text-sm font-medium text-black mb-2">
                    Versions
                  </label>
                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-gray-200 text-black border-2 border-black rounded-xl transition-all duration-200 text-sm font-medium shadow-neo-brutalism-sm"
                  >
                    <History size={16} />
                    <span>History</span>
                  </button>
                  <p className="text-xs text-gray-600 mt-1">
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
                    ? 'bg-highlight hover:bg-highlight/80 text-black border-2 border-black shadow-neo-brutalism'
                    : 'bg-highlight hover:bg-highlight/80 text-black border-2 border-black shadow-neo-brutalism'
                } disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-500 disabled:shadow-none transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-neo-brutalism-sm active:translate-x-[6px] active:translate-y-[6px] active:shadow-none disabled:transform-none`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
                <p className="text-center text-xs text-gray-600 mt-2">
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
                className="absolute top-2 right-2 p-2 bg-white text-black rounded-full z-10 border-2 border-black"
              >
                <X size={20} />
              </button>
              <img 
                src={previewUrl} 
                alt="Media preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg border-2 border-black shadow-neo-brutalism"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}