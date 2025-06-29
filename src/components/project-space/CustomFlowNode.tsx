import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Edit3, GitBranch, Target, Upload, Trash2, Maximize2, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlowNode, ProjectMember } from '../../store/projectSpaceStore'

const CustomFlowNode: React.FC<NodeProps> = ({ id, data, selected }) => {

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
        className={`w-[250px] h-[150px] ${getNodeColor()} backdrop-blur-sm border rounded-xl p-4 shadow-lg flex flex-col items-start ${
          selected ? 'ring-2 ring-white/50' : ''
        }`}
        animate={{
          boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : '0 0 5px rgba(0, 0, 0, 0.2)'
        }} 
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="text-white font-medium text-sm truncate flex-1 text-left">
            <span>{data.label || data.title}</span>
            
            {/* Show assignee if present */}
            {data.nodeData.metadata?.assignTo && data.projectMembers && (
              <div className="mt-1 text-xs flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded-md inline-block">
                <span>Assigned to:</span>
                {(() => {
                  const assignedUserId = data.nodeData.metadata.assignTo;
                  const assignedMember = data.projectMembers.find(m => m.user_id === assignedUserId);
                  
                  if (!assignedMember) return <span>Unknown</span>;
                  
                  return (
                    <div className="flex items-center gap-1.5">
                      {assignedMember.avatar_url ? (
                        <img 
                          src={assignedMember.avatar_url} 
                          alt={assignedMember.display_name || assignedMember.email}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-4 h-4 bg-indigo-600/30 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-indigo-300">
                            {(assignedMember.display_name || assignedMember.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-indigo-300">
                        {assignedMember.display_name || assignedMember.email}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          )}
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