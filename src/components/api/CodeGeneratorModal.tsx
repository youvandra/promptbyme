import React, { useState, useEffect } from 'react'
import { Search, Code, X, Filter, Eye, EyeOff, GitFork, Heart, Plus, Thermometer, ChevronDown, ChevronUp, Zap, Copy, CheckCircle, AlertCircle, Server, ArrowLeft, Key } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptStore } from '../../store/promptStore'
import { useAuthStore } from '../../store/authStore'
import { useFlowStore } from '../../store/flowStore'
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

interface Flow {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  steps: any[]
}

interface CodeGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  initialCodeType?: 'prompt' | 'flow'
}

export const CodeGeneratorModal: React.FC<CodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialCodeType = 'prompt'
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string>('')
  const [extractedVariables, setExtractedVariables] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'curl'>('javascript')
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'llama' | 'groq'>('openai')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o')
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [promptbyApiKey, setPromptbyApiKey] = useState<string | null>(null)
  const [aiProviderApiKey, setAiProviderApiKey] = useState<string | null>(null)
  const [showAiProviderKey, setShowAiProviderKey] = useState(false)
  const [savingAiProviderKey, setSavingAiProviderKey] = useState(false)
  const [codeType, setCodeType] = useState<'prompt' | 'flow'>(initialCodeType)
  const [activeTab, setActiveTab] = useState<'select' | 'configure'>('select')
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set())
  
  const { user } = useAuthStore()
  const { prompts, loading: promptsLoading, fetchUserPrompts } = usePromptStore()
  const { flows, loading: flowsLoading, fetchFlows } = useFlowStore()
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setCodeType(initialCodeType)
      setActiveTab('select')
      setSelectedPrompt(null)
      setSelectedFlow(null)
      setSearchQuery('')
    }
  }, [isOpen, initialCodeType])

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPrompts(user.id)
      fetchFlows()
      
      // Get Supabase URL from environment
      const url = import.meta.env.VITE_SUPABASE_URL || ''
      setSupabaseUrl(url)
      
      // Fetch the user's API keys
      fetchApiKeys()
    }
  }, [isOpen, user, fetchUserPrompts, fetchFlows])

  const fetchApiKeys = async () => {
    if (!user) return
    
    try {
      // Fetch promptby.me API key
      const { data: pbmKeyData, error: pbmKeyError } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .eq('key_type', 'pbm_api_key')
        .maybeSingle()

      if (!pbmKeyError && pbmKeyData) {
        setPromptbyApiKey(pbmKeyData.key)
      } else {
        setPromptbyApiKey(null)
      }

      // Fetch AI provider API key
      const { data: aiKeyData, error: aiKeyError } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .eq('key_type', 'ai_provider_key')
        .maybeSingle()

      if (!aiKeyError && aiKeyData) {
        setAiProviderApiKey(aiKeyData.key)
      } else {
        setAiProviderApiKey(null)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  // When a prompt is selected, extract variables
  useEffect(() => {
    if (selectedPrompt) {
      const variables = extractVariables(selectedPrompt.content)
      setExtractedVariables(variables)
      
      // Initialize variable values
      const initialValues: Record<string, string> = {}
      variables.forEach(variable => {
        initialValues[variable] = ''
      })
      setVariableValues(initialValues)
      
      // Move to configure tab when a prompt is selected
      setActiveTab('configure')
    } else if (selectedFlow) {
      // For flows, we need to extract variables from all steps
      // This would require fetching all steps and their content
      // For simplicity, we'll just set an empty array for now
      setExtractedVariables([])
      setVariableValues({})
      
      // Move to configure tab when a flow is selected
      setActiveTab('configure')
    } else {
      setExtractedVariables([])
      setVariableValues({})
    }
  }, [selectedPrompt, selectedFlow])

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

  // Extract variables from prompt content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || []
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))]
  }

  // Filter prompts based on search and access filter
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterAccess === 'all' || prompt.access === filterAccess
    
    return matchesSearch && matchesFilter
  })

  // Filter flows based on search
  const filteredFlows = flows.filter(flow => {
    const matchesSearch = !searchQuery || 
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSearch
  })

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setSelectedFlow(null)
    setCodeType('prompt')
    setActiveTab('configure')
  }

  const handleFlowSelect = (flow: Flow) => {
    setSelectedFlow(flow)
    setSelectedPrompt(null)
    setCodeType('flow')
    setActiveTab('configure')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length <= maxLength ? content : content.substring(0, maxLength) + '...'
  }

  const handleSaveAiProviderKey = async () => {
    if (!user || !aiProviderApiKey) return
    
    setSavingAiProviderKey(true)
    
    try {
      // Check if user already has this type of API key
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('key_type', 'ai_provider_key')
        .maybeSingle()
      
      if (existingKey) {
        // Update existing key
        await supabase
          .from('api_keys')
          .update({ key: aiProviderApiKey })
          .eq('id', existingKey.id)
      } else {
        // Create new key
        await supabase
          .from('api_keys')
          .insert([{ 
            user_id: user.id, 
            key: aiProviderApiKey,
            key_type: 'ai_provider_key'
          }])
      }
    } catch (error) {
      console.error('Error saving AI provider API key:', error)
    } finally {
      setSavingAiProviderKey(false)
    }
  }

  // Generate JavaScript code snippet for prompt
  const generateJsPromptCode = (): string => {
    if (!selectedPrompt) return ''
    
    let variablesObj = '{}';
    if (extractedVariables.length > 0) {
      variablesObj = `{\n    ${extractedVariables.map(v => `${v}: "${variableValues[v] || `${v}Value`}"`).join(',\n    ')}\n  }`;
    }
    
    return `async function runPrompt() {
  // Your promptby.me API key
  const promptbyApiKey = "${promptbyApiKey || 'YOUR_PROMPTBY_ME_API_KEY'}";
  
  const response = await fetch("${supabaseUrl}/functions/v1/run-prompt-api", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${promptbyApiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt_id: "${selectedPrompt.id}",
      variables: ${variablesObj},
      api_key: "${aiProviderApiKey || 'YOUR_AI_PROVIDER_API_KEY'}",
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
}`;
  }

  // Generate JavaScript code snippet for flow
  const generateJsFlowCode = (): string => {
    if (!selectedFlow) return ''
    
    let variablesObj = '{}';
    if (extractedVariables.length > 0) {
      variablesObj = `{\n    ${extractedVariables.map(v => `${v}: "${variableValues[v] || `${v}Value`}"`).join(',\n    ')}\n  }`;
    }
    
    return `async function runFlow() {
  // Your promptby.me API key
  const promptbyApiKey = "${promptbyApiKey || 'YOUR_PROMPTBY_ME_API_KEY'}";
  
  const response = await fetch("${supabaseUrl}/functions/v1/run-prompt-flow-api", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${promptbyApiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      flow_id: "${selectedFlow.id}",
      variables: ${variablesObj},
      api_key: "${aiProviderApiKey || 'YOUR_AI_PROVIDER_API_KEY'}",
      provider: "${selectedProvider}",
      model: "${selectedModel}",
      temperature: ${temperature},
      max_tokens: ${maxTokens}
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
}`;
  }

  // Generate Python code snippet for prompt
  const generatePythonPromptCode = (): string => {
    if (!selectedPrompt) return ''
    
    let variablesDict = '{}';
    if (extractedVariables.length > 0) {
      variablesDict = `{\n        ${extractedVariables.map(v => `"${v}": "${variableValues[v] || `${v}_value`}"`).join(',\n        ')}\n    }`;
    }
    
    return `import requests
import json

def run_prompt():
    # Your promptby.me API key
    promptby_api_key = "${promptbyApiKey || 'YOUR_PROMPTBY_ME_API_KEY'}"
    
    url = "${supabaseUrl}/functions/v1/run-prompt-api"
    
    headers = {
        "Authorization": f"Bearer {promptby_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt_id": "${selectedPrompt.id}",
        "variables": ${variablesDict},
        "api_key": "${aiProviderApiKey || 'YOUR_AI_PROVIDER_API_KEY'}",
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
        raise Exception(data.get("error"))`;
  }

  // Generate Python code snippet for flow
  const generatePythonFlowCode = (): string => {
    if (!selectedFlow) return ''
    
    let variablesDict = '{}';
    if (extractedVariables.length > 0) {
      variablesDict = `{\n        ${extractedVariables.map(v => `"${v}": "${variableValues[v] || `${v}_value`}"`).join(',\n        ')}\n    }`;
    }
    
    return `import requests
import json

def run_flow():
    # Your promptby.me API key
    promptby_api_key = "${promptbyApiKey || 'YOUR_PROMPTBY_ME_API_KEY'}"
    
    url = "${supabaseUrl}/functions/v1/run-prompt-flow-api"
    
    headers = {
        "Authorization": f"Bearer {promptby_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "flow_id": "${selectedFlow.id}",
        "variables": ${variablesDict},
        "api_key": "${aiProviderApiKey || 'YOUR_AI_PROVIDER_API_KEY'}",
        "provider": "${selectedProvider}",
        "model": "${selectedModel}",
        "temperature": ${temperature},
        "max_tokens": ${maxTokens}
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("success"):
        print("Final Output:", data["output"])
        print("Step Outputs:", data["step_outputs"])
        return data["output"]
    else:
        print("Error:", data.get("error"))
        raise Exception(data.get("error"))`;
  }

  // Generate cURL code snippet for prompt
  const generateCurlPromptCode = (): string => {
    if (!selectedPrompt) return ''
    
    let variablesJson = '{}';
    if (extractedVariables.length > 0) {
      variablesJson = `{\n      ${extractedVariables.map(v => `"${v}": "${variableValues[v] || `${v}Value`}"`).join(',\n      ')}\n    }`;
    }
    
    return `curl -X POST "${supabaseUrl}/functions/v1/run-prompt-api" \\
  -H "Authorization: Bearer ${promptbyApiKey || 'YOUR_PROMPTBY_ME_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt_id": "${selectedPrompt.id}",
    "variables": ${variablesJson},
    "api_key": "${aiProviderApiKey || 'YOUR_AI_PROVIDER_API_KEY'}",
    "provider": "${selectedProvider}",
    "model": "${selectedModel}",
    "temperature": ${temperature},
    "max_tokens": ${maxTokens}
  }'`;
  }

  // Generate cURL code snippet for flow
  const generateCurlFlowCode = (): string => {
    if (!selectedFlow) return ''
    
    let variablesJson = '{}';
    if (extractedVariables.length > 0) {
      variablesJson = `{\n      ${extractedVariables.map(v => `"${v}": "${variableValues[v] || `${v}Value`}"`).join(',\n      ')}\n    }`;
    }
    
    return `curl -X POST "${supabaseUrl}/functions/v1/run-prompt-flow-api" \\
  -H "Authorization: Bearer ${promptbyApiKey || 'YOUR_PROMPTBY_ME_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flow_id": "${selectedFlow.id}",
    "variables": ${variablesJson},
    "api_key": "${aiProviderApiKey || 'YOUR_AI_PROVIDER_API_KEY'}",
    "provider": "${selectedProvider}",
    "model": "${selectedModel}",
    "temperature": ${temperature},
    "max_tokens": ${maxTokens}
  }'`;
  }

  const generateCode = (): string => {
    if (codeType === 'prompt') {
      if (selectedLanguage === 'javascript') {
        return generateJsPromptCode()
      } else if (selectedLanguage === 'python') {
        return generatePythonPromptCode()
      } else {
        return generateCurlPromptCode()
      }
    } else {
      if (selectedLanguage === 'javascript') {
        return generateJsFlowCode()
      } else if (selectedLanguage === 'python') {
        return generatePythonFlowCode()
      } else {
        return generateCurlFlowCode()
      }
    }
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

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }))
  }

  const handleBackToSelection = () => {
    setActiveTab('select')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Code className="text-indigo-400" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Generate {codeType === 'prompt' ? 'Prompt' : 'Flow'} API Code
              </h2>
              <p className="text-sm text-zinc-400">
                {activeTab === 'select' 
                  ? `Select a ${codeType}` 
                  : selectedPrompt 
                    ? `Configuring code for prompt: ${selectedPrompt.title || 'Untitled'}` 
                    : `Configuring code for flow: ${selectedFlow?.name || 'Untitled'}`}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800/50">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('select')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'select'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              1. Select {codeType === 'prompt' ? 'Prompt' : 'Flow'}
            </button>
            <button
              onClick={() => setActiveTab('configure')}
              disabled={!selectedPrompt && !selectedFlow}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'configure'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300 disabled:text-zinc-600 disabled:hover:text-zinc-600'
              }`}
            >
              2. Configure & Generate
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'select' ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col overflow-y-auto"
              >
                {/* Search and Filter */}
                <div className="p-6 border-b border-zinc-800/50 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${codeType === 'prompt' ? 'prompts' : 'flows'}...`}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      />
                    </div>

                    {codeType === 'prompt' && (
                      <div className="flex items-center gap-3">
                        <Filter className="text-zinc-500" size={18} />
                        <select
                          value={filterAccess}
                          onChange={(e) => setFilterAccess(e.target.value as any)}
                          className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        >
                          <option value="all">All Prompts</option>
                          <option value="public">Public Only</option>
                          <option value="private">Private Only</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Prompts/Flows List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {codeType === 'prompt' ? 'Select a Prompt' : 'Select a Flow'}
                  </h3>
                  
                  {codeType === 'prompt' ? (
                    // Prompts List
                    promptsLoading ? (
                      <div className="text-center py-12">
                        <div className="flex items-center justify-center gap-2 text-zinc-400">
                          <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                          <span>Loading prompts...</span>
                        </div>
                      </div>
                    ) : filteredPrompts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPrompts.map((prompt) => (
                          <motion.div
                            key={prompt.id}
                            className={`group relative bg-zinc-800/30 border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-indigo-500/50 hover:bg-zinc-800/50 ${
                              selectedPrompt?.id === prompt.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700/50'
                            }`}
                            onClick={() => handlePromptSelect(prompt)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                {prompt.title && (
                                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                                    {prompt.title}
                                  </h3>
                                )}
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <div className="flex items-center gap-1">
                                    {prompt.access === 'private' ? (
                                      <EyeOff size={10} className="text-amber-400" />
                                    ) : (
                                      <Eye size={10} className="text-emerald-400" />
                                    )}
                                    <span className={prompt.access === 'private' ? 'text-amber-400' : 'text-emerald-400'}>
                                      {prompt.access}
                                    </span>
                                  </div>
                                  <span>•</span>
                                  <span>{formatDate(prompt.created_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Content Preview */}
                            <div className="text-zinc-300 text-sm leading-relaxed mb-3">
                              {truncateContent(prompt.content)}
                            </div>

                            {/* Stats */}
                            {prompt.access === 'public' && (
                              <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <div className="flex items-center gap-1">
                                  <Eye size={10} />
                                  <span>{prompt.views || 0}</span>
                                </div>
                                {prompt.original_prompt_id === null && (prompt.fork_count || 0) > 0 && (
                                  <div className="flex items-center gap-1">
                                    <GitFork size={10} />
                                    <span>{prompt.fork_count || 0}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Selection Indicator */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-8">
                          <Search className="mx-auto text-zinc-500 mb-4" size={48} />
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {searchQuery || filterAccess !== 'all' ? 'No matching prompts' : 'No prompts found'}
                          </h3>
                          <p className="text-zinc-400">
                            {searchQuery || filterAccess !== 'all'
                              ? 'Try adjusting your search or filter'
                              : 'Create your first prompt to get started'
                            }
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    // Flows List
                    flowsLoading ? (
                      <div className="text-center py-12">
                        <div className="flex items-center justify-center gap-2 text-zinc-400">
                          <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                          <span>Loading flows...</span>
                        </div>
                      </div>
                    ) : filteredFlows.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredFlows.map((flow) => (
                          <motion.div
                            key={flow.id}
                            className={`group relative bg-zinc-800/30 border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-purple-500/50 hover:bg-zinc-800/50 ${
                              selectedFlow?.id === flow.id ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700/50'
                            }`}
                            onClick={() => handleFlowSelect(flow)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                                  {flow.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <span>{formatDate(flow.created_at)}</span>
                                  <span>•</span>
                                  <span>{flow.steps?.length || 0} steps</span>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            {flow.description && (
                              <div className="text-zinc-300 text-sm leading-relaxed mb-3">
                                {truncateContent(flow.description)}
                              </div>
                            )}

                            {/* Selection Indicator */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-8">
                          <Search className="mx-auto text-zinc-500 mb-4" size={48} />
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {searchQuery ? 'No matching flows' : 'No flows found'}
                          </h3>
                          <p className="text-zinc-400">
                            {searchQuery
                              ? 'Try adjusting your search'
                              : 'Create your first flow to get started'
                            }
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col md:flex-row overflow-y-auto"
              >
                {/* Left Column - Configuration */}
                <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-zinc-800/50 flex flex-col">
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <button
                      onClick={handleBackToSelection}
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-4"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to selection</span>
                    </button>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {codeType === 'prompt' ? 'Prompt Details' : 'Flow Details'}
                      </h3>
                      
                      <div className={`bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4 ${codeType === 'flow' ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-indigo-500'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">
                            {selectedPrompt ? (selectedPrompt.title || 'Untitled Prompt') : (selectedFlow?.name || 'Untitled Flow')}
                          </h4>
                          
                          {selectedPrompt && (
                            <div className={`px-2 py-1 rounded text-xs ${
                              selectedPrompt.access === 'private' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {selectedPrompt.access === 'private' ? 'Private' : 'Public'}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-zinc-500 mb-3">
                          ID: {selectedPrompt ? selectedPrompt.id : selectedFlow?.id}
                        </div>
                        
                        <div className="text-sm text-zinc-300 line-clamp-3">
                          {selectedPrompt 
                            ? truncateContent(selectedPrompt.content, 200)
                            : (selectedFlow?.description || 'No description available')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Variables Section - Only show for prompts */}
                    {codeType === 'prompt' && extractedVariables.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Variables</h3>
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                          <div className="space-y-3">
                            {extractedVariables.map((variable, index) => (
                              <div key={index}>
                                <label className="block text-xs font-medium text-zinc-300 mb-1">
                                  {`{{${variable}}}`}
                                </label>
                                <input
                                  type="text"
                                  value={variableValues[variable] || ''}
                                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                                  placeholder={`Enter value for ${variable}`}
                                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Language Selection */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Language</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedLanguage('javascript')}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                            selectedLanguage === 'javascript' 
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
                              : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                          }`}
                        >
                          <span>JavaScript</span>
                        </button>
                        
                        <button
                          onClick={() => setSelectedLanguage('python')}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                            selectedLanguage === 'python' 
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
                              : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                          }`}
                        >
                          <span>Python</span>
                        </button>
                        
                        <button
                          onClick={() => setSelectedLanguage('curl')}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                            selectedLanguage === 'curl' 
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
                              : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                          }`}
                        >
                          <span>cURL</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* AI Provider Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">AI Provider</h3>
                      <div className="space-y-4">
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value as any)}
                          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic (Claude)</option>
                          <option value="google">Google (Gemini)</option>
                          <option value="llama">Llama</option>
                          <option value="groq">Groq</option>
                        </select>
                        
                        {/* AI Provider API Key */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                            <Key size={16} className="text-indigo-400" />
                            API Key
                          </label>
                          <div className="relative">
                            <input
                              type={showAiProviderKey ? "text" : "password"}
                              value={
                                showAiProviderKey
                                  ? aiProviderApiKey
                                  : aiProviderApiKey
                                    ? aiProviderApiKey.slice(0, 4) + "••••••" + aiProviderApiKey.slice(-4)
                                    : ''
                              }
                              onChange={(e) => setAiProviderApiKey(e.target.value)}
                              placeholder={`Enter your ${selectedProvider} API key`}
                              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                              <button
                                onClick={() => setShowAiProviderKey(!showAiProviderKey)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                title={showAiProviderKey ? "Hide API key" : "Show API key"}
                              >
                                {showAiProviderKey ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              {aiProviderApiKey && (
                                <button
                                  onClick={() => copyToClipboard(aiProviderApiKey, 'ai-key')}
                                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                                  title="Copy to clipboard"
                                >
                                  {copied === 'ai-key' ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-xs text-zinc-500">
                              Your API key is stored securely and never sent to our servers.
                            </p>
                            <button
                              onClick={handleSaveAiProviderKey}
                              disabled={savingAiProviderKey || !aiProviderApiKey}
                              className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:bg-zinc-700/20 text-indigo-400 disabled:text-zinc-500 text-xs rounded transition-all duration-200"
                            >
                              {savingAiProviderKey ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <span>Save Key</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Advanced Options */}
                        <div>
                          <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            <span>Advanced Options</span>
                          </button>
                          
                          <AnimatePresence>
                            {showAdvancedOptions && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden mt-3"
                              >
                                <div className="space-y-4 bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                                  <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                      Model
                                    </label>
                                    <select
                                      value={selectedModel}
                                      onChange={(e) => setSelectedModel(e.target.value)}
                                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
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
                                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Code Output */}
                <div className="w-full md:w-1/2 flex flex-col overflow-y-auto">
                  <div className="p-6 flex flex-col flex-1 overflow-y-auto">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Generated Code
                      </h3>
                      <button
                        onClick={() => copyToClipboard(generateCode(), 'code')}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                        title="Copy to clipboard"
                      >
                        {copied === 'code' ? (
                          <CheckCircle size={16} className="text-emerald-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                    
                    <div className="bg-zinc-800/50 p-4 rounded-lg flex-1 overflow-auto">
                      <pre className="text-sm text-indigo-300 font-mono">
                        <code>{generateCode()}</code>
                      </pre>
                    </div>
                    
                    <div className="mt-4 text-xs text-zinc-500">
                      <p>This code snippet demonstrates how to call the {codeType === 'prompt' ? 'run-prompt-api' : 'run-prompt-flow-api'} endpoint.</p>
                      {!aiProviderApiKey && (
                        <p className="mt-1 text-amber-400">Note: You haven't set an AI provider API key yet. Enter and save your API key above.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
          
          {activeTab === 'select' && (selectedPrompt || selectedFlow) && (
            <button
              onClick={() => setActiveTab('configure')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Continue
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}