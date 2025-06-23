import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Edit3, GitBranch, Target, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { FlowNode } from '../../store/projectSpaceStore'

const CustomFlowNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  // Check if this node is the active node
  const isActive = data.activeNodeId === id
  
  // Get the appropriate icon based on node type
  const getNodeIcon = () => {
    switch (data.type) {
      case 'input':
        return <Upload size={16} className="text-purple-400" />
      case 'prompt':
        return <Edit3 size={16} className="text-blue-400" />
      case 'condition':
        return <GitBranch size={16} className="text-yellow-400" />
      case 'output':
        return <Target size={16} className="text-green-400" />
      default:
        return <Edit3 size={16} className="text-blue-400" />
    }
  }

  // Get the appropriate background color based on node type
  const getNodeColor = () => {
    switch (data.type) {
      case 'input':
        return 'bg-purple-500/10 border-purple-500/30'
      case 'prompt':
        return 'bg-blue-500/10 border-blue-500/30'
      case 'condition':
        return 'bg-yellow-500/10 border-yellow-500/30'
      case 'output':
        return 'bg-green-500/10 border-green-500/30'
      default:
        return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  return (
    <div className="relative">
      {/* Input Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-zinc-700 border-2 border-white cursor-crosshair"
      />
      
      {/* Node Content */}
      <motion.div 
        className={`min-w-[200px] max-w-[300px] ${getNodeColor()} backdrop-blur-sm border rounded-xl p-4 shadow-lg ${
          selected ? 'ring-2 ring-white/50' : ''
        }`}
        animate={{
          boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : '0 0 5px rgba(0, 0, 0, 0.2)'
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          {getNodeIcon()}
          <div className="text-white font-medium text-sm truncate">
            {data.title}
          </div>
        </div>
        
        <div className="text-zinc-300 text-xs line-clamp-3 break-words">
          {data.content}
        </div>
      </motion.div>
      
      {/* Output Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-zinc-700 border-2 border-white cursor-crosshair"
      />
    </div>
  )
}

export default CustomFlowNode