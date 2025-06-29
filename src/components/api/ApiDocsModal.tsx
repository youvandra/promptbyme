import React, { useState } from 'react'
import { X, Copy, CheckCircle, Code, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { marked } from 'marked'

interface ApiDocsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['authentication', 'run-prompt']))
  const [copied, setCopied] = useState<string | null>(null)
  
  const { user } = useAuthStore()

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
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
              API Documentation
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Introduction */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Introduction</h3>
              <p className="text-zinc-300">
                The promptby.me API allows you to programmatically access and run your prompts. This documentation provides information on how to use the API endpoints.
              </p>
            </div>
            
            {/* Authentication Section */}
            <div className="border border-zinc-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('authentication')}
                className="w-full flex items-center justify-between p-4 text-left bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">Authentication</h3>
                {expandedSections.has('authentication') ? (
                  <ChevronDown size={20} className="text-zinc-400" />
                ) : (
                  <ChevronRight size={20} className="text-zinc-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.has('authentication') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-zinc-800/50">
                      <p className="text-zinc-300 mb-4">
                        All API requests require authentication. You can use either a Supabase JWT token or a promptby.me API key in the <code className="bg-zinc-800 px-1 py-0.5 rounded text-indigo-300">Authorization</code> header of your requests.
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Option 1: Supabase JWT Token</span>
                          <button
                            onClick={() => copyToClipboard('Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN', 'auth-header-jwt')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'auth-header-jwt' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono">
                          <code>Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN</code>
                        </pre>
                      </div>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Option 2: promptby.me API Key</span>
                          <button
                            onClick={() => copyToClipboard('Authorization: Bearer YOUR_PROMPTBY_ME_API_KEY', 'auth-header-api')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'auth-header-api' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono">
                          <code>Authorization: Bearer YOUR_PROMPTBY_ME_API_KEY</code>
                        </pre>
                      </div>
                      
                      <p className="text-zinc-300 mb-2">
                        To obtain a JWT token, you need to authenticate with Supabase using your application's authentication flow. Alternatively, you can generate a promptby.me API key in your account settings.
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">JavaScript Example (JWT Token)</span>
                          <button
                            onClick={() => copyToClipboard(`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Sign in and get the JWT token
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// The JWT token is in data.session.access_token
const jwtToken = data.session.access_token`, 'auth-example')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'auth-example' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Sign in and get the JWT token
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// The JWT token is in data.session.access_token
const jwtToken = data.session.access_token`}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Run Prompt Endpoint */}
            <div className="border border-zinc-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('run-prompt')}
                className="w-full flex items-center justify-between p-4 text-left bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">Run Prompt API</h3>
                {expandedSections.has('run-prompt') ? (
                  <ChevronDown size={20} className="text-zinc-400" />
                ) : (
                  <ChevronRight size={20} className="text-zinc-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.has('run-prompt') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-zinc-800/50">
                      <p className="text-zinc-300 mb-4">
                        This endpoint allows you to execute a prompt with optional variable substitution.
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Endpoint</span>
                          <button
                            onClick={() => copyToClipboard(`POST ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api`, 'endpoint')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'endpoint' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono">
                          <code>POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api</code>
                        </pre>
                      </div>
                      
                      <h4 className="text-md font-semibold text-white mb-2">Request Body</h4>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">JSON</span>
                          <button
                            onClick={() => copyToClipboard(`{
  "prompt_id": "uuid-of-your-prompt",
  "variables": {
    "variable_name_1": "value_1",
    "variable_name_2": "value_2"
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}`, 'request-body')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'request-body' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`{
  "prompt_id": "uuid-of-your-prompt",
  "variables": {
    "variable_name_1": "value_1",
    "variable_name_2": "value_2"
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}`}</code>
                        </pre>
                      </div>
                      
                      <h4 className="text-md font-semibold text-white mb-2">Parameters</h4>
                      
                      <table className="w-full text-sm text-left text-zinc-300 mb-4">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                          <tr>
                            <th scope="col" className="px-4 py-3">Parameter</th>
                            <th scope="col" className="px-4 py-3">Type</th>
                            <th scope="col" className="px-4 py-3">Required</th>
                            <th scope="col" className="px-4 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-800">
                            <td className="px-4 py-3 font-medium">prompt_id</td>
                            <td className="px-4 py-3">string</td>
                            <td className="px-4 py-3">Yes</td>
                            <td className="px-4 py-3">The UUID of the prompt to run</td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="px-4 py-3 font-medium">variables</td>
                            <td className="px-4 py-3">object</td>
                            <td className="px-4 py-3">No</td>
                            <td className="px-4 py-3">Key-value pairs for variable substitution in the prompt</td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="px-4 py-3 font-medium">api_key</td>
                            <td className="px-4 py-3">string</td>
                            <td className="px-4 py-3">Yes</td>
                            <td className="px-4 py-3">Your API key for the AI provider</td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="px-4 py-3 font-medium">provider</td>
                            <td className="px-4 py-3">string</td>
                            <td className="px-4 py-3">No</td>
                            <td className="px-4 py-3">AI provider to use (default: "groq"). Options: "openai", "anthropic", "google", "llama", "groq"</td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="px-4 py-3 font-medium">model</td>
                            <td className="px-4 py-3">string</td>
                            <td className="px-4 py-3">No</td>
                            <td className="px-4 py-3">The model to use (default: "llama3-8b-8192")</td>
                          </tr>
                          <tr className="border-b border-zinc-800">
                            <td className="px-4 py-3 font-medium">temperature</td>
                            <td className="px-4 py-3">number</td>
                            <td className="px-4 py-3">No</td>
                            <td className="px-4 py-3">Controls randomness (0-2, default: 0.7)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">max_tokens</td>
                            <td className="px-4 py-3">number</td>
                            <td className="px-4 py-3">No</td>
                            <td className="px-4 py-3">Maximum tokens in the response (default: 1000)</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <h4 className="text-md font-semibold text-white mb-2">Response</h4>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Success (200 OK)</span>
                          <button
                            onClick={() => copyToClipboard(`{
  "success": true,
  "output": "The AI generated response.",
  "prompt": {
    "id": "uuid-of-your-prompt",
    "title": "Prompt Title",
    "processed_content": "The prompt content with variables filled in."
  }
}`, 'success-response')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'success-response' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`{
  "success": true,
  "output": "The AI generated response.",
  "prompt": {
    "id": "uuid-of-your-prompt",
    "title": "Prompt Title",
    "processed_content": "The prompt content with variables filled in."
  }
}`}</code>
                        </pre>
                      </div>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Error (4xx/5xx)</span>
                          <button
                            onClick={() => copyToClipboard(`{
  "success": false,
  "error": "Error message details."
}`, 'error-response')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'error-response' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Error message details."
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Usage Example */}
            <div className="border border-zinc-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('usage-example')}
                className="w-full flex items-center justify-between p-4 text-left bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">Usage Example</h3>
                {expandedSections.has('usage-example') ? (
                  <ChevronDown size={20} className="text-zinc-400" />
                ) : (
                  <ChevronRight size={20} className="text-zinc-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.has('usage-example') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-zinc-800/50">
                      <h4 className="text-md font-semibold text-white mb-2">JavaScript/TypeScript with JWT</h4>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Example</span>
                          <button
                            onClick={() => copyToClipboard(`async function runPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${supabaseAccessToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt_id: 'your-prompt-uuid',
      variables: {
        name: 'John',
        company: 'Acme Inc.'
      },
      api_key: 'your-ai-provider-api-key',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}`, 'js-example-jwt')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'js-example-jwt' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`async function runPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${supabaseAccessToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt_id: 'your-prompt-uuid',
      variables: {
        name: 'John',
        company: 'Acme Inc.'
      },
      api_key: 'your-ai-provider-api-key',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}`}</code>
                        </pre>
                      </div>
                      
                      <h4 className="text-md font-semibold text-white mb-2">JavaScript/TypeScript with API Key</h4>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Example</span>
                          <button
                            onClick={() => copyToClipboard(`async function runPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-promptby-me-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt_id: 'your-prompt-uuid',
      variables: {
        name: 'John',
        company: 'Acme Inc.'
      },
      api_key: 'your-ai-provider-api-key',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}`, 'js-example-api')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'js-example-api' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`async function runPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-promptby-me-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt_id: 'your-prompt-uuid',
      variables: {
        name: 'John',
        company: 'Acme Inc.'
      },
      api_key: 'your-ai-provider-api-key',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}`}</code>
                        </pre>
                      </div>
                      
                      <h4 className="text-md font-semibold text-white mb-2">Python</h4>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Example</span>
                          <button
                            onClick={() => copyToClipboard(`import requests
import json

def run_prompt():
    url = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api'
    
    headers = {
        'Authorization': 'Bearer your-promptby-me-api-key',  # Or use JWT token
        'Content-Type': 'application/json'
    }
    
    payload = {
        'prompt_id': 'your-prompt-uuid',
        'variables': {
            'name': 'John',
            'company': 'Acme Inc.'
        },
        'api_key': 'your-ai-provider-api-key',
        'provider': 'anthropic',
        'model': 'claude-3-opus-20240229',
        'temperature': 0.5
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get('success'):
        print('AI Response:', data['output'])
    else:
        print('Error:', data.get('error'))`, 'python-example')}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied === 'python-example' ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                          <code>{`import requests
import json

def run_prompt():
    url = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api'
    
    headers = {
        'Authorization': 'Bearer your-promptby-me-api-key',  # Or use JWT token
        'Content-Type': 'application/json'
    }
    
    payload = {
        'prompt_id': 'your-prompt-uuid',
        'variables': {
            'name': 'John',
            'company': 'Acme Inc.'
        },
        'api_key': 'your-ai-provider-api-key',
        'provider': 'anthropic',
        'model': 'claude-3-opus-20240229',
        'temperature': 0.5
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get('success'):
        print('AI Response:', data['output'])
    else:
        print('Error:', data.get('error'))
`}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Security Considerations */}
            <div className="border border-zinc-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('security')}
                className="w-full flex items-center justify-between p-4 text-left bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">Security Considerations</h3>
                {expandedSections.has('security') ? (
                  <ChevronDown size={20} className="text-zinc-400" />
                ) : (
                  <ChevronRight size={20} className="text-zinc-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.has('security') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-zinc-800/50">
                      <ul className="list-disc list-inside space-y-2 text-zinc-300">
                        <li>
                          <strong className="text-white">API Keys:</strong> Never expose your AI provider API keys or promptby.me API keys in client-side code. Always use the API from a secure backend environment.
                        </li>
                        <li>
                          <strong className="text-white">JWT Tokens:</strong> Protect your Supabase JWT tokens and ensure they have appropriate expiration times.
                        </li>
                        <li>
                          <strong className="text-white">Rate Limiting:</strong> Be aware that this API may be subject to rate limiting both from promptby.me and from the underlying AI providers.
                        </li>
                        <li>
                          <strong className="text-white">Prompt Access:</strong> Users can only access prompts they own or prompts that are marked as public.
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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