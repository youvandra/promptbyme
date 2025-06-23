import React from 'react'
import { X, Upload, Edit3, GitBranch, Target, Calendar, User, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlowNode } from '../../store/projectSpaceStore'

interface NodeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  node: FlowNode | null
  onEdit?: (nodeId: string) => void
}

const NODE_TYPE_CONFIG = {
  input: {
    icon: Upload,
    color: 'bg-purple-500',
    label: 'Input',
    description: 'Defines input parameters and variables for the flow'
  },
  prompt: {
    icon: Edit3,
    color: 'bg-blue-500',
    label: 'Prompt',
    description: 'Contains AI prompts with instructions and context'
  },
  condition: {
    icon: GitBranch,
    color: 'bg-yellow-500',
    label: 'Condition',
    description: 'Defines conditional logic and branching paths'
  },
  output: {
    icon: Target,
    color: 'bg-green-500',
    label: 'Output',
    description: 'Specifies output format and requirements'
  }
}

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  isOpen,
  onClose,
  node,
  onEdit
}) => {
  if (!isOpen || !node) return null

  const nodeConfig = NODE_TYPE_CONFIG[node.type as keyof typeof NODE_TYPE_CONFIG]
  const Icon = nodeConfig.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <AnimatePresence>
        <motion.div 
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-gradient-to-r from-${node.type === 'input' ? 'purple' : node.type === 'prompt' ? 'blue' : node.type === 'condition' ? 'yellow' : 'green'}-500 to-${node.type === 'input' ? 'purple' : node.type === 'prompt' ? 'blue' : node.type === 'condition' ? 'yellow' : 'green'}-600 rounded-lg shadow-lg`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {node.title}
                </h2>
                <p className="text-sm text-zinc-400">
                  {nodeConfig.label} Node
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Node Type Description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Node Type</h3>
              <p className="text-zinc-400 text-sm">{nodeConfig.description}</p>
            </div>

            {/* Content */}
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <FileText size={16} />
                Content
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                {node.content ? (
                  <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {node.content}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-sm italic">
                    No content defined
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Created
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-zinc-200 text-sm">{formatDate(node.created_at)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Last Updated
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-zinc-200 text-sm">{formatDate(node.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Node ID: {node.id}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}