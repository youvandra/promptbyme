import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
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
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

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
  
  const { user, loading: authLoading } = useAuthStore()
  const { fetchUserPrompts } = usePromptStore()

  // Mock data for demonstration
  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      
      // Mock data for demonstration
      const mockFlows: PromptFlow[] = [
        {
          id: '1',
          name: 'Social Media Content',
          description: 'Generate engaging social media content with captions',
          prompts: [
            {
              id: 'p1',
              title: 'Generate Post Content',
              content: 'Create an engaging social media post about {{topic}} for {{platform}}. The tone should be {{tone}} and the target audience is {{audience}}.',
              order: 1
            },
            {
              id: 'p2',
              title: 'Generate Caption',
              content: 'Write a catchy caption for the following social media post:\n\n{{post_content}}\n\nInclude relevant hashtags for {{platform}}.',
              order: 2
            },
            {
              id: 'p3',
              title: 'Generate Hashtags',
              content: 'Create a list of 5-7 trending and relevant hashtags for a {{platform}} post about {{topic}} targeting {{audience}}.',
              order: 3
            }
          ],
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Blog Post Workflow',
          description: 'Complete workflow for creating blog content',
          prompts: [
            {
              id: 'p4',
              title: 'Generate Blog Outline',
              content: 'Create a detailed outline for a blog post about {{topic}}. The post should be {{length}} words and target {{audience}}.',
              order: 1
            },
            {
              id: 'p5',
              title: 'Write Introduction',
              content: 'Write an engaging introduction for a blog post with the following outline:\n\n{{outline}}\n\nThe introduction should hook the reader and provide context about {{topic}}.',
              order: 2
            },
            {
              id: 'p6',
              title: 'Write Main Content',
              content: 'Expand the following outline into full blog content:\n\n{{outline}}\n\nUse the introduction:\n\n{{introduction}}\n\nMake sure to include relevant examples and data points.',
              order: 3
            },
            {
              id: 'p7',
              title: 'Write Conclusion',
              content: 'Write a conclusion for the following blog post:\n\n{{blog_content}}\n\nSummarize the key points and include a call to action.',
              order: 4
            }
          ],
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      setFlows(mockFlows)
      setSelectedFlow(mockFlows[0])
    }
  }, [user, fetchUserPrompts])

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return
    
    setIsCreatingFlow(true)
    
    // Create a new flow (mock implementation)
    setTimeout(() => {
      const newFlow: PromptFlow = {
        id: `flow-${Date.now()}`,
        name: newFlowName.trim(),
        description: newFlowDescription.trim() || undefined,
        prompts: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setFlows([newFlow, ...flows])
      setSelectedFlow(newFlow)
      setShowCreateFlow(false)
      setNewFlowName('')
      setNewFlowDescription('')
      setToast({ message: 'Flow created successfully', type: 'success' })
      setIsCreatingFlow(false)
    }, 500)
  }

  const handleAddPrompt = () => {
    setShowPromptModal(true)
  }

  const handlePromptSelected = (prompt: any) => {
    if (!selectedFlow) return
    
    // Add the selected prompt to the flow
    const newPrompt: FlowPrompt = {
      id: `prompt-${Date.now()}`,
      title: prompt.title || 'Untitled Prompt',
      content: prompt.content,
      order: selectedFlow.prompts.length + 1
    }
    
    const updatedPrompts = [...selectedFlow.prompts, newPrompt]
    const updatedFlow = {
      ...selectedFlow,
      prompts: updatedPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
    setToast({ message: 'Prompt added to flow', type: 'success' })
  }

  const handleCreateNewPrompt = () => {
    if (!selectedFlow) return
    
    // Create a new empty prompt
    const newPrompt: FlowPrompt = {
      id: `prompt-${Date.now()}`,
      title: 'New Prompt',
      content: '',
      order: selectedFlow.prompts.length + 1
    }
    
    const updatedPrompts = [...selectedFlow.prompts, newPrompt]
    const updatedFlow = {
      ...selectedFlow,
      prompts: updatedPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
    
    // Start editing the new prompt
    setEditingPromptId(newPrompt.id)
    setEditingPromptTitle(newPrompt.title)
    setEditingPromptContent(newPrompt.content)
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
    
    const updatedPrompts = selectedFlow.prompts.map(p => 
      p.id === editingPromptId 
        ? { ...p, title: editingPromptTitle, content: editingPromptContent } 
        : p
    )
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: updatedPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
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
      .map((p, index) => ({ ...p, order: index + 1 }))
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: updatedPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
    setToast({ message: 'Prompt deleted successfully', type: 'success' })
  }

  const handleMovePrompt = (promptId: string, direction: 'up' | 'down') => {
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
    
    const updatedFlow = {
      ...selectedFlow,
      prompts: newPrompts,
      updatedAt: new Date().toISOString()
    }
    
    setSelectedFlow(updatedFlow)
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
  }

  const handleTogglePromptExpansion = (promptId: string) => {
    if (!selectedFlow) return
    
    const updatedPrompts = selectedFlow.prompts.map(p => 
      p.id === promptId ? { ...p, isExpanded: !p.isExpanded } : p
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
    
    // Simulate running the flow
    setTimeout(() => {
      // Generate mock output based on the prompts
      const output = selectedFlow.prompts.map((prompt, index) => {
        return `Step ${index + 1}: ${prompt.title}\n${'-'.repeat(40)}\n${generateMockOutput(prompt.content)}\n\n`
      }).join('')
      
      setFlowOutput(output)
      setIsRunningFlow(false)
      setToast({ message: 'Flow executed successfully', type: 'success' })
    }, 2000)
  }

  // Helper function to generate mock output for a prompt
  const generateMockOutput = (promptContent: string) => {
    // Replace variables with mock values
    const content = promptContent
      .replace(/\{\{topic\}\}/g, 'artificial intelligence')
      .replace(/\{\{platform\}\}/g, 'Instagram')
      .replace(/\{\{tone\}\}/g, 'professional yet approachable')
      .replace(/\{\{audience\}\}/g, 'tech enthusiasts')
      .replace(/\{\{length\}\}/g, '1500')
      .replace(/\{\{post_content\}\}/g, 'Exploring the future of AI in everyday applications...')
      .replace(/\{\{outline\}\}/g, '1. Introduction to AI\n2. Current applications\n3. Future trends')
      .replace(/\{\{introduction\}\}/g, 'Artificial intelligence is transforming how we interact with technology...')
      .replace(/\{\{blog_content\}\}/g, 'This is a sample blog post about AI and its applications...')
    
    // Generate a mock response based on the prompt type
    if (content.includes('social media post')) {
      return 'Artificial intelligence is revolutionizing how we work and live! Today, we\'re exploring 5 ways AI is making our daily tasks easier and more efficient. From smart assistants to predictive text, these technologies are here to stay. #AIRevolution #TechTrends'
    } else if (content.includes('caption')) {
      return '✨ Embracing the future, one algorithm at a time ✨\n\n#AITechnology #FutureTech #Innovation #TechTrends #DigitalTransformation'
    } else if (content.includes('hashtags')) {
      return '#AIRevolution #TechInnovation #DigitalFuture #SmartTech #AITrends #FutureTech #TechEnthusiast'
    } else if (content.includes('outline')) {
      return '1. Introduction to AI\n   - Definition and brief history\n   - Why AI matters today\n2. Current Applications\n   - Consumer applications\n   - Business solutions\n   - Healthcare innovations\n3. Future Trends\n   - Emerging technologies\n   - Ethical considerations\n   - Predictions for next 5 years\n4. Conclusion\n   - Summary of key points\n   - Call to action'
    } else if (content.includes('introduction')) {
      return 'Artificial intelligence has moved from science fiction to an integral part of our daily lives. From the moment we wake up to check our personalized news feeds to the recommendations that influence our purchasing decisions, AI is quietly reshaping how we interact with technology and each other. In this post, we\'ll explore the current state of AI applications and peek into the exciting future that lies ahead.'
    } else if (content.includes('main content')) {
      return 'The field of artificial intelligence has experienced unprecedented growth in recent years...\n\n[2500 words of detailed content would appear here]\n\n...leading us to reconsider the relationship between humans and machines.'
    } else if (content.includes('conclusion')) {
      return 'As we\'ve explored throughout this article, artificial intelligence is no longer a technology of the future—it's very much a technology of today. From the personalized experiences we enjoy online to the life-saving applications in healthcare, AI continues to demonstrate its value across industries and use cases. While challenges remain, particularly around ethics and responsible implementation, the trajectory is clear: AI will continue to become more integrated into our daily lives. The question isn\'t whether AI will transform your industry, but how quickly you'll adapt to the transformation. Are you ready to embrace the AI revolution?'
    } else {
      return 'Generated content based on your prompt would appear here. This would typically include detailed, contextually relevant information that addresses all the parameters specified in your prompt.'
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
                            <p className="text-xs text-zinc-400 truncate">
                              {flow.prompts.length} prompt{flow.prompts.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {flow.isPublic ? (
                              <Eye size={14} className="text-emerald-400" />
                            ) : (
                              <EyeOff size={14} className="text-amber-400" />
                            )}
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
                          
                          <button
                            onClick={() => {
                              // Toggle public/private
                              const updatedFlow = {
                                ...selectedFlow,
                                isPublic: !selectedFlow.isPublic,
                                updatedAt: new Date().toISOString()
                              }
                              setSelectedFlow(updatedFlow)
                              setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
                            }}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                              selectedFlow.isPublic
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            {selectedFlow.isPublic ? (
                              <>
                                <Eye size={14} />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={14} />
                                <span>Private</span>
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
                            {selectedFlow.prompts.length === 0 ? (
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
                                            <div className="w-6 h-6 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs font-medium">
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
                                        
                                        <AnimatePresence>
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
                                  <Save size={14} />
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