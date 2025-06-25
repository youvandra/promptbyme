import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Menu, 
  Plus, 
  Trash2, 
  Settings, 
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Edit3,
  Save,
  Wand2,
  Zap,
  ArrowRight,
  X,
  Copy,
  Download,
  RotateCcw,
  Server
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { PromptSelectionModal } from '../../components/prompts/PromptSelectionModal'
import { FlowApiSettingsModal } from '../../components/prompt-flow/FlowApiSettingsModal'
import { VariableFillModal } from '../../components/prompt-flow/VariableFillModal'
import { useAuthStore } from '../../store/authStore'
import { useFlowStore, FlowStep, PromptFlow } from '../../store/flowStore'
import { useClipboard } from '../../hooks/useClipboard'

export const PromptFlowPage: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null)
  const [editingStepTitle, setEditingStepTitle] = useState<string | null>(null)
  const [editingStepTitleValue, setEditingStepTitleValue] = useState('')
  
  const { copied, copyToClipboard } = useClipboard()
  
  const { user, loading: authLoading } = useAuthStore()
  const { 
    flows,
    selectedFlow,
    apiSettings,
    loading,
    executing,
    fetchFlows,
    createFlow,
    selectFlow,
    addStep,
    updateStep,
    updateStepContent,
    deleteStep,
    reorderStep,
    executeFlow,
    executeStep,
    updateApiSettings,
    clearOutputs
  } = useFlowStore()

  // Load flows on mount
  useEffect(() => {
    if (user) {
      fetchFlows()
    }
  }, [user, fetchFlows])

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return
    
    setIsCreating(true)
    try {
      const flow = await createFlow(
        newFlowName.trim(), 
        newFlowDescription.trim() || undefined
      )
      await selectFlow(flow.id)
      setShowCreateFlow(false)
      setNewFlowName('')
      setNewFlowDescription('')
      setToast({ message: 'Flow created successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to create flow:', error)
      setToast({ message: 'Failed to create flow', type: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  const handlePromptSelected = async (prompt: any) => {
    if (!selectedFlow) return
    
    try {
      await addStep(
        selectedFlow.id,
        prompt.id,
        prompt.title || 'Untitled Prompt',
        prompt.content
      )
      setToast({ message: 'Prompt added to flow', type: 'success' })
    } catch (error) {
      console.error('Failed to add prompt to flow:', error)
      setToast({ message: 'Failed to add prompt to flow', type: 'error' })
    }
  }

  const handleStepTitleUpdate = async (stepId: string, newTitle: string) => {
    try {
      await updateStep(stepId, { step_title: newTitle })
      setEditingStepTitle(null)
      setToast({ message: 'Step title updated', type: 'success' })
    } catch (error) {
      console.error('Failed to update step title:', error)
      setToast({ message: 'Failed to update step title', type: 'error' })
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return
    
    try {
      await deleteStep(stepId)
      setToast({ message: 'Step deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete step:', error)
      setToast({ message: 'Failed to delete step', type: 'error' })
    }
  }

  const handleMoveStep = async (stepId: string, direction: 'up' | 'down') => {
    if (!selectedFlow) return
    
    const stepIndex = selectedFlow.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) return
    
    const currentOrderIndex = selectedFlow.steps[stepIndex].order_index
    let newOrderIndex: number
    
    if (direction === 'up' && stepIndex > 0) {
      newOrderIndex = selectedFlow.steps[stepIndex - 1].order_index
    } else if (direction === 'down' && stepIndex < selectedFlow.steps.length - 1) {
      newOrderIndex = selectedFlow.steps[stepIndex + 1].order_index
    } else {
      return // Can't move further in this direction
    }
    
    try {
      await reorderStep(stepId, newOrderIndex)
      setToast({ message: 'Step reordered successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to reorder step:', error)
      setToast({ message: 'Failed to reorder step', type: 'error' })
    }
  }

  const handleRunFlow = async () => {
    if (!selectedFlow) return
    
    try {
      await executeFlow(selectedFlow.id)
      setToast({ message: 'Flow executed successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to execute flow:', error)
      setToast({ message: 'Failed to execute flow', type: 'error' })
    }
  }

  const handleRunStep = async (stepId: string) => {
    if (!selectedFlow) return
    
    try {
      const step = selectedFlow.steps.find(s => s.id === stepId)
      if (!step) return
      
      // Get variables from previous steps
      const stepIndex = selectedFlow.steps.findIndex(s => s.id === stepId)
      const previousSteps = selectedFlow.steps.slice(0, stepIndex)
      
      // Build context from previous steps' outputs
      const context: Record<string, string> = {}
      previousSteps.forEach((s, idx) => {
        if (s.output) {
          context[`step_${idx+1}_output`] = s.output
        }
      })
      
      // Add variables from the current step if they exist
      if (step.variables) {
        Object.entries(step.variables).forEach(([key, value]) => {
          context[key] = value
        })
      }
      
      // Get previous step output if available
      const prevStepOutput = stepIndex > 0 && previousSteps[previousSteps.length - 1].output 
        ? previousSteps[previousSteps.length - 1].output 
        : ''
      
      // Use custom content if available, otherwise use original prompt content
      const contentToUse = step.custom_content || step.prompt_content || ''
      
      const output = await executeStep(stepId, context, prevStepOutput, contentToUse)
      setToast({ message: 'Step executed successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to execute step:', error)
      setToast({ message: 'Failed to execute step', type: 'error' })
    }
  }

  const handleClearOutputs = () => {
    clearOutputs()
    setToast({ message: 'Outputs cleared', type: 'success' })
  }

  const handleSaveApiSettings = async (settings: any) => {
    try {
      await updateApiSettings(settings)
      setToast({ message: 'API settings saved', type: 'success' })
    } catch (error) {
      console.error('Failed to save API settings:', error)
      setToast({ message: 'Failed to save API settings', type: 'error' })
    }
  }

  const handleVariablesFilled = (stepId: string, filledContent: string, variables: Record<string, string>) => {
    updateStepContent(stepId, filledContent, variables)
      .then(() => {
        setToast({ message: 'Variables saved successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to save variables:', error)
        setToast({ message: 'Failed to save variables', type: 'error' })
      })
  }

  const copyStepOutput = (output: string) => {
    copyToClipboard(output)
    setToast({ message: 'Output copied to clipboard', type: 'success' })
  }

  const downloadStepOutput = (output: string, stepTitle: string) => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${stepTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_output.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setToast({ message: 'Output downloaded', type: 'success' })
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading prompt flows...</span>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access prompt flows
            </p>
          </div>
        </div>
        
        <BoltBadge />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  data-menu-button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <Menu size={20} />
                </button>
                
                <h1 className="text-lg font-semibold text-white">
                  Prompt Flow
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-7xl px-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Prompt Flow
                  </h1>
                  <p className="text-zinc-400">
                    Create and run sequential prompt chains
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowApiSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl transition-all duration-200 text-sm"
                  >
                    <Server size={16} className="text-indigo-400" />
                    <span>API Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCreateFlow(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                  >
                    <Plus size={16} />
                    <span>New Flow</span>
                  </button>
                </div>
              </div>

              {/* Flow Selection */}
              {flows.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative z-20 min-w-[200px]">
                      <select
                        value={selectedFlow?.id || ''}
                        onChange={(e) => {
                          const flowId = e.target.value
                          if (flowId) {
                            selectFlow(flowId)
                          }
                        }}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 appearance-none"
                      >
                        <option value="" disabled>Select a flow</option>
                        {flows.map(flow => (
                          <option key={flow.id} value={flow.id}>{flow.name}</option>
                        ))}
                      </select>
                      <ChevronDown 
                        size={16} 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none" 
                      />
                    </div>
                    
                    {selectedFlow && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleRunFlow}
                          disabled={executing || selectedFlow.steps.length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                        >
                          {executing ? (
                            <>
                              <Pause size={16} />
                              <span>Running...</span>
                            </>
                          ) : (
                            <>
                              <Play size={16} />
                              <span>Run Flow</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={handleClearOutputs}
                          disabled={executing}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 disabled:bg-zinc-900/30 border border-zinc-700/50 disabled:border-zinc-800/30 rounded-xl transition-all duration-200 text-sm disabled:text-zinc-600 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={16} />
                          <span>Clear Outputs</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flow Content */}
              {selectedFlow ? (
                <div className="space-y-6">
                  {/* Description */}
                  {selectedFlow.description && (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                      <p className="text-zinc-300">{selectedFlow.description}</p>
                    </div>
                  )}
                  
                  {/* Steps */}
                  <div className="space-y-4">
                    {selectedFlow.steps.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center">
                        <Zap className="mx-auto text-zinc-500 mb-4" size={32} />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No steps yet
                        </h3>
                        <p className="text-zinc-400 mb-6">
                          Add prompts to create a sequential flow
                        </p>
                        <button
                          onClick={() => setShowPromptModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                        >
                          <Plus size={16} />
                          <span>Add First Step</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {selectedFlow.steps.map((step, index) => {
                          const isExpanded = step.isExpanded || false
                          const isRunning = step.isRunning || false
                          const hasOutput = !!step.output
                          const hasCustomContent = !!step.custom_content
                          
                          return (
                            <div 
                              key={step.id}
                              className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden"
                            >
                              {/* Step Header */}
                              <div className="p-4 sm:p-6 border-b border-zinc-800/50">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                  {/* Step Number and Title */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 font-semibold">
                                      {index + 1}
                                    </div>
                                    
                                    {editingStepTitle === step.id ? (
                                      <div className="flex-1 min-w-0">
                                        <input
                                          type="text"
                                          value={editingStepTitleValue}
                                          onChange={(e) => setEditingStepTitleValue(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleStepTitleUpdate(step.id, editingStepTitleValue)
                                            } else if (e.key === 'Escape') {
                                              setEditingStepTitle(null)
                                            }
                                          }}
                                          onBlur={() => {
                                            if (editingStepTitleValue.trim()) {
                                              handleStepTitleUpdate(step.id, editingStepTitleValue)
                                            } else {
                                              setEditingStepTitle(null)
                                            }
                                          }}
                                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                                          placeholder="Enter step title"
                                          autoFocus
                                        />
                                      </div>
                                    ) : (
                                      <div 
                                        className="flex-1 min-w-0"
                                        onDoubleClick={() => {
                                          setEditingStepTitle(step.id)
                                          setEditingStepTitleValue(step.step_title)
                                        }}
                                      >
                                        <h3 className="text-lg font-semibold text-white truncate">
                                          {step.step_title}
                                        </h3>
                                        <p className="text-sm text-zinc-400 truncate">
                                          {step.prompt_title || 'Untitled Prompt'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    {/* Edit Title */}
                                    <button
                                      onClick={() => {
                                        setEditingStepTitle(step.id)
                                        setEditingStepTitleValue(step.step_title)
                                      }}
                                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                      title="Edit title"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    
                                    {/* Move Up */}
                                    {index > 0 && (
                                      <button
                                        onClick={() => handleMoveStep(step.id, 'up')}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                        title="Move up"
                                      >
                                        <ChevronUp size={16} />
                                      </button>
                                    )}
                                    
                                    {/* Move Down */}
                                    {index < selectedFlow.steps.length - 1 && (
                                      <button
                                        onClick={() => handleMoveStep(step.id, 'down')}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                        title="Move down"
                                      >
                                        <ChevronDown size={16} />
                                      </button>
                                    )}
                                    
                                    {/* Delete */}
                                    <button
                                      onClick={() => handleDeleteStep(step.id)}
                                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                      title="Delete step"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                    
                                    {/* Fill Variables */}
                                    <button
                                      onClick={() => {
                                        setSelectedStep(step)
                                        setShowVariableModal(true)
                                      }}
                                      className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200"
                                      title="Fill variables"
                                    >
                                      <Wand2 size={16} />
                                    </button>
                                    
                                    {/* Run Step */}
                                    <button
                                      onClick={() => handleRunStep(step.id)}
                                      disabled={executing || isRunning}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:bg-zinc-800/30 text-emerald-400 disabled:text-zinc-500 border border-emerald-500/30 disabled:border-zinc-700/30 rounded-lg transition-all duration-200 text-xs font-medium disabled:cursor-not-allowed"
                                    >
                                      {isRunning ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                          <span>Running</span>
                                        </>
                                      ) : (
                                        <>
                                          <Play size={12} />
                                          <span>Run</span>
                                        </>
                                      )}
                                    </button>
                                    
                                    {/* Expand/Collapse */}
                                    <button
                                      onClick={() => {
                                        updateStep(step.id, { isExpanded: !isExpanded })
                                      }}
                                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                      title={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Step Content (Expanded) */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 sm:p-6 border-b border-zinc-800/50 bg-zinc-900/30">
                                      <div className="flex items-center gap-2 mb-3">
                                        <h4 className="text-sm font-medium text-zinc-300">Prompt Content</h4>
                                        {hasCustomContent && (
                                          <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                                            Customized
                                          </div>
                                        )}
                                      </div>
                                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 whitespace-pre-wrap text-zinc-300 text-sm font-mono">
                                        {step.custom_content || step.prompt_content}
                                      </div>
                                    </div>
                                    
                                    {/* Step Output */}
                                    {hasOutput && (
                                      <div className="p-4 sm:p-6 bg-zinc-900/30">
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="text-sm font-medium text-zinc-300">Output</h4>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => copyStepOutput(step.output!)}
                                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                              title="Copy output"
                                            >
                                              <Copy size={14} />
                                            </button>
                                            <button
                                              onClick={() => downloadStepOutput(step.output!, step.step_title)}
                                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                              title="Download output"
                                            >
                                              <Download size={14} />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 whitespace-pre-wrap text-zinc-300 text-sm">
                                          {step.output}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              {/* Step Connector */}
                              {index < selectedFlow.steps.length - 1 && (
                                <div className="flex justify-center py-2">
                                  <ArrowRight className="text-zinc-600" size={20} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                        
                        {/* Add Step Button */}
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={() => setShowPromptModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl transition-all duration-200 text-sm"
                          >
                            <Plus size={16} className="text-indigo-400" />
                            <span>Add Step</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  {flows.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                      <Zap className="mx-auto text-zinc-500 mb-4" size={48} />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No Prompt Flows Yet
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        Create your first flow to get started
                      </p>
                      <button
                        onClick={() => setShowCreateFlow(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                      >
                        <Plus size={16} />
                        <span>Create First Flow</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                      <Zap className="mx-auto text-zinc-500 mb-4" size={48} />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Select a Flow
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        Choose a flow from the dropdown above or create a new one
                      </p>
                      <button
                        onClick={() => setShowCreateFlow(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                      >
                        <Plus size={16} />
                        <span>Create New Flow</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Flow Modal */}
      <AnimatePresence>
        {showCreateFlow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateFlow(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">
                  Create New Flow
                </h2>
                
                <button
                  onClick={() => setShowCreateFlow(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Flow Name *
                  </label>
                  <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    placeholder="Enter flow name"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newFlowDescription}
                    onChange={(e) => setNewFlowDescription(e.target.value)}
                    placeholder="Enter flow description (optional)"
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
                <button
                  onClick={() => setShowCreateFlow(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFlow}
                  disabled={isCreating || !newFlowName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Create Flow</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prompt Selection Modal */}
      <PromptSelectionModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSelectPrompt={handlePromptSelected}
      />

      {/* API Settings Modal */}
      <FlowApiSettingsModal
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        settings={apiSettings}
        onSave={handleSaveApiSettings}
      />

      {/* Variable Fill Modal */}
      {selectedStep && (
        <VariableFillModal
          isOpen={showVariableModal}
          onClose={() => setShowVariableModal(false)}
          step={selectedStep}
          onVariablesFilled={handleVariablesFilled}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BoltBadge />
    </div>
  )
}

// Helper component for ChevronUp icon
const ChevronUp = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m18 15-6-6-6 6"/>
  </svg>
)