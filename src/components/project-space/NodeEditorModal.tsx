import React, { useState, useEffect } from 'react'
import { X, Save, Type, GitBranch, Target, Wand2, Download, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { FlowNode } from '../../store/projectSpaceStore'
import { highlightVariables, extractVariables } from '../../utils/promptUtils'
import { PromptImportModal } from './PromptImportModal'
import { useProjectSpaceStore } from '../../store/projectSpaceStore'

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
  const [showImportModal, setShowImportModal] = useState(false)
  const [isNewNode, setIsNewNode] = useState(false)
  const { createNode } = useProjectSpaceStore()

  useEffect(() => {
    if (node && isOpen) {
      setIsNewNode(node.id.startsWith('temp-'))
      setTitle(node.title)
      setContent(node.content)
    }
    else if (isOpen && !node) {
      // Reset form for new nodes
      setTitle('')
      setContent('')
      setIsNewNode(false)
    }
  }, [node, isOpen])

  const handleSave = async () => {
    if (!node || !title.trim()) return

    setSaving(true)
    try {
      if (isNewNode && node.id.startsWith('temp-')) {
        // For new nodes, create them properly
        const newNode = await createNode(
          node.project_id,
          node.type,
          node.position,
          node.imported_prompt_id || undefined
        )
        
        // Update the newly created node with the form data
        if (newNode) {
          await onSave(newNode.id, {
            title: title.trim(),
            content: content.trim()
          })
        }
      } else {
        // Update existing node
        await onSave(node.id, {
          title: title.trim(),
          content: content.trim()
        })
      }
      onClose()
    } catch (error) {
      console.error('Failed to save node:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setIsNewNode(false)
    onClose()
  }

  const handleImportPrompt = (prompt: any) => {
    setTitle(prompt.title || 'Imported Prompt')
    setContent(prompt.content)
    // Update the node with imported prompt data
    if (node) {
      node.imported_prompt_id = prompt.id
    }
    setShowImportModal(false)
  }

  if (!isOpen || !node) return null

  const nodeConfig = NODE_TYPE_CONFIG[node.type]
  const Icon = nodeConfig.icon

  // Extract variables from content
  const detectedVariables = extractVariables(content)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
        <motion.div 
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
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
                  {isNewNode ? 'Create' : 'Edit'} {nodeConfig.label} Node
                </h2>
                <p className="text-sm text-zinc-400">
                  {node.title === `New ${nodeConfig.label}` ? 'Create a new' : 'Configure your'} {node.type} node
                </p>
              </div>
            </div>
          
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
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
                placeholder={`Enter a descriptive title for your ${node.type}...`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                autoFocus
              />
            </div>

            {/* Import Prompt Button (only for prompt nodes) */}
            {node.type === 'prompt' && (
              <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl backdrop-blur-sm">
                <div>
                  <h4 className="text-sm font-medium text-indigo-300 mb-1">Import from Gallery</h4>
                  <p className="text-xs text-indigo-400/80">Import an existing prompt from your gallery</p>
                </div>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:border-white/20 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Download size={16} />
                  <span>Import</span>
                </button>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Description & Content
              </label>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={nodeConfig.placeholder}
                  className="w-full min-h-[300px] bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-y font-mono text-sm leading-relaxed"
                />
              
                {/* Character count */}
                <div className="text-sm text-zinc-500 mt-2">
                  {content.length} characters
                </div>
              </div>
            </div>

            {/* Live preview of variables */}
            {detectedVariables.length > 0 && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="text-sm font-medium text-indigo-300 mb-2">
                  <Wand2 size={16} />
                  Variables detected: {detectedVariables.join(', ')}
                </h4>
                <div 
                  className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightVariables(content.substring(0, 200) + (content.length > 200 ? '...' : '')) 
                  }}
                />
              </div>
            )}

            {node.type === 'prompt' && isNewNode && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">
                  {nodeConfig.label} Guidelines
                </h4>
                <div className="text-xs text-zinc-400 space-y-1">
                  <p>• Use clear, specific instructions for the best AI results</p>
                  <p>• Include {{variables}} for dynamic content</p>
                  <p>• Provide context and examples when helpful</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 flex-shrink-0">
            <div className="text-sm text-zinc-500">
              {isNewNode ? 'Creating new node' : `Last updated: ${new Date(node.updated_at).toLocaleDateString()}`}
            </div>
          
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleClose}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:bg-zinc-700/50 disabled:border-zinc-700/50 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isNewNode ? 'Create' : 'Save Changes'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Import Prompt Modal */}
      <PromptImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSelectPrompt={handleImportPrompt}
      />
    </>
  )
}