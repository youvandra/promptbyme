import React, { useState, useEffect } from 'react'
import { Menu, Code, Key, FileText, Copy, CheckCircle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ApiKeyModal } from '../../components/api/ApiKeyModal'
import { ApiDocsModal } from '../../components/api/ApiDocsModal'
import { CodeGeneratorModal } from '../../components/api/CodeGeneratorModal'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export const ApiPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiDocsModal, setShowApiDocsModal] = useState(false)
  const [showCodeGeneratorModal, setShowCodeGeneratorModal] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python'>('javascript')
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'llama' | 'groq'>('openai')
  
  const { user, loading: authLoading } = useAuthStore()

  useEffect(() => {
    if (user) {
      fetchApiKey()
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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
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
                
                <div className="w-6" />
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
                      <span className="text-zinc-400">Loading...</span>
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
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <button
                      onClick={() => setShowCodeGeneratorModal(true)}
                      className="w-full flex items-center justify-center gap-2 p-6 bg-zinc-800/30 border border-zinc-700/30 hover:border-indigo-500/50 hover:bg-zinc-800/50 rounded-xl transition-all duration-200"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Code size={24} className="text-indigo-400" />
                        </div>
                        <h3 className="text-white font-medium mb-2">Choose Your Prompt</h3>
                        <p className="text-zinc-400 text-sm">Select from your saved prompts to generate API code</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="h-full flex flex-col">
                      <div className="mb-4">
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
                    </div>
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
                      <p className="text-zinc-400 text-sm">Detailed reference for the promptby.me API</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowApiDocsModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    View Documentation
                  </button>
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
      
      {/* Code Generator Modal */}
      <CodeGeneratorModal
        isOpen={showCodeGeneratorModal}
        onClose={() => setShowCodeGeneratorModal(false)}
      />

      <BoltBadge />
    </div>
  )
}