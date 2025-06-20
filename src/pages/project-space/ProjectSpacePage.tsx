import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, Plus, Layers, Upload, Edit3, GitBranch, Target, ZoomIn, ZoomOut, Maximize2, Eye, Copy, Trash2, X, Link2, UserPlus, Keyboard, MoreVertical, Clock, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { NodeEditorModal } from '../../components/project-space/NodeEditorModal'
import { NodeDetailsModal } from '../../components/project-space/NodeDetailsModal'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore, FlowNode, FlowConnection } from '../../store/projectSpaceStore'

const NODE_TYPE_CONFIG = {
  input: {
    icon: Upload,
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500/30',
    label: 'Input',
    description: 'Define input parameters'
  },
  prompt: {
    icon: Edit3,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500/30',
    label: 'Prompt',
    description: 'AI prompt instructions'
  },
  condition: {
    icon: GitBranch,
    color: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-500/30',
    label: 'Condition',
    description: 'Conditional logic'
  },
  output: {
    icon: Target,
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-500/30',
    label: 'Output',
    description: 'Output specifications'
  }
}

interface DragState {
  isDragging: boolean
  dragType: 'canvas' | 'node' | null
  draggedNodeId: string | null
  startPosition: { x: number; y: number }
  nodeOffset: { x: number; y: number }
}

interface Viewport {
  x: number
  y: number
  zoom: number
}

