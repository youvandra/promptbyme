import React, { useState, useEffect } from 'react'
import { Menu, Code, Key, Info, Copy, CheckCircle, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ApiKeyModal } from '../../components/api/ApiKeyModal'
import { ApiLogsModal } from '../../components/api/ApiLogsModal'
import { CodeGeneratorPage } from './CodeGeneratorPage'
import { useAuthStore } from '../../store/authStore'
import { useClipboard } from '../../hooks/useClipboard'

export const ApiPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiLogsModal, setShowApiLogsModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const { user, loading: authLoading } = useAuthStore()
  const { copied, copyToClipboard } = useClipboard()

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setToast({ message: 'Copied to clipboard!', type: 'success' })
    } else {
      setToast({ message: 'Failed to copy', type: 'error' })
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
            <Code className="mx-auto text-zinc-400 mb-4" size={64} />
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access the API page
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
            <div className="w-full max-w-7xl mx-auto px-6 py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    API Access
                  </h1>
                  <p className="text-zinc-400">
                    Manage your API keys and integrate with your applications
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                  >
                    <Key size={16} />
                    <span>Manage API Keys</span>
                  </button>
                  
                  <button
                    onClick={() => setShowApiLogsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all duration-200"
                  >
                    <Info size={16} />
                    <span>View Logs</span>
                  </button>
                </div>
              </div>

              {/* API Documentation Link */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">API Documentation</h2>
                    <p className="text-zinc-400">
                      Learn how to integrate promptby.me with your applications using our REST API
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link
                      to="/docs/api-reference"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all duration-200"
                    >
                      <Info size={16} />
                      <span>View Documentation</span>
                    </Link>
                    
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/docs/api-reference`)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                      title="Copy documentation link"
                    >
                      {copied ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Generator */}
              <CodeGeneratorPage />
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* API Logs Modal */}
      <ApiLogsModal
        isOpen={showApiLogsModal}
        onClose={() => setShowApiLogsModal(false)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BoltBadge />
    </div>
  )
}