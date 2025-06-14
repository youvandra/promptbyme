import React, { useEffect, useState } from 'react'
import { FolderOpen, Search, Filter, Grid, List, Plus, ArrowLeft, Menu, Eye, Lock, Heart, GitFork, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
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
      setToast({ message: 'Prompt deleted successfully', type: 'success' })
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
    totalForks: prompts.reduce((sum, p) => sum + (p.fork_count || 0), 0),
    forkedPrompts: prompts.filter(p => p.original_prompt_id !== null).length
  }

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`
    return `${(num / 1000000).toFixed(1)}M`
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading gallery...</span>
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
      <div className="flex min-h-screen">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <Menu size={20} />
                </button>
                
                <h1 className="text-lg font-semibold text-white">
                  Gallery
                </h1>
                
                <div className="w-6" /> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-6xl pl-6 pr-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Your Gallery
                  </h1>
                  <p className="text-zinc-400">
                    Manage your AI prompt collection
                  </p>
                </div>
                
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 self-start lg:self-auto btn-hover"
                >
                  <Plus size={16} />
                  <span>New Prompt</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                  {/* Total */}
                  <div className="flex items-center gap-2">
                    <FolderOpen className="text-indigo-400" size={18} />
                    <span className="text-2xl font-bold text-white">{stats.total}</span>
                    <span className="text-sm text-zinc-400">Total</span>
                  </div>
                  
                  {/* Public */}
                  <div className="flex items-center gap-2">
                    <Eye className="text-emerald-400" size={18} />
                    <span className="text-2xl font-bold text-white">{stats.public}</span>
                    <span className="text-sm text-zinc-400">Public</span>
                  </div>
                  
                  {/* Private */}
                  <div className="flex items-center gap-2">
                    <Lock className="text-amber-400" size={18} />
                    <span className="text-2xl font-bold text-white">{stats.private}</span>
                    <span className="text-sm text-zinc-400">Private</span>
                  </div>
                  
                  {/* Views */}
                  <div className="flex items-center gap-2">
                    <Users className="text-purple-400" size={18} />
                    <span className="text-2xl font-bold text-white">{formatNumber(stats.totalViews)}</span>
                    <span className="text-sm text-zinc-400">Views</span>
                  </div>
                  
                  {/* Likes */}
                  <div className="flex items-center gap-2">
                    <Heart className="text-pink-400" size={18} />
                    <span className="text-2xl font-bold text-white">{formatNumber(stats.totalLikes)}</span>
                    <span className="text-sm text-zinc-400">Likes</span>
                  </div>
                  
                  {/* Forks Created */}
                  <div className="flex items-center gap-2">
                    <GitFork className="text-orange-400" size={18} />
                    <span className="text-2xl font-bold text-white">{formatNumber(stats.totalForks)}</span>
                    <span className="text-sm text-zinc-400">Forks</span>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                {/* Search */}
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

                {/* Filter */}
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

                {/* View Mode */}
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
              {promptLoading ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
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
                  <FolderOpen className="mx-auto text-zinc-500 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchQuery || filterAccess !== 'all' ? 'No matching prompts' : 'No prompts yet'}
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    {searchQuery || filterAccess !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
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