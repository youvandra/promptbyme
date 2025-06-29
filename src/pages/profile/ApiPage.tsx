import React, { useState, useEffect } from 'react'
import { Menu, Code, Key, FileText, Copy, CheckCircle, ExternalLink, Cpu, Thermometer, Zap, Wand2, Eye, EyeOff, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ApiKeyModal } from '../../components/api/ApiKeyModal'
import { ApiDocsModal } from '../../components/api/ApiDocsModal'
import { ApiLogsModal } from '../../components/api/ApiLogsModal'
import { CodeGeneratorModal } from '../../components/api/CodeGeneratorModal'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useSecureStorage } from '../../hooks/useSecureStorage'

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

interface VariableValue {
  name: string
  value: string
}

export const ApiPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiDocsModal, setShowApiDocsModal] = useState(false)
  const [showApiLogsModal, setShowApiLogsModal] = useState(false)
  const [showCodeGeneratorModal, setShowCodeGeneratorModal] = useState(false)
  const [codeGeneratorType, setCodeGeneratorType] = useState<'prompt' | 'flow'>('prompt')
  const [copied, setCopied] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiProviderApiKey, setAiProviderApiKey] = useState<string>('')
  const [showApiProviderKey, setShowApiProviderKey] = useState(false)
  const [savingApiKey, setSavingApiKey] = useState(false)
  
  const { user, loading: authLoading } = useAuthStore()
  const { getSecureItem, setSecureItem } = useSecureStorage()

  useEffect(() => {
    if (user) {
      fetchApiKey()
      loadAiProviderApiKey()
    }
  }, [user])

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

  const loadAiProviderApiKey = async () => {
    try {
      const storedKey = await getSecureItem('ai_provider_api_key')
      if (storedKey) {
        setAiProviderApiKey(storedKey)
      }
    } catch (error) {
      console.error('Failed to load AI provider API key:', error)
    }
  }

  const saveAiProviderApiKey = async () => {
    if (!aiProviderApiKey) return
    
    setSavingApiKey(true)
    try {
      await setSecureItem('ai_provider_api_key', aiProviderApiKey)
      setCopied('ai-provider-key')
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to save AI provider API key:', error)
    } finally {
      setSavingApiKey(false)
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

  const handleOpenCodeGenerator = (type: 'prompt' | 'flow') => {
    setCodeGeneratorType(type)
    setShowCodeGeneratorModal(true)
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
                
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowApiLogsModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <Info size={16} />
                    <span>View Logs</span>
                  </button>
                  
                  <button
                    onClick={() => setShowApiDocsModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <FileText size={16} />
                    <span>View Documentation</span>
                  </button>
                </div>
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

              {/* AI Provider API Key Section */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <Key size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">AI Provider API Key</h2>
                      <p className="text-zinc-400 text-sm">Required for AI model access</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type={showApiProviderKey ? "text" : "password"}
                        value={aiProviderApiKey}
                        onChange={(e) => setAiProviderApiKey(e.target.value)}
                        placeholder="Enter your AI provider API key"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 pr-10"
                      />
                      <button
                        onClick={() => setShowApiProviderKey(!showApiProviderKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showApiProviderKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      onClick={saveAiProviderApiKey}
                      disabled={!aiProviderApiKey || savingApiKey}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
                    >
                      {savingApiKey ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : copied === 'ai-provider-key' ? (
                        <CheckCircle size={16} />
                      ) : (
                        'Save Key'
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Your API key is stored securely in your browser and never sent to our servers.
                </p>
              </div>

              {/* Generate API Code Section */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <Code size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Generate API Code</h2>
                    <p className="text-zinc-400 text-sm">Generate code to integrate with your applications</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-zinc-300 mb-4">
                      Generate code snippets to run your prompts and flows from your own applications. Choose from JavaScript, Python, or cURL.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                        <h3 className="text-white font-medium mb-2">Available Endpoints</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="bg-indigo-500/20 text-indigo-400 p-1 rounded mt-0.5">
                              <Code size={14} />
                            </div>
                            <div>
                              <p className="text-indigo-300 font-medium">run-prompt-api</p>
                              <p className="text-zinc-400">Execute a single prompt with variables</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="bg-indigo-500/20 text-indigo-400 p-1 rounded mt-0.5">
                              <Code size={14} />
                            </div>
                            <div>
                              <p className="text-indigo-300 font-medium">run-prompt-flow-api</p>
                              <p className="text-zinc-400">Run a complete prompt flow with all steps</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                        <h3 className="text-white font-medium mb-2">Features</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded mt-0.5">
                              <CheckCircle size={14} />
                            </div>
                            <p className="text-zinc-300">Variable substitution</p>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded mt-0.5">
                              <CheckCircle size={14} />
                            </div>
                            <p className="text-zinc-300">Multiple AI providers</p>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded mt-0.5">
                              <CheckCircle size={14} />
                            </div>
                            <p className="text-zinc-300">Secure authentication</p>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded mt-0.5">
                              <CheckCircle size={14} />
                            </div>
                            <p className="text-zinc-300">Multi-step flow execution</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <button
                      onClick={() => handleOpenCodeGenerator('prompt')}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                    >
                      <Code size={20} />
                      <span>Generate Prompt API Code</span>
                    </button>
                    
                    <button
                      onClick={() => handleOpenCodeGenerator('flow')}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                    >
                      <Zap size={20} />
                      <span>Generate Flow API Code</span>
                    </button>
                    
                    <p className="text-center text-zinc-500 text-sm mt-1">
                      Select a prompt or flow and generate code in your preferred language
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentation Link */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">API Documentation</h2>
                      <p className="text-zinc-400 text-sm">Detailed guides and reference for the API</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowApiDocsModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all duration-200"
                    >
                      <FileText size={16} />
                      <span>View Documentation</span>
                    </button>
                    
                    <a
                      href="/docs/api-reference.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white border border-zinc-700/50 rounded-lg transition-all duration-200"
                    >
                      <ExternalLink size={16} />
                      <span>Raw Markdown</span>
                    </a>
                  </div>
                </div>
              </div>
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
      
      {/* API Logs Modal */}
      <ApiLogsModal
        isOpen={showApiLogsModal}
        onClose={() => setShowApiLogsModal(false)}
      />
      
      {/* Code Generator Modal */}
      <CodeGeneratorModal
        isOpen={showCodeGeneratorModal}
        onClose={() => setShowCodeGeneratorModal(false)}
        initialCodeType={codeGeneratorType}
      />

      <BoltBadge />
    </div>
  )
}