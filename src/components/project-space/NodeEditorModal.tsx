import React, { useState, useEffect } from 'react'
import { X, Save, Type, GitBranch, Target, Wand2, Download, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { FlowNode } from '../../store/projectSpaceStore'
import { PromptImportModal } from './PromptImportModal'
import { highlightVariables, extractVariables } from '../../utils/promptUtils'

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
  
  
  const isNewNode = !node?.id
  const nodeConfig = node ? NODE_TYPE_CONFIG[node.type] : NODE_TYPE_CONFIG.prompt

  useEffect(() => {
    if (node) {
      setTitle(node.title || '')
      setContent(node.content || '')
    } else {
      setTitle('')
      setContent('')
    }
  }, [node])

  const handleClose = () => {
    setTitle('')
    setContent('')
    onClose()
  }

  const handleSave = async () => {
    if (!node || !title.trim()) return
    
    setSaving(true)
    try {
      await onSave(node.id, {
        title: title.trim(),
        content: content.trim()
      })
      handleClose()
    } catch (error) {
      console.error('Failed to save node:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleImportPrompt = (prompt: any) => {
    setTitle(prompt.title || '')
    setContent(prompt.content || '')
    setShowImportModal(false)
  }

  // Extract variables from content
  const detectedVariables = extractVariables(content)

  if (!isOpen || !node) return null

  const IconComponent = nodeConfig.icon

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${nodeConfig.color} rounded-lg`}>
                <IconComponent size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isNewNode ? `Create ${nodeConfig.label}` : `Edit ${nodeConfig.label}`}
                </h2>
                <p className="text-sm text-zinc-400">
                  {isNewNode ? `Add a new ${nodeConfig.label.toLowerCase()} node to your flow` : `Modify your ${nodeConfig.label.toLowerCase()} node`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {node.type === 'prompt' && (
                <motion.button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm font-medium rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={16} />
                  Import Prompt
                </motion.button>
              )}
              
              <motion.button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} className="text-zinc-400" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                {nodeConfig.label} Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${nodeConfig.label.toLowerCase()} title...`}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                {nodeConfig.label} Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={nodeConfig.placeholder}
                rows={12}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}