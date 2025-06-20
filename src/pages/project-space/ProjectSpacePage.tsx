import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Menu, 
  Plus, 
  Layers, 
  Clock, 
  Search, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Users, 
  UserPlus,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { Toast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore } from '../../store/projectSpaceStore'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'

export const ProjectSpacePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectVisibility, setNewProjectVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [isCreating, setIsCreating] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [projectToRename, setProjectToRename] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [projectForTeam, setProjectForTeam] = useState<string | null>(null)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [isInviting, setIsInviting] = useState(false)
  
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const { 
    projects, 
    loading, 
    fetchProjects, 
    createProject, 
    updateProject,
    deleteProject,
    inviteProjectMember,
    fetchProjectMembers,
    projectMembers
  } = useProjectSpaceStore()

  // Ref for dropdown menu
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([projectId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          // Close this dropdown
          const dropdown = document.getElementById(`dropdown-${projectId}`)
          if (dropdown) {
            dropdown.classList.add('hidden')
          }
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    setIsCreating(true)
    try {
      const project = await createProject(
        newProjectName.trim(), 
        newProjectDescription.trim() || undefined,
        newProjectVisibility
      )
      setToast({ message: 'Project created successfully', type: 'success' })
      setShowCreateModal(false)
      setNewProjectName('')
      setNewProjectDescription('')
      setNewProjectVisibility('private')
      
      // Navigate to the new project
      navigate(`/project-space/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      setToast({ message: 'Failed to create project', type: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleRenameProject = async () => {
    if (!projectToRename || !newName.trim()) return
    
    setIsRenaming(true)
    try {
      await updateProject(projectToRename, { name: newName.trim() })
      setToast({ message: 'Project renamed successfully', type: 'success' })
      setShowRenameModal(false)
      setProjectToRename(null)
      setNewName('')
    } catch (error) {
      console.error('Failed to rename project:', error)
      setToast({ message: 'Failed to rename project', type: 'error' })
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete)
      setToast({ message: 'Project deleted successfully', type: 'success' })
      setShowDeleteModal(false)
      setProjectToDelete(null)
    } catch (error) {
      console.error('Failed to delete project:', error)
      setToast({ message: 'Failed to delete project', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInviteMember = async () => {
    if (!projectForTeam || !newMemberEmail.trim()) return
    
    setIsInviting(true)
    try {
      await inviteProjectMember(projectForTeam, newMemberEmail.trim(), newMemberRole)
      setToast({ message: 'Invitation sent successfully', type: 'success' })
      setNewMemberEmail('')
      
      // Refresh members list
      await fetchProjectMembers(projectForTeam)
    } catch (error) {
      console.error('Failed to invite member:', error)
      setToast({ message: 'Failed to invite member', type: 'error' })
    } finally {
      setIsInviting(false)
    }
  }

  const toggleDropdown = (projectId: string) => {
    const dropdown = document.getElementById(`dropdown-${projectId}`)
    if (dropdown) {
      dropdown.classList.toggle('hidden')
    }
  }

  const openRenameModal = (projectId: string, currentName: string) => {
    setProjectToRename(projectId)
    setNewName(currentName)
    setShowRenameModal(true)
    
    // Close dropdown
    const dropdown = document.getElementById(`dropdown-${projectId}`)
    if (dropdown) {
      dropdown.classList.add('hidden')
    }
  }

  const openDeleteModal = (projectId: string) => {
    setProjectToDelete(projectId)
    setShowDeleteModal(true)
    
    // Close dropdown
    const dropdown = document.getElementById(`dropdown-${projectId}`)
    if (dropdown) {
      dropdown.classList.add('hidden')
    }
  }

  const openTeamModal = (projectId: string) => {
    setProjectForTeam(projectId)
    fetchProjectMembers(projectId)
    setShowTeamModal(true)
    
    // Close dropdown
    const dropdown = document.getElementById(`dropdown-${projectId}`)
    if (dropdown) {
      dropdown.classList.add('hidden')
    }
  }

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // First sort by ownership (owned projects first)
      if (a.user_id === user?.id && b.user_id !== user?.id) return -1
      if (a.user_id !== user?.id && b.user_id === user?.id) return 1
      
      // Then sort by updated_at (most recent first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getMemberCount = (projectId: string) => {
    if (projectForTeam === projectId) {
      return projectMembers.length;
    }
    
    // Find the project and return its member count
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    
    // If the project has a member_count property, use it
    if ('member_count' in project) {
      return project.member_count || 0;
    }
    
    // Default to 1 (at least the owner)
    return 1;
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover self-start lg:self-auto"
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
              {loading ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                    <span>Loading projects...</span>
                  </div>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const isOwner = project.user_id === user.id
                    
                    return (
                      <div
                        key={project.id}
                        className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700/50 transition-all duration-300 group"
                      >
                        {/* Project Header */}
                        <div className="p-6 border-b border-zinc-800/50">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => navigate(`/project-space/${project.id}`)}
                            >
                              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400">
                                {isOwner ? (
                                  <Layers size={20} />
                                ) : (
                                  <UserPlus size={20} />
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                  {project.name}
                                  {!isOwner && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                      Invited
                                    </span>
                                  )}
                                </h3>
                                {project.description && (
                                  <p className="text-sm text-zinc-400 line-clamp-1">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="relative" ref={el => dropdownRefs.current[project.id] = el}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDropdown(project.id)
                                }}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {/* Dropdown Menu */}
                              <div
                                id={`dropdown-${project.id}`}
                                className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-10 hidden"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => openRenameModal(project.id, project.name)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white w-full text-left"
                                  >
                                    <Edit3 size={14} />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    onClick={() => openTeamModal(project.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white w-full text-left"
                                  >
                                    <Users size={14} />
                                    <span>Manage Team</span>
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(project.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full text-left"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Project Stats */}
                        <div className="p-6">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Users size={14} />
                              <span>{getMemberCount(project.id)} members</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500">
                              <Clock size={14} />
                              <span>Updated {formatDate(project.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                    <Layers className="mx-auto text-zinc-500 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No projects found
                    </h3>
                    <p className="text-zinc-400 mb-6">
                      {searchQuery ? 'Try adjusting your search query' : 'Create your first project to get started'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                      >
                        <Plus size={16} />
                        <span>Create Project</span>
                      </button>
                    )}
                  </div>
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
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
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
                    Description <span className="text-zinc-500">(optional)</span>
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description"
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
                      onClick={() => setNewProjectVisibility('private')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        newProjectVisibility === 'private'
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-sm font-medium">Private</span>
                      <span className="text-xs text-center">Only you</span>
                    </button>
                    <button
                      onClick={() => setNewProjectVisibility('team')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        newProjectVisibility === 'team'
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-sm font-medium">Team</span>
                      <span className="text-xs text-center">Invited only</span>
                    </button>
                    <button
                      onClick={() => setNewProjectVisibility('public')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        newProjectVisibility === 'public'
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-sm font-medium">Public</span>
                      <span className="text-xs text-center">Everyone</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isCreating}
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

      {/* Rename Project Modal */}
      <AnimatePresence>
        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRenameModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Rename Project</h2>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    New Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter new project name"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameProject}
                  disabled={!newName.trim() || isRenaming}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isRenaming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Renaming...</span>
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} />
                      <span>Rename</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Delete Project</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <p className="text-red-300 text-sm">
                    This action cannot be undone. All nodes and connections in this project will be permanently deleted.
                  </p>
                </div>
                
                <p className="text-zinc-300">
                  Are you sure you want to delete this project?
                </p>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Management Modal */}
      <AnimatePresence>
        {showTeamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTeamModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">Manage Team</h2>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Current Members */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
                  
                  <div className="space-y-2">
                    <TeamMembersDisplay 
                      projectId={projectForTeam || ''} 
                      currentUserRole={null} 
                    />
                  </div>
                </div>
                
                {/* Invite New Member */}
                <div className="pt-4 border-t border-zinc-800/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Invite New Member</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Role
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as any)}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      >
                        <option value="viewer">Viewer (read-only)</option>
                        <option value="editor">Editor (can edit)</option>
                        <option value="admin">Admin (full access)</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={handleInviteMember}
                      disabled={!newMemberEmail.trim() || isInviting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed w-full justify-center"
                    >
                      {isInviting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending Invitation...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          <span>Send Invitation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end p-6 border-t border-zinc-800/50 flex-shrink-0">
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Close
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