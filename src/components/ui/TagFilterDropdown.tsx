import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, ChevronDown, X, Check, Filter } from 'lucide-react'
import { APP_TAGS, APP_TAG_CATEGORIES, getAppTagById, type AppTag } from '../../lib/appTags'

interface TagFilterDropdownProps {
  selectedTag: string | null
  onTagChange: (tag: string | null) => void
  placeholder?: string
  className?: string
}

export const TagFilterDropdown: React.FC<TagFilterDropdownProps> = ({
  selectedTag,
  onTagChange,
  placeholder = "Filter by app",
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

  const handleTagSelect = (tagId: string | null) => {
    onTagChange(tagId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const selectedTagObject = selectedTag ? getAppTagById(selectedTag) : null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border-2 border-black rounded-[28px] text-black hover:bg-gray-100 transition-all duration-200 shadow-neo-brutalism-sm"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Filter size={16} className="text-black flex-shrink-0" />
          {selectedTagObject ? (
            <div className="flex items-center gap-2">
              <selectedTagObject.icon 
                size={14} 
                style={{ color: selectedTagObject.color }}
              />
              <span className="text-sm truncate text-black">{selectedTagObject.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-600 truncate">{placeholder}</span>
          )}
        </div>
        
        {selectedTag && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTagChange(null)
            }}
            className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-colors transform hover:scale-110"
          >
            <X size={14} />
          </button>
        )}
        
        <ChevronDown 
          size={16} 
          className={`text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-xl shadow-neo-brutalism z-50 max-h-80 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b-2 border-black">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:border-black text-sm shadow-neo-brutalism-sm"
                autoFocus
              />
            </div>

            {/* All Apps option */}
            <div className="p-2 border-b-2 border-black">
              <button
                onClick={() => handleTagSelect(null)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedTag === null 
                    ? 'bg-highlight text-black border-2 border-black shadow-neo-brutalism-sm' 
                    : 'text-black hover:bg-gray-200'
                }`}
              >
                <Filter size={16} className="text-black" />
                <span className="text-sm">All Apps</span>
                {selectedTag === null && (
                  <Check size={14} className="ml-auto text-black" />
                )}
              </button>
            </div>

            {/* Tags List */}
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(groupedTags).map(([categoryId, category]) => (
                <div key={categoryId} className="p-2">
                  <h4 className="text-xs font-medium text-black uppercase tracking-wider px-2 py-1 mb-1">
                    {category.name}
                  </h4>
                  <div className="space-y-1">
                    {category.tags.map((tag) => {
                      const Icon = tag.icon
                      const isSelected = selectedTag === tag.id
                      
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleTagSelect(tag.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                            isSelected
                              ? 'bg-highlight text-black border-2 border-black shadow-neo-brutalism-sm'
                              : 'text-black hover:bg-gray-200'
                          }`}
                        >
                          <Icon 
                            size={16} 
                            style={{ color: isSelected ? '#000000' : tag.color }}
                          />
                          <span className="text-sm font-medium">{tag.name}</span>
                          {isSelected && (
                            <Check size={14} className="ml-auto text-black" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {Object.keys(groupedTags).length === 0 && (
                <div className="p-4 text-center text-gray-600 text-sm">
                  No apps found matching "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}