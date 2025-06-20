import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Share2, FolderOpen, History, Trash2, ChevronRight } from 'lucide-react'

interface ContextMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  submenu?: ContextMenuItem[]
}

interface ContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  items,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ x, y })
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null)

  // Adjust position to prevent overflow
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let adjustedX = x
      let adjustedY = y
      
      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }
      
      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }
      
      // Ensure minimum distance from edges
      adjustedX = Math.max(10, adjustedX)
      adjustedY = Math.max(10, adjustedY)
      
      setPosition({ x: adjustedX, y: adjustedY })
    }
  }, [isOpen, x, y])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.submenu) {
      item.onClick()
      onClose()
    }
  }

  const renderMenuItem = (item: ContextMenuItem, isSubmenu = false) => (
    <div
      key={item.id}
      className="relative"
      onMouseEnter={() => item.submenu && setActiveSubmenu(item.id)}
      onMouseLeave={() => item.submenu && setActiveSubmenu(null)}
    >
      <button
        onClick={() => handleItemClick(item)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-all duration-200 ${
          item.variant === 'danger'
            ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
            : 'text-zinc-300 hover:bg-white/5 hover:text-white'
        } ${isSubmenu ? 'pl-4' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 flex-shrink-0">
            {item.icon}
          </span>
          <span className="font-medium">{item.label}</span>
        </div>
        {item.submenu && (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
      </button>

      {/* Submenu */}
      <AnimatePresence>
        {item.submenu && activeSubmenu === item.id && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-0 ml-1 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/30 rounded-lg shadow-xl py-2 min-w-[160px] z-50 glass-panel"
          >
            {item.submenu.map(subItem => renderMenuItem(subItem, true))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-[9999] bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/30 rounded-lg shadow-xl py-2 min-w-[180px] glass-panel"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {items.map(item => renderMenuItem(item))}
      </motion.div>
    </AnimatePresence>
  )
}