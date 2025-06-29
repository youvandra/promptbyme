import React, { useState, useEffect } from 'react'
import { X, Key, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose
}) => {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && user) {
      fetchApiKey()
    }
  }, [isOpen, user])

  const fetchApiKey = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
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

  const generateApiKey = async () => {
    if (!user) return
    
    setRegenerating(true)
    try {
      // Generate a random API key
      const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 32)
      
      // Format it with hyphens for readability
      const formattedKey = `pbm_${key.substring(0, 8)}-${key.substring(8, 16)}-${key.substring(16, 24)}-${key.substring(24, 32)}`
      
      // Check if user already has an API key
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (existingKey) {
        // Update existing key
        await supabase
          .from('api_keys')
          .update({ key: formattedKey })
          .eq('user_id', user.id)
      } else {
        // Create new key
        await supabase
          .from('api_keys')
          .insert([{ user_id: user.id, key: formattedKey }])
      }
      
      setApiKey(formattedKey)
      setShowKey(true)
    } catch (error) {
      console.error('Error generating API key:', error)
    } finally {
      setRegenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!apiKey) return
    
    try {
      await navigator.clipboard.writeText(apiKey)
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
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Key className="text-indigo-400" size={20} />
            <h2 className="text-xl font-semibold text-white">
              API Key
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
        <div className="p-6 space-y-6">
          <p className="text-zinc-300">
            Your API key allows you to programmatically access and run your prompts. Keep this key secure and never share it publicly.
          </p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-zinc-400">Loading API key...</span>
              </div>
            </div>
          ) : (
            <>
              {apiKey ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        readOnly
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      />
                      <div className="absolute right-2 flex items-center gap-2">
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                          title={showKey ? "Hide API key" : "Show API key"}
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                          title="Copy to clipboard"
                        >
                          {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-zinc-500">
                      Last generated: {new Date().toLocaleDateString()}
                    </p>
                    <button
                      onClick={generateApiKey}
                      disabled={regenerating}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {regenerating ? 'Regenerating...' : 'Regenerate key'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 mb-4">You don't have an API key yet.</p>
                  <button
                    onClick={generateApiKey}
                    disabled={regenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 mx-auto"
                  >
                    {regenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Key size={16} />
                        <span>Generate API Key</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
          
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-indigo-300 mb-2">API Usage</h3>
            <p className="text-xs text-zinc-300 mb-2">
              To use this API key, include it in your requests to the promptby.me API.
            </p>
            <div className="bg-zinc-800/50 p-3 rounded-lg overflow-x-auto">
              <pre className="text-xs text-zinc-300 font-mono">
                <code>
{`fetch('https://your-project.supabase.co/functions/v1/run-prompt-api', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_JWT',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt_id: 'your-prompt-uuid',
    variables: { name: 'John' },
    api_key: '${apiKey || 'your-ai-provider-api-key'}',
    provider: 'openai',
    model: 'gpt-4o'
  })
})`}
                </code>
              </pre>
            </div>
          </div>
          
          <p className="text-xs text-zinc-500">
            Note: This API key is for authenticating with AI providers, not with promptby.me. You still need to authenticate with Supabase to access your prompts.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
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