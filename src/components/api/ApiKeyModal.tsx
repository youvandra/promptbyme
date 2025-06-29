import React, { useState, useEffect } from 'react'
import { X, Key, Copy, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
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
  const [aiProviderKey, setAiProviderKey] = useState<string | null>(null)
  const [pbmApiKey, setPbmApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAiKey, setShowAiKey] = useState(false)
  const [showPbmKey, setShowPbmKey] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [regeneratingAiKey, setRegeneratingAiKey] = useState(false)
  const [regeneratingPbmKey, setRegeneratingPbmKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'pbm'>('ai')
  
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && user) {
      fetchApiKeys()
    }
  }, [isOpen, user])

  const fetchApiKeys = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Fetch AI provider key
      const { data: aiKeyData, error: aiKeyError } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .eq('key_type', 'ai_provider_key')
        .maybeSingle()

      if (!aiKeyError && aiKeyData) {
        setAiProviderKey(aiKeyData.key)
      } else {
        setAiProviderKey(null)
      }
      
      // Fetch promptby.me API key
      const { data: pbmKeyData, error: pbmKeyError } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .eq('key_type', 'pbm_api_key')
        .maybeSingle()

      if (!pbmKeyError && pbmKeyData) {
        setPbmApiKey(pbmKeyData.key)
      } else {
        setPbmApiKey(null)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async (keyType: 'ai_provider_key' | 'pbm_api_key') => {
    if (!user) return
    
    const isAiKey = keyType === 'ai_provider_key'
    
    if (isAiKey) {
      setRegeneratingAiKey(true)
    } else {
      setRegeneratingPbmKey(true)
    }
    
    try {
      // Generate a random API key
      const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 32)
      
      // Format it with hyphens for readability
      const prefix = isAiKey ? 'ai_' : 'pbm_'
      const formattedKey = `${prefix}${key.substring(0, 8)}-${key.substring(8, 16)}-${key.substring(16, 24)}-${key.substring(24, 32)}`
      
      // Check if user already has this type of API key
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('key_type', keyType)
        .maybeSingle()
      
      if (existingKey) {
        // Update existing key
        await supabase
          .from('api_keys')
          .update({ key: formattedKey })
          .eq('id', existingKey.id)
      } else {
        // Create new key
        await supabase
          .from('api_keys')
          .insert([{ 
            user_id: user.id, 
            key: formattedKey,
            key_type: keyType
          }])
      }
      
      if (isAiKey) {
        setAiProviderKey(formattedKey)
        setShowAiKey(true)
      } else {
        setPbmApiKey(formattedKey)
        setShowPbmKey(true)
      }
    } catch (error) {
      console.error(`Error generating ${isAiKey ? 'AI provider' : 'promptby.me'} API key:`, error)
    } finally {
      if (isAiKey) {
        setRegeneratingAiKey(false)
      } else {
        setRegeneratingPbmKey(false)
      }
    }
  }

  const copyToClipboard = async (text: string, keyType: string) => {
    if (!text) return
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(keyType)
      setTimeout(() => setCopied(null), 2000)
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
        {/* Header with Tabs */}
        <div className="flex flex-col border-b border-zinc-800/50">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Key className="text-indigo-400" size={20} />
              <h2 className="text-xl font-semibold text-white">
                API Keys
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-zinc-800/50">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              AI Provider Key
            </button>
            <button
              onClick={() => setActiveTab('pbm')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'pbm'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              promptby.me API Key
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'ai' ? (
            <>
              <p className="text-zinc-300">
                Your AI provider API key is used to authenticate with external AI services like OpenAI, Anthropic, or Groq. This key is required when running prompts through the API.
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
                  {aiProviderKey ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="flex items-center">
                          <input
                            type={showAiKey ? "text" : "password"}
                            value={aiProviderKey}
                            readOnly
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          />
                          <div className="absolute right-2 flex items-center gap-2">
                            <button
                              onClick={() => setShowAiKey(!showAiKey)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                              title={showAiKey ? "Hide API key" : "Show API key"}
                            >
                              {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(aiProviderKey, 'ai')}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                              title="Copy to clipboard"
                            >
                              {copied === 'ai' ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-zinc-500">
                          Last generated: {new Date().toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => generateApiKey('ai_provider_key')}
                          disabled={regeneratingAiKey}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {regeneratingAiKey ? 'Regenerating...' : 'Regenerate key'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-zinc-400 mb-4">You don't have an AI provider API key yet.</p>
                      <button
                        onClick={() => generateApiKey('ai_provider_key')}
                        disabled={regeneratingAiKey}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 mx-auto"
                      >
                        {regeneratingAiKey ? (
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
                <h3 className="text-sm font-medium text-indigo-300 mb-2">Usage</h3>
                <p className="text-xs text-zinc-300 mb-2">
                  This key is used to authenticate with external AI providers when making API calls.
                </p>
                <div className="bg-zinc-800/50 p-3 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono">
                    <code>
{`// Include this key in your API requests
{
  "api_key": "${aiProviderKey || 'your-ai-provider-api-key'}"
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-zinc-300">
                Your promptby.me API key allows you to authenticate with the promptby.me API directly. Use this key instead of a Supabase JWT token for simpler API integration.
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
                  {pbmApiKey ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="flex items-center">
                          <input
                            type={showPbmKey ? "text" : "password"}
                            value={pbmApiKey}
                            readOnly
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          />
                          <div className="absolute right-2 flex items-center gap-2">
                            <button
                              onClick={() => setShowPbmKey(!showPbmKey)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                              title={showPbmKey ? "Hide API key" : "Show API key"}
                            >
                              {showPbmKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(pbmApiKey, 'pbm')}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                              title="Copy to clipboard"
                            >
                              {copied === 'pbm' ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-zinc-500">
                          Last generated: {new Date().toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => generateApiKey('pbm_api_key')}
                          disabled={regeneratingPbmKey}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {regeneratingPbmKey ? 'Regenerating...' : 'Regenerate key'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-zinc-400 mb-4">You don't have a promptby.me API key yet.</p>
                      <button
                        onClick={() => generateApiKey('pbm_api_key')}
                        disabled={regeneratingPbmKey}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 mx-auto"
                      >
                        {regeneratingPbmKey ? (
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
                <h3 className="text-sm font-medium text-indigo-300 mb-2">Usage</h3>
                <p className="text-xs text-zinc-300 mb-2">
                  Use this key in the Authorization header instead of a Supabase JWT token.
                </p>
                <div className="bg-zinc-800/50 p-3 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono">
                    <code>
{`// Include this key in your Authorization header
fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
  headers: {
    'Authorization': 'Bearer ${pbmApiKey || 'your-promptby-me-api-key'}',
    'Content-Type': 'application/json'
  },
  // ...
})`}
                    </code>
                  </pre>
                </div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <p className="font-medium mb-1">Security Note</p>
                  <p>This API key grants access to your prompts. Keep it secure and never expose it in client-side code. Use it only in secure server environments.</p>
                </div>
              </div>
            </>
          )}
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