import React, { useState } from 'react'
import { X, Copy, CheckCircle, Code, ChevronDown, ChevronRight, Book, Server, ArrowRight, Search, Filter, Globe, Play } from 'lucide-react'
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['introduction', 'authentication', 'run-prompt', 'run-flow']))
  const [copied, setCopied] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'reference' | 'guides'>('reference')
  
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

  // Filter sections based on search query
  const filterSections = (content: JSX.Element) => {
    if (!searchQuery) return true
    
    // Convert JSX to string for searching
    const contentString = JSON.stringify(content)
    return contentString.toLowerCase().includes(searchQuery.toLowerCase())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Book className="text-indigo-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">
                API Documentation
              </h2>
              <p className="text-sm text-zinc-400">
                Complete reference for the promptby.me API
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
              onClick={() => setActiveTab('reference')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'reference'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'guides'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Guides & Tutorials
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-zinc-800/50 overflow-y-auto p-4 flex-shrink-0">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200"
                />
              </div>
            </div>
            
            {activeTab === 'reference' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Getting Started</h3>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection('introduction')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('introduction') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Introduction</span>
                      {expandedSections.has('introduction') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('authentication')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('authentication') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Authentication</span>
                      {expandedSections.has('authentication') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Endpoints</h3>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection('run-prompt')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('run-prompt') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="px-1.5 py-0.5 text-xs rounded font-mono bg-blue-500/20 text-blue-400">POST</div>
                        <span>Run Prompt</span>
                      </div>
                      {expandedSections.has('run-prompt') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('run-flow')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('run-flow') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="px-1.5 py-0.5 text-xs rounded font-mono bg-blue-500/20 text-blue-400">POST</div>
                        <span>Run Flow</span>
                      </div>
                      {expandedSections.has('run-flow') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Guides</h3>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection('error-handling')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('error-handling') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Error Handling</span>
                      {expandedSections.has('error-handling') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('rate-limits')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('rate-limits') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Rate Limits</span>
                      {expandedSections.has('rate-limits') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('security')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('security') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Security Best Practices</span>
                      {expandedSections.has('security') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'guides' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tutorials</h3>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection('quickstart')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('quickstart') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Quickstart Guide</span>
                      {expandedSections.has('quickstart') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('variables')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('variables') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Working with Variables</span>
                      {expandedSections.has('variables') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('flows')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('flows') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Building Multi-Step Flows</span>
                      {expandedSections.has('flows') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Use Cases</h3>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection('web-integration')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('web-integration') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Web Application Integration</span>
                      {expandedSections.has('web-integration') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('backend-integration')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('backend-integration') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Backend Service Integration</span>
                      {expandedSections.has('backend-integration') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <button
                      onClick={() => toggleSection('mobile-integration')}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        expandedSections.has('mobile-integration') ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>Mobile App Integration</span>
                      {expandedSections.has('mobile-integration') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'reference' && (
              <div className="space-y-8">
                {/* Introduction Section */}
                {expandedSections.has('introduction') && filterSections(
                  <div id="introduction" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        The promptby.me API allows you to programmatically access and run your prompts and flows. 
                        This documentation provides information on how to use the API endpoints, authenticate requests, 
                        and handle responses.
                      </p>
                      <p>
                        With the promptby.me API, you can:
                      </p>
                      <ul>
                        <li>Run individual prompts with variable substitution</li>
                        <li>Execute multi-step prompt flows</li>
                        <li>Integrate AI capabilities into your applications</li>
                        <li>Automate prompt execution workflows</li>
                      </ul>
                      <p>
                        The API is organized around REST principles, uses JSON for request and response bodies, 
                        and relies on standard HTTP response codes to indicate success or failure.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Authentication Section */}
                {expandedSections.has('authentication') && filterSections(
                  <div id="authentication" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        The promptby.me API uses API keys for authentication. All API requests must include your API key in the Authorization header.
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono">
                          <code>Authorization: Bearer {apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`Authorization: Bearer ${apiKey || 'YOUR_PROMPTBY_ME_API_KEY'}`, 'auth-header-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'auth-header-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Obtaining an API Key</h3>
                      <p>
                        You can generate a promptby.me API key from your account settings. Each API key is tied to your account and has access to all your prompts and flows.
                      </p>
                      
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                        <h4 className="text-amber-400 font-medium mb-2">Security Notice</h4>
                        <p className="text-amber-300 text-sm">
                          Keep your API keys secure and never expose them in client-side code. Always make API calls from a secure backend environment.
                        </p>
                      </div>
                      
                      <h3>API Key Management</h3>
                      <p>
                        You can manage your API keys by:
                      </p>
                      <ul>
                        <li>Generating new keys when needed</li>
                        <li>Regenerating keys if they've been compromised</li>
                        <li>Using different keys for different environments (development, production)</li>
                      </ul>
                      
                      <button
                        onClick={() => setShowApiKeyModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 mt-2"
                      >
                        <Key size={16} />
                        <span>{apiKey ? 'Manage API Key' : 'Generate API Key'}</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Run Prompt Endpoint */}
                {expandedSections.has('run-prompt') && filterSections(
                  <div id="run-prompt" className="scroll-mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-2 py-1 text-xs rounded font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">POST</div>
                      <h2 className="text-2xl font-bold text-white">Run Prompt API</h2>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p>
                        This endpoint allows you to execute a prompt with optional variable substitution and get an AI-generated response.
                      </p>
                      
                      <h3>Endpoint URL</h3>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono">
                          <code>{import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/run-prompt-api</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/run-prompt-api`, 'prompt-endpoint-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'prompt-endpoint-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Request Parameters</h3>
                      <table className="border-collapse w-full">
                        <thead>
                          <tr>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Parameter</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Type</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Required</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">prompt_id</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-emerald-400">Yes</td>
                            <td className="border border-zinc-700 p-2">The UUID of the prompt to run</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">variables</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">object</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">Key-value pairs for variable substitution in the prompt</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">api_key</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-emerald-400">Yes</td>
                            <td className="border border-zinc-700 p-2">Your API key for the AI provider</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">provider</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">AI provider to use (default: "groq"). Options: "openai", "anthropic", "google", "llama", "groq"</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">model</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">The model to use (default: "llama3-8b-8192")</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">temperature</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">number</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">Controls randomness (0-2, default: 0.7)</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">max_tokens</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">number</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">Maximum tokens in the response (default: 1000)</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <h3>Example Request</h3>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "prompt_id": "uuid-of-your-prompt",
  "variables": {
    "name": "John",
    "company": "Acme Inc."
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}`}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`{
  "prompt_id": "uuid-of-your-prompt",
  "variables": {
    "name": "John",
    "company": "Acme Inc."
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}`, 'prompt-request-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'prompt-request-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Response</h3>
                      <p>Success (200 OK):</p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
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
                        <button
                          onClick={() => copyToClipboard(`{
  "success": true,
  "output": "The AI generated response.",
  "prompt": {
    "id": "uuid-of-your-prompt",
    "title": "Prompt Title",
    "processed_content": "The prompt content with variables filled in."
  }
}`, 'prompt-response-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'prompt-response-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <p>Error (4xx/5xx):</p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Error message details."
}`}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`{
  "success": false,
  "error": "Error message details."
}`, 'prompt-error-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'prompt-error-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Code Examples</h3>
                      <div className="bg-zinc-800/50 rounded-lg my-4 overflow-hidden">
                        <div className="flex border-b border-zinc-700">
                          <button
                            onClick={() => setSelectedLanguage('javascript')}
                            className={`px-4 py-2 text-sm font-medium ${
                              selectedLanguage === 'javascript'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            JavaScript
                          </button>
                          <button
                            onClick={() => setSelectedLanguage('python')}
                            className={`px-4 py-2 text-sm font-medium ${
                              selectedLanguage === 'python'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            Python
                          </button>
                          <button
                            onClick={() => setSelectedLanguage('curl')}
                            className={`px-4 py-2 text-sm font-medium ${
                              selectedLanguage === 'curl'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            cURL
                          </button>
                        </div>
                        <div className="p-4 relative">
                          {selectedLanguage === 'javascript' && (
                            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                              <code>{`async function runPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
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
                          )}
                          
                          {selectedLanguage === 'python' && (
                            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                              <code>{`import requests
import json

def run_prompt():
    url = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api'
    
    headers = {
        'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
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
                          )}
                          
                          {selectedLanguage === 'curl' && (
                            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                              <code>{`curl -X POST '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api' \\
  -H 'Authorization: Bearer ${apiKey || 'your-promptby-me-api-key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "prompt_id": "your-prompt-uuid",
    "variables": {
      "name": "John",
      "company": "Acme Inc."
    },
    "api_key": "your-ai-provider-api-key",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`}</code>
                            </pre>
                          )}
                          
                          <button
                            onClick={() => {
                              let codeToClipboard = ''
                              if (selectedLanguage === 'javascript') {
                                codeToClipboard = `async function runPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
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
}`
                              } else if (selectedLanguage === 'python') {
                                codeToClipboard = `import requests
import json

def run_prompt():
    url = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api'
    
    headers = {
        'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
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
`
                              } else {
                                codeToClipboard = `curl -X POST '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api' \\
  -H 'Authorization: Bearer ${apiKey || 'your-promptby-me-api-key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "prompt_id": "your-prompt-uuid",
    "variables": {
      "name": "John",
      "company": "Acme Inc."
    },
    "api_key": "your-ai-provider-api-key",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`
                              }
                              copyToClipboard(codeToClipboard, 'prompt-code-copy')
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                          >
                            {copied === 'prompt-code-copy' ? (
                              <CheckCircle size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} className="text-zinc-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <h3>Try It Out</h3>
                      <p>
                        To try this endpoint, you'll need:
                      </p>
                      <ul>
                        <li>Your promptby.me API key</li>
                        <li>A prompt ID from your account</li>
                        <li>An AI provider API key</li>
                      </ul>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => handleOpenCodeGenerator('prompt')}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Code size={16} />
                          <span>Generate Prompt API Code</span>
                        </button>
                        
                        <button
                          onClick={() => setShowApiKeyModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Key size={16} />
                          <span>{apiKey ? 'Manage API Key' : 'Generate API Key'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Run Flow Endpoint */}
                {expandedSections.has('run-flow') && filterSections(
                  <div id="run-flow" className="scroll-mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-2 py-1 text-xs rounded font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">POST</div>
                      <h2 className="text-2xl font-bold text-white">Run Flow API</h2>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p>
                        This endpoint allows you to execute a complete prompt flow with optional variable substitution and get results from each step.
                      </p>
                      
                      <h3>Endpoint URL</h3>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono">
                          <code>{import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/run-prompt-flow-api</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/run-prompt-flow-api`, 'flow-endpoint-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'flow-endpoint-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Request Parameters</h3>
                      <table className="border-collapse w-full">
                        <thead>
                          <tr>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Parameter</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Type</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Required</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">flow_id</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-emerald-400">Yes</td>
                            <td className="border border-zinc-700 p-2">The UUID of the flow to run</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">variables</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">object</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">Key-value pairs for variable substitution across all steps in the flow</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">api_key</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-emerald-400">Yes</td>
                            <td className="border border-zinc-700 p-2">Your API key for the AI provider</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">provider</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">AI provider to use (default: "groq"). Options: "openai", "anthropic", "google", "llama", "groq"</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">model</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">string</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">The model to use (default: "llama3-8b-8192")</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">temperature</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">number</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">Controls randomness (0-2, default: 0.7)</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">max_tokens</td>
                            <td className="border border-zinc-700 p-2 font-mono text-xs">number</td>
                            <td className="border border-zinc-700 p-2 text-zinc-500">No</td>
                            <td className="border border-zinc-700 p-2">Maximum tokens in the response (default: 1000)</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <h3>Example Request</h3>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "flow_id": "uuid-of-your-flow",
  "variables": {
    "name": "John",
    "company": "Acme Inc."
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}`}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`{
  "flow_id": "uuid-of-your-flow",
  "variables": {
    "name": "John",
    "company": "Acme Inc."
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}`, 'flow-request-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'flow-request-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Response</h3>
                      <p>Success (200 OK):</p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": true,
  "output": "The final AI generated response from the last step.",
  "step_outputs": {
    "step-id-1": "Output from step 1",
    "step-id-2": "Output from step 2",
    "step-id-3": "Output from step 3"
  },
  "flow": {
    "id": "uuid-of-your-flow",
    "name": "Flow Name",
    "steps": [
      {
        "id": "step-id-1",
        "title": "Step 1 Title",
        "order_index": 0
      },
      {
        "id": "step-id-2",
        "title": "Step 2 Title",
        "order_index": 1
      },
      {
        "id": "step-id-3",
        "title": "Step 3 Title",
        "order_index": 2
      }
    ]
  }
}`}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`{
  "success": true,
  "output": "The final AI generated response from the last step.",
  "step_outputs": {
    "step-id-1": "Output from step 1",
    "step-id-2": "Output from step 2",
    "step-id-3": "Output from step 3"
  },
  "flow": {
    "id": "uuid-of-your-flow",
    "name": "Flow Name",
    "steps": [
      {
        "id": "step-id-1",
        "title": "Step 1 Title",
        "order_index": 0
      },
      {
        "id": "step-id-2",
        "title": "Step 2 Title",
        "order_index": 1
      },
      {
        "id": "step-id-3",
        "title": "Step 3 Title",
        "order_index": 2
      }
    ]
  }
}`, 'flow-response-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'flow-response-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <p>Error (4xx/5xx):</p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4 relative">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Error message details."
}`}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`{
  "success": false,
  "error": "Error message details."
}`, 'flow-error-copy')}
                          className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied === 'flow-error-copy' ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                      
                      <h3>Code Examples</h3>
                      <div className="bg-zinc-800/50 rounded-lg my-4 overflow-hidden">
                        <div className="flex border-b border-zinc-700">
                          <button
                            onClick={() => setSelectedLanguage('javascript')}
                            className={`px-4 py-2 text-sm font-medium ${
                              selectedLanguage === 'javascript'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            JavaScript
                          </button>
                          <button
                            onClick={() => setSelectedLanguage('python')}
                            className={`px-4 py-2 text-sm font-medium ${
                              selectedLanguage === 'python'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            Python
                          </button>
                          <button
                            onClick={() => setSelectedLanguage('curl')}
                            className={`px-4 py-2 text-sm font-medium ${
                              selectedLanguage === 'curl'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            cURL
                          </button>
                        </div>
                        <div className="p-4 relative">
                          {selectedLanguage === 'javascript' && (
                            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                              <code>{`async function runFlow() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      flow_id: 'your-flow-uuid',
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
    console.log('Final Output:', data.output);
    console.log('All Step Outputs:', data.step_outputs);
  } else {
    console.error('Error:', data.error);
  }
}`}</code>
                            </pre>
                          )}
                          
                          {selectedLanguage === 'python' && (
                            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                              <code>{`import requests
import json

def run_flow():
    url = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api'
    
    headers = {
        'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'flow_id': 'your-flow-uuid',
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
        print('Final Output:', data['output'])
        print('All Step Outputs:', data['step_outputs'])
    else:
        print('Error:', data.get('error'))
`}</code>
                            </pre>
                          )}
                          
                          {selectedLanguage === 'curl' && (
                            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                              <code>{`curl -X POST '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api' \\
  -H 'Authorization: Bearer ${apiKey || 'your-promptby-me-api-key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "flow_id": "your-flow-uuid",
    "variables": {
      "name": "John",
      "company": "Acme Inc."
    },
    "api_key": "your-ai-provider-api-key",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`}</code>
                            </pre>
                          )}
                          
                          <button
                            onClick={() => {
                              let codeToClipboard = ''
                              if (selectedLanguage === 'javascript') {
                                codeToClipboard = `async function runFlow() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      flow_id: 'your-flow-uuid',
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
    console.log('Final Output:', data.output);
    console.log('All Step Outputs:', data.step_outputs);
  } else {
    console.error('Error:', data.error);
  }
}`
                              } else if (selectedLanguage === 'python') {
                                codeToClipboard = `import requests
import json

def run_flow():
    url = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api'
    
    headers = {
        'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'flow_id': 'your-flow-uuid',
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
        print('Final Output:', data['output'])
        print('All Step Outputs:', data['step_outputs'])
    else:
        print('Error:', data.get('error'))
`
                              } else {
                                codeToClipboard = `curl -X POST '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api' \\
  -H 'Authorization: Bearer ${apiKey || 'your-promptby-me-api-key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "flow_id": "your-flow-uuid",
    "variables": {
      "name": "John",
      "company": "Acme Inc."
    },
    "api_key": "your-ai-provider-api-key",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`
                              }
                              copyToClipboard(codeToClipboard, 'flow-code-copy')
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded transition-colors"
                          >
                            {copied === 'flow-code-copy' ? (
                              <CheckCircle size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} className="text-zinc-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <h3>Try It Out</h3>
                      <p>
                        To try this endpoint, you'll need:
                      </p>
                      <ul>
                        <li>Your promptby.me API key</li>
                        <li>A flow ID from your account</li>
                        <li>An AI provider API key</li>
                      </ul>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => handleOpenCodeGenerator('flow')}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Code size={16} />
                          <span>Generate Flow API Code</span>
                        </button>
                        
                        <button
                          onClick={() => setShowApiKeyModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all duration-200"
                        >
                          <Key size={16} />
                          <span>{apiKey ? 'Manage API Key' : 'Generate API Key'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Error Handling Section */}
                {expandedSections.has('error-handling') && filterSections(
                  <div id="error-handling" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Error Handling</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        The promptby.me API uses conventional HTTP response codes to indicate the success or failure of an API request.
                        In general, codes in the 2xx range indicate success, codes in the 4xx range indicate an error that failed given the
                        information provided, and codes in the 5xx range indicate an error with the promptby.me servers.
                      </p>
                      
                      <h3>Common Error Codes</h3>
                      <table className="border-collapse w-full">
                        <thead>
                          <tr>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Status Code</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">400</td>
                            <td className="border border-zinc-700 p-2">Bad Request - Missing required parameters or invalid input</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">401</td>
                            <td className="border border-zinc-700 p-2">Unauthorized - Invalid or missing authentication token</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">403</td>
                            <td className="border border-zinc-700 p-2">Forbidden - You don't have access to the requested prompt or flow</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">404</td>
                            <td className="border border-zinc-700 p-2">Not Found - Prompt or flow not found</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">429</td>
                            <td className="border border-zinc-700 p-2">Too Many Requests - Rate limit exceeded</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">500</td>
                            <td className="border border-zinc-700 p-2">Internal Server Error - Something went wrong on the server</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <h3>Error Response Format</h3>
                      <p>
                        All error responses follow a consistent format:
                      </p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Detailed error message"
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Handling Missing Variables</h3>
                      <p>
                        When a prompt contains variables that aren't provided in the request, the API will return a 400 error with details about the missing variables:
                      </p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Missing variables: {{name}}, {{company}}",
  "missingVariables": ["name", "company"]
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Best Practices for Error Handling</h3>
                      <ul>
                        <li>Always check the <code>success</code> field in the response to determine if the request was successful</li>
                        <li>Implement proper error handling in your code to gracefully handle API errors</li>
                        <li>Log error responses for debugging purposes</li>
                        <li>Implement retry logic with exponential backoff for transient errors (5xx)</li>
                        <li>Display user-friendly error messages to your users</li>
                      </ul>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example error handling in JavaScript
async function runPrompt() {
  try {
    const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-promptby-me-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt_id: 'your-prompt-uuid',
        variables: { /* ... */ },
        api_key: 'your-ai-provider-api-key'
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // Handle API error
      console.error('API Error:', data.error);
      
      // Check for missing variables
      if (data.missingVariables) {
        console.error('Missing variables:', data.missingVariables);
        // Prompt user to provide missing variables
      }
      
      return null;
    }
    
    return data.output;
  } catch (error) {
    // Handle network or parsing errors
    console.error('Request failed:', error);
    return null;
  }
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Rate Limits Section */}
                {expandedSections.has('rate-limits') && filterSections(
                  <div id="rate-limits" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        The promptby.me API implements rate limiting to ensure fair usage and system stability. Rate limits are applied on a per-user basis and are determined by your account type.
                      </p>
                      
                      <h3>Current Rate Limits</h3>
                      <table className="border-collapse w-full">
                        <thead>
                          <tr>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Account Type</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Requests per Minute</th>
                            <th className="border border-zinc-700 bg-zinc-800/50 p-2 text-left">Requests per Day</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">Free</td>
                            <td className="border border-zinc-700 p-2">10</td>
                            <td className="border border-zinc-700 p-2">1,000</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">Pro</td>
                            <td className="border border-zinc-700 p-2">60</td>
                            <td className="border border-zinc-700 p-2">10,000</td>
                          </tr>
                          <tr>
                            <td className="border border-zinc-700 p-2 font-medium">Enterprise</td>
                            <td className="border border-zinc-700 p-2">300</td>
                            <td className="border border-zinc-700 p-2">100,000</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <h3>Rate Limit Headers</h3>
                      <p>
                        The API includes rate limit information in the response headers:
                      </p>
                      <ul>
                        <li><code>X-RateLimit-Limit</code>: The maximum number of requests allowed per minute</li>
                        <li><code>X-RateLimit-Remaining</code>: The number of requests remaining in the current window</li>
                        <li><code>X-RateLimit-Reset</code>: The time at which the current rate limit window resets (Unix timestamp)</li>
                      </ul>
                      
                      <h3>Rate Limit Exceeded</h3>
                      <p>
                        When you exceed the rate limit, the API will return a 429 Too Many Requests response with a JSON body:
                      </p>
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Rate limit exceeded. Please try again in X seconds.",
  "retry_after": 30
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Best Practices for Rate Limits</h3>
                      <ul>
                        <li>Implement retry logic with exponential backoff for rate limit errors</li>
                        <li>Monitor the rate limit headers to avoid hitting limits</li>
                        <li>Batch requests when possible to reduce API calls</li>
                        <li>Cache responses when appropriate to reduce API usage</li>
                      </ul>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example rate limit handling in JavaScript
async function callApiWithRetry(url, options, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // Check for rate limit error
      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = data.retry_after || 30; // Default to 30 seconds
        
        console.log(\`Rate limit exceeded. Retrying in \${retryAfter} seconds...\`);
        
        // Wait for the specified time before retrying
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffTime = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Security Best Practices Section */}
                {expandedSections.has('security') && filterSections(
                  <div id="security" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Security Best Practices</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        When integrating with the promptby.me API, it's important to follow security best practices to protect your data and API keys.
                      </p>
                      
                      <h3>API Key Security</h3>
                      <ul>
                        <li><strong>Never expose API keys in client-side code</strong> - Always make API calls from a secure backend environment</li>
                        <li><strong>Rotate API keys regularly</strong> - Periodically regenerate your API keys to minimize risk</li>
                        <li><strong>Use environment variables</strong> - Store API keys in environment variables, not in code</li>
                        <li><strong>Implement proper access controls</strong> - Limit who has access to your API keys</li>
                      </ul>
                      
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                        <h4 className="text-amber-400 font-medium mb-2">Security Warning</h4>
                        <p className="text-amber-300 text-sm">
                          Never include your API keys in client-side JavaScript code or mobile apps where they can be extracted. Always proxy API requests through a secure backend service.
                        </p>
                      </div>
                      
                      <h3>Secure Implementation Patterns</h3>
                      <h4>Backend Proxy Pattern (Recommended)</h4>
                      <p>
                        The most secure way to use the promptby.me API is to create a backend proxy that handles API requests:
                      </p>
                      <ol>
                        <li>Your frontend makes requests to your own backend API</li>
                        <li>Your backend validates the request and user authentication</li>
                        <li>Your backend makes the API call to promptby.me with your API key</li>
                        <li>Your backend returns the response to the frontend</li>
                      </ol>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example Node.js backend proxy
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Your API endpoint that proxies to promptby.me
app.post('/api/run-prompt', async (req, res) => {
  try {
    // Authenticate the user (implement your auth logic)
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    // Make the API call to promptby.me
    const response = await axios.post(
      '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api',
      {
        prompt_id: req.body.prompt_id,
        variables: req.body.variables,
        api_key: process.env.AI_PROVIDER_API_KEY,
        provider: req.body.provider || 'groq',
        model: req.body.model || 'llama3-8b-8192',
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.max_tokens || 1000
      },
      {
        headers: {
          'Authorization': \`Bearer \${process.env.PROMPTBY_ME_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return the response to the client
    res.json(response.data);
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'An error occurred'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`}</code>
                        </pre>
                      </div>
                      
                      <h3>HTTPS and TLS</h3>
                      <p>
                        All API requests must use HTTPS to ensure data is encrypted in transit. The API will reject any non-HTTPS requests.
                      </p>
                      
                      <h3>Input Validation</h3>
                      <p>
                        Always validate user input before passing it to the API to prevent injection attacks:
                      </p>
                      <ul>
                        <li>Validate prompt IDs and flow IDs are valid UUIDs</li>
                        <li>Sanitize variables to prevent injection attacks</li>
                        <li>Validate numeric parameters (temperature, max_tokens) are within acceptable ranges</li>
                      </ul>
                      
                      <h3>Error Handling</h3>
                      <p>
                        Implement proper error handling to avoid exposing sensitive information:
                      </p>
                      <ul>
                        <li>Don't expose raw error messages from the API to end users</li>
                        <li>Log errors securely without including sensitive data</li>
                        <li>Provide user-friendly error messages</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'guides' && (
              <div className="space-y-8">
                {/* Quickstart Guide */}
                {expandedSections.has('quickstart') && filterSections(
                  <div id="quickstart" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Quickstart Guide</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        This guide will help you get started with the promptby.me API in just a few minutes.
                      </p>
                      
                      <h3>Step 1: Generate an API Key</h3>
                      <p>
                        First, you need to generate a promptby.me API key:
                      </p>
                      <ol>
                        <li>Go to the API page in your promptby.me account</li>
                        <li>Click on "Generate API Key"</li>
                        <li>Copy and securely store your API key</li>
                      </ol>
                      
                      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 my-4">
                        <h4 className="text-indigo-400 font-medium mb-2">Tip</h4>
                        <p className="text-indigo-300 text-sm">
                          Store your API key in environment variables or a secure key management system, never in your source code.
                        </p>
                      </div>
                      
                      <h3>Step 2: Find Your Prompt or Flow ID</h3>
                      <p>
                        Next, you need the ID of the prompt or flow you want to run:
                      </p>
                      <ol>
                        <li>Go to your Gallery or Flow page</li>
                        <li>Select the prompt or flow you want to use</li>
                        <li>The ID is in the URL or can be found in the prompt/flow details</li>
                      </ol>
                      
                      <h3>Step 3: Make Your First API Call</h3>
                      <p>
                        Now you're ready to make your first API call. Here's a simple example using JavaScript:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example: Running a prompt
async function runMyFirstPrompt() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
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
    console.log('Success! AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}

runMyFirstPrompt();`}</code>
                        </pre>
                      </div>
                      
                      <h3>Step 4: Handle Variables</h3>
                      <p>
                        If your prompt contains variables (like <code>{{name}}</code>), you need to provide values for them in the <code>variables</code> object:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example prompt with variables
// "Write a welcome email to {{name}} from {{company}}."

// API request with variables
{
  "prompt_id": "your-prompt-uuid",
  "variables": {
    "name": "John Smith",
    "company": "Acme Inc."
  },
  "api_key": "your-ai-provider-api-key"
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Step 5: Implement Error Handling</h3>
                      <p>
                        Always implement proper error handling in your API calls:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`async function runPromptWithErrorHandling() {
  try {
    const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt_id: 'your-prompt-uuid',
        variables: {
          name: 'John',
          company: 'Acme Inc.'
        },
        api_key: 'your-ai-provider-api-key'
      })
    });
    
    // Check for HTTP errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || \`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (!data.success) {
      throw new Error(data.error || 'Unknown API error');
    }
    
    return data.output;
  } catch (error) {
    console.error('Error running prompt:', error.message);
    // Handle the error appropriately in your application
    return null;
  }
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Next Steps</h3>
                      <p>
                        Now that you've made your first API call, you can:
                      </p>
                      <ul>
                        <li>Explore the <a href="#run-prompt" className="text-indigo-400 hover:text-indigo-300">Run Prompt API</a> for more details on running individual prompts</li>
                        <li>Learn about the <a href="#run-flow" className="text-indigo-400 hover:text-indigo-300">Run Flow API</a> for executing multi-step prompt flows</li>
                        <li>Check out the <a href="#error-handling" className="text-indigo-400 hover:text-indigo-300">Error Handling</a> guide for best practices</li>
                        <li>Review <a href="#security" className="text-indigo-400 hover:text-indigo-300">Security Best Practices</a> for secure implementation</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Working with Variables */}
                {expandedSections.has('variables') && filterSections(
                  <div id="variables" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Working with Variables</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        Variables are a powerful feature of promptby.me that allow you to create dynamic, reusable prompts. This guide explains how to work with variables in the API.
                      </p>
                      
                      <h3>Understanding Variables</h3>
                      <p>
                        In promptby.me, variables are denoted by double curly braces: <code>{{variable_name}}</code>. When you run a prompt through the API, you can provide values for these variables.
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <h4 className="text-white font-medium mb-2">Example Prompt with Variables</h4>
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`Write a personalized email to {{recipient_name}} about {{topic}}. 
The email should be {{tone}} in tone and include information about {{company_name}}.

Sign the email as {{sender_name}}.`}</code>
                        </pre>
                      </div>
                      
                      <h3>Providing Variable Values in API Calls</h3>
                      <p>
                        When making an API call, you provide values for variables in the <code>variables</code> object:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "prompt_id": "your-prompt-uuid",
  "variables": {
    "recipient_name": "John Smith",
    "topic": "upcoming product launch",
    "tone": "professional",
    "company_name": "Acme Inc.",
    "sender_name": "Jane Doe"
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "openai",
  "model": "gpt-4o"
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Variable Substitution Process</h3>
                      <p>
                        When you make an API call with variables:
                      </p>
                      <ol>
                        <li>The API retrieves the prompt content</li>
                        <li>It replaces each variable placeholder with the corresponding value from your request</li>
                        <li>The processed content is sent to the AI provider</li>
                        <li>The AI generates a response based on the processed content</li>
                      </ol>
                      
                      <h3>Handling Missing Variables</h3>
                      <p>
                        If your prompt contains variables that aren't provided in the API call, the API will return an error:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": false,
  "error": "Missing variables: {{recipient_name}}, {{topic}}",
  "missingVariables": ["recipient_name", "topic"]
}`}</code>
                        </pre>
                      </div>
                      
                      <p>
                        The <code>missingVariables</code> array can be used to prompt the user for the required information.
                      </p>
                      
                      <h3>Variables in Flows</h3>
                      <p>
                        When working with flows, you can provide variables that will be applied across all steps in the flow:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "flow_id": "your-flow-uuid",
  "variables": {
    "customer_name": "John Smith",
    "product_name": "Premium Widget",
    "issue_description": "Widget stopped working after firmware update"
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "anthropic",
  "model": "claude-3-opus-20240229"
}`}</code>
                        </pre>
                      </div>
                      
                      <p>
                        These variables will be applied to any step in the flow that uses the corresponding variable names.
                      </p>
                      
                      <h3>Variable Best Practices</h3>
                      <ul>
                        <li><strong>Use descriptive variable names</strong> - Names like <code>{{customer_name}}</code> are more clear than <code>{{name}}</code></li>
                        <li><strong>Document required variables</strong> - Make sure users of your API integration know which variables they need to provide</li>
                        <li><strong>Validate variable values</strong> - Check that values are appropriate before sending them to the API</li>
                        <li><strong>Handle missing variables gracefully</strong> - Provide clear error messages to users when variables are missing</li>
                        <li><strong>Consider default values</strong> - For optional variables, you might want to provide default values in your application</li>
                      </ul>
                      
                      <h3>Example: Dynamic Variable Handling</h3>
                      <p>
                        Here's an example of how to handle variables dynamically in a web application:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Function to extract variables from a prompt
function extractVariables(promptContent) {
  const matches = promptContent.match(/\\{\\{([^}]+)\\}\\}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, ''));
}

// Function to run a prompt with user-provided variables
async function runPromptWithVariables(promptId, userVariables) {
  try {
    const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-promptby-me-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt_id: promptId,
        variables: userVariables,
        api_key: 'your-ai-provider-api-key'
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // Check for missing variables
      if (data.missingVariables && data.missingVariables.length > 0) {
        // Prompt user for missing variables
        const missingVars = data.missingVariables;
        const newVariables = { ...userVariables };
        
        for (const varName of missingVars) {
          // In a real app, you would show a UI to collect these values
          const value = prompt(\`Please enter a value for \${varName}:\`);
          newVariables[varName] = value;
        }
        
        // Retry with the new variables
        return runPromptWithVariables(promptId, newVariables);
      }
      
      throw new Error(data.error || 'Unknown error');
    }
    
    return data.output;
  } catch (error) {
    console.error('Error running prompt:', error);
    throw error;
  }
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Building Multi-Step Flows */}
                {expandedSections.has('flows') && filterSections(
                  <div id="flows" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Building Multi-Step Flows</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        Prompt flows allow you to chain multiple prompts together in a sequence, with the output of one step feeding into the next. This guide explains how to work with flows in the API.
                      </p>
                      
                      <h3>Understanding Prompt Flows</h3>
                      <p>
                        A prompt flow consists of multiple steps, each with its own prompt. When you run a flow:
                      </p>
                      <ol>
                        <li>The first step is executed with the provided variables</li>
                        <li>The output from the first step is available to the second step</li>
                        <li>This process continues through all steps in the flow</li>
                        <li>The final output is the result of the last step</li>
                      </ol>
                      
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 my-4">
                        <h4 className="text-purple-400 font-medium mb-2">Flow Example</h4>
                        <p className="text-purple-300 text-sm">
                          A content creation flow might have these steps:
                        </p>
                        <ol className="text-purple-300 text-sm list-decimal list-inside">
                          <li>Generate content ideas based on a topic</li>
                          <li>Expand the best idea into an outline</li>
                          <li>Create a full draft from the outline</li>
                          <li>Polish and refine the draft</li>
                        </ol>
                      </div>
                      
                      <h3>Running a Flow via the API</h3>
                      <p>
                        To run a flow, you use the <code>/functions/v1/run-prompt-flow-api</code> endpoint:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example: Running a flow
async function runFlow() {
  const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-flow-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'your-promptby-me-api-key'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      flow_id: 'your-flow-uuid',
      variables: {
        topic: 'artificial intelligence',
        audience: 'beginners',
        tone: 'educational'
      },
      api_key: 'your-ai-provider-api-key',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Final Output:', data.output);
    console.log('Step Outputs:', data.step_outputs);
  } else {
    console.error('Error:', data.error);
  }
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Understanding the Flow Response</h3>
                      <p>
                        The flow API response includes:
                      </p>
                      <ul>
                        <li><code>output</code>: The final output from the last step in the flow</li>
                        <li><code>step_outputs</code>: An object containing the output from each step, keyed by step ID</li>
                        <li><code>flow</code>: Metadata about the flow, including its steps</li>
                      </ul>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`{
  "success": true,
  "output": "The final AI generated response from the last step.",
  "step_outputs": {
    "step-id-1": "Output from step 1",
    "step-id-2": "Output from step 2",
    "step-id-3": "Output from step 3"
  },
  "flow": {
    "id": "uuid-of-your-flow",
    "name": "Flow Name",
    "steps": [
      {
        "id": "step-id-1",
        "title": "Step 1 Title",
        "order_index": 0
      },
      {
        "id": "step-id-2",
        "title": "Step 2 Title",
        "order_index": 1
      },
      {
        "id": "step-id-3",
        "title": "Step 3 Title",
        "order_index": 2
      }
    ]
  }
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Variables in Flows</h3>
                      <p>
                        Variables in flows work similarly to variables in individual prompts, but they can be used across multiple steps:
                      </p>
                      <ul>
                        <li>Variables provided in the API call are available to all steps in the flow</li>
                        <li>Each step can use any of the provided variables</li>
                        <li>The output of previous steps is automatically available to subsequent steps</li>
                      </ul>
                      
                      <h3>Best Practices for Flows</h3>
                      <ul>
                        <li><strong>Design flows with clear step dependencies</strong> - Each step should build on the previous ones</li>
                        <li><strong>Use consistent variable naming</strong> - Maintain consistent variable names across steps</li>
                        <li><strong>Keep steps focused</strong> - Each step should have a single, clear purpose</li>
                        <li><strong>Test flows thoroughly</strong> - Ensure each step works as expected with various inputs</li>
                        <li><strong>Handle errors at each step</strong> - Implement error handling for each step in the flow</li>
                      </ul>
                      
                      <h3>Advanced Flow Techniques</h3>
                      <h4>Extracting Specific Information from Step Outputs</h4>
                      <p>
                        You can use the <code>step_outputs</code> object to extract specific information from each step:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Example: Processing step outputs
async function processFlowResults(flowId) {
  const response = await runFlow(flowId);
  
  if (response.success) {
    // Extract specific information from each step
    const ideas = parseIdeas(response.step_outputs['step-id-1']);
    const outline = parseOutline(response.step_outputs['step-id-2']);
    const draft = response.step_outputs['step-id-3'];
    const finalContent = response.output;
    
    return {
      ideas,
      outline,
      draft,
      finalContent
    };
  }
  
  return null;
}

// Helper function to parse ideas from step 1 output
function parseIdeas(stepOutput) {
  // Example parsing logic - adjust based on your prompt design
  const ideas = stepOutput.split('\\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.trim().replace(/^[-*]\\s+/, ''));
  
  return ideas;
}

// Helper function to parse outline from step 2 output
function parseOutline(stepOutput) {
  // Example parsing logic - adjust based on your prompt design
  const sections = stepOutput.split('\\n\\n')
    .filter(section => section.trim().length > 0)
    .map(section => section.trim());
  
  return sections;
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Example Use Cases for Flows</h3>
                      <ul>
                        <li><strong>Content Creation</strong> - Generate ideas, outlines, drafts, and final content</li>
                        <li><strong>Data Analysis</strong> - Process data, extract insights, and generate reports</li>
                        <li><strong>Customer Support</strong> - Analyze customer queries, generate responses, and suggest follow-ups</li>
                        <li><strong>Code Generation</strong> - Create specifications, generate code, and write documentation</li>
                        <li><strong>Research</strong> - Formulate questions, gather information, and synthesize findings</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Web Application Integration */}
                {expandedSections.has('web-integration') && filterSections(
                  <div id="web-integration" className="scroll-mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Web Application Integration</h2>
                    <div className="prose prose-invert max-w-none">
                      <p>
                        This guide demonstrates how to integrate the promptby.me API into a web application, with a focus on security and user experience.
                      </p>
                      
                      <h3>Architecture Overview</h3>
                      <p>
                        For web applications, we recommend a backend proxy architecture:
                      </p>
                      <ol>
                        <li>Your frontend makes requests to your own backend API</li>
                        <li>Your backend validates the request and user authentication</li>
                        <li>Your backend makes the API call to promptby.me with your API key</li>
                        <li>Your backend returns the response to the frontend</li>
                      </ol>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Frontend (React)
import { useState } from 'react';

function PromptRunner() {
  const [promptId, setPromptId] = useState('');
  const [variables, setVariables] = useState({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Call your backend API, not promptby.me directly
      const response = await fetch('/api/run-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include your app's auth token, not the promptby.me API key
          'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\`
        },
        body: JSON.stringify({
          prompt_id: promptId,
          variables,
          // Note: AI provider API key is managed by your backend
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.output);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (error) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Run Prompt</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Prompt ID:</label>
          <input
            type="text"
            value={promptId}
            onChange={(e) => setPromptId(e.target.value)}
            required
          />
        </div>
        
        {/* Dynamic variable inputs would go here */}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Prompt'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div>
          <h3>Result:</h3>
          <div>{result}</div>
        </div>
      )}
    </div>
  );
}`}</code>
                        </pre>
                      </div>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Backend (Node.js/Express)
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Middleware to verify user authentication
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify the token (implement your auth logic)
  // This is just a placeholder - use your actual auth system
  if (!isValidToken(token)) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  
  // Set the authenticated user on the request object
  req.user = getUserFromToken(token);
  next();
};

// API endpoint to run a prompt
app.post('/api/run-prompt', authenticateUser, async (req, res) => {
  try {
    const { prompt_id, variables } = req.body;
    
    if (!prompt_id) {
      return res.status(400).json({ success: false, error: 'Prompt ID is required' });
    }
    
    // Make the API call to promptby.me
    const response = await axios.post(
      '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api',
      {
        prompt_id,
        variables: variables || {},
        api_key: process.env.AI_PROVIDER_API_KEY,
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': \`Bearer \${process.env.PROMPTBY_ME_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return the response to the client
    res.json(response.data);
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    
    // Return a user-friendly error message
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'An error occurred while processing your request'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Auth helper functions (implement these based on your auth system)
function isValidToken(token) {
  // Implement token validation logic
  return true; // Placeholder
}

function getUserFromToken(token) {
  // Implement user extraction logic
  return { id: '123', name: 'User' }; // Placeholder
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Handling Variables Dynamically</h3>
                      <p>
                        For a better user experience, you can dynamically generate form fields based on the variables in a prompt:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Frontend component for dynamic variables
function VariableForm({ promptId, onSubmit }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promptDetails, setPromptDetails] = useState(null);
  const [variables, setVariables] = useState({});
  
  // Fetch prompt details to extract variables
  useEffect(() => {
    async function fetchPromptDetails() {
      try {
        const response = await fetch(\`/api/prompts/\${promptId}\`);
        const data = await response.json();
        
        if (data.success) {
          setPromptDetails(data.prompt);
          
          // Extract variables from the prompt content
          const matches = data.prompt.content.match(/\\{\\{([^}]+)\\}\\}/g) || [];
          const extractedVars = matches.map(match => match.replace(/[{}]/g, ''));
          
          // Initialize variables state with empty values
          const initialVars = {};
          extractedVars.forEach(varName => {
            initialVars[varName] = '';
          });
          
          setVariables(initialVars);
        } else {
          setError(data.error || 'Failed to load prompt details');
        }
      } catch (error) {
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPromptDetails();
  }, [promptId]);
  
  const handleVariableChange = (name, value) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(variables);
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!promptDetails) return <div>No prompt found</div>;
  
  return (
    <div>
      <h3>{promptDetails.title || 'Untitled Prompt'}</h3>
      <form onSubmit={handleSubmit}>
        {Object.keys(variables).map(varName => (
          <div key={varName} className="form-group">
            <label>{varName}:</label>
            <input
              type="text"
              value={variables[varName]}
              onChange={(e) => handleVariableChange(varName, e.target.value)}
              placeholder={\`Enter \${varName}\`}
              required
            />
          </div>
        ))}
        
        <button type="submit">Run Prompt</button>
      </form>
    </div>
  );
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Implementing a Loading State</h3>
                      <p>
                        AI responses can take time to generate, so it's important to implement a good loading state:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`function PromptRunner() {
  // ... other state variables
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const runPrompt = async () => {
    setLoading(true);
    setProgress(10); // Initial progress
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 500);
      
      // Make the API call
      const response = await fetch('/api/run-prompt', {
        // ... request details
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.output);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (error) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* ... form elements */}
      
      <button onClick={runPrompt} disabled={loading}>
        {loading ? 'Generating...' : 'Run Prompt'}
      </button>
      
      {loading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: \`\${progress}%\` }}></div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
      )}
      
      {/* ... result display */}
    </div>
  );
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Error Handling and User Feedback</h3>
                      <p>
                        Implement comprehensive error handling to provide a good user experience:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`function ErrorHandler({ error }) {
  // Map API error messages to user-friendly messages
  const getUserFriendlyError = (error) => {
    if (error.includes('Missing variables')) {
      return 'Some required variables are missing. Please fill in all fields.';
    }
    
    if (error.includes('Prompt not found')) {
      return 'The selected prompt could not be found. It may have been deleted.';
    }
    
    if (error.includes('Invalid API key')) {
      return 'There was an authentication issue. Please try again later.';
    }
    
    return 'An error occurred while generating the response. Please try again.';
  };
  
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{getUserFriendlyError(error)}</div>
    </div>
  );
}`}</code>
                        </pre>
                      </div>
                      
                      <h3>Caching Responses</h3>
                      <p>
                        For better performance and to reduce API calls, consider caching responses:
                      </p>
                      
                      <div className="bg-zinc-800/50 p-4 rounded-lg my-4">
                        <pre className="text-indigo-300 font-mono text-sm overflow-x-auto">
                          <code>{`// Simple in-memory cache (use a more robust solution in production)
const responseCache = new Map();

// Function to generate a cache key
function generateCacheKey(promptId, variables) {
  return \`\${promptId}:\${JSON.stringify(variables)}\`;
}

// Function to run a prompt with caching
async function runPromptWithCache(promptId, variables) {
  const cacheKey = generateCacheKey(promptId, variables);
  
  // Check if we have a cached response
  if (responseCache.has(cacheKey)) {
    console.log('Using cached response');
    return responseCache.get(cacheKey);
  }
  
  // No cached response, make the API call
  const response = await fetch('/api/run-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\`
    },
    body: JSON.stringify({
      prompt_id: promptId,
      variables
    })
  });
  
  const data = await response.json();
  
  // Cache the successful response
  if (data.success) {
    responseCache.set(cacheKey, data);
  }
  
  return data;
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <div className="text-xs text-zinc-500">
            API Documentation • promptby.me
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}