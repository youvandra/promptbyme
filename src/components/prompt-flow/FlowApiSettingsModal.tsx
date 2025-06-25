import React, { useState, useEffect } from 'react'
import { X, Save, Key, Thermometer, Zap, Server, Bot, MessageSquare, Sparkles, Brain, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSecureStorage } from '../../hooks/useSecureStorage'

interface ApiSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'llama' | 'groq'
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

interface FlowApiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: any
  onSave: (settings: any) => Promise<void> | void
}

export const FlowApiSettingsModal: React.FC<FlowApiSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [provider, setProvider] = useState<ApiSettings['provider']>(settings.provider)
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [model, setModel] = useState(settings.model)
  const [temperature, setTemperature] = useState(settings.temperature)
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens)
  const [saving, setSaving] = useState(false)
  
  const { setSecureItem } = useSecureStorage()

  // Update local state when settings prop changes
  useEffect(() => {
    setProvider(settings.provider)
    setApiKey(settings.apiKey)
    setModel(settings.model)
    setTemperature(settings.temperature)
    setMaxTokens(settings.maxTokens)
  }, [settings])

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    const savePromise = onSave({
      provider,
      apiKey: apiKey.trim(),
      model,
      temperature,
      maxTokens
    })
    
    // Handle both sync and async onSave
    if (savePromise && typeof savePromise.then === 'function') {
      savePromise.then(() => {
        onClose()
      }).catch(error => {
        console.error('Failed to save settings:', error)
        setError('Failed to save settings')
      })
    } else {
      onClose()
    }
  }

  // Get available models based on provider
  const getModels = () => {
    switch (provider) {
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

  // Get provider icon
  const getProviderIcon = () => {
    switch (provider) {
      case 'openai':
        return <MessageSquare size={20} className="text-green-400" />
      case 'anthropic':
        return <Bot size={20} className="text-purple-400" />
      case 'google':
        return <Sparkles size={20} className="text-blue-400" />
      case 'llama':
        return <Brain size={20} className="text-amber-400" />
      case 'groq':
        return <Cpu size={20} className="text-emerald-400" />
      default:
        return <Server size={20} className="text-indigo-400" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Server className="text-indigo-400" size={20} />
            <h2 className="text-xl font-semibold text-white">
              API Settings
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
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              API Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setProvider('openai')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                  provider === 'openai' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                    : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <MessageSquare size={20} />
                <span className="text-sm font-medium">OpenAI</span>
              </button>
              
              <button
                onClick={() => setProvider('anthropic')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                  provider === 'anthropic' 
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                    : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <Bot size={20} />
                <span className="text-sm font-medium">Anthropic</span>
              </button>
              
              <button
                onClick={() => setProvider('google')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                  provider === 'google' 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                    : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <Sparkles size={20} />
                <span className="text-sm font-medium">Google</span>
              </button>
              
              <button
                onClick={() => setProvider('llama')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                  provider === 'llama' 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                    : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <Brain size={20} />
                <span className="text-sm font-medium">Llama</span>
              </button>
              
              <button
                onClick={() => setProvider('groq')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                  provider === 'groq' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <Cpu size={20} />
                <span className="text-sm font-medium">Groq</span>
              </button>
            </div>
          </div>
          
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <Key size={16} className="text-indigo-400" />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider} API key`}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Your API key is stored securely and never shared
            </p>
          </div>
          
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" />
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            >
              {getModels().map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          
          {/* Temperature */}
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
          
          {/* Max Tokens */}
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
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}