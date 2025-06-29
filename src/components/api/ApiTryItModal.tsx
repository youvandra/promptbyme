import React, { useState, useEffect } from 'react'
import { X, Play, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface ApiTryItModalProps {
  isOpen: boolean
  onClose: () => void
  promptId: string
  promptTitle?: string
  variables: string[]
  provider: string
  model: string
}

export const ApiTryItModal: React.FC<ApiTryItModalProps> = ({
  isOpen,
  onClose,
  promptId,
  promptTitle,
  variables,
  provider,
  model
}) => {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [apiKey, setApiKey] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && user) {
      fetchApiKey()
      
      // Initialize variable values
      const initialValues: Record<string, string> = {}
      variables.forEach(variable => {
        initialValues[variable] = ''
      })
      setVariableValues(initialValues)
    }
  }, [isOpen, user, variables])

  const fetchApiKey = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data) {
        setApiKey(data.key)
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
    }
  }

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }))
  }

  const handleRunTest = async () => {
    if (!user || !apiKey) return
    
    setIsRunning(true)
    setResult(null)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt_id: promptId,
          variables: variableValues,
          api_key: apiKey,
          provider,
          model,
          temperature: 0.7,
          max_tokens: 1000
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.output)
      } else {
        setError(data.error || 'Unknown error')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to run test')
    } finally {
      setIsRunning(false)
    }
  }

  const copyToClipboard = async () => {
    if (!result) return
    
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Play className="text-indigo-400" size={20} />
            <h2 className="text-xl font-semibold text-white">
              Try API
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {promptTitle || 'Test Prompt'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Provider: {provider}</span>
              <span>•</span>
              <span>Model: {model}</span>
            </div>
          </div>
          
          {/* Variables */}
          {variables.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-white mb-3">Fill Variables</h4>
              <div className="space-y-3">
                {variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      {`{{${variable}}}`}
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter value for ${variable}`}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* API Key Warning */}
          {!apiKey && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-300 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">API Key Required</p>
                <p>You need to generate an API key before you can run tests.</p>
              </div>
            </div>
          )}
          
          {/* Run Button */}
          <div>
            <button
              onClick={handleRunTest}
              disabled={isRunning || !apiKey}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run Test</span>
                </>
              )}
            </button>
          </div>
          
          {/* Result */}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-emerald-300">Result</h4>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 text-sm whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
              <h4 className="font-medium mb-1">Error</h4>
              <p>{error}</p>
            </div>
          )}
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