import React, { useEffect, useState } from 'react'
import { FolderOpen, Search, Filter, Grid, List, Plus, ArrowLeft, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { PromptCard } from '../components/PromptCard'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { SideNavbar } from '../components/SideNavbar'
import { useAuthStore } from '../store/authStore'
import { usePromptStore } from '../store/promptStore'
import { useLikeStore } from '../store/likeStore'

export const GalleryPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { 
    prompts, 
    loading: promptLoading, 
    fetchUserPrompts, 
    deletePrompt,
    subscribeToUserPrompts 
  } = usePromptStore()
  const { fetchUserLikes } = useLikeStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      fetchUserLikes(user.id)
      const unsubscribe = subscribeToUserPrompts(user.id)
      return unsubscribe
    }
  }, [user, fetchUserPrompts, fetchUserLikes, subscribeToUserPrompts])

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt(id)
      setToast({ message: '> Prompt deleted. ::Archive updated', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to delete prompt', type: 'error' })
    }
  }

  // Filter prompts based on search and access filter
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterAccess === 'all' || prompt.access === filterAccess
    
    return matchesSearch && matchesFilter
  })

  // Calculate stats
  const stats = {
    total: prompts.length,
    public: prompts.filter(p => p.access === 'public').length,
    private: prompts.filter(p => p.access === 'private').length,
    totalLikes: prompts.reduce((sum, p) => sum + (p.like_count || 0), 0),
    totalViews: prompts.reduce((sum, p) => sum + (p.views || 0), 0),
    totalForks: prompts.reduce((sum, p) => sum + (p.fork_count || 0), 0)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span>Loading gallery...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-cyan-100 relative overflow-hidden">
        <AnimatedBackground />
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="mx-auto text-cyan-400 mb-4" size={64} />
            <h1 className="text-4xl font-bold font-mono text-cyan-100 mb-4">
              Access Required
            </h1>
            <p className="text-xl text-cyan-300/80 font-mono mb-8">
              Please sign in to access your gallery
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft size={16} />
              <span>Go to Terminal</span>
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
      
      {/* Layout Container */}
      <div className="flex min-h-screen">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen ml-10 lg:ml-10">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-cyan-500/30 backdrop-blur-md">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Menu size={24} />
                </button>
                
                <h1 className="text-lg font-bold font-mono text-cyan-300">
                  Gallery
                </h1>
                
                <div className="w-6" /> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-full pr-12 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold font-mono text-cyan-300">
                    Prompt Gallery
                  </h1>
                  <p className="text-cyan-500/70 font-mono text-sm">
                    Your personal collection of AI prompts
                  </p>
                </div>
                
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105 self-start lg:self-auto"
                >
                  <Plus size={16} />
                  <span>Create Prompt</span>
                </Link>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 text-center">
                  <FolderOpen className="text-cyan-400 mx-auto mb-2" size={20} />
                  <p className="text-2xl font-bold text-cyan-100 font-mono">{stats.total}</p>
                  <p className="text-xs text-cyan-500/70 font-mono">Total</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="w-5 h-5 bg-green-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-2xl font-bold text-green-100 font-mono">{stats.public}</p>
                  <p className="text-xs text-green-500/70 font-mono">Public</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="w-5 h-5 bg-red-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-2xl font-bold text-red-100 font-mono">{stats.private}</p>
                  <p className="text-xs text-red-500/70 font-mono">Private</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="w-5 h-5 bg-purple-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-2xl font-bold text-purple-100 font-mono">{stats.totalViews}</p>
                  <p className="text-xs text-purple-500/70 font-mono">Views</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-pink-500/30 rounded-lg p-4 text-center">
                  <div className="w-5 h-5 bg-pink-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-2xl font-bold text-pink-100 font-mono">{stats.totalLikes}</p>
                  <p className="text-xs text-pink-500/70 font-mono">Likes</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-orange-500/30 rounded-lg p-4 text-center">
                  <div className="w-5 h-5 bg-orange-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-2xl font-bold text-orange-100 font-mono">{stats.totalForks}</p>
                  <p className="text-xs text-orange-500/70 font-mono">Forks</p>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500/50" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full bg-black/40 border border-cyan-500/30 rounded-lg pl-10 pr-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                  <Filter className="text-cyan-500/50" size={18} />
                  <select
                    value={filterAccess}
                    onChange={(e) => setFilterAccess(e.target.value as 'all' | 'public' | 'private')}
                    className="bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono"
                  >
                    <option value="all">All Prompts</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/30 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : 'text-cyan-500/70 hover:text-cyan-400'
                    }`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : 'text-cyan-500/70 hover:text-cyan-400'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {/* Prompts Grid/List */}
              {promptLoading ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono">
                    <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    <span>Loading prompts...</span>
                  </div>
                </div>
              ) : filteredPrompts.length > 0 ? (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {filteredPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      id={prompt.id}
                      title={prompt.title}
                      content={prompt.content}
                      access={prompt.access}
                      createdAt={prompt.created_at}
                      views={prompt.views}
                      likeCount={prompt.like_count}
                      forkCount={prompt.fork_count}
                      originalPromptId={prompt.original_prompt_id}
                      onDelete={handleDeletePrompt}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="mx-auto text-cyan-500/50 mb-4" size={64} />
                  <h3 className="text-xl font-bold text-cyan-300 font-mono mb-2">
                    {searchQuery || filterAccess !== 'all' ? 'No matching prompts' : 'No prompts yet'}
                  </h3>
                  <p className="text-cyan-500/70 font-mono mb-6">
                    {searchQuery || filterAccess !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first prompt to get started'
                    }
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
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