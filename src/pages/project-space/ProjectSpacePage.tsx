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
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { 
    projects, 
    loading, 
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    currentProject,
    selectProject
  } = useProjectSpaceStore()

  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<FlowProject | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<FlowProject | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectVisibility, setNewProjectVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isViewingProject, setIsViewingProject] = useState(false)

  // Get project ID from URL
  const projectId = searchParams.get('project')

  // Load projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  // Handle project selection from URL
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        selectProject(project)
        setIsViewingProject(true)
      }
    } else {
      setIsViewingProject(false)
      selectProject(null)
    }
  }, [projectId, projects, selectProject])

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    try {
      await createProject({
        name: newProjectName,
        description: newProjectDescription || undefined,
        visibility: newProjectVisibility
      })
      setShowCreateModal(false)
      setNewProjectName('')
      setNewProjectDescription('')
      setNewProjectVisibility('private')
      showToast('Project created successfully!', 'success')
    } catch (error) {
      showToast('Failed to create project', 'error')
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      await deleteProject(projectToDelete.id)
      setShowDeleteModal(false)
      setProjectToDelete(null)
      showToast('Project deleted successfully!', 'success')
      
      // If we're viewing the deleted project, navigate back
      if (currentProject?.id === projectToDelete.id) {
        navigate('/project-space')
      }
    } catch (error) {
      showToast('Failed to delete project', 'error')
    }
  }

  const handleProjectClick = (project: FlowProject) => {
    navigate(`/project-space?project=${project.id}`)
  }

  const handleBackToProjects = () => {
    navigate('/project-space')
  }

  const renderProjectSpace = () => {
    if (!currentProject) return null

    return (
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToProjects}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                {currentProject.name}
                <div className="flex items-center gap-2">
                  {currentProject.visibility === 'public' ? (
                    <Globe size={18} className="text-green-400" />
                  ) : currentProject.visibility === 'team' ? (
                    <Users size={18} className="text-blue-400" />
                  ) : (
                    <Lock size={18} className="text-zinc-400" />
                  )}
                </div>
              </h1>
              {currentProject.description && (
                <p className="text-zinc-400 mt-1">{currentProject.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TeamMembersDisplay projectId={currentProject.id} />
            
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all duration-200"
            >
              <UserPlus size={16} />
              <span>Invite</span>
            </button>

            <button
              onClick={() => {
                setSelectedProject(currentProject)
                setShowSettingsModal(true)
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Project Canvas Placeholder */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 min-h-[600px] flex items-center justify-center">
          <div className="text-center">
            <Layers size={48} className="text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Project Canvas</h3>
            <p className="text-zinc-400 mb-6">Start building your flow by adding nodes and connections</p>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover mx-auto">
              <Plus size={16} />
              <span>Add First Node</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader className="animate-spin" size={20} />
          <span>Loading projects...</span>
        </div>
      </div>
    )
  }

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

                  {/* Projects Grid */}
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <Layers size={48} className="text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {searchQuery ? 'No projects found' : 'No projects yet'}
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        {searchQuery 
                          ? 'Try adjusting your search terms'
                          : 'Create your first project to get started'
                        }
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover mx-auto"
                        >
                          <Plus size={16} />
                          <span>Create Project</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProjects.map((project) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-200 cursor-pointer"
                          onClick={() => handleProjectClick(project)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                                <Layers size={20} className="text-indigo-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                  {project.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {project.visibility === 'public' ? (
                                    <Globe size={14} className="text-green-400" />
                                  ) : project.visibility === 'team' ? (
                                    <Users size={14} className="text-blue-400" />
                                  ) : (
                                    <Lock size={14} className="text-zinc-400" />
                                  )}
                                  <span className="text-xs text-zinc-500 capitalize">
                                    {project.visibility}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProject(project)
                                  setShowSettingsModal(true)
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all duration-200"
                              >
                                <Settings size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProjectToDelete(project)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {project.description && (
                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              Updated {new Date(project.updated_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <Eye size={12} />
                              <span>0 views</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['private', 'team', 'public'] as const).map((visibility) => (
                      <button
                        key={visibility}
                        onClick={() => setNewProjectVisibility(visibility)}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          newProjectVisibility === visibility
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {visibility === 'private' && <Lock size={16} />}
                          {visibility === 'team' && <Users size={16} />}
                          {visibility === 'public' && <Globe size={16} />}
                          <span className="text-xs capitalize">{visibility}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && projectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Delete Project</h2>
                  <p className="text-sm text-zinc-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-zinc-300 mb-6">
                Are you sure you want to delete <strong>{projectToDelete.name}</strong>? 
                All project data, including nodes and connections, will be permanently removed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Delete Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}