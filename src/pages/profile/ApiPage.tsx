import React, { useState } from 'react'
import { Menu, Code, Key, FileText, Copy, CheckCircle, ExternalLink, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ApiKeyModal } from '../../components/api/ApiKeyModal'
import { ApiDocsModal } from '../../components/api/ApiDocsModal'
import { CodeGeneratorModal } from '../../components/api/CodeGeneratorModal'
import { useAuthStore } from '../../store/authStore'

export const ApiPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiDocsModal, setShowApiDocsModal] = useState(false)
  const [showCodeGeneratorModal, setShowCodeGeneratorModal] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  
  const { user, loading: authLoading } = useAuthStore()

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

              {/* API Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <Key size={20} className="text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">API Key</h2>
                  </div>
                  <p className="text-zinc-300 mb-4">
                    Generate and manage your API key to authenticate with AI providers when using the promptby.me API.
                  </p>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <Key size={16} />
                    <span>Manage API Key</span>
                  </button>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Documentation</h2>
                  </div>
                  <p className="text-zinc-300 mb-4">
                    Learn how to use the promptby.me API to run prompts programmatically from your applications.
                  </p>
                  <button
                    onClick={() => setShowApiDocsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <FileText size={16} />
                    <span>View Documentation</span>
                  </button>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <Wand2 size={20} className="text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Generate Code</h2>
                  </div>
                  <p className="text-zinc-300 mb-4">
                    Select a prompt and generate ready-to-use code snippets for API integration in your applications.
                  </p>
                  <button
                    onClick={() => setShowCodeGeneratorModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <Code size={16} />
                    <span>Generate API Code</span>
                  </button>
                </div>
              </div>

              {/* Quick Start Guide */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Quick Start Guide</h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">1. Generate an API Key</h3>
                    <p className="text-zinc-300">
                      First, generate an API key by clicking the "Manage API Key" button above. This key will be used to authenticate with AI providers.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">2. Authenticate with Supabase</h3>
                    <p className="text-zinc-300 mb-2">
                      To access your prompts, you need to authenticate with Supabase and get a JWT token.
                    </p>
                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">JavaScript</span>
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
const jwtToken = data.session.access_token`, 'auth-code')}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied === 'auth-code' ? (
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
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">3. Call the API</h3>
                    <p className="text-zinc-300 mb-2">
                      Use the JWT token to authenticate with the promptby.me API and run a prompt.
                    </p>
                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">JavaScript</span>
                        <button
                          onClick={() => copyToClipboard(`async function runPrompt() {
  const response = await fetch('https://your-project.supabase.co/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`,
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
      model: 'gpt-4o'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}`, 'api-call')}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied === 'api-call' ? (
                            <CheckCircle size={16} className="text-emerald-400" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-indigo-300 font-mono overflow-x-auto">
                        <code>{`async function runPrompt() {
  const response = await fetch('https://your-project.supabase.co/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`,
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
      model: 'gpt-4o'
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
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Additional Resources</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="https://supabase.com/docs/guides/functions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 rounded-xl transition-all duration-200"
                  >
                    <ExternalLink size={18} className="text-indigo-400" />
                    <div>
                      <h3 className="text-white font-medium text-sm">Supabase Edge Functions</h3>
                      <p className="text-zinc-400 text-xs">Learn more about Supabase Edge Functions</p>
                    </div>
                  </a>
                  
                  <a
                    href="https://platform.openai.com/docs/api-reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 rounded-xl transition-all duration-200"
                  >
                    <ExternalLink size={18} className="text-indigo-400" />
                    <div>
                      <h3 className="text-white font-medium text-sm">OpenAI API Reference</h3>
                      <p className="text-zinc-400 text-xs">Documentation for the OpenAI API</p>
                    </div>
                  </a>
                  
                  <a
                    href="https://docs.anthropic.com/claude/reference/getting-started-with-the-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 rounded-xl transition-all duration-200"
                  >
                    <ExternalLink size={18} className="text-indigo-400" />
                    <div>
                      <h3 className="text-white font-medium text-sm">Anthropic API Reference</h3>
                      <p className="text-zinc-400 text-xs">Documentation for the Claude API</p>
                    </div>
                  </a>
                  
                  <a
                    href="https://console.groq.com/docs/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 rounded-xl transition-all duration-200"
                  >
                    <ExternalLink size={18} className="text-indigo-400" />
                    <div>
                      <h3 className="text-white font-medium text-sm">Groq API Reference</h3>
                      <p className="text-zinc-400 text-xs">Documentation for the Groq API</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
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