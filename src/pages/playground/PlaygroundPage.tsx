import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Play, Cpu, Copy, Download, Trash2, Save, Plus, Wand2 } from 'lucide-react'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { PromptSelectionModal } from '../../components/prompts/PromptSelectionModal'
import { VariableFillModal } from '../../components/prompts/VariableFillModal'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'

interface SelectedPrompt {
  id: string
  title?: string
  content: string
}

export const PlaygroundPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [model, setModel] = useState('llama3-8b-8192')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [promptInput, setPromptInput] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<SelectedPrompt | null>(null)
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [pendingPromptContent, setPendingPromptContent] = useState('')
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { fetchUserPrompts } = usePromptStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      
      // Check if we have a prompt passed from navigation
      if (location.state?.selectedPrompt) {
        const prompt = location.state.selectedPrompt
        handlePromptSelected(prompt)
        // Clear the state to prevent re-selection on refresh
        window.history.replaceState({}, document.title)
      }
    }
  }, [user, fetchUserPrompts, location.state])

  // Load saved settings from localStorage with decryption
  useEffect(() => {
    const loadSettings = async () => {
      const savedModel = localStorage.getItem('groq_model')
      const savedTemperature = localStorage.getItem('groq_temperature')
      const savedMaxTokens = localStorage.getItem('groq_max_tokens')
      
      if (savedModel) setModel(savedModel)
      if (savedTemperature) setTemperature(parseFloat(savedTemperature))
      if (savedMaxTokens) setMaxTokens(parseInt(savedMaxTokens))
    }
    
    loadSettings()
  }, [])

  // Save settings to localStorage with encryption
  const saveSettings = async () => {
    try {
      localStorage.setItem('groq_model', model)
      localStorage.setItem('groq_temperature', temperature.toString())
      localStorage.setItem('groq_max_tokens', maxTokens.toString())
      setToast({ message: 'Settings saved successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to save settings:', error)
      setToast({ message: 'Failed to save settings', type: 'error' })
    }
  }

  const handlePromptSelected = (prompt: any) => {
    const hasVariables = /\{\{([^}]+)\}\}/.test(prompt.content)
    
    if (hasVariables) {
      setPendingPromptContent(prompt.content)
      setSelectedPrompt({ id: prompt.id, title: prompt.title, content: prompt.content })
      setShowVariableModal(true)
    } else {
      setPromptInput(prompt.content)
      setSelectedPrompt({ id: prompt.id, title: prompt.title, content: prompt.content })
    }
  }

  const handleVariablesFilled = (filledContent: string) => {
    setPromptInput(filledContent)
    setShowVariableModal(false)
    setPendingPromptContent('')
  }

  const generateResponse = async () => {
    if (!selectedPrompt || !promptInput.trim()) {
      setToast({ message: 'Please select a prompt first', type: 'error' })
      return
    }

    setIsGenerating(true)
    setOutput('')

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        }, 
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: promptInput
            }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate response')
      }

      const data = await response.json()
      setOutput(data.choices[0]?.message?.content || 'No response generated')
      setToast({ message: 'Response generated successfully', type: 'success' })
    } catch (error: any) {
      console.error('Error generating response:', error)
      setToast({ message: error.message || 'Failed to generate response', type: 'error' })
    } finally {
      setIsGenerating(false)
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

  const downloadOutput = () => {
    if (!output) return
    
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-response.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setToast({ message: 'Output downloaded', type: 'success' })
  }

  const clearAll = () => {
    setPromptInput('')
    setSelectedPrompt(null)
    setOutput('')
    setToast({ message: 'Cleared all content', type: 'success' })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading playground...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Play className="mx-auto text-zinc-400 mb-4" size={64} />
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access the playground
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
                  Playground
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
                    AI Playground
                  </h1>
                  <p className="text-zinc-400">
                    Test your prompts with OpenAI models and see instant results
                  </p>
                </div>
              </div>

              {/* Main Playground Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Settings Panel */}
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Cpu className="text-indigo-400" size={20} />
                      <h2 className="text-lg font-semibold text-white">Groq API Settings</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Model Selection */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Model
                        </label>
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        >
                          <option value="llama3-8b-8192">Llama 3 (8B)</option>
                          <option value="llama3-70b-8192">Llama 3 (70B)</option>
                          <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                          <option value="gemma-7b-it">Gemma 7B</option>
                        </select>
                      </div>

                      {/* Temperature */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Temperature: {temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                          <span>Focused</span>
                          <span>Creative</span>
                        </div>
                      </div>

                      {/* Max Tokens */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="4000"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                      </div>

                      {/* Save Settings Button - Moved here */}
                      <div className="pt-4 border-t border-zinc-800/50">
                        <button
                          onClick={saveSettings}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                        >
                          <Save size={16} />
                          <span>Save Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input/Output Panel */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Prompt Input */}
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">Prompt Input</h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={clearAll}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                          title="Clear all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Prompt Selection Card or Input */}
                    {!selectedPrompt ? (
                      <div 
                        onClick={() => setShowPromptModal(true)}
                        className="w-full min-h-[200px] bg-zinc-800/30 border-2 border-dashed border-zinc-700/50 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600/30 transition-colors duration-200">
                            <Plus size={24} className="text-indigo-400" />
                          </div>
                          <h3 className="text-white font-medium mb-2">Choose Your Prompt</h3>
                          <p className="text-zinc-400 text-sm">Select from your saved prompts to get started</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium text-sm">
                            {selectedPrompt.title || 'Selected Prompt'}
                          </h3>
                          <button
                            onClick={() => {
                              setSelectedPrompt(null)
                              setPromptInput('')
                            }}
                            className="p-1 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="text-zinc-300 text-sm">
                          {selectedPrompt.content.substring(0, 150)}
                          {selectedPrompt.content.length > 150 && '...'}
                        </div>
                      </div>
                    )}
                    
                    {selectedPrompt && (
                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                        <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                          {promptInput}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        {selectedPrompt && (
                          <div className="text-xs text-zinc-500">
                            {promptInput.length} characters
                          </div>
                        )}
                        {!selectedPrompt ? (
                          <button
                            onClick={() => setShowPromptModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm rounded-lg transition-all duration-200 border border-indigo-500/30"
                          >
                            <Wand2 size={16} />
                            <span>Select Prompt</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowPromptModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs rounded-lg transition-all duration-200"
                          >
                            <Wand2 size={12} />
                            <span>Change prompt</span>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={generateResponse}
                        disabled={isGenerating || !selectedPrompt}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            <span>Generate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Output */}
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">AI Response</h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(output)}
                          disabled={!output}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Copy response"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={downloadOutput}
                          disabled={!output}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download response"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="min-h-[200px] bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                      {output ? (
                        <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                          {output}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                          <div className="text-center">
                            <Play className="mx-auto mb-2 opacity-50" size={32} />
                            <p>AI response will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {output && (
                      <div className="mt-4 text-xs text-zinc-500">
                        {output.length} characters
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Variable Fill Modal */}
      <VariableFillModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        promptContent={pendingPromptContent}
        promptTitle={selectedPrompt?.title}
        onVariablesFilled={handleVariablesFilled}
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