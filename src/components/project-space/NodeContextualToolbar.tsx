import React from 'react'
import { motion } from 'framer-motion'
import { 
  Trash2, 
  Maximize2,
  Edit3, 
  Copy, 
  Link
} from 'lucide-react'
import { FlowNode } from '../../store/projectSpaceStore'
import { Node, useReactFlow } from 'reactflow'

export interface NodeContextualToolbarProps {
  node: Node
  nodeData: FlowNode
  onEdit: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (nodeId: string) => void 
}

export const NodeContextualToolbar: React.FC<NodeContextualToolbarProps> = ({
  node,
  nodeData,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const { getEdges, setEdges } = useReactFlow()

  // Remove the stopPropagation to allow the toolbar to be clicked
  const handleClick = (e: React.MouseEvent, callback: () => void) => {
    callback();
  }
  
  // Function to handle node deletion with confirmation
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`HI you sure you want to delete this ${nodeData.type} node?`)) {
      onDelete(node.id)
    }
  }
  
  // Function to handle node editing
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(node.id)
  }
  
  // Function to handle viewing node details
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewDetails(node.id)
  }
  
  // Function to start connection mode (to be implemented)
  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    // This would be implemented in the parent component
    console.log('Connect from node:', node.id)
  }

  return (
    <motion.div
      className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl z-50 flex items-center" 
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center">
        <button
          onClick={(e) => handleClick(e, () => handleViewDetails(node.id))}
          className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          title="View details"
        >
          <Maximize2 size={16} />
        </button>
        
        <button
          onClick={(e) => handleClick(e, () => handleEdit(node.id))}
          className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          title="Edit node"
        >
          <Edit3 size={16} />
        </button>
        
        <button
          onClick={(e) => handleClick(e, handleConnect)}
          className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          title="Connect to another node"
        >
          <Copy size={16} />
        </button>
        
        <button
          onClick={handleDelete}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          title="Delete node"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}