import React, { useState, useEffect } from 'react'
import { Menu, Code, Key, FileText, Copy, CheckCircle, ExternalLink, Cpu, Thermometer, Zap, Wand2, Eye, EyeOff, Info, Search, Filter, ChevronDown, ChevronRight, Play, Book, Server, Globe, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ApiKeyModal } from '../../components/api/ApiKeyModal'
import { ApiDocsModal } from '../../components/api/ApiDocsModal'
import { ApiLogsModal } from '../../components/api/ApiLogsModal'
import { CodeGeneratorModal } from '../../components/api/CodeGeneratorModal'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useSubscription } from '../../hooks/useSubscription'
import { useSecureStorage } from '../../hooks/useSecureStorage'
import { UpgradeMessage } from '../../components/subscription/UpgradeMessage'
import { motion, AnimatePresence } from 'framer-motion'

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

interface ApiEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  category: 'prompt' | 'flow' | 'auth'
  authentication: boolean
  parameters: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
  responses: {
    status: number
    description: string
    schema: any
  }[]
}

export const ApiPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiDocsModal, setShowApiDocsModal] = useState(false)
  const [showApiLogsModal, setShowApiLogsModal] = useState(false)
  const [showCodeGeneratorModal, setShowCodeGeneratorModal] = useState(false)
  const [codeGeneratorType, setCodeGeneratorType] = useState<'prompt' | 'flow'>('prompt')
  const [copied, setCopied] = useState<string | null>(null)
  const { isBasicOrHigher, loading: subscriptionLoading } = useSubscription()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiProviderApiKey, setAiProviderApiKey] = useState<string>('')
  const [showApiProviderKey, setShowApiProviderKey] = useState(false)
  const [savingApiKey, setSavingApiKey] = useState(false)
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'prompt' | 'flow' | 'auth'>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'curl'>('javascript')
  
  const { user, loading: authLoading } = useAuthStore()
  const { getSecureItem, setSecureItem } = useSecureStorage()

  // API endpoints data
  const apiEndpoints: ApiEndpoint[] = [
    {
      id: 'run-prompt-api',
      name: 'Run Prompt',
      method: 'POST',
      path: '/functions/v1/run-prompt-api',
      description: 'Execute a prompt with optional variable substitution.',
      category: 'prompt',
      authentication: true,
      parameters: [
        { name: 'prompt_id', type: 'string', required: true, description: 'The UUID of the prompt to run' },
        { name: 'variables', type: 'object', required: false, description: 'Key-value pairs for variable substitution in the prompt' },
        { name: 'api_key', type: 'string', required: true, description: 'Your API key for the AI provider' },
        { name: 'provider', type: 'string', required: false, description: 'AI provider to use (default: "groq"). Options: "openai", "anthropic", "google", "llama", "groq"' },
        { name: 'model', type: 'string', required: false, description: 'The model to use (default: "llama3-8b-8192")' },
        { name: 'temperature', type: 'number', required: false, description: 'Controls randomness (0-2, default: 0.7)' },
        { name: 'max_tokens', type: 'number', required: false, description: 'Maximum tokens in the response (default: 1000)' }
      ],
      responses: [
        {
          status: 200,
          description: 'Success',
          schema: {
            success: true,
            output: 'The AI generated response.',
            prompt: {
              id: 'uuid-of-your-prompt',
              title: 'Prompt Title',
              processed_content: 'The prompt content with variables filled in.'
            }
          }
        },
        {
          status: 400,
          description: 'Bad Request',
          schema: {
            success: false,
            error: 'Missing required parameters or invalid input'
          }
        },
        {
          status: 401,
          description: 'Unauthorized',
          schema: {
            success: false,
            error: 'Invalid or missing authentication token'
          }
        },
        {
          status: 403,
          description: 'Forbidden',
          schema: {
            success: false,
            error: 'You don\'t have access to the requested prompt'
          }
        },
        {
          status: 404,
          description: 'Not Found',
          schema: {
            success: false,
            error: 'Prompt not found'
          }
        },
        {
          status: 500,
          description: 'Internal Server Error',
          schema: {
            success: false,
            error: 'Something went wrong on the server'
          }
        }
      ]
    },
    {
      id: 'run-prompt-flow-api',
      name: 'Run Prompt Flow',
      method: 'POST',
      path: '/functions/v1/run-prompt-flow-api',
      description: 'Execute a complete prompt flow with optional variable substitution.',
      category: 'flow',
      authentication: true,
      parameters: [
        { name: 'flow_id', type: 'string', required: true, description: 'The UUID of the flow to run' },
        { name: 'variables', type: 'object', required: false, description: 'Key-value pairs for variable substitution across all steps in the flow' },
        { name: 'api_key', type: 'string', required: true, description: 'Your API key for the AI provider' },
        { name: 'provider', type: 'string', required: false, description: 'AI provider to use (default: "groq"). Options: "openai", "anthropic", "google", "llama", "groq"' },
        { name: 'model', type: 'string', required: false, description: 'The model to use (default: "llama3-8b-8192")' },
        { name: 'temperature', type: 'number', required: false, description: 'Controls randomness (0-2, default: 0.7)' },
        { name: 'max_tokens', type: 'number', required: false, description: 'Maximum tokens in the response (default: 1000)' }
      ],
      responses: [
        {
          status: 200,
          description: 'Success',
          schema: {
            success: true,
            output: 'The final AI generated response from the last step.',
            step_outputs: {
              'step-id-1': 'Output from step 1',
              'step-id-2': 'Output from step 2',
              'step-id-3': 'Output from step 3'
            },
            flow: {
              id: 'uuid-of-your-flow',
              name: 'Flow Name',
              steps: [
                {
                  id: 'step-id-1',
                  title: 'Step 1 Title',
                  order_index: 0
                },
                {
                  id: 'step-id-2',
                  title: 'Step 2 Title',
                  order_index: 1
                },
                {
                  id: 'step-id-3',
                  title: 'Step 3 Title',
                  order_index: 2
                }
              ]
            }
          }
        },
        {
          status: 400,
          description: 'Bad Request',
          schema: {
            success: false,
            error: 'Missing required parameters or invalid input'
          }
        },
        {
          status: 401,
          description: 'Unauthorized',
          schema: {
            success: false,
            error: 'Invalid or missing authentication token'
          }
        },
        {
          status: 403,
          description: 'Forbidden',
          schema: {
            success: false,
            error: 'You don\'t have access to the requested flow'
          }
        },
        {
          status: 404,
          description: 'Not Found',
          schema: {
            success: false,
            error: 'Flow not found or no steps in flow'
          }
        },
        {
          status: 500,
          description: 'Internal Server Error',
          schema: {
            success: false,
            error: 'Something went wrong during flow execution'
          }
        }
      ]
    }
  ]

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

  // Filter endpoints based on search and category
  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = searchQuery === '' || 
      endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || endpoint.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Get code example for the selected endpoint
  const getCodeExample = (endpoint: ApiEndpoint, language: 'javascript' | 'python' | 'curl') => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
    
    if (language === 'javascript') {
      if (endpoint.id === 'run-prompt-api') {
        return `async function runPrompt() {
  // Your promptby.me API key
  const promptbyApiKey = "${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}";
  
  const response = await fetch("${baseUrl}/functions/v1/run-prompt-api", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${promptbyApiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt_id: "your-prompt-uuid",
      variables: {
        name: "John",
        company: "Acme Inc."
      },
      api_key: "YOUR_AI_PROVIDER_API_KEY",
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 1000
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
      } else if (endpoint.id === 'run-prompt-flow-api') {
        return `async function runFlow() {
  // Your promptby.me API key
  const promptbyApiKey = "${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}";
  
  const response = await fetch("${baseUrl}/functions/v1/run-prompt-flow-api", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${promptbyApiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      flow_id: "your-flow-uuid",
      variables: {
        name: "John",
        company: "Acme Inc."
      },
      api_key: "YOUR_AI_PROVIDER_API_KEY",
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log("Final Output:", data.output);
    console.log("Step Outputs:", data.step_outputs);
    return data.output;
  } else {
    console.error("Error:", data.error);
    throw new Error(data.error);
  }
}`
      }
    } else if (language === 'python') {
      if (endpoint.id === 'run-prompt-api') {
        return `import requests
import json

def run_prompt():
    # Your promptby.me API key
    promptby_api_key = "${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}"
    
    url = "${baseUrl}/functions/v1/run-prompt-api"
    
    headers = {
        "Authorization": f"Bearer {promptby_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt_id": "your-prompt-uuid",
        "variables": {
            "name": "John",
            "company": "Acme Inc."
        },
        "api_key": "YOUR_AI_PROVIDER_API_KEY",
        "provider": "anthropic",
        "model": "claude-3-opus-20240229",
        "temperature": 0.5,
        "max_tokens": 1000
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("success"):
        print("AI Response:", data["output"])
        return data["output"]
    else:
        print("Error:", data.get("error"))
        raise Exception(data.get("error"))
`
      } else if (endpoint.id === 'run-prompt-flow-api') {
        return `import requests
import json

def run_flow():
    # Your promptby.me API key
    promptby_api_key = "${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}"
    
    url = "${baseUrl}/functions/v1/run-prompt-flow-api"
    
    headers = {
        "Authorization": f"Bearer {promptby_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "flow_id": "your-flow-uuid",
        "variables": {
            "name": "John",
            "company": "Acme Inc."
        },
        "api_key": "YOUR_AI_PROVIDER_API_KEY",
        "provider": "anthropic",
        "model": "claude-3-opus-20240229",
        "temperature": 0.5,
        "max_tokens": 1000
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("success"):
        print("Final Output:", data["output"])
        print("Step Outputs:", data["step_outputs"])
        return data["output"]
    else:
        print("Error:", data.get("error"))
        raise Exception(data.get("error"))
`
      }
    } else if (language === 'curl') {
      if (endpoint.id === 'run-prompt-api') {
        return `curl -X POST "${baseUrl}/functions/v1/run-prompt-api" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt_id": "your-prompt-uuid",
    "variables": {
      "name": "John",
      "company": "Acme Inc."
    },
    "api_key": "YOUR_AI_PROVIDER_API_KEY",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`
      } else if (endpoint.id === 'run-prompt-flow-api') {
        return `curl -X POST "${baseUrl}/functions/v1/run-prompt-flow-api" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flow_id": "your-flow-uuid",
    "variables": {
      "name": "John",
      "company": "Acme Inc."
    },
    "api_key": "YOUR_AI_PROVIDER_API_KEY",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`
      }
    }
    
    return 'Code example not available'
  }

  if (authLoading || subscriptionLoading) {
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

  // Check if user has required subscription for API access
  if (!isBasicOrHigher()) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
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

            {/* Upgrade Message */}
            <UpgradeMessage feature="api" minPlan="basic" />
          </div>
        </div>
        
        <BoltBadge />
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
          <div className="relative z-10 flex-1 flex">
            {/* API Sidebar */}
            <div className="hidden md:block w-64 border-r border-zinc-800/50 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-1">
                  {filteredEndpoints.map(endpoint => (
                    <button
                      key={endpoint.id}
                      onClick={() => setActiveEndpoint(endpoint.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeEndpoint === endpoint.id
                          ? endpoint.category === 'prompt'
                            ? 'bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500'
                            : 'bg-purple-600/20 text-purple-300 border-l-2 border-purple-500'
                          : 'hover:bg-zinc-800/50 text-zinc-300'
                      }`}
                    >
                      <div className={`px-1.5 py-0.5 text-xs rounded font-mono ${
                        endpoint.method === 'GET' 
                          ? 'bg-green-500/20 text-green-400' 
                          : endpoint.method === 'POST'
                            ? 'bg-blue-500/20 text-blue-400'
                            : endpoint.method === 'PUT'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                      }`}>
                        {endpoint.method}
                      </div>
                      <span className="truncate">{endpoint.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {activeEndpoint ? (
                <div className="p-6">
                  {(() => {
                    const endpoint = apiEndpoints.find(e => e.id === activeEndpoint)
                    if (!endpoint) return null
                    
                    return (
                      <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`px-2 py-1 text-xs rounded font-mono ${
                                endpoint.method === 'GET' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : endpoint.method === 'POST'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : endpoint.method === 'PUT'
                                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {endpoint.method}
                              </div>
                              <h1 className="text-2xl font-bold text-white">{endpoint.name}</h1>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="group relative">
                                <div className="flex items-center gap-2 font-mono text-sm text-zinc-300 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                                  {import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}{endpoint.path}
                                </div>
                                <button
                                  onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}${endpoint.path}`, 'endpoint-url')}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-700/50 rounded"
                                >
                                  {copied === 'endpoint-url' ? (
                                    <CheckCircle size={14} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={14} className="text-zinc-400" />
                                  )}
                                </button>
                              </div>
                              <div className={`px-2 py-1 text-xs rounded ${
                                endpoint.category === 'prompt'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                {endpoint.category === 'prompt' ? 'Prompt' : 'Flow'}
                              </div>
                            </div>
                            <p className="text-zinc-400">{endpoint.description}</p>
                          </div>
                          
                          <div>
                            <button
                              onClick={() => handleOpenCodeGenerator(endpoint.category)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                endpoint.category === 'prompt'
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              <Code size={16} />
                              <span>Generate Code</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Authentication */}
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Key size={18} className="text-indigo-400" />
                            Authentication
                          </h2>
                          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                            <p className="text-zinc-300 mb-3">
                              This endpoint requires authentication using a promptby.me API key in the Authorization header.
                            </p>
                            <div className="bg-zinc-900/50 p-3 rounded-lg font-mono text-sm text-indigo-300 mb-3">
                              <div className="flex items-center justify-between">
                                <span>Authorization: Bearer {apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}` : 'YOUR_PROMPTBY_ME_API_KEY'}</span>
                                <button
                                  onClick={() => copyToClipboard(`Authorization: Bearer ${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}`, 'auth-header')}
                                  className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
                                >
                                  {copied === 'auth-header' ? (
                                    <CheckCircle size={14} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={14} className="text-zinc-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowApiKeyModal(true)}
                                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                {apiKey ? 'Manage API Key' : 'Generate API Key'}
                              </button>
                              <span className="text-zinc-600">•</span>
                              <button
                                onClick={() => setShowApiLogsModal(true)}
                                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                View API Logs
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Parameters */}
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Server size={18} className="text-indigo-400" />
                            Request Parameters
                          </h2>
                          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                                <tr>
                                  <th scope="col" className="px-4 py-3">Parameter</th>
                                  <th scope="col" className="px-4 py-3">Type</th>
                                  <th scope="col" className="px-4 py-3">Required</th>
                                  <th scope="col" className="px-4 py-3">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.parameters.map((param, index) => (
                                  <tr key={param.name} className={`border-b border-zinc-800 ${index % 2 === 0 ? 'bg-zinc-800/20' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-white">{param.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-300">{param.type}</td>
                                    <td className="px-4 py-3">
                                      {param.required ? (
                                        <span className="text-emerald-400">Yes</span>
                                      ) : (
                                        <span className="text-zinc-500">No</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        {/* Code Examples */}
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Code size={18} className="text-indigo-400" />
                            Code Examples
                          </h2>
                          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                            <div className="flex border-b border-zinc-700/50 mb-4">
                              <button
                                onClick={() => setSelectedLanguage('javascript')}
                                className={`px-4 py-2 text-sm font-medium ${
                                  selectedLanguage === 'javascript'
                                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                                    : 'text-zinc-400 hover:text-zinc-300'
                                }`}
                              >
                                JavaScript
                              </button>
                              <button
                                onClick={() => setSelectedLanguage('python')}
                                className={`px-4 py-2 text-sm font-medium ${
                                  selectedLanguage === 'python'
                                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                                    : 'text-zinc-400 hover:text-zinc-300'
                                }`}
                              >
                                Python
                              </button>
                              <button
                                onClick={() => setSelectedLanguage('curl')}
                                className={`px-4 py-2 text-sm font-medium ${
                                  selectedLanguage === 'curl'
                                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                                    : 'text-zinc-400 hover:text-zinc-300'
                                }`}
                              >
                                cURL
                              </button>
                            </div>
                            <div className="relative">
                              <pre className="bg-zinc-900/50 p-4 rounded-lg text-sm font-mono text-indigo-300 overflow-x-auto">
                                <code>{getCodeExample(endpoint, selectedLanguage)}</code>
                              </pre>
                              <button
                                onClick={() => copyToClipboard(getCodeExample(endpoint, selectedLanguage), 'code-example')}
                                className="absolute top-3 right-3 p-2 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg transition-colors"
                              >
                                {copied === 'code-example' ? (
                                  <CheckCircle size={16} className="text-emerald-400" />
                                ) : (
                                  <Copy size={16} className="text-zinc-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Responses */}
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <ArrowRight size={18} className="text-indigo-400" />
                            Responses
                          </h2>
                          <div className="space-y-4">
                            {endpoint.responses.map(response => (
                              <div 
                                key={response.status}
                                className={`bg-zinc-800/30 border rounded-xl overflow-hidden ${
                                  response.status >= 200 && response.status < 300
                                    ? 'border-emerald-500/30'
                                    : response.status >= 400 && response.status < 500
                                      ? 'border-amber-500/30'
                                      : 'border-red-500/30'
                                }`}
                              >
                                <div className={`px-4 py-3 flex items-center justify-between ${
                                  response.status >= 200 && response.status < 300
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : response.status >= 400 && response.status < 500
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-red-500/10 text-red-400'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">{response.status}</span>
                                    <span className="text-sm">{response.description}</span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <pre className="bg-zinc-900/50 p-3 rounded-lg text-sm font-mono text-indigo-300 overflow-x-auto">
                                    <code>{JSON.stringify(response.schema, null, 2)}</code>
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Try It Out */}
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Play size={18} className="text-indigo-400" />
                            Try It Out
                          </h2>
                          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                            <p className="text-zinc-300 mb-4">
                              To try this endpoint, you'll need to:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-zinc-300 mb-4">
                              <li>Generate a promptby.me API key (if you haven't already)</li>
                              <li>Have a valid {endpoint.id === 'run-prompt-api' ? 'prompt ID' : 'flow ID'} from your account</li>
                              <li>Provide an AI provider API key</li>
                            </ol>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => handleOpenCodeGenerator(endpoint.category)}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                  endpoint.category === 'prompt'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                              >
                                <Code size={16} />
                                <span>Generate Code</span>
                              </button>
                              <button
                                onClick={() => setShowApiKeyModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                              >
                                <Key size={16} />
                                <span>{apiKey ? 'Manage API Key' : 'Generate API Key'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <div className="max-w-2xl w-full">
                    <div className="text-center mb-8">
                      <Globe className="mx-auto text-indigo-400 mb-4" size={48} />
                      <h1 className="text-3xl font-bold text-white mb-2">
                        API Documentation
                      </h1>
                      <p className="text-zinc-400 max-w-lg mx-auto">
                        Integrate promptby.me into your applications with our simple and powerful API. Select an endpoint from the sidebar to view detailed documentation.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* API Key Card */}
                      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                            <Key size={20} className="text-indigo-400" />
                          </div>
                          <h2 className="text-xl font-semibold text-white">API Key</h2>
                        </div>
                        <p className="text-zinc-400 mb-4">
                          {apiKey 
                            ? "You have an API key generated. Use this key to authenticate your API requests."
                            : "Generate an API key to start making authenticated requests to the promptby.me API."}
                        </p>
                        <button
                          onClick={() => setShowApiKeyModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Key size={16} />
                          <span>{apiKey ? 'Manage API Key' : 'Generate API Key'}</span>
                        </button>
                      </div>
                      
                      {/* API Logs Card */}
                      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                            <Info size={20} className="text-indigo-400" />
                          </div>
                          <h2 className="text-xl font-semibold text-white">API Logs</h2>
                        </div>
                        <p className="text-zinc-400 mb-4">
                          View logs of your API requests to monitor usage, troubleshoot issues, and track performance.
                        </p>
                        <button
                          onClick={() => setShowApiLogsModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Info size={16} />
                          <span>View API Logs</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Book size={20} className="text-indigo-400" />
                        Getting Started
                      </h2>
                      <div className="space-y-4 text-zinc-300">
                        <p>
                          The promptby.me API allows you to programmatically access and run your prompts and flows. Here's how to get started:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 pl-4">
                          <li>Generate your API key from the API Key section</li>
                          <li>Choose which endpoint you want to use (Run Prompt or Run Flow)</li>
                          <li>Generate code snippets for your preferred programming language</li>
                          <li>Make API requests using your promptby.me API key for authentication</li>
                          <li>Monitor your API usage through the logs</li>
                        </ol>
                        <p>
                          Select an endpoint from the sidebar to view detailed documentation and examples.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Prompt API Card */}
                      <div className={`bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 hover:border-indigo-500/50 transition-all duration-300`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                            <Wand2 size={20} className="text-indigo-400" />
                          </div>
                          <h2 className="text-xl font-semibold text-white">Prompt API</h2>
                        </div>
                        <p className="text-zinc-300 mb-4">
                          Run individual prompts with variable substitution and get AI-generated responses.
                        </p>
                        <button
                          onClick={() => handleOpenCodeGenerator('prompt')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Code size={16} />
                          <span>Generate Prompt API Code</span>
                        </button>
                      </div>
                      
                      {/* Flow API Card */}
                      <div className={`bg-purple-600/10 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                            <Zap size={20} className="text-purple-400" />
                          </div>
                          <h2 className="text-xl font-semibold text-white">Flow API</h2>
                        </div>
                        <p className="text-zinc-300 mb-4">
                          Execute complete prompt flows with multiple steps and get results from each step.
                        </p>
                        <button
                          onClick={() => handleOpenCodeGenerator('flow')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Code size={16} />
                          <span>Generate Flow API Code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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