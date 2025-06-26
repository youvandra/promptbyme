import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import { Menu, BookOpen } from 'lucide-react'
import { DocsSidebar } from '../../components/docs/DocsSidebar'
import { DocsContent } from '../../components/docs/DocsContent'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { useAuthStore } from '../../store/authStore'

export const DocsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [docsSidebarOpen, setDocsSidebarOpen] = useState(window.innerWidth >= 768)
  const location = useLocation()
  const navigate = useNavigate()
  
  const { user, loading: authLoading } = useAuthStore()

  // Get the current section from the URL
  const currentPath = location.pathname.split('/docs/')[1] || 'introduction'

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setDocsSidebarOpen(false)
    }
  }, [location.pathname])

  // Toggle docs sidebar for mobile
  const toggleDocsSidebar = () => {
    setDocsSidebarOpen(!docsSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDocsSidebarOpen(!docsSidebarOpen)}
                className="text-zinc-400 hover:text-white transition-colors p-1 md:hidden"
              >
                <Menu size={20} />
              </button>
              
              <div className="flex items-center gap-3">
                <BookOpen className="text-indigo-400" size={20} />
                <h1 className="text-lg font-semibold text-white">
                  Documentation
                </h1>
              </div>
              
              <div className="w-6" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 flex-1 flex">
          {/* Docs Sidebar */}
          <DocsSidebar 
            isOpen={docsSidebarOpen} 
            onToggle={toggleDocsSidebar}
            currentPath={currentPath}
          />
          
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${docsSidebarOpen ? 'md:ml-64' : ''}`}>
            <Routes>
              <Route path="/" element={<DocsContent section="introduction" />} />
              <Route path="/introduction" element={<DocsContent section="introduction" />} />
              <Route path="/getting-started" element={<DocsContent section="getting-started" />} />
              <Route path="/prompt-management" element={<DocsContent section="prompt-management" />} />
              <Route path="/prompt-versioning" element={<DocsContent section="prompt-versioning" />} />
              <Route path="/variables" element={<DocsContent section="variables" />} />
              <Route path="/playground" element={<DocsContent section="playground" />} />
              <Route path="/prompt-flow" element={<DocsContent section="prompt-flow" />} />
              <Route path="/project-space" element={<DocsContent section="project-space" />} />
              <Route path="/team-collaboration" element={<DocsContent section="team-collaboration" />} />
              <Route path="/faq" element={<DocsContent section="faq" />} />
              <Route path="*" element={<DocsContent section="introduction" />} />
            </Routes>
          </div>
        </div>
      </div>

      <BoltBadge />
    </div>
  )
}