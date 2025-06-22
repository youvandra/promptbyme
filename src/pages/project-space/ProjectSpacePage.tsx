import React, { useState, useEffect, useRef } from 'react'
import { Menu, Plus, Trash2, Edit3, Save, X, Settings, Share2, Users, Download, Upload, GitBranch, Target, Type, Info, MoreHorizontal, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { Toast } from '../../components/ui/Toast'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { NodeEditorModal } from '../../components/project-space/NodeEditorModal'
import { NodeDetailsModal } from '../../components/project-space/NodeDetailsModal'
import { PromptImportModal } from '../../components/project-space/PromptImportModal'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore, FlowNode, FlowConnection } from '../../store/projectSpaceStore'
import { useToast } from '../../hooks/useToast'

export const ProjectSpacePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [showNodeEditorModal, setShowNodeEditorModal] = useState(false)
  const [showNodeDetailsModal, setShowNodeDetailsModal] = useState(false)
  const [showPromptImportModal, setShowPromptImportModal] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [editProjectName, setEditProjectName] = useState('')
  const [editProjectDescription, setEditProjectDescription] = useState('')
  const [editProjectVisibility, setEditProjectVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [creatingProject, setCreatingProject] = useState(false)
  const [updatingProject, setUpdatingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [newNodeType, setNewNodeType] = useState<'input' | 'prompt' | 'condition' | 'output'>('prompt')
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [isCreatingConnection, setIsCreatingConnection] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; x: number; y: number } | null>(null)
  const [connectionEnd, setConnectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [isInviting, setIsInviting] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const projectMenuRef = useRef<HTMLDivElement>(null)
  
  const { toast, showToast, hideToast } = useToast()
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { 
    projects, 
    selectedProject: activeProject,
    currentUserRole,
    loading, 
    fetchProjects, 
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    createConnection,
    deleteConnection,
    inviteProjectMember,
    subscribeToProject
  } = useProjectSpaceStore()

  // Initialize auth
  useEffect(() => {
    initialize()
  }, [initialize])

  // Load projects when user is available
  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  // Select first project by default if none selected
  useEffect(() => {
    if (!loading && projects.length > 0 && !selectedProject) {
      handleSelectProject(projects[0].id)
    }
  }, [loading, projects, selectedProject])

  // Set up subscription to selected project
  useEffect(() => {
    if (activeProject) {
      const unsubscribe = subscribeToProject(activeProject.id)
      return unsubscribe
    }
  }, [activeProject, subscribeToProject])

  // Close project menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle canvas click for node placement
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!activeProject || !isAddingNode || !canvasRef.current) return
    
    // Get canvas bounds
    const rect = canvasRef.current.getBoundingClientRect()
    
    // Calculate position relative to canvas
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Create a temporary node for the editor
    const tempNode: FlowNode = {
      id: `temp-${Date.now()}`,
      project_id: activeProject.id,
      type: newNodeType,
      title: `New ${newNodeType.charAt(0).toUpperCase() + newNodeType.slice(1)}`,
      content: '',
      position: { x, y },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setSelectedNode(tempNode)
    setShowNodeEditorModal(true)
    setIsAddingNode(false)
  }

  // Handle node drag
  const handleNodeDrag = (nodeId: string, newPosition: { x: number; y: number }) => {
    if (!activeProject) return
    
    moveNode(nodeId, newPosition)
  }

  // Handle node click
  const handleNodeClick = (node: FlowNode, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isAddingNode) {
      setIsAddingNode(false)
      return
    }
    
    if (isCreatingConnection) {
      if (connectionStart && connectionStart.nodeId !== node.id) {
        // Complete connection
        createConnection(activeProject!.id, connectionStart.nodeId, node.id)
          .then(() => {
            showToast('Connection created', 'success')
          })
          .catch(error => {
            console.error('Failed to create connection:', error)
            showToast('Failed to create connection', 'error')
          })
      }
      
      setIsCreatingConnection(false)
      setConnectionStart(null)
      setConnectionEnd(null)
      return
    }
    
    setSelectedNode(node)
    setShowNodeDetailsModal(true)
  }

  // Handle node connection start
  const handleNodeConnectionStart = (node: FlowNode, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!activeProject) return
    
    setIsCreatingConnection(true)
    setConnectionStart({
      nodeId: node.id,
      x: node.position.x,
      y: node.position.y
    })
    setConnectionEnd({
      x: node.position.x,
      y: node.position.y
    })
  }

  // Handle mouse move during connection creation
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCreatingConnection || !connectionStart || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    setConnectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  // Handle canvas mouse up
  const handleCanvasMouseUp = () => {
    if (isCreatingConnection) {
      setIsCreatingConnection(false)
      setConnectionStart(null)
      setConnectionEnd(null)
    }
  }

  // Handle node deletion
  const handleDeleteNode = (nodeId: string) => {
    if (!activeProject) return
    
    if (window.confirm('Are you sure you want to delete this node?')) {
      deleteNode(nodeId)
        .then(() => {
          showToast('Node deleted', 'success')
        })
        .catch(error => {
          console.error('Failed to delete node:', error)
          showToast('Failed to delete node', 'error')
        })
    }
  }

  // Handle connection deletion
  const handleDeleteConnection = (connectionId: string) => {
    if (!activeProject) return
    
    if (window.confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(connectionId)
        .then(() => {
          showToast('Connection deleted', 'success')
        })
        .catch(error => {
          console.error('Failed to delete connection:', error)
          showToast('Failed to delete connection', 'error')
        })
    }
  }

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId)
    
    const project = projects.find(p => p.id === projectId)
    if (project) {
      selectProject(project)
        .catch(error => {
          console.error('Failed to select project:', error)
          showToast('Failed to load project', 'error')
        })
    }
  }

  // Handle project creation
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    setCreatingProject(true)
    try {
      await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined)
      setShowCreateProjectModal(false)
      setNewProjectName('')
      setNewProjectDescription('')
      showToast('Project created successfully', 'success')
    } catch (error) {
      console.error('Failed to create project:', error)
      showToast('Failed to create project', 'error')
    } finally {
      setCreatingProject(false)
    }
  }

  // Handle project update
  const handleUpdateProject = async () => {
    if (!activeProject || !editProjectName.trim()) return
    
    setUpdatingProject(true)
    try {
      await updateProject(activeProject.id, {
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || undefined,
        visibility: editProjectVisibility
      })
      setShowEditProjectModal(false)
      showToast('Project updated successfully', 'success')
    } catch (error) {
      console.error('Failed to update project:', error)
      showToast('Failed to update project', 'error')
    } finally {
      setUpdatingProject(false)
    }
  }

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!activeProject) return
    
    if (!window.confirm(`Are you sure you want to delete "${activeProject.name}"? This action cannot be undone.`)) {
      return
    }
    
    setDeletingProject(true)
    try {
      await deleteProject(activeProject.id)
      setSelectedProject(null)
      showToast('Project deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete project:', error)
      showToast('Failed to delete project', 'error')
    } finally {
      setDeletingProject(false)
      setShowProjectMenu(false)
    }
  }

  // Handle node update
  const handleUpdateNode = async (nodeId: string, updates: Partial<FlowNode>) => {
    if (!activeProject) return
    
    try {
      await updateNode(nodeId, updates)
      showToast('Node updated successfully', 'success')
    } catch (error) {
      console.error('Failed to update node:', error)
      showToast('Failed to update node', 'error')
      throw error
    }
  }

  // Handle node edit button click
  const handleEditNode = (nodeId: string) => {
    if (!activeProject) return
    
    const node = activeProject.nodes?.find(n => n.id === nodeId)
    if (node) {
      setSelectedNode(node)
      setShowNodeEditorModal(true)
    }
  }

  // Open edit project modal
  const handleOpenEditProjectModal = () => {
    if (!activeProject) return
    
    setEditProjectName(activeProject.name)
    setEditProjectDescription(activeProject.description || '')
    setEditProjectVisibility(activeProject.visibility || 'private')
    setShowEditProjectModal(true)
    setShowProjectMenu(false)
  }

  // Handle member invitation
  const handleInviteMember = async () => {
    if (!activeProject || !inviteEmail.trim()) return
    
    setIsInviting(true)
    try {
      await inviteProjectMember(activeProject.id, inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      setInviteRole('viewer')
      setShowInviteModal(false)
      showToast('Invitation sent successfully', 'success')
    } catch (error: any) {
      console.error('Failed to invite member:', error)
      showToast(error.message || 'Failed to invite member', 'error')
    } finally {
      setIsInviting(false)
    }
  }

  // Get node type configuration
  const getNodeTypeConfig = (type: string) => {
    switch (type) {
      case 'input':
        return { 
          icon: Upload, 
          color: 'bg-purple-500',
          borderColor: 'border-purple-500/50',
          hoverColor: 'hover:bg-purple-500/10'
        }
      case 'prompt':
        return { 
          icon: Type, 
          color: 'bg-blue-500',
          borderColor: 'border-blue-500/50',
          hoverColor: 'hover:bg-blue-500/10'
        }
      case 'condition':
        return { 
          icon: GitBranch, 
          color: 'bg-yellow-500',
          borderColor: 'border-yellow-500/50',
          hoverColor: 'hover:bg-yellow-500/10'
        }
      case 'output':
        return { 
          icon: Target, 
          color: 'bg-green-500',
          borderColor: 'border-green-500/50',
          hoverColor: 'hover:bg-green-500/10'
        }
      default:
        return { 
          icon: Type, 
          color: 'bg-blue-500',
          borderColor: 'border-blue-500/50',
          hoverColor: 'hover:bg-blue-500/10'
        }
    }
  }

  // Calculate connection path
  const calculateConnectionPath = (connection: FlowConnection) => {
    if (!activeProject?.nodes) return ''
    
    const sourceNode = activeProject.nodes.find(n => n.id === connection.source_node_id)
    const targetNode = activeProject.nodes.find(n => n.id === connection.target_node_id)
    
    if (!sourceNode || !targetNode) return ''
    
    const sourceX = sourceNode.position.x + 100 // Assuming node width is 200px
    const sourceY = sourceNode.position.y + 50 // Assuming node height is 100px
    const targetX = targetNode.position.x
    const targetY = targetNode.position.y + 50 // Assuming node height is 100px
    
    // Calculate control points for the curve
    const dx = Math.abs(targetX - sourceX)
    const controlX1 = sourceX + dx * 0.3
    const controlX2 = targetX - dx * 0.3
    
    return `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`
  }

  // Calculate temporary connection path
  const calculateTempConnectionPath = () => {
    if (!connectionStart || !connectionEnd) return ''
    
    // Calculate control points for the curve
    const dx = Math.abs(connectionEnd.x - connectionStart.x)
    const controlX1 = connectionStart.x + dx * 0.3
    const controlX2 = connectionEnd.x - dx * 0.3
    
    return `M ${connectionStart.x} ${connectionStart.y} C ${controlX1} ${connectionStart.y}, ${controlX2} ${connectionEnd.y}, ${connectionEnd.x} ${connectionEnd.y}`
  }

  // Check if user can edit project
  const canEditProject = () => {
    if (!activeProject || !currentUserRole) return false
    return activeProject.user_id === user?.id || ['admin', 'editor'].includes(currentUserRole)
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
              <Layers size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access the project space
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
                  Project Space
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col">
            {/* Project Header */}
            <div className="border-b border-zinc-800/50 backdrop-blur-xl">
              <div className="px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Project Selector */}
                    <div className="relative" ref={projectMenuRef}>
                      <button
                        onClick={() => setShowProjectMenu(!showProjectMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-xl transition-all duration-200"
                      >
                        <span className="text-white font-medium truncate max-w-[150px] md:max-w-[200px]">
                          {activeProject ? activeProject.name : 'Select Project'}
                        </span>
                        <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${showProjectMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showProjectMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
                          >
                            <div className="p-2">
                              {/* Create New Project Button */}
                              <button
                                onClick={() => {
                                  setShowCreateProjectModal(true)
                                  setShowProjectMenu(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:bg-indigo-600/10 hover:text-indigo-300 rounded-lg transition-all duration-200 text-left"
                              >
                                <Plus size={16} />
                                <span>Create New Project</span>
                              </button>
                              
                              <div className="border-t border-zinc-800 my-2"></div>
                              
                              {/* Project List */}
                              {projects.length === 0 ? (
                                <div className="px-3 py-2 text-zinc-500 text-sm">
                                  No projects found
                                </div>
                              ) : (
                                projects.map(project => (
                                  <button
                                    key={project.id}
                                    onClick={() => {
                                      handleSelectProject(project.id)
                                      setShowProjectMenu(false)
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-left ${
                                      selectedProject === project.id
                                        ? 'bg-indigo-600/20 text-indigo-300'
                                        : 'text-white hover:bg-zinc-800/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Layers size={16} className="flex-shrink-0" />
                                      <span className="truncate">{project.name}</span>
                                    </div>
                                    
                                    {selectedProject === project.id && (
                                      <div className="flex items-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleOpenEditProjectModal()
                                          }}
                                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                                          title="Edit project"
                                        >
                                          <Edit3 size={14} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteProject()
                                          }}
                                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                                          title="Delete project"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Project Description */}
                    {activeProject && (
                      <p className="text-zinc-400 text-sm hidden md:block">
                        {activeProject.description || 'No description'}
                      </p>
                    )}
                  </div>
                  
                  {/* Project Tools */}
                  {activeProject && (
                    <div className="flex items-center gap-3">
                      {/* Team Members */}
                      <div className="flex items-center gap-2">
                        <TeamMembersDisplay 
                          projectId={activeProject.id}
                          currentUserRole={currentUserRole}
                        />
                      </div>
                      
                      {/* Invite Button */}
                      {(activeProject.user_id === user.id || currentUserRole === 'admin') && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all duration-200 text-sm"
                        >
                          <Plus size={14} />
                          <span>Invite</span>
                        </button>
                      )}
                      
                      {/* Project Settings */}
                      <button
                        onClick={handleOpenEditProjectModal}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                        title="Project settings"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                    <span>Loading project...</span>
                  </div>
                </div>
              ) : !activeProject ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Layers size={32} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Project Selected</h2>
                    <p className="text-zinc-400 mb-6">
                      {projects.length === 0 
                        ? 'Create your first project to get started with visual prompt flows.'
                        : 'Select a project from the dropdown above to start working.'}
                    </p>
                    <button
                      onClick={() => setShowCreateProjectModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                    >
                      <Plus size={16} />
                      <span>Create Project</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  ref={canvasRef}
                  className="absolute inset-0 bg-zinc-950"
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  style={{ cursor: isAddingNode ? 'crosshair' : 'default' }}
                >
                  {/* Grid Background */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
                  
                  {/* Connections */}
                  <svg className="absolute inset-0 pointer-events-none">
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                      </marker>
                    </defs>
                    
                    {/* Existing Connections */}
                    {activeProject.connections?.map(connection => (
                      <g key={connection.id}>
                        <path
                          d={calculateConnectionPath(connection)}
                          stroke="#8b5cf6"
                          strokeWidth="2"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConnection(connection.id)
                          }}
                        />
                      </g>
                    ))}
                    
                    {/* Temporary Connection */}
                    {isCreatingConnection && connectionStart && connectionEnd && (
                      <path
                        d={calculateTempConnectionPath()}
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                    )}
                  </svg>
                  
                  {/* Nodes */}
                  {activeProject.nodes?.map(node => {
                    const nodeConfig = getNodeTypeConfig(node.type)
                    const NodeIcon = nodeConfig.icon
                    const isHovered = hoveredNode === node.id
                    
                    return (
                      <motion.div
                        key={node.id}
                        className={`absolute bg-zinc-900/80 backdrop-blur-sm border ${nodeConfig.borderColor} rounded-xl shadow-lg w-[200px] cursor-grab ${isHovered ? nodeConfig.hoverColor : ''}`}
                        style={{
                          left: node.position.x,
                          top: node.position.y,
                          zIndex: isHovered ? 10 : 1
                        }}
                        drag={canEditProject()}
                        dragMomentum={false}
                        onDragStart={() => setIsDraggingNode(true)}
                        onDragEnd={(e, info) => {
                          setIsDraggingNode(false)
                          handleNodeDrag(node.id, {
                            x: node.position.x + info.offset.x,
                            y: node.position.y + info.offset.y
                          })
                        }}
                        onClick={(e) => !isDraggingNode && handleNodeClick(node, e)}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        {/* Node Header */}
                        <div className="flex items-center justify-between p-3 border-b border-zinc-800/50">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 ${nodeConfig.color} rounded-lg`}>
                              <NodeIcon size={14} className="text-white" />
                            </div>
                            <h3 className="text-sm font-medium text-white truncate max-w-[120px]">
                              {node.title}
                            </h3>
                          </div>
                          
                          {canEditProject() && (
                            <div className="flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditNode(node.id)
                                }}
                                className="p-1 text-zinc-400 hover:text-white transition-colors"
                                title="Edit node"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteNode(node.id)
                                }}
                                className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Delete node"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Node Content Preview */}
                        <div className="p-3 text-xs text-zinc-300 max-h-[100px] overflow-hidden">
                          {node.content ? (
                            <div className="line-clamp-4">{node.content}</div>
                          ) : (
                            <div className="text-zinc-500 italic">No content</div>
                          )}
                        </div>
                        
                        {/* Connection Handle */}
                        {canEditProject() && (
                          <div 
                            className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full cursor-pointer border-2 border-zinc-900 hover:scale-125 transition-transform duration-200"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => handleNodeConnectionStart(node, e)}
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Toolbar */}
            {activeProject && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl shadow-lg p-2 flex items-center gap-2">
                  {canEditProject() && (
                    <>
                      <button
                        onClick={() => {
                          setIsAddingNode(true)
                          setNewNodeType('input')
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isAddingNode && newNodeType === 'input'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10'
                        }`}
                        title="Add Input Node"
                      >
                        <Upload size={16} />
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsAddingNode(true)
                          setNewNodeType('prompt')
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isAddingNode && newNodeType === 'prompt'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10'
                        }`}
                        title="Add Prompt Node"
                      >
                        <Type size={16} />
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsAddingNode(true)
                          setNewNodeType('condition')
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isAddingNode && newNodeType === 'condition'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                        title="Add Condition Node"
                      >
                        <GitBranch size={16} />
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsAddingNode(true)
                          setNewNodeType('output')
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isAddingNode && newNodeType === 'output'
                            ? 'bg-green-500/20 text-green-400'
                            : 'text-zinc-400 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                        title="Add Output Node"
                      >
                        <Target size={16} />
                      </button>
                      
                      <div className="h-6 border-r border-zinc-700/50 mx-1"></div>
                      
                      <button
                        onClick={() => setShowPromptImportModal(true)}
                        className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200"
                        title="Import Prompt"
                      >
                        <Download size={16} />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      if (isAddingNode) {
                        setIsAddingNode(false)
                      }
                    }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                    title="Reset View"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateProjectModal(false)} />
            
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
                  onClick={() => setShowCreateProjectModal(false)}
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
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creatingProject}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {creatingProject ? (
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

      {/* Edit Project Modal */}
      <AnimatePresence>
        {showEditProjectModal && activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProjectModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Edit Project</h2>
                <button
                  onClick={() => setShowEditProjectModal(false)}
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
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
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
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
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
                      onClick={() => setEditProjectVisibility('private')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        editProjectVisibility === 'private'
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Lock size={16} />
                      <span className="text-xs">Private</span>
                    </button>
                    <button
                      onClick={() => setEditProjectVisibility('team')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        editProjectVisibility === 'team'
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Users size={16} />
                      <span className="text-xs">Team</span>
                    </button>
                    <button
                      onClick={() => setEditProjectVisibility('public')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        editProjectVisibility === 'public'
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Globe size={16} />
                      <span className="text-xs">Public</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Info size={14} className="text-indigo-400" />
                    Visibility Settings
                  </h4>
                  <div className="text-xs text-zinc-400">
                    {editProjectVisibility === 'private' && (
                      <p>Only you can access this project.</p>
                    )}
                    {editProjectVisibility === 'team' && (
                      <p>Only you and team members you invite can access this project.</p>
                    )}
                    {editProjectVisibility === 'public' && (
                      <p>Anyone with the link can view this project, but only team members can edit.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={handleDeleteProject}
                  disabled={deletingProject}
                  className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  {deletingProject ? (
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  <span>Delete</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEditProjectModal(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProject}
                    disabled={!editProjectName.trim() || updatingProject}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {updatingProject ? (
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Node Editor Modal */}
      <NodeEditorModal
        isOpen={showNodeEditorModal}
        onClose={() => setShowNodeEditorModal(false)}
        node={selectedNode}
        onSave={handleUpdateNode}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        isOpen={showNodeDetailsModal}
        onClose={() => setShowNodeDetailsModal(false)}
        node={selectedNode}
        onEdit={handleEditNode}
      />

      {/* Prompt Import Modal */}
      <PromptImportModal
        isOpen={showPromptImportModal}
        onClose={() => setShowPromptImportModal(false)}
        onSelectPrompt={(prompt) => {
          if (!activeProject || !canvasRef.current) return
          
          // Get canvas center
          const rect = canvasRef.current.getBoundingClientRect()
          const x = rect.width / 2 - 100 // Half node width
          const y = rect.height / 2 - 50 // Half node height
          
          // Create node with imported prompt
          createNode(activeProject.id, 'prompt', { x, y }, prompt.id)
            .then(() => {
              showToast('Prompt imported successfully', 'success')
              setShowPromptImportModal(false)
            })
            .catch(error => {
              console.error('Failed to import prompt:', error)
              showToast('Failed to import prompt', 'error')
            })
        }}
      />

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Invite Team Member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setInviteRole('viewer')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'viewer'
                          ? 'bg-green-600/20 border-green-500/50 text-green-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Eye size={16} />
                      <span className="text-xs">Viewer</span>
                    </button>
                    <button
                      onClick={() => setInviteRole('editor')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'editor'
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Edit3 size={16} />
                      <span className="text-xs">Editor</span>
                    </button>
                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'admin'
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Settings size={16} />
                      <span className="text-xs">Admin</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Info size={14} className="text-indigo-400" />
                    Role Permissions
                  </h4>
                  <div className="text-xs text-zinc-400">
                    {inviteRole === 'viewer' && (
                      <p>Viewers can view the project but cannot make changes.</p>
                    )}
                    {inviteRole === 'editor' && (
                      <p>Editors can view and edit the project, but cannot manage team members.</p>
                    )}
                    {inviteRole === 'admin' && (
                      <p>Admins have full access to edit the project and manage team members.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim() || isInviting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
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
          onClose={hideToast}
        />
      )}

      <BoltBadge />
    </div>
  )
}