import React from 'react'
import { motion } from 'framer-motion'
import { 
  Trash2, 
  Edit3,
  Link,
  Info, 
  X
} from 'lucide-react'
import { FlowNode } from '../../store/projectSpaceStore'

interface NodeDetailsToolbarProps {
  selectedNode: FlowNode | null
  onEdit: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (nodeId: string) => void
  onStartConnect?: (nodeId: string) => void
  onClose: () => void
}

export const NodeDetailsToolbar: React.FC<NodeDetailsToolbarProps> = ({
  selectedNode,
  onEdit,
  onDelete,
  onViewDetails,
  onStartConnect,
  onClose
}) => {
  if (!selectedNode) return null

  // Get the appropriate color based on node type
  const getNodeColor = () => {
    switch (selectedNode.type) {
      case 'input':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300'
      case 'prompt':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300'
      case 'condition':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
      case 'output':
        return 'bg-green-500/10 border-green-500/30 text-green-300'
      default:
        return 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
    }
  }

  // Function to handle node deletion with confirmation
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${selectedNode.type} node?`)) {
      onDelete(selectedNode.id)
    }
  }

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800/50 rounded-xl shadow-xl z-50 max-w-[90vw]"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center p-1">
        {/* Node info */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getNodeColor()} overflow-hidden`}>
          <span className="font-medium text-sm truncate max-w-[200px]">{selectedNode.title}</span>
          <span className="text-xs px-2 py-0.5 bg-zinc-800/50 rounded-full">
            {selectedNode.type}
          </span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-zinc-800/50 mx-2"></div>

        {/* Actions */}
        <div className="flex items-center">
          <button
            onClick={() => onViewDetails(selectedNode.id)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            title="View node details"
          >
            <Info size={18} />
          </button>
          
          <button
            onClick={() => onEdit(selectedNode.id)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            title="Edit node"
          >
            <Edit3 size={18} />
          </button>
          
          {onStartConnect && (
            <button
              onClick={() => onStartConnect(selectedNode.id)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              title="Connect to another node"
            >
              <Link size={18} />
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            title="Delete node"
          >
            <Trash2 size={18} />
          </button>
          
          <div className="h-8 w-px bg-zinc-800/50 mx-2"></div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            title="Close toolbar"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}