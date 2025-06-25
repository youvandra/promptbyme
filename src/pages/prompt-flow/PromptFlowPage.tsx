import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Menu, 
  Plus, Trash2, ArrowUp, ArrowDown, Edit3, Save, Eye, EyeOff, Play, Settings,
  Folder, Import, ChevronRight, ChevronDown, MoreVertical, X, Pencil,
  Check, 
  AlertCircle,
  Copy,
  AlertTriangle,
  CheckCircle,
  Download,
  MessageSquare,
  Bot,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
import { FlowApiSettingsModal } from '../../components/prompt-flow/FlowApiSettingsModal'
import { useFlowStore, PromptFlow, FlowStep } from '../../store/flowStore'
import { supabase } from '../../lib/supabase'
import { PromptSelectionModal } from '../../components/prompts/PromptSelectionModal'

export const PromptFlowPage: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [isCreatingFlow, setIsCreatingFlow] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editingPromptTitle, setEditingPromptTitle] = useState('')
  const [editingPromptContent, setEditingPromptContent] = useState('')
  const [showPromptMenu, setShowPromptMenu] = useState<string | null>(null)
  const [editingFlowName, setEditingFlowName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showApiSettingsModal, setShowApiSettingsModal] = useState(false)
  
  const { user, loading: authLoading } = useAuthStore()
  const { prompts, fetchUserPrompts } = usePromptStore()
  const { 
    flows, 
    selectedFlow, 
    loading: flowLoading, 
    executing: isRunningFlow,
    fetchFlows, 
    apiSettings,
    createFlow, 
    updateFlow,
    deleteFlow,
    selectFlow,
    addStep,
    updateStep,
    deleteStep,
    reorderStep,
    updateApiSettings,
    executeFlow,
    clearOutputs
  } = useFlowStore()

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      fetchFlows()
    }
  }, [user, fetchUserPrompts, fetchFlows])

  // Set initial flow name when editing
  useEffect(() => {
    if (selectedFlow) {
      setNewName(selectedFlow.name)
    }
  }, [selectedFlow])

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return
    
    setIsCreatingFlow(true)

    createFlow(newFlowName.trim(), newFlowDescription.trim() || undefined)
      .then(() => {
        setShowCreateFlow(false)
        setNewFlowName('')
        setNewFlowDescription('')
        setToast({ message: 'Flow created successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to create flow:', error)
        setToast({ message: 'Failed to create flow', type: 'error' })
      })
      .finally(() => {
        setIsCreatingFlow(false)
      })
  }

  const handleRenameFlow = () => {
    if (!selectedFlow || !newName.trim()) return

    updateFlow(selectedFlow.id, { name: newName.trim() })
      .then(() => {
        setEditingFlowName(false)
        setToast({ message: 'Flow renamed successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to rename flow:', error)
        setToast({ message: 'Failed to rename flow', type: 'error' })
      })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameFlow()
    } else if (e.key === 'Escape') {
      setEditingFlowName(false)
      if (selectedFlow) {
        setNewName(selectedFlow.name)
      }
    }
  }

  const handleSelectFlow = (flowId: string) => {
    selectFlow(flowId)
      .catch(error => {
        console.error('Failed to select flow:', error)
        setToast({ message: 'Failed to select flow', type: 'error' })
      })
  }

  const handleDeleteFlow = (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return

    deleteFlow(flowId)
      .then(() => {
        setToast({ message: 'Flow deleted successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to delete flow:', error)
        setToast({ message: 'Failed to delete flow', type: 'error' })
      })
  }

  const handleAddPrompt = () => {
    setShowPromptModal(true)
  }

  const handlePromptSelected = (prompt: any) => {
    if (!selectedFlow) return

    addStep(selectedFlow.id, prompt.id, prompt.title || 'Untitled Prompt', prompt.content)
      .then(() => {
        setToast({ message: 'Prompt added to flow', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to add prompt:', error)
        setToast({ message: 'Failed to add prompt', type: 'error' })
      })
      .finally(() => {
        setShowPromptModal(false)
      })
  }

  const handleCreateNewPrompt = () => {
    if (!selectedFlow) return

    // Create a new empty prompt in the database first
    const { createPrompt } = usePromptStore.getState()
    const { user } = useAuthStore.getState()

    if (!user) {
      setToast({ message: 'You must be logged in to create prompts', type: 'error' })
      return
    }

    createPrompt({
      user_id: user.id,
      title: 'New Prompt',
      content: '',
      access: 'private',
      tags: [],
    })
      .then((promptData) => {
        // Now add this prompt to the flow
        return addStep(selectedFlow.id, promptData.id, promptData.title || 'New Prompt', promptData.content)
      })
      .then(() => {
        setToast({ message: 'New prompt created and added to flow', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to create new prompt:', error)
        setToast({ message: 'Failed to create new prompt', type: 'error' })
      })
  }

  const handleEditPrompt = (promptId: string) => {
    if (!selectedFlow) return

    const step = selectedFlow.steps.find(p => p.id === promptId)
    if (!step) return

    setEditingPromptId(promptId)
    setEditingPromptTitle(step.step_title)
    setEditingPromptContent(step.prompt_content || '')
  }

  const handleSavePrompt = () => {
    if (!selectedFlow || !editingPromptId) return

    // First update the prompt in the database
    const step = selectedFlow.steps.find(p => p.id === editingPromptId)
    if (!step) return

    const { updatePrompt } = usePromptStore.getState()

    // Update the step title in the flow
    updateStep(editingPromptId, {
      step_title: editingPromptTitle
    })
      .then(() => {
        // Also update the prompt content in the prompts table
        return updatePrompt(step.prompt_id, {
          title: editingPromptTitle,
          content: editingPromptContent
        })
      })
      .then(() => {
        setEditingPromptId(null)
        setToast({ message: 'Prompt saved successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to save prompt:', error)
        setToast({ message: 'Failed to save prompt', type: 'error' })
      })
  }

  const handleCancelEdit = () => {
    setEditingPromptId(null)
  }

  const handleDeletePrompt = (promptId: string) => {
    if (!selectedFlow) return

    if (!confirm('Are you sure you want to delete this prompt?')) return

    deleteStep(promptId)
      .then(() => {
        setToast({ message: 'Prompt deleted successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to delete prompt:', error)
        setToast({ message: 'Failed to delete prompt', type: 'error' })
      })
  }

  const handleMovePrompt = (promptId: string, direction: 'up' | 'down') => {
    if (!selectedFlow) return

    const step = selectedFlow.steps.find(s => s.id === promptId)
    if (!step) return

    const currentIndex = step.order_index
    let newIndex = currentIndex

    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'down' && currentIndex < selectedFlow.steps.length - 1) {
      newIndex = currentIndex + 1
    } else {
      return // No change needed
    }

    reorderStep(promptId, newIndex)
      .catch(error => {
        console.error('Failed to move prompt:', error)
        setToast({ message: 'Failed to move prompt', type: 'error' })
      })
  }

  const handleTogglePromptExpansion = (promptId: string) => {
    if (!selectedFlow) return

    const updatedSteps = selectedFlow.steps.map(step => 
      step.id === promptId ? { ...step, isExpanded: !step.isExpanded } : step
    )

    // Update local state only (no need to persist this to the database)
    useFlowStore.setState({
      selectedFlow: {
        ...selectedFlow,
        steps: updatedSteps
      }
    })
  }

  const handleRunFlow = () => {
    if (!selectedFlow || selectedFlow.steps.length === 0) return

    executeFlow(selectedFlow.id)
      .then(() => {
        setToast({ message: 'Flow executed successfully', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to execute flow:', error)
        setToast({ message: 'Failed to execute flow', type: 'error' })
      })
  }

  const handleClearOutputs = () => {
    clearOutputs()
    setToast({ message: 'Outputs cleared', type: 'success' })
  }

  const handleSaveApiSettings = (settings: any) => {
    updateApiSettings(settings)
    setToast({ message: 'API settings saved', type: 'success' })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: 'Copied to clipboard', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to copy', type: 'error' })
    }
  }

  // Loading state
  if (authLoading || flowLoading) {
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
              <Folder size={32} className="text-indigo-400" />
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
          <div className="relative z-10 flex-1 overflow-hidden">
            <div className="h-full flex flex-col md:flex-row">
              {/* Sidebar - Flow List */}
              <div className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-zinc-800/50 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Your Flows</h2>
                    <button
                      onClick={() => setShowCreateFlow(true)}
                      className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200"
                      title="Create new flow"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {/* Flow List */}
                  <div className="space-y-2">
                    {flows.map(flow => (
                      <div
                        key={flow.id}
                        onClick={() => handleSelectFlow(flow.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedFlow?.id === flow.id
                            ? 'bg-indigo-600/20 border border-indigo-500/30'
                            : 'hover:bg-zinc-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">{flow.name}</h3>
                            <p className="text-xs text-zinc-400 truncate">{flow.steps.length} prompt{flow.steps.length !== 1 ? 's' : ''}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFlow(flow.id);
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete flow"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {flows.length === 0 && (
                      <div className="text-center py-8">
                        <Folder className="mx-auto text-zinc-600 mb-2" size={32} />
                        <p className="text-zinc-500 text-sm">No flows yet</p>
                        <button
                          onClick={() => setShowCreateFlow(true)}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-all duration-200"
                        >
                          Create Your First Flow
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Main Content - Flow Editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedFlow ? (
                  <>
                    {/* Flow Header */}
                    <div className="border-b border-zinc-800/50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          {editingFlowName ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleRenameFlow}
                                autoFocus
                                className="text-xl font-bold text-white bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-1 focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                onClick={handleRenameFlow}
                                className="p-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200"
                              >
                                <Save size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h1 className="text-xl font-bold text-white">{selectedFlow.name}</h1>
                              <button
                                onClick={() => setEditingFlowName(true)}
                                className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                                title="Rename flow"
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          )}
                          {selectedFlow.description && (
                            <p className="text-zinc-400 text-sm">{selectedFlow.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRunFlow}
                            disabled={isRunningFlow || selectedFlow.steps.length === 0 || !apiSettings.apiKey}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-lg transition-all duration-200 text-sm"
                          >
                            {isRunningFlow ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Running...</span>
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                <span>Run Flow</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowApiSettingsModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-all duration-200 text-sm"
                          >
                            <Settings size={14} />
                            <span>API Settings</span>
                          </button>
                          <button
                            onClick={handleClearOutputs}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-all duration-200 text-sm"
                          >
                            <X size={14} />
                            <span>Clear</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Flow Content */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      {/* Prompts List */}
                      <div className="w-full md:w-1/2 lg:w-2/5 border-b md:border-b-0 md:border-r border-zinc-800/50 overflow-y-auto">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Prompts</h2>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleAddPrompt}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs"
                                title="Import from gallery"
                              >
                                <Import size={12} />
                                <span>Import</span>
                              </button>
                              <button
                                onClick={handleCreateNewPrompt}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs"
                                title="Create new prompt"
                              >
                                <Plus size={12} />
                                <span>Create</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Prompts */}
                          <div className="space-y-3">
                            {selectedFlow.steps.length === 0 ? (
                              <div className="text-center py-8 bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                                <p className="text-zinc-500 mb-2">No prompts in this flow</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                  <button
                                    onClick={handleAddPrompt}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs"
                                  >
                                    <Import size={12} />
                                    <span>Import from Gallery</span>
                                  </button>
                                  <button
                                    onClick={handleCreateNewPrompt}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs"
                                  >
                                    <Plus size={12} />
                                    <span>Create New Prompt</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              selectedFlow.steps
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((step) => (
                                  <div
                                    key={step.id}
                                    className={`bg-zinc-800/30 border rounded-lg transition-all duration-200 ${
                                      editingPromptId === step.id
                                        ? 'border-indigo-500/50'
                                        : 'border-zinc-700/50 hover:border-zinc-600/50'
                                    }`}
                                  >
                                    {editingPromptId === step.id ? (
                                      // Editing mode
                                      <div className="p-4">
                                        <input
                                          type="text"
                                          value={editingPromptTitle}
                                          onChange={(e) => setEditingPromptTitle(e.target.value)}
                                          placeholder="Prompt title"
                                          className="w-full bg-zinc-700/50 border border-zinc-600/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 mb-3"
                                        />
                                        <textarea
                                          value={editingPromptContent}
                                          onChange={(e) => setEditingPromptContent(e.target.value)}
                                          placeholder="Prompt content"
                                          rows={6}
                                          className="w-full bg-zinc-700/50 border border-zinc-600/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 mb-3 font-mono text-sm"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={handleSavePrompt}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 text-sm"
                                          >
                                            <Save size={14} />
                                            <span>Save</span>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      // View mode
                                      <div>
                                        <div className="flex items-center justify-between p-3 border-b border-zinc-700/30">
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs font-medium">
                                              {step.order_index + 1}
                                            </div>
                                            <h3 className="text-sm font-medium text-white">{step.step_title}</h3>
                                          </div>
                                          <div className="flex items-center">
                                            <button
                                              onClick={() => handleTogglePromptExpansion(step.id)}
                                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                                            >
                                              {step.isExpanded ? (
                                                <ChevronDown size={16} />
                                              ) : (
                                                <ChevronRight size={16} />
                                              )}
                                            </button>
                                            <div className="relative">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setShowPromptMenu(showPromptMenu === step.id ? null : step.id)
                                                }}
                                                className="p-1 text-zinc-400 hover:text-white transition-colors"
                                              >
                                                <MoreVertical size={16} />
                                              </button>
                                              
                                              <AnimatePresence>
                                                {showPromptMenu === step.id && (
                                                  <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute top-full right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 w-40"
                                                  >
                                                    <div className="py-1">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowPromptMenu(null)
                                                          handleEditPrompt(step.id)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left text-sm"
                                                      >
                                                        <Edit3 size={14} />
                                                        <span>Edit</span>
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowPromptMenu(null)
                                                          handleMovePrompt(step.id, 'up')
                                                        }}
                                                        disabled={step.order_index === 0}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left text-sm disabled:text-zinc-500 disabled:hover:bg-transparent"
                                                      >
                                                        <ArrowUp size={14} />
                                                        <span>Move Up</span>
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowPromptMenu(null)
                                                          handleMovePrompt(step.id, 'down')
                                                        }}
                                                        disabled={step.order_index === selectedFlow.steps.length - 1}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left text-sm disabled:text-zinc-500 disabled:hover:bg-transparent"
                                                      >
                                                        <ArrowDown size={14} />
                                                        <span>Move Down</span>
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowPromptMenu(null)
                                                          handleDeletePrompt(step.id)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left text-sm"
                                                      >
                                                        <Trash2 size={14} />
                                                        <span>Delete</span>
                                                      </button>
                                                    </div>
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <AnimatePresence>
                                          {step.isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="p-3 bg-zinc-800/50 border-t border-zinc-700/30">
                                                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                                                  {step.prompt_content || "No content available"}
                                                </pre>
                                                
                                                {/* Output display */}
                                                {step.output && (
                                                  <div className="mt-3 pt-3 border-t border-zinc-700/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <h4 className="text-xs font-medium text-emerald-400">Output</h4>
                                                      <button
                                                        onClick={() => copyToClipboard(step.output || '')}
                                                        className="p-1 text-zinc-500 hover:text-white transition-colors"
                                                        title="Copy output"
                                                      >
                                                        <Copy size={12} />
                                                      </button>
                                                    </div>
                                                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2 text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                                                      {step.output}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Output Panel */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                          <h2 className="text-lg font-semibold text-white mb-4">Flow Output</h2>
                          
                          {selectedFlow.steps.some(step => step.output) ? (
                            <div className="space-y-4">
                              {selectedFlow.steps
                                .filter(step => step.output)
                                .map((step, index) => (
                                  <div key={step.id} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                        <span className="w-5 h-5 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs">
                                          {step.order_index + 1}
                                        </span>
                                        {step.step_title}
                                      </h3>
                                      <button
                                        onClick={() => copyToClipboard(step.output || '')}
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all duration-200"
                                        title="Copy to clipboard"
                                      >
                                        <Copy size={14} />
                                      </button>
                                    </div>
                                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                                      {step.output}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-lg p-8 text-center">
                              <Play className="mx-auto text-zinc-600 mb-3" size={32} />
                              <p className="text-zinc-500 mb-4">Run the flow to see output here</p>
                              <button
                                onClick={handleRunFlow}
                                disabled={isRunningFlow || selectedFlow.steps.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-lg transition-all duration-200 text-sm"
                              >
                                <Play size={14} />
                                <span>Run Flow</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Folder size={32} className="text-indigo-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-2">
                        No Flow Selected
                      </h2>
                      <p className="text-zinc-400 mb-6">
                        Select an existing flow or create a new one to get started.
                      </p>
                      <button
                        onClick={() => setShowCreateFlow(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 mx-auto"
                      >
                        <Plus size={16} />
                        <span>Create Flow</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
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
                  disabled={isCreatingFlow || !newFlowName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isCreatingFlow ? (
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
        isOpen={showApiSettingsModal}
        onClose={() => setShowApiSettingsModal(false)}
        settings={apiSettings}
        onSave={handleSaveApiSettings}
      />

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