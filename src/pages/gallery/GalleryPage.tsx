import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Search, Filter, Grid, List, Plus, ArrowLeft, Menu, Eye, Lock, GitFork, Users, ChevronDown, FolderPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PromptCard } from '../../components/prompts/PromptCard'
import { PromptModal } from '../../components/prompts/PromptModal'
import { PromptVersionHistory } from '../../components/prompts/PromptVersionHistory'
import { FolderModal } from '../../components/folders/FolderModal'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
import { useFolderStore } from '../../store/folderStore'

// Memoized prompt card component to prevent unnecessary re-renders
const MemoizedPromptCard = React.memo(PromptCard)
export const GalleryPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showFolderDropdown, setShowFolderDropdown] = useState(false)
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { 
    prompts, 
    fetchUserPrompts, 
    deletePrompt,
    updatePrompt,
    createVersion,
    subscribeToUserPrompts 
  } = usePromptStore()
  const { folders, fetchFolders, createFolder } = useFolderStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      setIsPageLoading(true)
      
      // Load all data concurrently
      Promise.all([
        fetchUserPrompts(user.id),
        fetchFolders()
      ]).finally(() => {
        setIsPageLoading(false)
      })
      
      // Set up real-time subscription
      const unsubscribe = subscribeToUserPrompts(user.id)
      return unsubscribe
    }
  }, [user, fetchUserPrompts, fetchFolders, subscribeToUserPrompts])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFolderDropdown(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  // Memoize filtered prompts to avoid recalculation on every render
  const filteredPrompts = React.useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = !searchQuery || 
        prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filterAccess === 'all' || prompt.access === filterAccess
      
      const matchesFolder = selectedFolderId === null || prompt.folder_id === selectedFolderId
      
      return matchesSearch && matchesFilter && matchesFolder
    })
  }, [prompts, searchQuery, filterAccess, selectedFolderId])

  // Memoize stats calculation
  const stats = React.useMemo(() => ({
    total: filteredPrompts.length,
    public: filteredPrompts.filter(p => p.access === 'public').length,
    private: filteredPrompts.filter(p => p.access === 'private').length,
    totalViews: filteredPrompts.reduce((sum, p) => sum + (p.views || 0), 0),
    totalForks: filteredPrompts.reduce((sum, p) => sum + (p.fork_count || 0), 0),
    forkedPrompts: filteredPrompts.filter(p => p.original_prompt_id !== null).length,
    totalVersions: filteredPrompts.reduce((sum, p) => sum + (p.total_versions || 1), 0)
  }), [filteredPrompts])

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt(id)
      setToast({ message: 'Prompt deleted successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to delete prompt', type: 'error' })
    }
  }

  const handleViewPrompt = (id: string) => {
    const prompt = prompts.find(p => p.id === id)
    if (prompt) {
      setSelectedPrompt(prompt)
      setShowModal(true)
    }
  }

  const handleViewHistory = (id: string) => {
    const prompt = prompts.find(p => p.id === id)
    if (prompt) {
      setSelectedPrompt(prompt)
      setShowVersionHistory(true)
    }
  }

  const handleSavePrompt = async (id: string, title: string, content: string, access: 'public' | 'private') => {
    try {
      const currentPrompt = prompts.find(p => p.id === id)
      if (currentPrompt && (currentPrompt.content !== content || currentPrompt.title !== title)) {
        await createVersion(id, title, content, 'Updated via modal')
        setToast({ message: 'New version created successfully', type: 'success' })
      } else {
        await updatePrompt(id, { title: title || null, access })
        setToast({ message: 'Prompt updated successfully', type: 'success' })
      }
      
      const updatedPrompt = { ...selectedPrompt, title, content, access }
      setSelectedPrompt(updatedPrompt)
    } catch (error) {
      setToast({ message: 'Failed to update prompt', type: 'error' })
      throw error
    }
  }

  const handleCreateVersion = async (promptId: string, title: string, content: string, commitMessage: string) => {
    try {
      await createVersion(promptId, title, content, commitMessage)
      setToast({ message: 'New version created successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to create version', type: 'error' })
    }
  }

  const handleRevertVersion = async (versionNumber: number) => {
    try {
      setToast({ message: `Reverted to version ${versionNumber}`, type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to revert version', type: 'error' })
    }
  }

  const handleMoveToFolder = async (promptId: string, folderId: string | null) => {
    try {
      await updatePrompt(promptId, { folder_id: folderId })
      setToast({ 
        message: folderId 
          ? `Moved to ${folders.find(f => f.id === folderId)?.name || 'folder'}` 
          : 'Moved to root level', 
        type: 'success' 
      })
    } catch (error) {
      setToast({ message: 'Failed to move prompt', type: 'error' })
    }
  }

  const handleCreateFolder = async (folderData: any) => {
    try {
      await createFolder(folderData)
      setShowFolderModal(false)
      setToast({ message: 'Folder created successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to create folder', type: 'error' })
    }
  }

  const handleEditPrompt = (id: string) => {
    const prompt = prompts.find(p => p.id === id)
    if (prompt) {
      setSelectedPrompt(prompt)
      setShowModal(true)
    }
  }

  const handleSharePrompt = async (id: string) => {
    try {
      const { data: { user } } = await import('../../lib/supabase').then(m => m.supabase.auth.getUser())
      if (user) {
        const { data: userData } = await import('../../lib/supabase').then(m => 
          m.supabase.from('users').select('display_name').eq('id', user.id).single()
        )
        
        if (userData?.display_name) {
          const link = `${window.location.origin}/${userData.display_name}/${id}`
          await navigator.clipboard.writeText(link)
          setToast({ message: 'Link copied to clipboard', type: 'success' })
        }
      }
    } catch (err) {
      setToast({ message: 'Failed to copy link', type: 'error' })
    }
  }


  // Get current folder name
  const currentFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null
  const currentFolderName = currentFolder ? currentFolder.name : 'All Prompts'


  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`
    return `${(num / 1000000).toFixed(1)}M`
  }

  if (authLoading || isPageLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>{authLoading ? 'Loading gallery...' : 'Loading your prompts...'}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="mx-auto text-zinc-400 mb-4" size={64} />
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access your gallery
            </p>
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
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  data-menu-button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <Menu size={20} />
                </button>
                
                <h1 className="text-lg font-semibold text-white">
                  Gallery
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-6xl px-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-white">
                        {currentFolderName}
                      </h1>
                      
                      {/* Folder Dropdown */}
                      {folders.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowFolderDropdown(!showFolderDropdown)
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-all duration-200"
                          >
                            <FolderOpen size={16} className="text-indigo-400" />
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showFolderDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {showFolderDropdown && (
                            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 min-w-[200px] max-h-64 overflow-y-auto">
                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    setSelectedFolderId(null)
                                    setShowFolderDropdown(false)
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                    selectedFolderId === null 
                                      ? 'bg-indigo-600/20 text-indigo-300' 
                                      : 'text-zinc-300 hover:bg-zinc-800/50'
                                  }`}
                                >
                                  <FolderOpen size={16} />
                                  <span>All Prompts</span>
                                </button>
                                
                                {folders.map((folder) => (
                                  <button
                                    key={folder.id}
                                    onClick={() => {
                                      setSelectedFolderId(folder.id)
                                      setShowFolderDropdown(false)
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                      selectedFolderId === folder.id 
                                        ? 'bg-indigo-600/20 text-indigo-300' 
                                        : 'text-zinc-300 hover:bg-zinc-800/50'
                                    }`}
                                  >
                                    <div 
                                      className="w-4 h-4 flex-shrink-0"
                                      style={{ color: folder.color }}
                                    >
                                      <FolderOpen size={16} />
                                    </div>
                                    <span className="truncate">{folder.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-400">
                      Manage your AI prompt collection with version control
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFolderModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                  >
                    <FolderPlus size={16} />
                    <span>New Folder</span>
                  </button>
                  
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                  >
                    <Plus size={16} />
                    <span>New Prompt</span>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="text-indigo-400" size={18} />
                    <span className="text-2xl font-bold text-white">{stats.total}</span>
                    <span className="text-sm text-zinc-400">Total</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye className="text-emerald-400" size={18} />
                    <span className="text-2xl font-bold text-white">{stats.public}</span>
                    <span className="text-sm text-zinc-400">Public</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Lock className="text-amber-400" size={18} />
                    <span className="text-2xl font-bold text-white">{stats.private}</span>
                    <span className="text-sm text-zinc-400">Private</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="text-purple-400" size={18} />
                    <span className="text-2xl font-bold text-white">{formatNumber(stats.totalViews)}</span>
                    <span className="text-sm text-zinc-400">Views</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <GitFork className="text-orange-400" size={18} />
                    <span className="text-2xl font-bold text-white">{formatNumber(stats.totalForks)}</span>
                    <span className="text-sm text-zinc-400">Forks</span>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Filter className="text-zinc-500" size={18} />
                  <select
                    value={filterAccess}
                    onChange={(e) => setFilterAccess(e.target.value as 'all' | 'public' | 'private')}
                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  >
                    <option value="all">All Prompts</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {/* Prompts Grid/List */}
              {filteredPrompts.length > 0 ? (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {filteredPrompts.map((prompt, index) => (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="card-hover"
                    >
                      <MemoizedPromptCard
                        id={prompt.id}
                        title={prompt.title}
                        content={prompt.content}
                        access={prompt.access}
                        createdAt={prompt.created_at}
                        views={prompt.views}
                        forkCount={prompt.fork_count}
                        originalPromptId={prompt.original_prompt_id}
                        currentVersion={prompt.current_version}
                        totalVersions={prompt.total_versions}
                        tags={prompt.tags}
                        folders={folders}
                        enableContextMenu={true}
                        onEdit={handleEditPrompt}
                        onDelete={handleDeletePrompt}
                        onView={handleViewPrompt}
                        onViewHistory={handleViewHistory}
                        onMoveToFolder={handleMoveToFolder}
                        onShare={handleSharePrompt}
                        showUseButton={true}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="mx-auto text-zinc-500 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchQuery || filterAccess !== 'all' || selectedFolderId ? 'No matching prompts' : 'No prompts yet'}
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    {searchQuery || filterAccess !== 'all' || selectedFolderId
                      ? 'Try adjusting your search, filter, or folder selection'
                      : 'Create your first prompt to get started'
                    }
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                  >
                    <Plus size={16} />
                    <span>Create First Prompt</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        prompt={selectedPrompt}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedPrompt(null)
        }}
        onSave={handleSavePrompt}
        onDelete={handleDeletePrompt}
        isOwner={true}
        showActions={true}
      />

      {/* Version History Modal */}
      {showVersionHistory && selectedPrompt && (
        <PromptVersionHistory
          promptId={selectedPrompt.id}
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false)
            setSelectedPrompt(null)
          }}
          onRevert={handleRevertVersion}
          onCreateVersion={handleCreateVersion}
          isOwner={true}
        />
      )}

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSave={handleCreateFolder}
        folders={folders}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BoltBadge />
    </div>
  )
}