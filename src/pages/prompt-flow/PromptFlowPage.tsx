import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Menu, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Save, 
  Eye, 
  EyeOff, 
  Play,
  Folder,
  Import,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  X,
  AlertCircle,
  Check,
  Settings,
  Copy,
  AlertTriangle,
  CheckCircle,
  Download,
  MessageSquare,
  Bot,
  Sparkles,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { useFlowStore } from '../../store/flowStore'
import { PromptSelectionModal } from '../../components/prompts/PromptSelectionModal'

interface FlowPrompt {
  id: string
  title: string
  content: string
  order: number
  isExpanded?: boolean
}

interface PromptFlow {
  id: string
  name: string
  description?: string
  prompts: FlowPrompt[]
  createdAt: string
  updatedAt: string
}

export const PromptFlowPage: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [flows, setFlows] = useState<PromptFlow[]>([])
  const [selectedFlow, setSelectedFlow] = useState<PromptFlow | null>(null)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editingPromptTitle, setEditingPromptTitle] = useState('')
  const [editingPromptContent, setEditingPromptContent] = useState('')
  const [showPromptMenu, setShowPromptMenu] = useState<string | null>(null)
  const [isRunningFlow, setIsRunningFlow] = useState(false)
  const [flowOutput, setFlowOutput] = useState<string | null>(null)
  
  const { user, loading: authLoading } = useAuthStore()
  const { 
    flows: storeFlows, 
    selectedFlow: storeSelectedFlow,
    loading: flowsLoading,
    fetchFlows,
    selectFlow,
    reorderStep
  } = useFlowStore()

  // Mock data for demonstration
  useEffect(() => {
    if (user) {
      fetchFlows()
    }
  }, [user, fetchFlows])

  // Update local state when store state changes
  useEffect(() => {
    if (storeFlows.length > 0) {
      setFlows(storeFlows)
    }
  }, [storeFlows])

  useEffect(() => {
    if (storeSelectedFlow) {
      setSelectedFlow(storeSelectedFlow)
    }
  }, [storeSelectedFlow])

  const handleSelectFlow = async (flowId: string) => {
    try {
      await selectFlow(flowId)
    } catch (error) {
      console.error('Failed to select flow:', error)
      setToast({ message: 'Failed to select flow', type: 'error' })
    }
  }

  const handleAddPrompt = () => {
    setShowPromptModal(true)
  }

  const handlePromptSelected = (prompt: any) => {
    if (!selectedFlow) return
    
    const newPrompt: FlowPrompt = {
      id: `prompt-${Date.now()}`,
      title: prompt.title || 'Untitled Prompt',
      content: prompt.content,
      order: selectedFlow.prompts.length + 1,
      isExpanded: false
    }
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: [...selectedFlow.prompts, newPrompt],
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f))
    setToast({ message: 'Prompt added to flow', type: 'success' })
  }

  const handleCreateNewPrompt = () => {
    if (!selectedFlow) return
    
    const newPrompt: FlowPrompt = {
      id: `prompt-${Date.now()}`,
      title: 'New Prompt',
      content: 'Enter your prompt content here...',
      order: selectedFlow.prompts.length + 1,
      isExpanded: false
    }
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: [...selectedFlow.prompts, newPrompt],
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f))
    
    // Start editing the new prompt
    setEditingPromptId(newPrompt.id)
    setEditingPromptTitle(newPrompt.title)
    setEditingPromptContent(newPrompt.content)
    
    setToast({ message: 'New prompt created', type: 'success' })
  }

  const handleEditPrompt = (promptId: string) => {
    if (!selectedFlow) return
    
    const prompt = selectedFlow.prompts.find(p => p.id === promptId)
    if (!prompt) return
    
    setEditingPromptId(promptId)
    setEditingPromptTitle(prompt.title)
    setEditingPromptContent(prompt.content)
  }

  const handleSavePrompt = () => {
    if (!selectedFlow || !editingPromptId) return
    
    const updatedPrompts = selectedFlow.prompts.map(prompt =>
      prompt.id === editingPromptId
        ? { ...prompt, title: editingPromptTitle, content: editingPromptContent }
        : prompt
    )
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: updatedPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f))
    setEditingPromptId(null)
    setToast({ message: 'Prompt saved successfully', type: 'success' })
  }

  const handleCancelEdit = () => {
    setEditingPromptId(null)
  }

  const handleDeletePrompt = (promptId: string) => {
    if (!selectedFlow) return
    
    if (!confirm('Are you sure you want to delete this prompt?')) return
    
    const updatedPrompts = selectedFlow.prompts
      .filter(p => p.id !== promptId)
      .map((prompt, index) => ({ ...prompt, order: index + 1 }))
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: updatedPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f))
    setToast({ message: 'Prompt deleted successfully', type: 'success' })
  }

  const handleMovePrompt = async (promptId: string, direction: 'up' | 'down') => {
    if (!selectedFlow) return
    
    const promptIndex = selectedFlow.prompts.findIndex(p => p.id === promptId)
    if (promptIndex === -1) return
    
    const newPrompts = [...selectedFlow.prompts]
    
    if (direction === 'up' && promptIndex > 0) {
      // Swap with the previous prompt
      const temp = newPrompts[promptIndex]
      newPrompts[promptIndex] = { ...newPrompts[promptIndex - 1], order: promptIndex + 1 } 
      newPrompts[promptIndex - 1] = { ...temp, order: promptIndex }
    } else if (direction === 'down' && promptIndex < newPrompts.length - 1) {
      // Swap with the next prompt
      const temp = newPrompts[promptIndex]
      newPrompts[promptIndex] = { ...newPrompts[promptIndex + 1], order: promptIndex + 1 }
      newPrompts[promptIndex + 1] = { ...temp, order: promptIndex + 2 }
    } else {
      return // No change needed
    }
    
    try {
      // Call the reorderStep function from the store
      await reorderStep(promptId, direction === 'up' ? promptIndex - 1 : promptIndex + 1)
    } catch (error) {
      console.error('Failed to reorder steps:', error)
      setToast({ message: 'Failed to reorder steps', type: 'error' })
      return
    }
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: newPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f))
  }

  const handleTogglePromptExpansion = (promptId: string) => {
    if (!selectedFlow) return
    
    const updatedPrompts = selectedFlow.prompts.map(prompt =>
      prompt.id === promptId ? { ...prompt, isExpanded: !prompt.isExpanded } : prompt
    )
    
    setSelectedFlow({
      ...selectedFlow,
      prompts: updatedPrompts
    })
  }

  const handleRunFlow = () => {
    if (!selectedFlow || selectedFlow.prompts.length === 0) return
    
    setIsRunningFlow(true)
    setFlowOutput(null)
    
    // Mock flow execution
    setTimeout(() => {
      const output = selectedFlow.prompts.map((prompt, index) => {
        return `Step ${index + 1}: ${prompt.title}\n${'-'.repeat(40)}\n[Mock output for: ${prompt.content.substring(0, 100)}...]\n\n`
      }).join('')
      
      setFlowOutput(output)
      setIsRunningFlow(false)
      setToast({ message: 'Flow executed successfully', type: 'success' })
    }, 2000)
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
  if (authLoading) {
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
                  Sequential Prompts
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden lg:block relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-8 py-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Sequential Prompts
                </h1>
                <p className="text-zinc-400">
                  Manage your prompt flow projects
                </p>
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
                      onClick={() => {}}
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
                            <p className="text-xs text-zinc-400 truncate">{flow.prompts.length} prompt{flow.prompts.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {flows.length === 0 && (
                      <div className="text-center py-8">
                        <Folder className="mx-auto text-zinc-600 mb-2" size={32} />
                        <p className="text-zinc-500 text-sm">No flows yet</p>
                        <button
                          onClick={() => {}}
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
                          <h1 className="text-xl font-bold text-white">{selectedFlow.name}</h1>
                          {selectedFlow.description && (
                            <p className="text-zinc-400 text-sm">{selectedFlow.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRunFlow}
                            disabled={isRunningFlow || selectedFlow.prompts.length === 0}
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
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs w-full"
                                title="Import from gallery"
                              >
                                <Import size={12} />
                                <span>Import</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Prompts */}
                          <div className="space-y-3">
                            {selectedFlow.prompts.length === 0 ? (
                              <div className="text-center py-8 bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                                <p className="text-zinc-500 mb-2">No prompts in this flow</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                  <button
                                    onClick={handleAddPrompt}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs"
                                  >
                                    <Plus size={12} />
                                    <span>Add Prompt</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              selectedFlow.prompts
                                .sort((a, b) => a.order - b.order)
                                .map((prompt) => (
                                  <div
                                    key={prompt.id}
                                    className={`bg-zinc-800/30 border rounded-lg transition-all duration-200 ${
                                      editingPromptId === prompt.id
                                        ? 'border-indigo-500/50'
                                        : 'border-zinc-700/50 hover:border-zinc-600/50'
                                    }`}
                                  >
                                    {editingPromptId === prompt.id ? (
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
                                            <div className="w-6 h-6 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs font-medium" title={`Step ${prompt.order}`}>
                                              {prompt.order}
                                            </div>
                                            <h3 className="text-sm font-medium text-white">{prompt.title}</h3>
                                          </div>
                                          <div className="flex items-center">
                                            <button
                                              onClick={() => handleTogglePromptExpansion(prompt.id)}
                                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                                            >
                                              {prompt.isExpanded ? (
                                                <ChevronDown size={16} />
                                              ) : (
                                                <ChevronRight size={16} />
                                              )}
                                            </button>
                                            <div className="relative">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setShowPromptMenu(showPromptMenu === prompt.id ? null : prompt.id)
                                                }}
                                                className="p-1 text-zinc-400 hover:text-white transition-colors"
                                              >
                                                <MoreVertical size={16} />
                                              </button>
                                              
                                              <AnimatePresence>
                                                {showPromptMenu === prompt.id && (
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
                                                          handleEditPrompt(prompt.id)
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
                                                          handleMovePrompt(prompt.id, 'up')
                                                        }}
                                                        disabled={prompt.order === 1}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left text-sm disabled:text-zinc-500 disabled:hover:bg-transparent"
                                                      >
                                                        <ArrowUp size={14} />
                                                        <span>Move Up</span>
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowPromptMenu(null)
                                                          handleMovePrompt(prompt.id, 'down')
                                                        }}
                                                        disabled={prompt.order === selectedFlow.prompts.length}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-left text-sm disabled:text-zinc-500 disabled:hover:bg-transparent"
                                                      >
                                                        <ArrowDown size={14} />
                                                        <span>Move Down</span>
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setShowPromptMenu(null)
                                                          handleDeletePrompt(prompt.id)
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
                                        
                                        <AnimatePresence initial={false}>
                                          {prompt.isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="p-3 bg-zinc-800/50 border-t border-zinc-700/30">
                                                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                                                  {prompt.content}
                                                </pre>
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
                          
                          {flowOutput ? (
                            <div className="relative">
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                <button
                                  onClick={() => copyToClipboard(flowOutput)}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all duration-200"
                                  title="Copy to clipboard"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => setFlowOutput(null)}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all duration-200"
                                  title="Clear output"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                                {flowOutput}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-lg p-8 text-center">
                              <Play className="mx-auto text-zinc-600 mb-3" size={32} />
                              <p className="text-zinc-500 mb-4">Run the flow to see output here</p>
                              <button
                                onClick={handleRunFlow}
                                disabled={isRunningFlow || selectedFlow.prompts.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-lg transition-all duration-200 text-sm"
                              >
                                {isRunningFlow ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Running...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={14} />
                                    <span>Run Flow</span>
                                  </>
                                )}
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
                      <h2 className="text-xl font-semibold text-white mb-2">No Flow Selected</h2>
                      <p className="text-zinc-400 mb-6">Select an existing flow to get started.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Selection Modal */}
      <PromptSelectionModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSelectPrompt={handlePromptSelected}
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