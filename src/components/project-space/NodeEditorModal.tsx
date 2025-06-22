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
            {detectedVariables && detectedVariables.length > 0 && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 backdrop-blur-sm">
                <h4 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-2">
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