export const ProjectSpacePage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [showNodeDetails, setShowNodeDetails] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null)
  const [isConnectMode, setIsConnectMode] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    draggedNodeId: null,
    startPosition: { x: 0, y: 0 },
    nodeOffset: { x: 0, y: 0 }
  })
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [currentZoomDisplay, setCurrentZoomDisplay] = useState<number | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const keysPressed = useRef(new Set<string>())

  const { user, loading: authLoading, initialize } = useAuthStore()
  const {
    projects,
    selectedProject: storeSelectedProject,
    currentUserRole,
    loading,
    fetchProjects,
    createProject,
    selectProject,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    duplicateNode,
    createConnection,
    deleteConnection,
    subscribeToProject
  } = useProjectSpaceStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  // Subscribe to real-time updates for selected project
  useEffect(() => {
    if (storeSelectedProject?.id) {
      const unsubscribe = subscribeToProject(storeSelectedProject.id)
      return unsubscribe
    }
  }, [storeSelectedProject?.id, subscribeToProject])

  // Update local selected project when store changes
  useEffect(() => {
    setSelectedProject(storeSelectedProject)
  }, [storeSelectedProject])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
      
      // Prevent default browser shortcuts when our shortcuts are active
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            // TODO: Implement undo
            setToast({ message: 'Undo (Coming soon)', type: 'success' })
            break
          case 'y':
            e.preventDefault()
            // TODO: Implement redo
            setToast({ message: 'Redo (Coming soon)', type: 'success' })
            break
          case 's':
            e.preventDefault()
            setToast({ message: 'Project auto-saved', type: 'success' })
            break
          case 'a':
            e.preventDefault()
            // Select all nodes (TODO: implement selection)
            setToast({ message: 'Select all (Coming soon)', type: 'success' })
            break
          case 'd':
            e.preventDefault()
            // Duplicate selected (TODO: implement)
            setToast({ message: 'Duplicate (Coming soon)', type: 'success' })
            break
          case '/':
            e.preventDefault()
            setShowShortcuts(true)
            break
        }
      }
      
      // Non-modifier shortcuts
      switch (e.key.toLowerCase()) {
        case 'escape':
          setShowNodeEditor(false)
          setShowNodeDetails(false)
          setShowShortcuts(false)
          break
        case 'delete':
        case 'backspace':
          // TODO: Delete selected nodes
          break
        case '1':
          if (!e.ctrlKey && !e.metaKey) {
            handleAddNode('input')
            setToast({ message: 'Input node created', type: 'success' })
          }
          break
        case '2':
          if (!e.ctrlKey && !e.metaKey) {
            handleAddNode('prompt')
            setToast({ message: 'Prompt node created', type: 'success' })
          }
          break
        case '3':
          if (!e.ctrlKey && !e.metaKey) {
            handleAddNode('condition')
            setToast({ message: 'Condition node created', type: 'success' })
          }
          break
        case '4':
          if (!e.ctrlKey && !e.metaKey) {
            handleAddNode('output')
            setToast({ message: 'Output node created', type: 'success' })
          }
          break
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            // Fit to screen
            setViewport({ x: 0, y: 0, zoom: 1 })
            setCurrentZoomDisplay(100)
            setTimeout(() => setCurrentZoomDisplay(null), 1000)
          }
          break
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            // Reset zoom
            setViewport(prev => ({ ...prev, zoom: 1 }))
            setCurrentZoomDisplay(100)
            setTimeout(() => setCurrentZoomDisplay(null), 1000)
          }
          break
        case '?':
          if (!e.ctrlKey && !e.metaKey) {
            setShowShortcuts(true)
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    // Zoom with Ctrl+Scroll
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        
        const zoomFactor = 0.1
        const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor
        const newZoom = Math.max(0.1, Math.min(3, viewport.zoom + delta))
        
        setViewport(prev => ({ ...prev, zoom: newZoom }))
        setCurrentZoomDisplay(Math.round(newZoom * 100))
        setTimeout(() => setCurrentZoomDisplay(null), 1000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [viewport.zoom, setToast])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setCreatingProject(true)
    try {
      const project = await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined)
      await selectProject(project)
      setShowProjectModal(false)
      setNewProjectName('')
      setNewProjectDescription('')
      setToast({ message: 'Project created successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to create project:', error)
      setToast({ message: 'Failed to create project', type: 'error' })
    } finally {
      setCreatingProject(false)
    }
  }

  const handleSelectProject = async (project: any) => {
    try {
      await selectProject(project)
    } catch (error) {
      console.error('Failed to select project:', error)
      setToast({ message: 'Failed to load project', type: 'error' })
    }
  }

  const handleAddNode = async (type: FlowNode['type']) => {
    if (!selectedProject) return

    try {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return

      // Calculate position in canvas coordinates
      // Position nodes at the top-center of the canvas
      const centerX = (canvasRect.width / 2 - viewport.x) / viewport.zoom
      const centerY = (100 - viewport.y) / viewport.zoom

      const newNode = await createNode(selectedProject.id, type, { x: centerX, y: centerY })
      setEditingNode(newNode)
      setShowNodeEditor(true)
    } catch (error) {
      console.error('Failed to create node:', error)
      setToast({ message: 'Failed to create node', type: 'error' })
    }
  }

  const handleNodeClick = (node: FlowNode, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (isConnectMode) {
      if (!connectionStart) {
        setConnectionStart(node.id)
        setToast({ message: 'Select target node to connect', type: 'success' })
      } else if (connectionStart !== node.id) {
        handleCreateConnection(connectionStart, node.id)
        setConnectionStart(null)
        setIsConnectMode(false)
      }
    } else {
      setSelectedNode(node)
    }
  }

  const handleCreateConnection = async (sourceId: string, targetId: string) => {
    if (!selectedProject) return

    try {
      await createConnection(selectedProject.id, sourceId, targetId)
      setToast({ message: 'Connection created', type: 'success' })
    } catch (error) {
      console.error('Failed to create connection:', error)
      setToast({ message: 'Failed to create connection', type: 'error' })
    }
  }

  const handleNodeEdit = (node: FlowNode) => {
    setEditingNode(node)
    setShowNodeEditor(true)
    setSelectedNode(null)
  }

  const handleNodeSave = async (nodeId: string, updates: Partial<FlowNode>) => {
    try {
      await updateNode(nodeId, updates)
      setToast({ message: 'Node updated successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to update node:', error)
      setToast({ message: 'Failed to update node', type: 'error' })
    }
  }

  const handleNodeDelete = async (nodeId: string) => {
    if (!window.confirm('Are you sure you want to delete this node?')) return

    try {
      await deleteNode(nodeId)
      setSelectedNode(null)
      setToast({ message: 'Node deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete node:', error)
      setToast({ message: 'Failed to delete node', type: 'error' })
    }
  }

  const handleNodeDuplicate = async (nodeId: string) => {
    try {
      await duplicateNode(nodeId)
      setToast({ message: 'Node duplicated successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to duplicate node:', error)
      setToast({ message: 'Failed to duplicate node', type: 'error' })
    }
  }

  const handleConnectionDelete = async (connectionId: string) => {
    try {
      await deleteConnection(connectionId)
      setToast({ message: 'Connection deleted', type: 'success' })
    } catch (error) {
      console.error('Failed to delete connection:', error)
      setToast({ message: 'Failed to delete connection', type: 'error' })
    }
  }

  // Mouse event handlers for canvas and node dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only handle left mouse button

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on a node
    const target = e.target as HTMLElement
    const nodeElement = target.closest('[data-node-id]')
    
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-node-id')
      const node = selectedProject?.nodes?.find((n: FlowNode) => n.id === nodeId)
      
      if (node && !isConnectMode) {
        // Start node dragging
        const nodeRect = nodeElement.getBoundingClientRect()
        const offsetX = e.clientX - nodeRect.left
        const offsetY = e.clientY - nodeRect.top

        setDragState({
          isDragging: true,
          dragType: 'node',
          draggedNodeId: nodeId!,
          startPosition: { x, y },
          nodeOffset: { x: offsetX, y: offsetY }
        })
      }
    } else {
      // Start canvas panning
      setDragState({
        isDragging: true,
        dragType: 'canvas',
        draggedNodeId: null,
        startPosition: { x, y },
        nodeOffset: { x: 0, y: 0 }
      })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) {
      // Handle temporary connection line
      if (isConnectMode && connectionStart && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const sourceNode = selectedProject?.nodes?.find((n: FlowNode) => n.id === connectionStart)
        
        if (sourceNode) {
          const startX = sourceNode.position.x * viewport.zoom + viewport.x + 140 // Node width/2
          const startY = sourceNode.position.y * viewport.zoom + viewport.y + 70  // Node height/2
          const endX = e.clientX - rect.left
          const endY = e.clientY - rect.top

          setTempConnection({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY }
          })
        }
      }
      return
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    const deltaX = currentX - dragState.startPosition.x
    const deltaY = currentY - dragState.startPosition.y

    if (dragState.dragType === 'canvas') {
      // Pan the canvas
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setDragState(prev => ({
        ...prev,
        startPosition: { x: currentX, y: currentY }
      }))
    } else if (dragState.dragType === 'node' && dragState.draggedNodeId) {
      // Move the node with smooth interpolation
      const newX = (currentX - dragState.nodeOffset.x - viewport.x) / viewport.zoom
      const newY = (currentY - dragState.nodeOffset.y - viewport.y) / viewport.zoom

      // Update node position immediately for smooth dragging
      if (selectedProject?.nodes) {
        const updatedNodes = selectedProject.nodes.map((node: FlowNode) =>
          node.id === dragState.draggedNodeId
            ? { ...node, position: { x: newX, y: newY } }
            : node
        )
        setSelectedProject({ ...selectedProject, nodes: updatedNodes })
      }
    }
  }, [dragState, viewport, isConnectMode, connectionStart, selectedProject])

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.dragType === 'node' && dragState.draggedNodeId) {
      // Save final node position to database
      const node = selectedProject?.nodes?.find((n: FlowNode) => n.id === dragState.draggedNodeId)
      if (node) {
        moveNode(dragState.draggedNodeId, node.position).catch(error => {
          console.error('Failed to save node position:', error)
          setToast({ message: 'Failed to save node position', type: 'error' })
        })
      }
    }

    setDragState({
      isDragging: false,
      dragType: null,
      draggedNodeId: null,
      startPosition: { x: 0, y: 0 },
      nodeOffset: { x: 0, y: 0 }
    })
  }, [dragState, selectedProject, moveNode])

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  const handleZoomIn = () => {
    setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3) }))
  }

  const handleZoomOut = () => {
    setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.3) }))
  }

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 })
  }

  const renderConnection = (connection: FlowConnection) => {
    const sourceNode = selectedProject?.nodes?.find((n: FlowNode) => n.id === connection.source_node_id)
    const targetNode = selectedProject?.nodes?.find((n: FlowNode) => n.id === connection.target_node_id)
    
    if (!sourceNode || !targetNode) return null

    const startX = sourceNode.position.x + 140 // Node width/2
    const startY = sourceNode.position.y + 70  // Node height/2
    const endX = targetNode.position.x + 140
    const endY = targetNode.position.y + 70

    const midX = (startX + endX) / 2
    const controlPoint1X = startX + (midX - startX) * 0.5
    const controlPoint2X = endX - (endX - midX) * 0.5

    const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${startY} ${controlPoint2X} ${endY} ${endX} ${endY}`
    const isHovered = hoveredConnection === connection.id

    return (
      <g key={connection.id}>
        {/* Invisible wider path for easier clicking */}
        <path
          d={pathData}
          stroke="transparent"
          strokeWidth="20"
          fill="none"
          className="cursor-pointer"
          onMouseEnter={() => setHoveredConnection(connection.id)}
          onMouseLeave={() => setHoveredConnection(null)}
          onClick={() => {
            if (window.confirm('Delete this connection?')) {
              handleConnectionDelete(connection.id)
            }
          }}
        />
        {/* Visible connection line */}
        <path
          d={pathData}
          stroke={isHovered ? "rgba(239, 68, 68, 0.8)" : "rgba(99, 102, 241, 0.6)"}
          strokeWidth={isHovered ? "3" : "2"}
          fill="none"
          className="pointer-events-none transition-all duration-200"
          style={{
            filter: isHovered ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' : 'none'
          }}
        />
        {/* Connection endpoint */}
        <circle
          cx={endX}
          cy={endY}
          r={isHovered ? "6" : "4"}
          fill={isHovered ? "rgba(239, 68, 68, 0.8)" : "rgba(99, 102, 241, 0.8)"}
          className="pointer-events-none transition-all duration-200"
        />
        {/* Delete indicator on hover */}
        {isHovered && (
          <g>
            <circle
              cx={midX}
              cy={(startY + endY) / 2}
              r="12"
              fill="rgba(239, 68, 68, 0.9)"
              className="pointer-events-none"
            />
            <text
              x={midX}
              y={(startY + endY) / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="10"
              className="pointer-events-none font-bold"
            >
              ×
            </text>
          </g>
        )}
      </g>
    )
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
              Please sign in to access Project Space
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
          <div className="relative z-10 flex-1 flex flex-col">
            {!selectedProject ? (
              /* Project Selection View */
              <div className="flex-1 p-6">
                <div className="max-w-6xl mx-auto">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        Project Space
                      </h1>
                      <p className="text-zinc-400">
                        Create visual prompt flows and collaborate with your team
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 self-start lg:self-auto"
                    >
                      <Plus size={20} />
                      <span>New Project</span>
                    </button>
                  </div>

                  {/* Projects Grid */}
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-zinc-400">
                        <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                        <span>Loading projects...</span>
                      </div>
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((project) => (
                        <motion.div
                          key={project.id}
                          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Options Menu */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle options menu logic would go here
                                }}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {/* Options menu would be implemented here */}
                            </div>
                          </div>
                          
                          <div 
                            className="flex items-center gap-3 mb-4 cursor-pointer"
                            onClick={() => handleSelectProject(project)}
                          >
                            <div className="p-2.5 bg-indigo-500/20 rounded-lg">
                              <Layers size={18} className="text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {project.name}
                            </h3>
                          </div>
                          
                          {project.description && (
                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-zinc-500" />
                              Updated {new Date(project.updated_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1">
                              <Users size={12} className="text-zinc-500" />
                              <span>{project.member_count || 1} members</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                        <Layers className="mx-auto text-zinc-500 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No Projects Yet
                        </h3>
                        <p className="text-zinc-400 mb-6">
                          Create your first project to start building prompt flows
                        </p>
                        <button
                          onClick={() => setShowProjectModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <Plus size={16} />
                          <span>Create Project</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Project Canvas View */
              <div className="flex-1 flex flex-col relative">
                {/* Project Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                      title="Back to projects"
                    >
                      <Layers size={20} />
                    </button>
                    
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {selectedProject.name}
                      </h2>
                      {selectedProject.description && (
                        <p className="text-sm text-zinc-400">
                          {selectedProject.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Team Members Display */}
                    <TeamMembersDisplay 
                      projectId={selectedProject.id}
                      currentUserRole={currentUserRole}
                    />
                    
                    {/* Add Member Button */}
                    {currentUserRole === 'admin' && (
                      <motion.button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Invite team member"
                      >
                        <UserPlus size={16} className="text-zinc-400" />
                        <span className="text-zinc-300">Invite</span>
                      </motion.button>
                    )}
                  </div>
                </div>
                
                {/* Canvas Area */}
                <div
                  ref={canvasRef}
                  className="flex-1 relative overflow-hidden"
                  onMouseDown={handleMouseDown}
                  style={{
                    cursor: isConnectMode ? 'crosshair' : dragState.isDragging ? 'grabbing' : 'grab',
                    backgroundImage: `
                      radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)
                    `,
                    backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`
                  }}
                >
                  {/* SVG for connections */}
                  <svg
                    ref={svgRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    {/* Render existing connections */}
                    <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
                      {selectedProject.connections?.map(renderConnection)}
                      
                      {/* Temporary connection line */}
                      {tempConnection && (
                        <line
                          x1={tempConnection.start.x}
                          y1={tempConnection.start.y}
                          x2={tempConnection.end.x}
                          y2={tempConnection.end.y}
                          stroke="rgba(99, 102, 241, 0.5)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )}
                    </g>
                  </svg>

                  {/* Render nodes */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                      transformOrigin: '0 0',
                      zIndex: 2
                    }}
                  >
                    {selectedProject.nodes?.map((node: FlowNode) => {
                      const config = NODE_TYPE_CONFIG[node.type]
                      const Icon = config.icon
                      const isSelected = selectedNode?.id === node.id
                      const isConnectionSource = connectionStart === node.id
                      const isDragging = dragState.draggedNodeId === node.id

                      return (
                        <motion.div
                          key={node.id}
                          data-node-id={node.id}
                          className={`absolute w-72 group cursor-pointer ${
                            isSelected
                              ? 'z-50'
                              : isConnectionSource
                                ? 'z-40'
                                : isDragging ? 'z-50' : 'z-10'
                          }`}
                          style={{
                            left: node.position.x,
                            top: node.position.y,
                          }}
                          onClick={(e) => handleNodeClick(node, e)}
                          whileHover={{ scale: isDragging ? 1.05 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          animate={{
                            scale: isDragging ? 1.05 : 1,
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          {/* Node Card */}
                          <div className={`
                            bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 
                            transition-all duration-200 hover:bg-white/10 hover:border-white/20
                            ${isSelected ? 'ring-2 ring-indigo-500/50 bg-indigo-500/10 border-indigo-500/30' : ''}
                            ${isConnectionSource ? 'ring-2 ring-orange-500/50 bg-orange-500/10 border-orange-500/30' : ''}
                            ${isDragging ? 'shadow-2xl shadow-black/50' : 'shadow-lg shadow-black/20'}
                          `}>
                            {/* Node Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`p-2.5 bg-gradient-to-r ${config.color} rounded-lg shadow-lg`}>
                                <Icon size={18} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate">
                                  {node.title}
                                </h4>
                                <p className="text-zinc-400 text-xs">
                                  {config.description}
                                </p>
                              </div>
                            </div>

                            {/* Node Content Preview */}
                            {node.content && (
                              <div className="text-zinc-300 text-xs leading-relaxed line-clamp-3 mb-4 bg-white/5 rounded-lg p-3 border border-white/10">
                                {node.content.substring(0, 120)}
                                {node.content.length > 120 && '...'}
                              </div>
                            )}

                            {/* Connection Points */}
                            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-zinc-700 border-2 border-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-zinc-700 border-2 border-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Empty state */}
                  {(!selectedProject.nodes || selectedProject.nodes.length === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center mt-20">
                        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                          <Layers className="text-zinc-400" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                          Empty Canvas
                        </h3>
                        <p className="text-zinc-500 mb-6">
                          Add your first node to start building your prompt flow
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Node Creation Toolbar - Top Center */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl">
                    {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => {
                      const Icon = config.icon
                      return (
                        <motion.button
                          key={type}
                          onClick={() => handleAddNode(type as FlowNode['type'])}
                          className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm font-medium"
                          title={`Add ${config.label}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon size={16} />
                          <span className="hidden sm:inline">{config.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Viewport Toolbar - Left Bottom */}
                <div className="absolute bottom-6 left-6 z-50">
                  <div className="flex flex-col gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl">
                    {/* Current Zoom Display */}
                    {currentZoomDisplay && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-3 py-1 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg text-sm text-white"
                      >
                        {currentZoomDisplay}%
                      </motion.div>
                    )}
                    
                    <motion.button
                      onClick={handleZoomIn}
                      className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      title="Zoom in"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ZoomIn size={18} />
                    </motion.button>
                    <div className="text-xs text-zinc-400 text-center px-2 py-1 font-mono">
                      {Math.round(viewport.zoom * 100)}%
                    </div>
                    <motion.button
                      onClick={handleZoomOut}
                      className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      title="Zoom out"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ZoomOut size={18} />
                    </motion.button>
                    <motion.button
                      onClick={handleResetView}
                      className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      title="Reset view"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Maximize2 size={18} />
                    </motion.button>
                  </div>
                </div>

                {/* Contextual Toolbar - Middle Bottom (when node selected) */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50"
                    >
                      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl">
                        <motion.button
                          onClick={() => handleNodeEdit(selectedNode)}
                          className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                          title="Edit node"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit3 size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => setShowNodeDetails(true)}
                          className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                          title="View details"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            setIsConnectMode(!isConnectMode)
                            setConnectionStart(null)
                            setTempConnection(null)
                          }}
                          className={`p-3 rounded-lg transition-all duration-200 ${
                            isConnectMode
                              ? 'text-orange-400 bg-orange-500/20'
                              : 'text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                          title={isConnectMode ? 'Exit connect mode' : 'Connect nodes'}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Link2 size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleNodeDuplicate(selectedNode.id)}
                          className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                          title="Duplicate node"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Copy size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleNodeDelete(selectedNode.id)}
                          className="p-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                          title="Delete node"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => setSelectedNode(null)}
                          className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                          title="Close"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={18} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectModal(false)} />
            
            <motion.div 
              className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Create New Project</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
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
                      placeholder="Optional description"
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <motion.button
                    onClick={handleCreateProject}
                    disabled={creatingProject || !newProjectName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:bg-zinc-700/50 disabled:border-zinc-700/50 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowProjectModal(false)}
                    disabled={creatingProject}
                    className="px-4 py-3 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Node Editor Modal */}
      <NodeEditorModal
        isOpen={showNodeEditor}
        onClose={() => {
          setShowNodeEditor(false)
          setEditingNode(null)
        }}
        node={editingNode}
        onSave={handleNodeSave}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        isOpen={showNodeDetails}
        onClose={() => {
          setShowNodeDetails(false)
          setSelectedNode(null)
        }}
        node={selectedNode}
        onEdit={handleNodeEdit}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        projectId={selectedProject?.id}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          
          <motion.div 
            className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Keyboard className="text-indigo-400" size={20} />
                <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Navigation */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Zoom In</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + Scroll Up</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Zoom Out</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + Scroll Down</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Reset Zoom</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">R</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Fit to Screen</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">F</kbd>
                    </div>
                  </div>
                </div>

                {/* Node Creation */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Node Creation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Input Node</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">1</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Prompt Node</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">2</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Condition Node</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">3</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Output Node</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">4</kbd>
                    </div>
                  </div>
                </div>

                {/* Editing */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Editing</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Undo</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Redo</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + Y</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Save</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + S</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Select All</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + A</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Duplicate</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Ctrl + D</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Delete</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Del / Backspace</kbd>
                    </div>
                  </div>
                </div>

                {/* General */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">General</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Close Modal</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Show Shortcuts</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">? or Ctrl + /</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <h4 className="text-indigo-300 font-medium mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-indigo-200 space-y-1">
                  <li>• Hold <kbd className="px-1 py-0.5 bg-indigo-800/30 rounded text-xs">Space</kbd> and drag to pan around the canvas</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-indigo-800/30 rounded text-xs">Ctrl + Scroll</kbd> for precise zoom control</li>
                  <li>• Number keys (1-4) quickly select different node types</li>
                  <li>• Press <kbd className="px-1 py-0.5 bg-indigo-800/30 rounded text-xs">F</kbd> to fit all nodes in view</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast - Positioned to avoid sidebar */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 lg:left-80 lg:transform-none">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <BoltBadge />
    </div>
  )
}

// Invite Member Modal Component
interface InviteMemberModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  projectId,
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { inviteProjectMember } = useProjectSpaceStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await inviteProjectMember(projectId, email.trim(), role)
      setSuccess('Invitation sent successfully!')
      setEmail('')
      setRole('viewer')
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Invite Team Member</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor' | 'admin')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              >
                <option value="viewer">Viewer - Can view the project</option>
                <option value="editor">Editor - Can edit nodes and connections</option>
                <option value="admin">Admin - Full project access</option>
              </select>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                {success}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <motion.button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:bg-zinc-700/50 disabled:border-zinc-700/50 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                whileHover={{ scale: loading || !email.trim() ? 1 : 1.02 }}
                whileTap={{ scale: loading || !email.trim() ? 1 : 0.98 }}
              >
                {loading ? (
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
              </motion.button>
              
              <motion.button
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}