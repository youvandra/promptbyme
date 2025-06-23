import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Menu, 
  Plus, 
  Layers, 
  Settings, 
  Users, 
  Calendar, 
  Eye, 
  EyeOff, 
  Globe, 
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ArrowRight,
  X,
  Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore } from '../../store/projectSpaceStore'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectVisibility, setNewProjectVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null)
  const [showProjectSettings, setShowProjectSettings] = useState<string | null>(null)
  const [editProjectName, setEditProjectName] = useState('')
  const [editProjectDescription, setEditProjectDescription] = useState('')
  const [editProjectVisibility, setEditProjectVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  
  const { user, loading: authLoading } = useAuthStore()
  const { 
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject
  } = useProjectSpaceStore()

  // Load projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    setIsCreating(true)
    try {
      const project = await createProject(
        newProjectName.trim(), 
        newProjectDescription.trim() || undefined, 
        newProjectVisibility
      )
      setShowCreateProject(false)
      setNewProjectName('')
      setNewProjectDescription('')
      setNewProjectVisibility('private')
      setToast({ message: 'Project created successfully', type: 'success' })
      
      // Navigate to the new project
      navigate(`/project/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      setToast({ message: 'Failed to create project', type: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteProject(projectId)
      setToast({ message: 'Project deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete project:', error)
      setToast({ message: 'Failed to delete project', type: 'error' })
    }
  }

  const handleProjectSettings = (project: any) => {
    setShowProjectMenu(null)
    setEditProjectName(project.name)
    setEditProjectDescription(project.description || '')
    setEditProjectVisibility(project.visibility || 'private')
    setShowProjectSettings(project.id)
  }

  const handleSaveProjectSettings = async () => {
    if (!showProjectSettings || !editProjectName.trim()) return
    
    setIsSavingSettings(true)
    try {
      await updateProject(showProjectSettings, {
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || null,
        visibility: editProjectVisibility
      })
      setShowProjectSettings(null)
      setToast({ message: 'Project settings saved', type: 'success' })
    } catch (error) {
      console.error('Failed to save project:', error)
      setToast({ message: 'Failed to save project', type: 'error' })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleOpenProject = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        await selectProject(project)
        navigate(`/project/${projectId}`)
      }
    } catch (error) {
      console.error('Failed to open project:', error)
      setToast({ message: 'Failed to open project', type: 'error' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading projects...</span>
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
              <Layers size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access the project space
            </p>
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
                  Project Space
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-7xl px-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Project Dashboard
                  </h1>
                  <p className="text-zinc-400">
                    Manage your prompt flow projects
                  </p>
                </div>
                
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover self-start lg:self-auto"
                >
                  <Plus size={18} />
                  <span>New Project</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Projects Grid */}
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      className="group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 flex flex-col h-full"
                      whileHover={{ y: -5 }}
                    >
                      {/* Project Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            {project.visibility === 'private' ? (
                              <div className="flex items-center gap-1 text-amber-400">
                                <EyeOff size={14} />
                                <span>Private</span>
                              </div>
                            ) : project.visibility === 'team' ? (
                              <div className="flex items-center gap-1 text-blue-400">
                                <Users size={14} />
                                <span>Team</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <Globe size={14} />
                                <span>Public</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Project Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowProjectMenu(showProjectMenu === project.id ? null : project.id);
                            }}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {showProjectMenu === project.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 min-w-[160px]"
                              >
                                <div className="py-1">
                                  {user && project.user_id === user.id && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowProjectMenu(null);
                                          handleProjectSettings(project);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left text-sm"
                                      >
                                        <Settings size={14} />
                                        <span>Settings</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowProjectMenu(null);
                                          handleDeleteProject(project.id);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left text-sm"
                                      >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      {/* Project Description */}
                      {project.description && (
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="mt-auto">
                        <button
                          onClick={() => handleOpenProject(project.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all duration-200 text-sm"
                        >
                          <span>Open Project</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                    <Layers className="mx-auto text-zinc-500 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {searchQuery ? 'No matching projects' : 'No projects yet'}
                    </h3>
                    <p className="text-zinc-400 mb-6">
                      {searchQuery 
                        ? 'Try adjusting your search query'
                        : 'Create your first project to get started'
                      }
                    </p>
                    <button
                      onClick={() => setShowCreateProject(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                    >
                      <Plus size={16} />
                      <span>Create First Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateProject(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">
                  Create New Project
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Visibility
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setNewProjectVisibility('private')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        newProjectVisibility === 'private' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <EyeOff size={20} />
                      <span className="text-sm font-medium">Private</span>
                      <span className="text-xs text-center">Only you can access</span>
                    </button>
                    
                    <button
                      onClick={() => setNewProjectVisibility('team')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        newProjectVisibility === 'team' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-sm font-medium">Team</span>
                      <span className="text-xs text-center">You and team members</span>
                    </button>
                    
                    <button
                      onClick={() => setNewProjectVisibility('public')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        newProjectVisibility === 'public' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-sm font-medium">Public</span>
                      <span className="text-xs text-center">Anyone can view</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProjectName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Settings Modal */}
      <AnimatePresence>
        {showProjectSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectSettings(null)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">
                  Project Settings
                </h2>
                
                <button
                  onClick={() => setShowProjectSettings(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Visibility
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setEditProjectVisibility('private')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        editProjectVisibility === 'private' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <EyeOff size={20} />
                      <span className="text-sm font-medium">Private</span>
                      <span className="text-xs text-center">Only you can access</span>
                    </button>
                    
                    <button
                      onClick={() => setEditProjectVisibility('team')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        editProjectVisibility === 'team' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-sm font-medium">Team</span>
                      <span className="text-xs text-center">You and team members</span>
                    </button>
                    
                    <button
                      onClick={() => setEditProjectVisibility('public')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        editProjectVisibility === 'public' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-sm font-medium">Public</span>
                      <span className="text-xs text-center">Anyone can view</span>
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-800/50">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                        deleteProject(showProjectSettings)
                          .then(() => {
                            setShowProjectSettings(null)
                            setToast({ message: 'Project deleted successfully', type: 'success' })
                          })
                          .catch(error => {
                            console.error('Failed to delete project:', error)
                            setToast({ message: 'Failed to delete project', type: 'error' })
                          })
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-sm"
                  >
                    <Trash2 size={16} />
                    <span>Delete Project</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
                <button
                  onClick={() => setShowProjectSettings(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProjectSettings}
                  disabled={isSavingSettings || !editProjectName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isSavingSettings ? (
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
        )}
      </AnimatePresence>

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