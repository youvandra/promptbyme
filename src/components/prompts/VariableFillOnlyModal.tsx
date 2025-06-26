import React, { useState, useEffect } from 'react'
import { X, Eye, Copy, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Variable {
  name: string
  value: string
  placeholder?: string
}

interface VariableFillOnlyModalProps {
  isOpen: boolean
  onClose: () => void
  promptContent: string
  promptTitle?: string
  onVariablesFilled: (filledContent: string) => void
}

export const VariableFillOnlyModal: React.FC<VariableFillOnlyModalProps> = ({
  isOpen,
  onClose,
  promptContent,
  promptTitle,
  onVariablesFilled
}) => {
  const [variables, setVariables] = useState<Variable[]>([])
  const [copied, setCopied] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Extract variables from prompt content
  useEffect(() => {
    if (isOpen && promptContent) {
      const variableMatches = promptContent.match(/\{\{([^}]+)\}\}/g) || []
      const uniqueVariables = Array.from(new Set(variableMatches))
        .map(match => {
          const name = match.replace(/[{}]/g, '')
          return {
            name,
            value: '',
            placeholder: `Enter ${name.toLowerCase().replace(/_/g, ' ')}`
          }
        })
      
      setVariables(uniqueVariables)
      setPreviewMode(false)
    }
  }, [isOpen, promptContent])

  const updateVariable = (name: string, value: string) => {
    setVariables(prev => 
      prev.map(variable => 
        variable.name === name ? { ...variable, value } : variable
      )
    )
  }

  const generateFilledPrompt = () => {
    let filledPrompt = promptContent
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      filledPrompt = filledPrompt.replace(regex, variable.value || `{{${variable.name}}}`)
    })
    return filledPrompt
  }

  const handleApply = () => {
    const filledPrompt = generateFilledPrompt()
    onVariablesFilled(filledPrompt)
  }

  const allVariablesFilled = variables.every(variable => variable.value.trim() !== '')

  // Function to highlight variables in content
  const renderLivePreview = () => {
    let highlightedPrompt = promptContent
    
    // Process each variable individually to highlight correctly
    variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`
      if (variable.value) {
        // Replace the placeholder with highlighted filled value
        const regex = new RegExp(`\\{\\{${variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g')
        highlightedPrompt = highlightedPrompt.replace(
          regex, 
          `<span class="bg-emerald-500/20 text-emerald-300 px-1 rounded font-medium border border-emerald-500/30">${variable.value}</span>`
        )
      } else {
        // Highlight unfilled variables in orange
        const regex = new RegExp(`(\\{\\{${variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\})`, 'g')
        highlightedPrompt = highlightedPrompt.replace(
          regex, 
          `<span class="bg-orange-500/20 text-orange-300 px-1 rounded font-medium border border-orange-500/30 animate-pulse">$1</span>`
        )
      }
    })

    return { __html: highlightedPrompt }
  }

  const renderFinalPreview = () => {
    let highlightedPrompt = promptContent
    
    // Process each variable individually to highlight correctly
    variables.forEach(variable => {
      if (variable.value) {
        // Replace the placeholder with highlighted filled value
        const regex = new RegExp(`\\{\\{${variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g')
        highlightedPrompt = highlightedPrompt.replace(
          regex, 
          `<span class="bg-indigo-500/20 text-indigo-300 px-1 rounded font-medium">${variable.value}</span>`
        )
      }
    })

    return { __html: highlightedPrompt }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              Fill Variables
            </h2>
            {promptTitle && (
              <p className="text-sm text-zinc-400">
                {promptTitle}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!previewMode ? (
              <motion.div
                key="fill"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden p-4 sm:p-6"
              >
                {/* MOBILE: TOP / DESKTOP: LEFT - Live preview */}
                <div className="lg:w-1/2 overflow-hidden">
                  <div className="sticky top-6">
                    <div className="bg-zinc-800/20 border border-zinc-800/50 p-4 rounded-xl">
                      <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                        <Eye size={16} className="text-indigo-400" />
                        Live Preview
                      </h4>
                      <p className="text-xs text-zinc-500 mb-4">See your changes in real-time</p>
                
                      <div className="bg-zinc-900/50 border border-zinc-700/30 rounded-xl p-4 max-h-[60vh] overflow-auto">
                        <div 
                          className="text-zinc-200 leading-relaxed whitespace-pre-wrap break-words text-sm"
                          dangerouslySetInnerHTML={renderLivePreview()}
                        />
                      </div>
                
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded"></div>
                          <span className="text-zinc-400">Filled variables</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500/20 border border-orange-500/30 rounded animate-pulse"></div>
                          <span className="text-zinc-400">Unfilled variables</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE: BOTTOM / DESKTOP: RIGHT - Variable inputs */}
                <div className="lg:w-1/2 space-y-6 overflow-y-auto max-h-[80vh]">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Fill in the variables
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Enter values and see the preview update in real-time
                    </p>
                  </div>

                  {/* Variable inputs */}
                  <div className="space-y-4">
                    {variables.map((variable, index) => (
                      <motion.div
                        key={variable.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <label className="block text-sm font-medium text-zinc-300">
                          <span className="text-indigo-400">{`{{${variable.name}}}`}</span>
                          {variable.value && (
                            <span className="ml-2 text-emerald-400 text-xs">✓ Filled</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={variable.value}
                          onChange={(e) => updateVariable(variable.name, e.target.value)}
                          placeholder={variable.placeholder}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Progress indicator */}
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-300">Progress</span>
                      <span className="text-sm text-zinc-400">
                        {variables.filter(v => v.value.trim()).length} / {variables.length}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700/50 rounded-full h-2">
                      <motion.div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(variables.filter(v => v.value.trim()).length / variables.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => setPreviewMode(true)}
                      disabled={!allVariablesFilled}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <Eye size={16} />
                      <span>Preview & Apply</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sm:p-6 space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Preview your customized prompt
                  </h3>
                  <p className="text-zinc-400">
                    Review the filled variables and apply when ready
                  </p>
                </div>

                {/* Final Preview */}
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    Customized Prompt
                  </h4>
                  <div 
                    className="text-zinc-200 leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={renderFinalPreview()}
                  />
                </div>

                {/* Variable summary */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-indigo-300 mb-3">Variables filled:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm bg-zinc-800/30 rounded-lg p-3">
                        <span className="text-indigo-400 font-mono text-xs">{`{{${variable.name}}}`}</span>
                        <span className="text-zinc-400">→</span>
                        <span className="text-white font-medium flex-1 truncate">{variable.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    Edit Variables
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Copy size={16} />
                    <span>Apply to Playground</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Copy feedback */}
        {copied && (
          <div className="absolute top-4 right-16 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm animate-pulse z-10 pointer-events-none">
            Copied!
          </div>
        )}
      </motion.div>
    </div>
  )
}