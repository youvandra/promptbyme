import React, { useState, useEffect } from 'react'
import { X, Search, Filter, Eye, Lock, GitFork, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptStore } from '../../store/promptStore'
import { useAuthStore } from '../../store/authStore'

interface Prompt {
  id: string
  title?: string
  content: string
  access: 'public' | 'private'
  created_at: string
  views?: number
  like_count?: number
  fork_count?: number
  original_prompt_id?: string | null
}

interface PromptSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPrompt: (prompt: Prompt) => void
}

export const PromptSelectionModal: React.FC<PromptSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all')
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const { prompts, loading, fetchUserPrompts } = usePromptStore()

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPrompts(user.id)
    }
  }, [isOpen, user, fetchUserPrompts])

  // Filter prompts based on search and access filter
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterAccess === 'all' || prompt.access === filterAccess
    
    return matchesSearch && matchesFilter
  })

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPromptId(prompt.id)
    onSelectPrompt(prompt)
    onClose()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length <= maxLength ? content : content.substring(0, maxLength) + '...'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Choose Your Prompt</h2>
            <p className="text-sm text-zinc-400">Select a prompt from your collection</p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts..."
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="text-zinc-500" size={18} />
              <select
                value={filterAccess}
                onChange={(e) => setFilterAccess(e.target.value as 'all' | 'public' | 'private')}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              >
                <option value="all">All Prompts</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prompts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                <span>Loading prompts...</span>
              </div>
            </div>
          ) : filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  className={`group relative bg-zinc-800/30 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-indigo-500/50 hover:bg-zinc-800/50 ${
                    selectedPromptId === prompt.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700/50'
                  }`}
                  onClick={() => handlePromptSelect(prompt)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {prompt.title && (
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                          {prompt.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          {prompt.access === 'private' ? (
                            <Lock size={10} className="text-amber-400" />
                          ) : (
                            <Eye size={10} className="text-emerald-400" />
                          )}
                          <span className={prompt.access === 'private' ? 'text-amber-400' : 'text-emerald-400'}>
                            {prompt.access}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{formatDate(prompt.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="text-zinc-300 text-sm leading-relaxed mb-3">
                    {truncateContent(prompt.content)}
                  </div>

                  {/* Stats */}
                  {prompt.access === 'public' && (
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Eye size={10} />
                        <span>{prompt.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={10} />
                        <span>{prompt.like_count || 0}</span>
                      </div>
                      {prompt.original_prompt_id === null && (prompt.fork_count || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <GitFork size={10} />
                          <span>{prompt.fork_count || 0}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection Indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-8">
                <Search className="mx-auto text-zinc-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery || filterAccess !== 'all' ? 'No matching prompts' : 'No prompts found'}
                </h3>
                <p className="text-zinc-400">
                  {searchQuery || filterAccess !== 'all'
                    ? 'Try adjusting your search or filter'
                    : 'Create your first prompt to get started'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}