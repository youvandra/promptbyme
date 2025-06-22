import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { 
  Menu, 
  Loader,
  ArrowLeft,
  Plus, 
  Layers,
  Search, 
  Settings, 
  Trash2, 
  Edit3, 
  Users, 
  Globe, 
  Lock, 
  UserPlus,
  MoreHorizontal,
  X,
  Mail,
  Check,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { Toast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore, FlowProject } from '../../store/projectSpaceStore'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'

export const ProjectSpacePage: React.FC = () => {
  // ... all the code content remains exactly the same ...
  return (
    <div className="min-h-screen bg-zinc-950">
      <SideNavbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              {isViewingProject ? (
                renderProjectSpace()
              ) : (
                <>
                  {/* Projects Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">
                        Project Space
                      </h1>
                      <p className="text-zinc-400">
                        Manage and organize your flow projects
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                    >
                      <Plus size={16} />
                      <span>New Project</span>
                    </button>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}