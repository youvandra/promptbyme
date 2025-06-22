import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom'
import { 
  Menu, 
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectVisibility, setProjectVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [selectedProject, setSelectedProject] = useState<FlowProject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null)
  
  const { user, loading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const params = useParams<{ projectId?: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { 
    projects, 
    loading: projectsLoading, 
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    selectedProject: currentProject,
    currentUserRole,
    inviteProjectMember
  } = useProjectSpaceStore((state) => state)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load project from URL params or search params
  useEffect(() => {
    // First check URL params (for /project/:projectId route)
    const projectId = params.projectId || searchParams.get('project')
    
    const loadProject = async () => {
      if (projectId && user && !authLoading) {
        setIsLoading(true)
        try {
          // First fetch projects if we don't have them yet
          if (projects.length === 0 && !projectsLoading) {
            await fetchProjects()
          }
          
          const project = projects.find(p => p.id === projectId)
          if (project) {
            await useProjectSpaceStore.getState().selectProject(project)
          }
        } catch (error) {
          console.error('Failed to load project:', error)
          setToast({ message: 'Failed to load project', type: 'error' })
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadProject()
  }, [params.projectId, searchParams, user, authLoading, projectsLoading, projects])

  useEffect(() => {
    if (user && !authLoading) {
      fetchProjects()
    }
  }, [user, authLoading, fetchProjects])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateProject = async () => {
    if (!projectName.trim()) return
    
    setIsLoading(true)
    try {
      const newProject = await createProject(
        projectName.trim(), 
        projectDescription.trim() || undefined,
        projectVisibility
      )
      
      setToast({ message: 'Project created successfully', type: 'success' })
      setShowCreateModal(false)
      setProjectName('')
      setProjectDescription('')
      setProjectVisibility('private')
      
      // Navigate to the new project
      navigate(`/project-space?project=${newProject.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      setToast({ message: 'Failed to create project', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProject = async () => {
    if (!selectedProject || !projectName.trim()) return
    
    setIsLoading(true)
    try {
      await updateProject(selectedProject.id, {
        name: projectName.trim(),
        description: projectDescription.trim() || null,
        visibility: projectVisibility
      })
      
      setToast({ message: 'Project updated successfully', type: 'success' })
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update project:', error)
      setToast({ message: 'Failed to update project', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return
    
    setIsLoading(true)
    try {
      await deleteProject(selectedProject.id)
      
      setToast({ message: 'Project deleted successfully', type: 'success' })
      setShowDeleteModal(false)
      setSelectedProject(null)
    } catch (error) {
      console.error('Failed to delete project:', error)
      setToast({ message: 'Failed to delete project', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!selectedProject || !inviteEmail.trim()) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setToast({ message: 'Please enter a valid email address', type: 'error' })
      return
    }
    
    setIsLoading(true)
    try {
      await inviteProjectMember(selectedProject.id, inviteEmail.trim(), inviteRole)
      
      setToast({ message: 'Invitation sent successfully', type: 'success' })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('viewer')
    } catch (error: any) {
      console.error('Failed to invite member:', error)
      setToast({ 
        message: error.message || 'Failed to invite member', 
        type: 'error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openProjectEditor = (project: FlowProject) => {
    // Navigate to the project page with the project ID in the URL
    setIsLoading(true)
    useProjectSpaceStore.getState().selectProject(project)
      .then(() => {
        navigate(`/project/${project.id}`, { replace: true })
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Failed to select project:', error)
        setToast({ message: 'Failed to load project', type: 'error' })
        setIsLoading(false)
      })
  }

  const openEditModal = (project: FlowProject) => {
    setSelectedProject(project)
    setProjectName(project.name)
    setProjectDescription(project.description || '')
    setProjectVisibility(project.visibility as 'private' | 'team' | 'public')
    setShowEditModal(true)
    setShowProjectMenu(null)
  }

  const openDeleteModal = (project: FlowProject) => {
    setSelectedProject(project)
    setShowDeleteModal(true)
    setShowProjectMenu(null)
  }

  const openInviteModal = (project: FlowProject) => {
    setSelectedProject(project)
    setShowInviteModal(true)
    setShowProjectMenu(null)
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe size={14} className="text-emerald-400" />
      case 'team':
        return <Users size={14} className="text-blue-400" />
      default:
        return <Lock size={14} className="text-amber-400" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public'
      case 'team':
        return 'Team'
      default:
        return 'Private'
    }
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'text-emerald-400'
      case 'team':
        return 'text-blue-400'
      default:
        return 'text-amber-400'
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
            <Layers className="mx-auto text-zinc-400 mb-4" size={64} />
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
                    Project Space
                  </h1>
                  <p className="text-zinc-400">
                    Create and manage your prompt flow projects
                  </p>
                </div>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover self-start"
                >
                  <Plus size={16} />
                  <span>New Project</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Projects Grid */}
              {projectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                    <span>Loading projects...</span>
                  </div>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 flex flex-col h-full"
                      onClick={() => openProjectEditor(project)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Project Menu */}
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowProjectMenu(showProjectMenu === project.id ? null : project.id)
                          }}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {showProjectMenu === project.id && (
                          <div 
                            ref={menuRef}
                            className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-48 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowProjectMenu(null)
                                openProjectEditor(project)
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left text-sm cursor-pointer"
                            >
                              <Layers size={14} />
                              <span>Open Project</span>
                            </div>
                            
                            {(project.user_id === user.id || currentUserRole === 'admin') && (
                              <>
                                <button
                                  onClick={() => openEditModal(project)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left text-sm"
                                >
                                  <Edit3 size={14} />
                                  <span>Edit Project</span>
                                </button>
                                
                                <button
                                  onClick={() => openInviteModal(project)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left text-sm"
                                >
                                  <UserPlus size={14} />
                                  <span>Invite Member</span>
                                </button>
                                
                                <button
                                  onClick={() => openDeleteModal(project)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left text-sm"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete Project</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Project Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                            <Layers size={18} />
                          </div>
                          <h3 className="text-lg font-semibold text-white truncate">
                            {project.name}
                          </h3>
                        </div>
                        
                        {project.description && (
                          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto pt-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 text-xs ${getVisibilityColor(project.visibility)}`}>
                              {getVisibilityIcon(project.visibility)}
                              <span>{getVisibilityText(project.visibility)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Users size={12} />
                              <span>{project.member_count || 1}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-zinc-500">
                            {new Date(project.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-zinc-400">Loading project...</span>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                      <Layers className="mx-auto text-zinc-500 mb-4" size={48} />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {searchQuery ? 'No matching projects' : 'No projects yet'}
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        {searchQuery 
                          ? 'Try adjusting your search query' 
                          : 'Create your first project to get started'
                        }
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                        >
                          <Plus size={16} />
                          <span>Create First Project</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
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
                
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
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
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setProjectVisibility('private')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        projectVisibility === 'private' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Lock size={20} />
                      <span className="text-xs font-medium">Private</span>
                    </button>
                    
                    <button
                      onClick={() => setProjectVisibility('team')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        projectVisibility === 'team' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-xs font-medium">Team</span>
                    </button>
                    
                    <button
                      onClick={() => setProjectVisibility('public')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        projectVisibility === 'public' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-xs font-medium">Public</span>
                    </button>
                  </div>
                  
                  <p className="mt-2 text-xs text-zinc-500">
                    {projectVisibility === 'private' 
                      ? 'Only you can access this project' 
                      : projectVisibility === 'team' 
                        ? 'You and team members can access this project'
                        : 'Anyone can view this project'
                    }
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={isLoading || !projectName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Project Modal */}
      <AnimatePresence>
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">
                  Edit Project
                </h2>
                
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
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
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setProjectVisibility('private')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        projectVisibility === 'private' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Lock size={20} />
                      <span className="text-xs font-medium">Private</span>
                    </button>
                    
                    <button
                      onClick={() => setProjectVisibility('team')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        projectVisibility === 'team' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-xs font-medium">Team</span>
                    </button>
                    
                    <button
                      onClick={() => setProjectVisibility('public')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        projectVisibility === 'public' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-xs font-medium">Public</span>
                    </button>
                  </div>
                  
                  <p className="mt-2 text-xs text-zinc-500">
                    {projectVisibility === 'private' 
                      ? 'Only you can access this project' 
                      : projectVisibility === 'team' 
                        ? 'You and team members can access this project'
                        : 'Anyone can view this project'
                    }
                  </p>
                </div>

                {/* Team Members Display */}
                {selectedProject && (
                  <div className="pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-zinc-300">Team Members</h3>
                      <TeamMembersDisplay 
                        projectId={selectedProject.id}
                        currentUserRole={currentUserRole}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProject}
                  disabled={isLoading || !projectName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-zinc-800/50">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Delete Project
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-zinc-300 mb-4">
                  Are you sure you want to delete <span className="font-semibold text-white">{selectedProject.name}</span>? This action cannot be undone.
                </p>
                
                <p className="text-zinc-400 text-sm mb-4">
                  All project data, including nodes and connections, will be permanently deleted.
                </p>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm">
                    Type <span className="font-mono font-bold">delete</span> to confirm
                  </p>
                  <input
                    type="text"
                    placeholder="delete"
                    className="mt-2 w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    onChange={(e) => {
                      // Enable the delete button only if the user types "delete"
                      const deleteButton = document.getElementById('delete-button') as HTMLButtonElement
                      if (deleteButton) {
                        deleteButton.disabled = e.target.value !== 'delete'
                      }
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="delete-button"
                  onClick={handleDeleteProject}
                  disabled={isLoading} // Only disabled when loading
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Project</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/20 rounded-lg">
                    <UserPlus size={20} className="text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Invite Team Member
                  </h2>
                </div>
                
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setInviteRole('viewer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'viewer' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Eye size={20} />
                      <span className="text-xs font-medium">Viewer</span>
                    </button>
                    
                    <button
                      onClick={() => setInviteRole('editor')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'editor' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Edit3 size={20} />
                      <span className="text-xs font-medium">Editor</span>
                    </button>
                    
                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'admin' 
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Settings size={20} />
                      <span className="text-xs font-medium">Admin</span>
                    </button>
                  </div>
                  
                  <p className="mt-2 text-xs text-zinc-500">
                    {inviteRole === 'viewer' 
                      ? 'Can view but not edit the project' 
                      : inviteRole === 'editor' 
                        ? 'Can view and edit the project'
                        : 'Full access including member management'
                    }
                  </p>
                </div>

                {/* Team Members Display */}
                <div className="pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-300">Current Members</h3>
                    <TeamMembersDisplay 
                      projectId={selectedProject.id}
                      currentUserRole={currentUserRole}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={isLoading || !inviteEmail.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Send Invitation</span>
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