import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Menu, 
  Plus, 
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
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
import { useFlowStore, PromptFlow, FlowStep } from '../../store/flowStore'
import { supabase } from '../../lib/supabase'
import { PromptSelectionModal } from '../../components/prompts/PromptSelectionModal'

export const PromptFlowPage: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [flows, setFlows] = useState<PromptFlow[]>([])
  const [selectedFlow, setSelectedFlow] = useState<PromptFlow | null>(null)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [newFlowName, setNewFlowName] = useState('') 
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [isCreatingFlow, setIsCreatingFlow] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editingPromptTitle, setEditingPromptTitle] = useState('')
  const [editingPromptContent, setEditingPromptContent] = useState('')
  const [showPromptMenu, setShowPromptMenu] = useState<string | null>(null)
  const [isRunningFlow, setIsRunningFlow] = useState(false)
  const [flowOutput, setFlowOutput] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-3.5-turbo')
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [apiProvider, setApiProvider] = useState<'openai' | 'anthropic' | 'google'>('openai')
  const [flowResults, setFlowResults] = useState<any[] | null>(null)
  const [flowError, setFlowError] = useState<string | null>(null)
  
  const { user, loading: authLoading } = useAuthStore()
  const { fetchUserPrompts } = usePromptStore()
  const { 
    flows: storeFlows, 
    fetchFlows, 
    createFlow, 
    selectFlow, 
    addStep,
    updateStep,
    deleteStep,
    reorderStep,
    executeFlow
  } = useFlowStore()

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      fetchFlows()
    }
  }, [user, fetchUserPrompts, fetchFlows])

  // Update local flows state when store flows change
  useEffect(() => {
    setFlows(storeFlows)
  }, [storeFlows])

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('flow_api_key')
    const savedModel = localStorage.getItem('flow_model')
    const savedProvider = localStorage.getItem('flow_provider')
    
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedModel) setModel(savedModel)
    if (savedProvider) setApiProvider(savedProvider as any)
  }, [])

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return
    
    setIsCreatingFlow(true)
    try {
      const newFlow = await createFlow(
        newFlowName.trim(),
        newFlowDescription.trim() || undefined
      )
      setSelectedFlow(newFlow)
      setShowCreateFlow(false)
      setNewFlowName('')
      setNewFlowDescription('')
      setToast({ message: 'Flow created successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to create flow:', error)
      setToast({ message: 'Failed to create flow', type: 'error' })
    } finally {
      setIsCreatingFlow(false)
    }
  }

  const handleAddPrompt = () => {
    setShowPromptModal(true)
  }

  const handlePromptSelected = async (prompt: any) => {
    if (!selectedFlow) return
    
    try {
      await addStep(
        selectedFlow.id,
        prompt.id,
        prompt.title || 'Untitled Prompt'
      )
      setToast({ message: 'Prompt added to flow', type: 'success' })
    } catch (error) {
      console.error('Failed to add prompt to flow:', error)
      setToast({ message: 'Failed to add prompt to flow', type: 'error' })
    }
  }

  const handleCreateNewPrompt = async () => {
    if (!selectedFlow) return
    
    // Check if user is authenticated
    if (!user) {
      setToast({ message: 'Please sign in to create prompts', type: 'error' })
      return
    }
    
    try {
      // First create a new prompt in the database
      const { data: newPrompt, error } = await supabase
        .from('prompts')
        .insert([{
          user_id: user.id,
          title: 'New Prompt',
          content: 'Enter your prompt content here...',
          access: 'private'
        }])
        .select()
        .single()
        
      if (error) throw error
      
      // Then add it to the flow
      const step = await addStep(
        selectedFlow.id,
        newPrompt.id,
        newPrompt.title || 'New Prompt'
      )
      
      // Start editing the new prompt
      setEditingPromptId(step.id)
      setEditingPromptTitle(step.step_title)
      setEditingPromptContent(step.prompt?.content || '')
      
      setToast({ message: 'New prompt created', type: 'success' })
    } catch (error) {
      console.error('Failed to create new prompt:', error)
      setToast({ message: 'Failed to create new prompt', type: 'error' })
    }
  }

  const handleEditPrompt = (promptId: string) => {
    if (!selectedFlow) return
    
    const step = selectedFlow.steps?.find(s => s.id === promptId)
    if (!step) return
    
    const prompt = step.prompt
    if (!prompt) return
    
    setEditingPromptId(promptId)
    setEditingPromptTitle(step.step_title)
    setEditingPromptContent(prompt.content)
  }

  const handleSavePrompt = async () => {
    if (!selectedFlow || !editingPromptId) return
    
    try {
      // Find the step being edited
      const step = selectedFlow.steps?.find(s => s.id === editingPromptId)
      if (!step) throw new Error('Step not found')
      
      // Update the step title
      await updateStep(editingPromptId, {
        step_title: editingPromptTitle
      })
      
      // Update the prompt content
      const { error } = await supabase
        .from('prompts')
        .update({ content: editingPromptContent })
        .eq('id', step.prompt_id)
      
      if (error) throw error
      
      // Refresh the flow to get updated data
      if (selectedFlow) {
        await selectFlow(selectedFlow)
      }
      
      setEditingPromptId(null)
      setToast({ message: 'Prompt saved successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to save prompt:', error)
      setToast({ message: 'Failed to save prompt', type: 'error' })
    }
  }

  const handleCancelEdit = () => {
    setEditingPromptId(null)
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!selectedFlow) return
    
    if (!confirm('Are you sure you want to delete this prompt?')) return
    
    try {
      await deleteStep(promptId)
      setToast({ message: 'Prompt deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      setToast({ message: 'Failed to delete prompt', type: 'error' })
    }
  }

  const handleMovePrompt = async (promptId: string, direction: 'up' | 'down') => {
    if (!selectedFlow) return
    if (!selectedFlow.steps) return
    
    const promptIndex = selectedFlow.steps.findIndex(s => s.id === promptId)
    if (promptIndex === -1) return
    
    const steps = [...selectedFlow.steps]
    
    if (direction === 'up' && promptIndex > 0) {
      // Swap with the previous prompt
      const temp = steps[promptIndex]
      steps[promptIndex] = steps[promptIndex - 1]
      steps[promptIndex - 1] = temp
    } else if (direction === 'down' && promptIndex < steps.length - 1) {
      // Swap with the next prompt
      const temp = steps[promptIndex]
      steps[promptIndex] = steps[promptIndex + 1]
      steps[promptIndex + 1] = temp
    } else {
      return // No change needed
    }
    
    try {
      // Get the IDs in the new order
      const stepIds = steps.map(step => step.id)
      await reorderStep(stepIds[0], steps.findIndex(s => s.id === stepIds[0]))
    } catch (error) {
      console.error('Failed to reorder steps:', error)
      setToast({ message: 'Failed to reorder steps', type: 'error' })
    }
  }

  const handleTogglePromptExpansion = (promptId: string) => {
    if (!selectedFlow) return
    if (!selectedFlow.steps) return
    
    const updatedSteps = selectedFlow.steps.map(step => 
      step.id === promptId ? { ...step, isExpanded: !step.isExpanded } : step
    )
    
    setSelectedFlow({
      ...selectedFlow,
      steps: updatedSteps
    })
  }

  const handleRunFlow = async () => {
    if (!selectedFlow || !selectedFlow.steps || selectedFlow.steps.length === 0) return
    if (!apiKey) {
      setToast({ message: 'Please enter an API key', type: 'error' })
      setShowApiSettings(true)
      return
    }
    
    setIsRunningFlow(true)
    setFlowOutput(null)
    setFlowResults(null)
    setFlowError(null)
    
    try {
      // Save API key to localStorage
      localStorage.setItem('flow_api_key', apiKey)
      localStorage.setItem('flow_model', model)
      localStorage.setItem('flow_provider', apiProvider)
      
      // Execute the flow
      const results = await executeFlow(selectedFlow.id, apiKey, model)
      
      // Format the output
      const output = results.map((result, index) => {
        return `Step ${index + 1}: ${result.step_title}\n${'-'.repeat(40)}\n${result}\n\n`
      }).join('')
      
      setFlowResults(results)
      setFlowOutput(output)
      setIsRunningFlow(false)
      setToast({ message: 'Flow executed successfully', type: 'success' })
    } catch (error: any) {
      console.error('Failed to run flow:', error)
      setFlowError(error.message || 'Failed to run flow')
      setIsRunningFlow(false)
      setToast({ message: error.message || 'Failed to run flow', type: 'error' })
    }
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
                        onClick={() => setSelectedFlow(flow)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedFlow?.id === flow.id
                            ? 'bg-indigo-600/20 border border-indigo-500/30'
                            : 'hover:bg-zinc-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">{flow.name}</h3>
                            <p className="text-xs text-zinc-400 truncate">{flow.steps?.length || 0} prompt{(flow.steps?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
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
                          <h1 className="text-xl font-bold text-white">{selectedFlow.name}</h1>
                          {selectedFlow.description && (
                            <p className="text-zinc-400 text-sm">{selectedFlow.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRunFlow}
                            disabled={isRunningFlow || !selectedFlow.steps || selectedFlow.steps.length === 0}
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
                                onClick={() => setShowApiSettings(!showApiSettings)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-600/20 hover:bg-zinc-600/30 text-zinc-400 rounded-lg transition-all duration-200 text-xs"
                                title="API Settings"
                              >
                                <Settings size={12} />
                                <span>API Settings</span>
                              </button>
                              <button
                                onClick={handleAddPrompt}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all duration-200 text-xs"
                                title="Import from gallery"
                              >
                                <Import size={12} />
                                <span>Import</span>
                              </button>
                            </div>
                          </div>

                          {/* API Settings Panel */}
                          <AnimatePresence>
                            {showApiSettings && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-4 overflow-hidden"
                              >
                                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4 mb-4">
                                  <h3 className="text-sm font-medium text-white mb-3">API Settings</h3>
                                  
                                  {/* API Provider Selection */}
                                  <div className="mb-3">
                                    <label className="block text-xs text-zinc-400 mb-2">Provider</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      <button
                                        onClick={() => {
                                          setApiProvider('openai')
                                          setModel('gpt-3.5-turbo')
                                        }}
                                        className={`px-3 py-2 text-xs rounded-lg transition-all ${
                                          apiProvider === 'openai' 
                                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' 
                                            : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/30'
                                        }`}
                                      >
                                        OpenAI
                                      </button>
                                      <button
                                        onClick={() => {
                                          setApiProvider('anthropic')
                                          setModel('claude-3-haiku-20240307')
                                        }}
                                        className={`px-3 py-2 text-xs rounded-lg transition-all ${
                                          apiProvider === 'anthropic' 
                                            ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                                            : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/30'
                                        }`}
                                      >
                                        Anthropic
                                      </button>
                                      <button
                                        onClick={() => {
                                          setApiProvider('google')
                                          setModel('gemini-pro')
                                        }}
                                        className={`px-3 py-2 text-xs rounded-lg transition-all ${
                                          apiProvider === 'google' 
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                                            : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/30'
                                        }`}
                                      >
                                        Google
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Model Selection */}
                                  <div className="mb-3">
                                    <label className="block text-xs text-zinc-400 mb-2">Model</label>
                                    <select
                                      value={model}
                                      onChange={(e) => setModel(e.target.value)}
                                      className="w-full bg-zinc-700/30 border border-zinc-700/30 rounded-lg px-3 py-2 text-white text-xs"
                                    >
                                      {apiProvider === 'openai' && (
                                        <>
                                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                          <option value="gpt-4">GPT-4</option>
                                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        </>
                                      )}
                                      {apiProvider === 'anthropic' && (
                                        <>
                                          <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                                          <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                                          <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                        </>
                                      )}
                                      {apiProvider === 'google' && (
                                        <>
                                          <option value="gemini-pro">Gemini Pro</option>
                                        </>
                                      )}
                                    </select>
                                  </div>
                                  
                                  {/* API Key */}
                                  <div className="mb-3">
                                    <label className="block text-xs text-zinc-400 mb-2">API Key</label>
                                    <input
                                      type="password"
                                      value={apiKey}
                                      onChange={(e) => setApiKey(e.target.value)}
                                      placeholder={`Enter your ${apiProvider} API key`}
                                      className="w-full bg-zinc-700/30 border border-zinc-700/30 rounded-lg px-3 py-2 text-white text-xs"
                                    />
                                  </div>
                                  
                                  <div className="text-xs text-zinc-500">
                                    Your API key is stored locally in your browser and is never sent to our servers.
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {/* Prompts */}
                          <div className="space-y-3">
                            {!selectedFlow.steps || selectedFlow.steps.length === 0 ? (
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
                                            <div className="w-6 h-6 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs font-medium" title={`Step ${step.order_index + 1}`}>
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
                                                        disabled={step.order_index === (selectedFlow.steps?.length || 0) - 1}
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
                                        
                                        <AnimatePresence initial={false}>
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
                                                  {step.prompt?.content || 'No content available'}
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
                          
                          {flowError ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h3 className="text-red-400 font-medium mb-1">Error Running Flow</h3>
                                  <p className="text-red-300 text-sm">{flowError}</p>
                                </div>
                              </div>
                            </div>
                          ) : flowResults ? (
                            <div className="relative">
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                <button
                                  onClick={() => copyToClipboard(flowOutput || '')}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all duration-200"
                                  title="Copy to clipboard"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setFlowOutput(null)
                                    setFlowResults(null)
                                  }}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all duration-200"
                                  title="Clear output"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="space-y-4">
                                {flowResults.map((result, index) => (
                                  <div key={index} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden">
                                    <div className="bg-zinc-700/30 px-4 py-2 border-b border-zinc-700/50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs font-medium">
                                            {index + 1}
                                          </div>
                                          <h3 className="text-sm font-medium text-white">{result.step_title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => copyToClipboard(result.result)}
                                            className="p-1 text-zinc-400 hover:text-white transition-colors"
                                            title="Copy result"
                                          >
                                            <Copy size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                                      {result.result}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-lg p-8 text-center">
                              <Play className="mx-auto text-zinc-600 mb-3" size={32} />
                              <p className="text-zinc-500 mb-4">Run the flow to see output here</p>
                              <button
                                onClick={handleRunFlow}
                                disabled={isRunningFlow || !selectedFlow.steps || selectedFlow.steps.length === 0 || !apiKey}
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
                        <Play size={32} className="text-indigo-400" />
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