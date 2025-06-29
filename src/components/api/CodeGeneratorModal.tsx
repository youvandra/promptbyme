import React, { useState, useEffect } from 'react'
import { X, Copy, CheckCircle, Code, Search, Filter, Eye, Lock, GitFork, Heart, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptStore } from '../../store/promptStore'
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

interface CodeGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CodeGeneratorModal: React.FC<CodeGeneratorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string>('')
  const [extractedVariables, setExtractedVariables] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python'>('javascript')
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'llama' | 'groq'>('openai')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o')
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  
  const { user } = useAuthStore()
  const { prompts, loading, fetchUserPrompts } = usePromptStore()

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPrompts(user.id)
      
      // Get Supabase URL from environment
      const url = import.meta.env.VITE_SUPABASE_URL || ''
      setSupabaseUrl(url)
    }
  }, [isOpen, user, fetchUserPrompts])

  // When a prompt is selected, extract variables
  useEffect(() => {
    if (selectedPrompt) {
      const variables = extractVariables(selectedPrompt.content)
      setExtractedVariables(variables)
    } else {
      setExtractedVariables([])
    }
  }, [selectedPrompt])

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

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
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

  // Generate JavaScript code snippet
  const generateJsCode = (): string => {
    if (!selectedPrompt) return ''
    
    let variablesObj = '{}';
    if (extractedVariables.length > 0) {
      variablesObj = `{\n    ${extractedVariables.map(v => `${v}: "${v}Value"`).join(',\n    ')}\n  }`;
    }
    
    return `async function runPrompt() {
  // Replace with your Supabase JWT token
  const supabaseAccessToken = "YOUR_SUPABASE_JWT_TOKEN";
  
  const response = await fetch("${supabaseUrl}/functions/v1/run-prompt-api", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${supabaseAccessToken}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt_id: "${selectedPrompt.id}",
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
}`;
  }

  // Generate Python code snippet
  const generatePythonCode = (): string => {
    if (!selectedPrompt) return ''
    
    let variablesDict = '{}';
    if (extractedVariables.length > 0) {
      variablesDict = `{\n        ${extractedVariables.map(v => `"${v}": "${v}_value"`).join(',\n        ')}\n    }`;
    }
    
    return `import requests
import json

def run_prompt():
    # Replace with your Supabase JWT token
    supabase_access_token = "YOUR_SUPABASE_JWT_TOKEN"
    
    url = "${supabaseUrl}/functions/v1/run-prompt-api"
    
    headers = {
        "Authorization": f"Bearer {supabase_access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt_id": "${selectedPrompt.id}",
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
        raise Exception(data.get("error"))`;
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
            <h2 className="text-xl font-semibold text-white">
              Generate API Code
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left side - Prompt selection */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-zinc-800/50 flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-zinc-800/50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Filter className="text-zinc-500" size={18} />
                  <select
                    value={filterAccess}
                    onChange={(e) => setFilterAccess(e.target.value as 'all' | 'public' | 'private')}
                    className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  >
                    <option value="all">All Prompts</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                    <span>Loading prompts...</span>
                  </div>
                </div>
              ) : filteredPrompts.length > 0 ? (
                <div className="space-y-4">
                  {filteredPrompts.map((prompt) => (
                    <motion.div
                      key={prompt.id}
                      className={`group relative bg-zinc-800/30 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-indigo-500/50 hover:bg-zinc-800/50 ${
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
                                <Lock size={10} className="text-amber-400" />
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
                          <div className="flex items-center gap-1">
                            <Heart size={10} />
                            <span>{prompt.like_count || 0}</span>
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
              )}
            </div>
          </div>
          
          {/* Right side - Code generation */}
          <div className="w-full md:w-1/2 flex flex-col">
            {selectedPrompt ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedPrompt.title || 'Untitled Prompt'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <div className={`px-2 py-1 rounded text-xs ${
                      selectedPrompt.access === 'private' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {selectedPrompt.access === 'private' ? 'Private' : 'Public'}
                    </div>
                    <div className="text-zinc-500 text-xs">
                      ID: {selectedPrompt.id}
                    </div>
                  </div>
                  
                  {extractedVariables.length > 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-4">
                      <h4 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-2">
                        <Wand2 size={16} />
                        <span>Variables Detected</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {extractedVariables.map((variable, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs border border-indigo-500/30"
                          >
                            {`{{${variable}}}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Language & Provider Selection */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Language
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedLanguage('javascript')}
                            className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                              selectedLanguage === 'javascript' 
                                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300' 
                                : 'bg-zinc-800/30 border border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                            }`}
                          >
                            JavaScript
                          </button>
                          <button
                            onClick={() => setSelectedLanguage('python')}
                            className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                              selectedLanguage === 'python' 
                                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300' 
                                : 'bg-zinc-800/30 border border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                            }`}
                          >
                            Python
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Provider
                        </label>
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
                      </div>
                    </div>
                    
                    {/* Advanced Options */}
                    <div className="mb-4">
                      <button
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span>Advanced Options</span>
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {showAdvancedOptions && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
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
                            
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                
                {/* Code Output */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-semibold text-white">
                      {selectedLanguage === 'javascript' ? 'JavaScript/TypeScript' : 'Python'} Code
                    </h4>
                    <button
                      onClick={() => copyToClipboard(
                        selectedLanguage === 'javascript' ? generateJsCode() : generatePythonCode(), 
                        'code'
                      )}
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
                  <div className="bg-zinc-800/50 p-4 rounded-lg">
                    <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                      <code>{selectedLanguage === 'javascript' ? generateJsCode() : generatePythonCode()}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Code size={32} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Select a Prompt
                  </h3>
                  <p className="text-zinc-400 max-w-md">
                    Choose a prompt from your collection to generate API code for integrating it into your applications.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}