import React from 'react'
import { X, Upload, Edit3, GitBranch, Target, Calendar, User, FileText, Copy } from 'lucide-react'
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
  const [copied, setCopied] = React.useState(false)

  if (!isOpen || !node) return null

  const nodeConfig = NODE_TYPE_CONFIG[node.type]
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

  // Extract variables from content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g)
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : []
  }

  const variables = extractVariables(node.content)

  // Simple token estimation function
  const estimateTokens = (text: string): number => {
    if (!text) return 0
    
    // Basic token estimation:
    // - Average 4 characters per token for English text
    // - Account for whitespace and punctuation
    // - Add slight buffer for safety
    const baseTokens = Math.ceil(text.length / 4)
    
    // Add tokens for variables (each variable adds ~2-3 tokens)
    const variableTokens = variables.length * 2.5
    
    // Round up and add small buffer
    return Math.ceil(baseTokens + variableTokens)
  }

  const estimatedTokens = estimateTokens(node.content)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <AnimatePresence>
        <motion.div 
          className="relative  backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 glass-morphism">
          {/* Node Type Description */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/20">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">Node Type</h3>
            <p className="text-zinc-400 text-sm">{nodeConfig.description}</p>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <FileText size={16} />
                Content
              </h3>
              {node.content && (
                <motion.button
                  onClick={() => copyToClipboard(node.content)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Copy content"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Copy size={12} />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </motion.button>
              )}
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/20">
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
          
          {/* Variables */}
          {node.type === 'prompt' && variables.length > 0 && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-500/30">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Variables ({variables.length} found)</h3>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200 transform hover:scale-105"
                  >
                    {`{{${variable}}}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imported Prompt Info */}
          {node.imported_prompt_id && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30">
              <h3 className="text-sm font-medium text-blue-300 mb-2">Imported Prompt</h3>
              <p className="text-blue-200 text-sm">
                This node was created from an imported prompt from your gallery.
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Created
              </h3>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/20">
                <p className="text-zinc-200 text-sm">{formatDate(node.created_at)}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Last Updated
              </h3>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/20">
                <p className="text-zinc-200 text-sm">{formatDate(node.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Statistics - Only show token estimation for prompt nodes */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Statistics</h3>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/20">
              <div className={`grid gap-4 text-sm ${node.type === 'prompt' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                <div>
                  <span className="text-zinc-500">Characters:</span>
                  <span className="text-zinc-200 ml-2">{node.content.length}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Words:</span>
                  <span className="text-zinc-200 ml-2">
                    {node.content.trim() ? node.content.trim().split(/\s+/).length : 0}
                  </span>
                </div>
                {node.type === 'prompt' && (
                  <div>
                    <span className="text-zinc-500">Est. Tokens:</span>
                    <span className="text-orange-300 ml-2 font-medium">
                      ~{estimatedTokens.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Token estimation explanation */}
              {node.type === 'prompt' && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-zinc-500">
                    Token estimation based on ~4 chars/token + variable overhead.
                    Actual usage may vary by model and content complexity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">
              Node ID: {node.id}
            </div>
            {onEdit && (
              <motion.button
                onClick={() => {
                  onEdit(node.id)
                  onClose()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-lg transition-all duration-200 text-sm hover:scale-105 hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit3 size={14} />
                <span>Edit Node</span>
              </motion.button>
            )}
          </div>
        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}