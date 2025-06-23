import React, { useState, useEffect } from 'react'
import { X, Save, Type, GitBranch, Target, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { FlowNode } from '../../store/projectSpaceStore'

interface NodeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  node: FlowNode | null
  onSave: (nodeId: string, updates: Partial<FlowNode>) => Promise<void>
}

const NODE_TYPE_CONFIG = {
  input: {
    icon: Upload,
    color: 'bg-purple-500',
    label: 'Input',
    placeholder: 'Define your input parameters here...\n\nExample:\nInput variables:\n- {{user_name}}: The name of the user\n- {{context}}: Additional context information'
  },
  prompt: {
    icon: Type,
    color: 'bg-blue-500',
    label: 'Prompt',
    placeholder: 'Write your prompt here...\n\nYou can use {{variables}} for dynamic content.\n\nExample:\nCreate a {{type}} for {{audience}} that focuses on {{topic}}.'
  },
  condition: {
    icon: GitBranch,
    color: 'bg-yellow-500',
    label: 'Condition',
    placeholder: 'Define your condition logic here...\n\nExample:\nIf {{variable}} equals "value" then:\n- Do action A\nElse:\n- Do action B'
  },
  output: {
    icon: Target,
    color: 'bg-green-500',
    label: 'Output',
    placeholder: 'Specify your output format here...\n\nExample:\nGenerate the result as:\n- Format: {{format}}\n- Length: {{length}}\n- Style: {{style}}'
  }
}

export const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (node && isOpen) {
      setTitle(node.title)
      setContent(node.content)
    }
  }, [node, isOpen])

  const handleSave = async () => {
    if (!node || !title.trim()) return

    setSaving(true)
    try {
      await onSave(node.id, {
        title: title.trim(),
        content: content.trim()
      })
      onClose()
    } catch (error) {
      console.error('Failed to save node:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !node) return null

  const nodeConfig = NODE_TYPE_CONFIG[node.type as keyof typeof NODE_TYPE_CONFIG]
  const Icon = nodeConfig.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${nodeConfig.color} rounded-lg shadow-lg`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Edit {nodeConfig.label} Node
              </h2>
              <p className="text-sm text-zinc-400">
                Configure your {node.type} node
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Node Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              autoFocus
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={nodeConfig.placeholder}
              className="w-full min-h-[300px] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-y font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800/50 flex-shrink-0">
          <div className="text-sm text-zinc-500">
            Last updated: {new Date(node.updated_at).toLocaleDateString()}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}