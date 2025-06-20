import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { APP_TAGS, APP_TAG_CATEGORIES, getAppTagById, type AppTag } from '../../lib/appTags'

interface TagSelectorProps {
  selectedTag: string | null
  onTagChange: (tag: string | null) => void
  placeholder?: string
  className?: string
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTag,
  onTagChange,
  placeholder = "Select app tag...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredTags = APP_TAGS.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedTags = APP_TAG_CATEGORIES.reduce((acc, category) => {
    const categoryTags = filteredTags.filter(tag => tag.category === category.id)
    if (categoryTags.length > 0) {
      acc[category.id] = {
        name: category.name,
        tags: categoryTags
      }
    }
    return acc
  }, {} as Record<string, { name: string; tags: AppTag[] }>)

  const handleTagToggle = (tagId: string) => {
    if (selectedTag === tagId) {
      onTagChange(null)
    } else {
      onTagChange(tagId)
    }
    setIsOpen(false) // Close dropdown after selection
  }

  const handleRemoveTag = () => {
    onTagChange(null)
  }

  const selectedTagObject = selectedTag ? getAppTagById(selectedTag) : null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Show selected tag or dropdown trigger */}
      {selectedTagObject ? (
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm w-full"
          >
            <selectedTagObject.icon 
              size={14} 
              style={{ color: selectedTagObject.color }}
            />
            <span className="text-white font-medium">{selectedTagObject.name}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveTag}
                className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
                title="Remove tag"
              >
                <X size={14} className="text-zinc-400 hover:text-white" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white hover:border-zinc-600/50 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-zinc-400" />
            <span className="text-sm text-zinc-400">
              {placeholder}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !selectedTagObject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags..."
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-sm"
                autoFocus
              />
            </div>

            {/* Tags List */}
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(groupedTags).map(([categoryId, category]) => (
                <div key={categoryId} className="p-2">
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-2 py-1 mb-1">
                    {category.name}
                  </h4>
                  <div className="space-y-1">
                    {category.tags.map((tag) => {
                      const Icon = tag.icon
                      const isSelected = selectedTag === tag.id
                      
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                            isSelected
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                              : 'text-zinc-300 hover:bg-zinc-800/50'
                          }`}
                        >
                          <Icon 
                            size={16} 
                            style={{ color: isSelected ? '#a5b4fc' : tag.color }}
                          />
                          <span className="text-sm font-medium">{tag.name}</span>
                          {isSelected && (
                            <div className="ml-auto w-3 h-3 bg-indigo-400 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {Object.keys(groupedTags).length === 0 && (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  No tags found matching "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}