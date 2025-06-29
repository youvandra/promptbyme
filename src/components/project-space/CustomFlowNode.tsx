import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Edit3, GitBranch, Target, Upload, Trash2, Maximize2, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlowNode } from '../../store/projectSpaceStore'

const CustomFlowNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  
  // Get the appropriate icon based on node type
  const getNodeIcon = () => {
    switch (data.type) {
      case 'input':
        return <Zap size={16} className="text-purple-400" />
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
        className="w-3 h-3 bg-zinc-700 border-2 border-white cursor-pointer !opacity-100"
      />
      
      {/* Node Content */}
      <motion.div 
        className={`w-[250px] h-[150px] ${getNodeColor()} backdrop-blur-sm border rounded-xl p-4 shadow-lg ${
          selected ? 'ring-2 ring-white/50' : ''
        }`}
        animate={{
          boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : '0 0 5px rgba(0, 0, 0, 0.2)'
        }} 
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          {getNodeIcon()}
          <div className="text-white font-medium text-sm truncate flex-1">
            {data.label || data.title}
          </div>
          
          {/* Show assignee if present */}
          {data.nodeData.metadata?.assignTo && (
            <div className="mt-2 text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md inline-block">
              Assigned to: {data.nodeData.metadata.assignTo}
            </div>
          )}
        </div>
        
        <div className="text-zinc-300 text-xs line-clamp-3 break-words overflow-y-auto flex-1">
          {data.content}
        </div>
        
        {/* Toolbar */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl z-50 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onViewDetails) data.onViewDetails(data.nodeData.id);
            }}
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            title="View details"
          >
            <Maximize2 size={16} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onEdit) data.onEdit(data.nodeData.id);
            }}
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            title="Edit node"
          >
            <Edit3 size={16} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`(customflow) Are you sure you want to delete this ${data.nodeData.type} node?`)) {
                if (data.onDelete) data.onDelete(data.nodeData.id);
              }
            }}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            title="Delete node"
          >
            <Trash2 size={16} />
          </button>
        </div>

      </motion.div>
      
      {/* Output Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom} 
        className="w-3 h-3 bg-zinc-700 border-2 border-white cursor-pointer !opacity-100"
      />
    </div>
  )
}

export default CustomFlowNode