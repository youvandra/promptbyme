import React, { useState } from 'react'
import { Folder, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFolderStore } from '../../store/folderStore'

interface Folder {
  id: string
  name: string
  color: string
  parent_id?: string | null
  children?: Folder[]
}

interface PromptFolderSelectorProps {
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onNewFolderClick?: () => void
  className?: string
}

export const PromptFolderSelector: React.FC<PromptFolderSelectorProps> = ({
  selectedFolderId,
  onFolderSelect,
  onNewFolderClick,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { folders } = useFolderStore()

  // Build folder tree
  const buildFolderTree = (folders: Folder[]): Folder[] => {
    const folderMap = new Map<string, Folder>()
    const rootFolders: Folder[] = []

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!
      
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id)
        if (parent) {
          parent.children!.push(folderWithChildren)
        }
      } else {
        rootFolders.push(folderWithChildren)
      }
    })

    return rootFolders
  }

  const folderTree = buildFolderTree(folders)
  const selectedFolder = folders.find(f => f.id === selectedFolderId)

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFolderSelect = (folderId: string | null) => {
    onFolderSelect(folderId)
    setIsOpen(false)
  }

  const handleNewFolderClick = () => {
    if (onNewFolderClick) {
      onNewFolderClick()
      setIsOpen(false)
    }
  }

  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800/50 ${
            selectedFolderId === folder.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => handleFolderSelect(folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </button>
          )}
          
          <div 
            className="w-3 h-3 flex-shrink-0"
            style={{ color: folder.color }}
          >
            <Folder size={12} />
          </div>
          
          <span className="text-sm truncate">{folder.name}</span>
        </div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {folder.children!.map(child => renderFolder(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white hover:border-zinc-600/50 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {selectedFolder ? (
            <>
              <div 
                className="w-4 h-4 flex-shrink-0"
                style={{ color: selectedFolder.color }}
              >
                <Folder size={16} />
              </div>
              <span className="text-sm truncate">{selectedFolder.name}</span>
            </>
          ) : (
            <>
              <Folder size={16} className="text-zinc-400" />
              <span className="text-sm text-zinc-400">Select Folder</span>
            </>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              {/* None option */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                  selectedFolderId === null ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300'
                }`}
                onClick={() => handleFolderSelect(null)}
              >
                <Folder size={16} className="text-zinc-400" />
                <span className="text-sm">No folder</span>
              </div>

              {/* Folder tree */}
              {folderTree.map(folder => renderFolder(folder))}
              
              {/* New Folder option */}
              <div
                className="flex items-center gap-2 px-3 py-2 mt-2 border-t border-zinc-800 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800/50 text-indigo-400 hover:text-indigo-300"
                onClick={handleNewFolderClick}
              >
                <FolderPlus size={16} />
                <span className="text-sm">New Folder</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}