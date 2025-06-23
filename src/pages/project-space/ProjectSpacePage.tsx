import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  NodeChange,
  EdgeChange,
  ConnectionLineType,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Menu, 
  Plus, 
  Settings, 
  Save, 
  Trash2, 
  Edit3, 
  Copy, 
  Layers, 
  Users, 
  Share2, 
  Eye, 
  EyeOff,
  Globe,
  UserPlus,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Upload,
  Type,
  GitBranch,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { Toast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore, FlowNode, FlowProject } from '../../store/projectSpaceStore'
import { NodeDetailsModal } from '../../components/project-space/NodeDetailsModal'
import { NodeEditorModal } from '../../components/project-space/NodeEditorModal'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'

// Custom node components
import InputNode from './nodes/InputNode'
import PromptNode from './nodes/PromptNode'
import ConditionNode from './nodes/ConditionNode'
import OutputNode from './nodes/OutputNode'

// Define node types for ReactFlow
const nodeTypes: NodeTypes = {
  input: InputNode,
  prompt: PromptNode,
  condition: ConditionNode,
  output: OutputNode
}

export const ProjectSpacePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [showNodeDetails, setShowNodeDetails] = useState(false)
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [isCreatingNode, setIsCreatingNode] = useState(false)
  const [newNodeType, setNewNodeType] = useState<'input' | 'prompt' | 'condition' | 'output'>('prompt')
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [showProjectSettings, setShowProjectSettings] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  
  const { user, loading: authLoading } = useAuthStore()
  const { 
    projects,
    selectedProject,
    currentUserRole,
    loading,
    fetchProjects,
    selectProject,
    createProject,
    updateProject,
    createNode,
    updateNode,
    deleteNode,
    createConnection,
    deleteConnection,
    fetchProjectMembers,
    subscribeToProject
  } = useProjectSpaceStore()

  // Load projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  // Select project when projectId changes
  useEffect(() => {
    const loadProject = async () => {
      if (!user || !projectId) {
        setIsLoading(false)
        return
      }

      try {
        // Find project in loaded projects
        const project = projects.find(p => p.id === projectId)
        
        if (project) {
          await selectProject(project)
          
          // Fetch project members
          await fetchProjectMembers(projectId)
          
          // Subscribe to real-time updates
          const unsubscribe = subscribeToProject(projectId)
          return unsubscribe
        } else {
          // If not found, try to navigate to projects list
          navigate('/project-space')
          setToast({ message: 'Project not found', type: 'error' })
        }
      } catch (error) {
        console.error('Error loading project:', error)
        setToast({ message: 'Failed to load project', type: 'error' })
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    loadProject()
  }, [projectId, user, projects, selectProject, fetchProjectMembers, subscribeToProject, navigate])

  // Convert flow nodes to ReactFlow nodes
  useEffect(() => {
    if (selectedProject?.nodes) {
      const flowNodes = selectedProject.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { 
          label: node.title,
          content: node.content,
          node: node
        }
      }))
      
      setNodes(flowNodes)
    } else {
      setNodes([])
    }
  }, [selectedProject?.nodes, setNodes])

  // Convert flow connections to ReactFlow edges
  useEffect(() => {
    if (selectedProject?.connections) {
      const flowEdges = selectedProject.connections.map(conn => ({
        id: conn.id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        }
      }))
      
      setEdges(flowEdges)
    } else {
      setEdges([])
    }
  }, [selectedProject?.connections, setEdges])

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const flowNode = selectedProject?.nodes?.find(n => n.id === node.id)
    if (flowNode) {
      setSelectedNode(flowNode)
      setShowNodeDetails(true)
    }
  }, [selectedProject?.nodes])

  // Handle node edit
  const handleEditNode = useCallback((nodeId: string) => {
    const flowNode = selectedProject?.nodes?.find(n => n.id === nodeId)
    if (flowNode) {
      setSelectedNode(flowNode)
      setShowNodeEditor(true)
    }
  }, [selectedProject?.nodes])

  // Handle node save
  const handleSaveNode = useCallback(async (nodeId: string, updates: Partial<FlowNode>) => {
    try {
      await updateNode(nodeId, updates)
      setToast({ message: 'Node updated successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to update node:', error)
      setToast({ message: 'Failed to update node', type: 'error' })
    }
  }, [updateNode])

  // Handle node delete
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      await deleteNode(nodeId)
      setToast({ message: 'Node deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete node:', error)
      setToast({ message: 'Failed to delete node', type: 'error' })
    }
  }, [deleteNode])

  // Handle edge creation
  const onConnect = useCallback((params: Connection) => {
    if (!selectedProject) return
    
    createConnection(selectedProject.id, params.source as string, params.target as string)
      .then(() => {
        setToast({ message: 'Connection created', type: 'success' })
      })
      .catch(error => {
        console.error('Failed to create connection:', error)
        setToast({ message: 'Failed to create connection', type: 'error' })
      })
  }, [selectedProject, createConnection])

  // Handle edge deletion
  const onEdgesDelete = useCallback((edges: Edge[]) => {
    edges.forEach(edge => {
      deleteConnection(edge.id)
        .catch(error => {
          console.error('Failed to delete connection:', error)
          setToast({ message: 'Failed to delete connection', type: 'error' })
        })
    })
  }, [deleteConnection])

  // Handle node creation
  const handleCreateNode = useCallback((type: 'input' | 'prompt' | 'condition' | 'output') => {
    if (!selectedProject || !reactFlowInstance) return
    
    // Calculate center position of the viewport
    const { x, y, zoom } = reactFlowInstance.getViewport()
    const centerX = -x / zoom + (reactFlowWrapper.current?.clientWidth || 800) / 2 / zoom
    const centerY = -y / zoom + (reactFlowWrapper.current?.clientHeight || 600) / 2 / zoom
    
    // Create a temporary node ID for the editor
    const tempNode: FlowNode = {
      id: `temp-${Date.now()}`,
      project_id: selectedProject.id,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: '',
      position: { x: centerX, y: centerY },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setSelectedNode(tempNode)
    setIsCreatingNode(true)
    setShowNodeEditor(true)
    setShowNodeMenu(false)
  }, [selectedProject, reactFlowInstance])

  // Handle project creation
  const handleCreateProject = useCallback(async () => {
    if (!user) return
    
    try {
      const newProject = await createProject('New Project', 'A new flow project')
      navigate(`/project/${newProject.id}`)
      setToast({ message: 'Project created successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to create project:', error)
      setToast({ message: 'Failed to create project', type: 'error' })
    }
  }, [user, createProject, navigate])

  // Handle project update
  const handleUpdateProject = useCallback(async (updates: Partial<FlowProject>) => {
    if (!selectedProject) return
    
    try {
      setIsSaving(true)
      await updateProject(selectedProject.id, updates)
      setToast({ message: 'Project updated successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to update project:', error)
      setToast({ message: 'Failed to update project', type: 'error' })
    } finally {
      setIsSaving(false)
      setShowProjectSettings(false)
    }
  }, [selectedProject, updateProject])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }, [])

  // Check if user can edit the project
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'editor' || selectedProject?.user_id === user?.id

  if (authLoading || loading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading project space...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Layers className="mx-auto text-zinc-400 mb-4" size={64} />
          <h1 className="text-4xl font-bold text-white mb-4">
            Access Required
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Please sign in to access the project space
          </p>
        </div>
        <BoltBadge />
      </div>
    )
  }

  // If no projectId is provided, show project list
  if (!projectId) {
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
              <div className="w-full max-w-6xl px-6 mx-auto py-8">
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
                    onClick={handleCreateProject}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
                  >
                    <Plus size={16} />
                    <span>New Project</span>
                  </button>
                </div>

                {/* Projects Grid */}
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400">
                            <Layers size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {project.name}
                            </h3>
                            <p className="text-xs text-zinc-500">
                              {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Zap size={12} className="text-indigo-400" />
                              <span>{project.nodes?.length || 0} nodes</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {project.visibility === 'private' ? (
                                <EyeOff size={12} className="text-amber-400" />
                              ) : project.visibility === 'team' ? (
                                <Users size={12} className="text-blue-400" />
                              ) : (
                                <Globe size={12} className="text-emerald-400" />
                              )}
                              <span className={
                                project.visibility === 'private' ? 'text-amber-400' : 
                                project.visibility === 'team' ? 'text-blue-400' : 
                                'text-emerald-400'
                              }>
                                {project.visibility}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                      <Layers className="mx-auto text-zinc-500 mb-4" size={64} />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No projects yet
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        Create your first project to get started
                      </p>
                      <button
                        onClick={handleCreateProject}
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

  // If project not found
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Layers className="mx-auto text-zinc-400 mb-4" size={64} />
          <h1 className="text-4xl font-bold text-white mb-4">
            Project Not Found
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/project-space')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
          >
            <Layers size={16} />
            <span>Back to Projects</span>
          </button>
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
                
                <h1 className="text-lg font-semibold text-white truncate">
                  {selectedProject.name}
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Project Header */}
          <div className="relative z-20 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/project-space')}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                  >
                    <Layers size={20} />
                  </button>
                  
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      {selectedProject.name}
                    </h1>
                    <p className="text-sm text-zinc-400">
                      {selectedProject.description || 'No description'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Team Members Display */}
                  <TeamMembersDisplay 
                    projectId={selectedProject.id} 
                    currentUserRole={currentUserRole}
                  />
                  
                  {/* Project Settings */}
                  <button
                    onClick={() => setShowProjectSettings(true)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                    title="Project settings"
                  >
                    <Settings size={20} />
                  </button>
                  
                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ReactFlow Canvas */}
          <div className="flex-1 relative z-10" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgesDelete={onEdgesDelete}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              defaultEdgeOptions={{
                type: 'smoothstep',
                style: { stroke: '#6366f1' },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#6366f1',
                }
              }}
              fitView
              onInit={setReactFlowInstance}
              proOptions={{ hideAttribution: true }}
              className="bg-zinc-950"
            >
              <Background color="#3f3f46" gap={16} />
              <Controls />
              <MiniMap 
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'input': return '#8b5cf6';
                    case 'prompt': return '#3b82f6';
                    case 'condition': return '#eab308';
                    case 'output': return '#22c55e';
                    default: return '#6366f1';
                  }
                }}
                maskColor="rgba(0, 0, 0, 0.5)"
                className="bg-zinc-900/80 border border-zinc-800/50 rounded-lg"
              />
              
              {/* Node Creation Panel */}
              {canEdit && (
                <Panel position="top-left" className="ml-4 mt-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowNodeMenu(!showNodeMenu)}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                    >
                      <Plus size={18} />
                      <span>Add Node</span>
                    </button>
                    
                    <AnimatePresence>
                      {showNodeMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-48"
                        >
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => handleCreateNode('input')}
                              className="flex items-center gap-3 w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <div className="p-1.5 bg-purple-500/20 rounded-md text-purple-400">
                                <Upload size={14} />
                              </div>
                              <span>Input Node</span>
                            </button>
                            <button
                              onClick={() => handleCreateNode('prompt')}
                              className="flex items-center gap-3 w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-400">
                                <Type size={14} />
                              </div>
                              <span>Prompt Node</span>
                            </button>
                            <button
                              onClick={() => handleCreateNode('condition')}
                              className="flex items-center gap-3 w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <div className="p-1.5 bg-yellow-500/20 rounded-md text-yellow-400">
                                <GitBranch size={14} />
                              </div>
                              <span>Condition Node</span>
                            </button>
                            <button
                              onClick={() => handleCreateNode('output')}
                              className="flex items-center gap-3 w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <div className="p-1.5 bg-green-500/20 rounded-md text-green-400">
                                <Target size={14} />
                              </div>
                              <span>Output Node</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Node Details Modal */}
      <NodeDetailsModal
        isOpen={showNodeDetails}
        onClose={() => setShowNodeDetails(false)}
        node={selectedNode}
        onEdit={canEdit ? handleEditNode : undefined}
      />

      {/* Node Editor Modal */}
      <NodeEditorModal
        isOpen={showNodeEditor}
        onClose={() => {
          setShowNodeEditor(false)
          setIsCreatingNode(false)
          setSelectedNode(null)
        }}
        node={selectedNode}
        onSave={handleSaveNode}
      />

      {/* Project Settings Modal */}
      <AnimatePresence>
        {showProjectSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectSettings(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Settings className="text-indigo-400" size={20} />
                  <h2 className="text-xl font-semibold text-white">
                    Project Settings
                  </h2>
                </div>
                
                <button
                  onClick={() => setShowProjectSettings(false)}
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
                    defaultValue={selectedProject.name}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    onBlur={(e) => {
                      if (e.target.value !== selectedProject.name && e.target.value.trim()) {
                        handleUpdateProject({ name: e.target.value })
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedProject.description || ''}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none h-24"
                    onBlur={(e) => {
                      if (e.target.value !== selectedProject.description) {
                        handleUpdateProject({ description: e.target.value || null })
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleUpdateProject({ visibility: 'private' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        selectedProject.visibility === 'private' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <EyeOff size={20} />
                      <span className="text-xs">Private</span>
                    </button>
                    <button
                      onClick={() => handleUpdateProject({ visibility: 'team' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        selectedProject.visibility === 'team' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-xs">Team</span>
                    </button>
                    <button
                      onClick={() => handleUpdateProject({ visibility: 'public' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        selectedProject.visibility === 'public' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-xs">Public</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/30 flex items-center justify-between">
                <button
                  onClick={() => setShowProjectSettings(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement project delete
                    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                      // deleteProject(selectedProject.id)
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200"
                >
                  <Trash2 size={16} />
                  <span>Delete Project</span>
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