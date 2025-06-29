import React, { useState, useEffect } from 'react'
import { Menu, Code, Key, FileText, Copy, CheckCircle, ExternalLink, Cpu, Thermometer, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ApiKeyModal } from '../../components/api/ApiKeyModal'
import { ApiDocsModal } from '../../components/api/ApiDocsModal'
import { PromptSelectorModal } from '../../components/api/PromptSelectorModal'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface Prompt {
  id: string
  title?: string
  content: string
  access: 'public' | 'private'
  created_at: string
  views?: number
  like_count?: number
  fork_count?: number
  original_prompt_id?: string | null
}

export const ApiPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiDocsModal, setShowApiDocsModal] = useState(false)
  const [showPromptSelectorModal, setShowPromptSelectorModal] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python'>('javascript')
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'llama' | 'groq'>('openai')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  
  const { user, loading: authLoading } = useAuthStore()

  useEffect(() => {
    if (user) {
      fetchApiKey()
    }
  }, [user])

  // Update model when provider changes
  useEffect(() => {
    switch (selectedProvider) {
      case 'openai':
        setSelectedModel('gpt-4o')
        break
      case 'anthropic':
        setSelectedModel('claude-3-opus-20240229')
        break
      case 'google':
        setSelectedModel('gemini-pro')
        break
      case 'llama':
        setSelectedModel('llama-3-70b-instruct')
        break
      case 'groq':
        setSelectedModel('llama3-8b-8192')
        break
    }
  }, [selectedProvider])

  // Generate code when parameters change
  useEffect(() => {
    if (selectedPrompt) {
      generateCode()
    }
  }, [selectedPrompt, selectedLanguage, selectedProvider, selectedModel, temperature, maxTokens, apiKey])

  const fetchApiKey = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .eq('key_type', 'pbm_api_key')
        .maybeSingle()

      if (!error && data) {
        setApiKey(data.key)
      } else {
        setApiKey(null)
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePromptSelected = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    generateCode(prompt)
  }

  const generateCode = (promptObj = selectedPrompt) => {
    if (!promptObj) return

    let code = ''
    if (selectedLanguage === 'javascript') {
      code = generateJsCode(promptObj)
    } else {
      code = generatePythonCode(promptObj)
    }

    setGeneratedCode(code)
  }

  // Generate JavaScript code
  const generateJsCode = (prompt: Prompt): string => {
    // Extract variables from prompt content
    const variableMatches = prompt.content.match(/\{\{([^}]+)\}\}/g) || []
    const uniqueVariables = Array.from(new Set(variableMatches.map(match => match.replace(/[{}]/g, ''))))
    
    let variablesObj = '{}'
    if (uniqueVariables.length > 0) {
      variablesObj = `{\n    ${uniqueVariables.map(v => `${v}: "${v}Value"`).join(',\n    ')}\n  }`
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    
    return `async function runPrompt() {
  // Your promptby.me API key
  const promptbyApiKey = "${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}";
  
  const response = await fetch("${supabaseUrl}/functions/v1/run-prompt-api", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${promptbyApiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt_id: "${prompt.id}",
      variables: ${variablesObj},
      api_key: "YOUR_AI_PROVIDER_API_KEY",
      provider: "${selectedProvider}",
      model: "${selectedModel}",
      temperature: ${temperature},
      max_tokens: ${maxTokens}
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log("AI Response:", data.output);
    return data.output;
  } else {
    console.error("Error:", data.error);
    throw new Error(data.error);
  }
}`
  }

  // Generate Python code
  const generatePythonCode = (prompt: Prompt): string => {
    // Extract variables from prompt content
    const variableMatches = prompt.content.match(/\{\{([^}]+)\}\}/g) || []
    const uniqueVariables = Array.from(new Set(variableMatches.map(match => match.replace(/[{}]/g, ''))))
    
    let variablesDict = '{}'
    if (uniqueVariables.length > 0) {
      variablesDict = `{\n        ${uniqueVariables.map(v => `"${v}": "${v}_value"`).join(',\n        ')}\n    }`
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    
    return `import requests
import json

def run_prompt():
    # Your promptby.me API key
    promptby_api_key = "${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}"
    
    url = "${supabaseUrl}/functions/v1/run-prompt-api"
    
    headers = {
        "Authorization": f"Bearer {promptby_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt_id": "${prompt.id}",
        "variables": ${variablesDict},
        "api_key": "YOUR_AI_PROVIDER_API_KEY",
        "provider": "${selectedProvider}",
        "model": "${selectedModel}",
        "temperature": ${temperature},
        "max_tokens": ${maxTokens}
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("success"):
        print("AI Response:", data["output"])
        return data["output"]
    else:
        print("Error:", data.get("error"))
        raise Exception(data.get("error"))`
  }

  const getProviderModels = () => {
    switch (selectedProvider) {
      case 'openai':
        return [
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
          { id: 'gpt-4o', name: 'GPT-4o' }
        ]
      case 'anthropic':
        return [
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
        ]
      case 'google':
        return [
          { id: 'gemini-pro', name: 'Gemini Pro' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ]
      case 'llama':
        return [
          { id: 'llama-2-7b-chat', name: 'Llama 2 (7B) Chat' },
          { id: 'llama-2-13b-chat', name: 'Llama 2 (13B) Chat' },
          { id: 'llama-2-70b-chat', name: 'Llama 2 (70B) Chat' },
          { id: 'llama-3-8b-instruct', name: 'Llama 3 (8B) Instruct' },
          { id: 'llama-3-70b-instruct', name: 'Llama 3 (70B) Instruct' }
        ]
      case 'groq':
        return [
          { id: 'llama3-8b-8192', name: 'Llama 3 (8B)' },
          { id: 'llama3-70b-8192', name: 'Llama 3 (70B)' },
          { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
          { id: 'gemma-7b-it', name: 'Gemma 7B' }
        ]
      default:
        return []
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading...</span>
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
            <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Code size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access the API
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
            >
              <span>Go Home</span>
            </Link>
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
                  API
                </h1>
                
                <button
                  onClick={() => setShowApiDocsModal(true)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <FileText size={20} />
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-6xl px-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Developer API
                  </h1>
                  <p className="text-zinc-400">
                    Integrate promptby.me into your applications
                  </p>
                </div>
                
                <button
                  onClick={() => setShowApiDocsModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 self-start lg:self-auto"
                >
                  <FileText size={16} />
                  <span>View Documentation</span>
                </button>
              </div>

              {/* API Key Section */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <Key size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">API Key</h2>
                      <p className="text-zinc-400 text-sm">Required for API authentication</p>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-zinc-400">Loading API key...</span>
                    </div>
                  ) : apiKey ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700/50">
                        <code className="text-indigo-300 font-mono text-sm">{apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 8)}</code>
                      </div>
                      <button
                        onClick={() => setShowApiKeyModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                      >
                        Manage Key
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                    >
                      Generate API Key
                    </button>
                  )}
                </div>
              </div>

              {/* Prompt Selection & Code Generation */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <Code size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Generate API Code</h2>
                    <p className="text-zinc-400 text-sm">Select a prompt and generate code for API integration</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Prompt Selection */}
                  <div className="lg:col-span-1">
                    {selectedPrompt ? (
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium text-sm">
                            {selectedPrompt.title || 'Selected Prompt'}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded text-xs ${
                              selectedPrompt.access === 'private' 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {selectedPrompt.access}
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-300 text-sm mb-2 line-clamp-2">
                          {selectedPrompt.content.substring(0, 100)}...
                        </p>
                        <div className="text-xs text-zinc-500">
                          ID: {selectedPrompt.id}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6 text-center">
                        <p className="text-zinc-400 mb-4">No prompt selected</p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowPromptSelectorModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                    >
                      {selectedPrompt ? 'Change Prompt' : 'Select Prompt'}
                    </button>
                  </div>
                  
                  {/* Middle Column - Settings */}
                  <div className="lg:col-span-1">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Programming Language
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSelectedLanguage('javascript')}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                              selectedLanguage === 'javascript' 
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
                                : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                            }`}
                          >
                            <span>JavaScript</span>
                          </button>
                          
                          <button
                            onClick={() => setSelectedLanguage('python')}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                              selectedLanguage === 'python' 
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
                                : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                            }`}
                          >
                            <span>Python</span>
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          AI Provider
                        </label>
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value as any)}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic (Claude)</option>
                          <option value="google">Google (Gemini)</option>
                          <option value="llama">Llama</option>
                          <option value="groq">Groq</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Model
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        >
                          {getProviderModels().map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                          <Thermometer size={16} className="text-indigo-400" />
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
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                          <Zap size={16} className="text-indigo-400" />
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="8000"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Generated Code */}
                  <div className="lg:col-span-1">
                    <div className="h-full flex flex-col">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-300">
                          Generated Code
                        </h3>
                        {generatedCode && (
                          <button
                            onClick={() => copyToClipboard(generatedCode, 'code')}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                            title="Copy to clipboard"
                          >
                            {copied === 'code' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 overflow-auto">
                        {selectedPrompt ? (
                          <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap">
                            {generatedCode}
                          </pre>
                        ) : (
                          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                            <p>Select a prompt to generate code</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Link - Removed from here and moved to header */}
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false)
          fetchApiKey() // Refresh API key after modal closes
        }}
      />

      {/* API Docs Modal */}
      <ApiDocsModal
        isOpen={showApiDocsModal}
        onClose={() => setShowApiDocsModal(false)}
      />
      
      {/* Prompt Selector Modal */}
      <PromptSelectorModal
        isOpen={showPromptSelectorModal}
        onClose={() => setShowPromptSelectorModal(false)}
        onSelectPrompt={handlePromptSelected}
      />

      <BoltBadge />
    </div>
  )
}