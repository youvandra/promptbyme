import React, { useState, useEffect } from 'react'
import { X, Folder, Palette } from 'lucide-react'
import { motion } from 'framer-motion'

interface Folder {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  user_id: string
  parent_id?: string | null
  position: number
  is_shared: boolean
  created_at: string
  updated_at: string
}

interface FolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (folderData: Partial<Folder>) => Promise<void>
  folder?: Folder | null
  folders: Folder[]
}

const FOLDER_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b', // Slate
]

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  folder,
  folders
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setDescription(folder.description || '')
      setColor(folder.color)
    } else {
      setName('')
      setDescription('')
      setColor('#6366f1')
    }
  }, [folder, isOpen])

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon: 'folder'
      })
    } catch (error) {
      console.error('Failed to save folder:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-f3f3f3 border-2 border-black rounded-[28px] w-full max-w-md shadow-neo-brutalism"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center border-2 border-black shadow-neo-brutalism-sm"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Folder size={18} />
            </div>
            <h2 className="text-lg font-semibold text-black">
              {folder ? 'Edit Folder' : 'Create Folder'}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Folder Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full bg-white border-2 border-black rounded-[28px] px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 shadow-neo-brutalism-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full bg-white border-2 border-black rounded-[28px] px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 resize-none shadow-neo-brutalism-sm"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              <div className="flex items-center gap-2">
                <Palette size={16} />
                Color
              </div>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {FOLDER_COLORS.map((folderColor) => (
                <button
                  key={folderColor}
                  onClick={() => setColor(folderColor)}
                  className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                    color === folderColor 
                      ? 'ring-2 ring-black ring-offset-2 ring-offset-f3f3f3 scale-110 border-2 border-black' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: folderColor }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-black">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-highlight hover:bg-highlight/80 disabled:bg-gray-300 disabled:text-gray-500 text-black font-bold rounded-xl border-2 border-black shadow-neo-brutalism transition-all duration-200 disabled:cursor-not-allowed neo-brutalism"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{folder ? 'Update' : 'Create'} Folder</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}