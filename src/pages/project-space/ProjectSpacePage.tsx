import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  NodeProps,
  MarkerType,
  ConnectionLineType,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Menu, 
  Plus, 
  Trash2,
  Settings, 
  Share2, 
  Users, 
  X, 
  Save,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  UserPlus,
  Mail,
  Check,
  Link,
  Info,
  Layers,
  Edit
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NodeEditorModal } from '../../components/project-space/NodeEditorModal'
import { NodeDetailsModal } from '../../components/project-space/NodeDetailsModal'
import { PromptImportModal } from '../../components/project-space/PromptImportModal'
import CustomFlowNode from '../../components/project-space/CustomFlowNode'
import { NodeDetailsToolbar } from '../../components/project-space/NodeDetailsToolbar'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'
import { ProjectMembersModal } from '../../components/project-space/ProjectMembersModal'
import { ProjectLogsModal } from '../../components/project-space/ProjectLogsModal'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore, FlowNode } from '../../store/projectSpaceStore'

export const ProjectSpacePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [showNodeDetails, setShowNodeDetails] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [selectedNodeForToolbar, setSelectedNodeForToolbar] = useState<FlowNode | null>(null)
  const [isConnectingNodes, setIsConnectingNodes] = useState(false)
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const [isInviting, setIsInviting] = useState(false)
  const [projectNameInput, setProjectNameInput] = useState('')
  const [projectDescriptionInput, setProjectDescriptionInput] = useState('')
  const [projectVisibilityInput, setProjectVisibilityInput] = useState<'private' | 'team' | 'public'>('private')
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [newProjectName, setNewProjectName] = useState('')
  
  const [showCreateProject, setShowCreateProject] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const { user, loading: authLoading } = useAuthStore()
  const { 
    projects,
    selectedProject,
    projectMembers,
    currentUserRole,
    loading,
    fetchProjects,
    createProject,
    selectProject,
    updateProject,
    createNode,
    updateNode,
    deleteNode,
   moveNode,
    createConnection,
    deleteConnection,
    inviteProjectMember
  } = useProjectSpaceStore() 

  // Define node types outside of the component render
  const nodeTypes: NodeTypes = React.useMemo(() => {
    return {
      input: CustomFlowNode,
      prompt: CustomFlowNode,
      condition: CustomFlowNode,
      output: CustomFlowNode
    }
  }, [])

  // Define edge options outside of the component render
  const defaultEdgeOptions = React.useMemo(() => ({
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true, 
    style: { stroke: '#6366f1', strokeWidth: 3 }
  }), [])

  // Connection line style
  const connectionLineStyle = {
    stroke: '#6366f1',
    strokeWidth: 3,
    strokeDasharray: '5,5',
  }

  // Load projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  // Select first project if none selected
  useEffect(() => {
    if (!loading && projects.length > 0 && !selectedProject) {
      selectProject(projects[0])
    }
  }, [loading, projects, selectedProject, selectProject])

  // Initialize project form inputs when project changes
  useEffect(() => {
    if (selectedProject) {
      setProjectNameInput(selectedProject.name)
      setProjectDescriptionInput(selectedProject.description || '')
      setProjectVisibilityInput(selectedProject.visibility || 'private')
    }
  }, [selectedProject])

 // Convert flow nodes to ReactFlow nodes
 useEffect(() => {
   if (selectedProject?.nodes) {
    const { user } = useAuthStore.getState();
     const flowNodes = selectedProject.nodes.map(node => {       
       // Define node color based on type
       let nodeColor;
       switch (node.type) {
         case 'input':
           nodeColor = '#8b5cf6'; // purple
           break;
         case 'prompt':
           nodeColor = '#3b82f6'; // blue
           break;
         case 'condition':
           nodeColor = '#eab308'; // yellow
           break;
         case 'output':
           nodeColor = '#22c55e'; // green
           break;
         default:
           nodeColor = '#6366f1'; // indigo
       }
       
       return {
       id: node.id,
       type: node.type,
       position: { x: node.position.x, y: node.position.y },
       data: { 
         label: node.title,
         content: node.content,
         nodeData: node,
         type: node.type,
          activeNodeId: activeNodeId,
        projectMembers: projectMembers,
        currentUserId: user?.id,
         onEdit: (nodeId: string) => {
           const node = selectedProject?.nodes?.find(n => n.id === nodeId)
           if (node) {
             setSelectedNode(node)
             setShowNodeEditor(true)
           }
         },
         onDelete: handleNodeDelete,
         onViewDetails: (nodeId: string) => {
           const node = selectedProject?.nodes?.find(n => n.id === nodeId)
           if (node) {
             setSelectedNode(node)
             setShowNodeDetails(true)
           }
         }
       },
       style: {
         background: `${nodeColor}20`,
         borderColor: `${nodeColor}50`,
         borderWidth: 1
       }
       // No need to specify sourcePosition and targetPosition here
     }})
     setNodes(flowNodes)
   } else {
     setNodes([])
   }
 }, [selectedProject?.nodes, setNodes, activeNodeId])

 // Convert flow connections to ReactFlow edges
useEffect(() => {
  if (selectedProject?.connections) {
    const flowEdges = selectedProject.connections.map(connection => {
      return {
        id: connection.id,
        source: connection.source_node_id, 
        target: connection.target_node_id, 
        type: 'default',
        animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed }, 
        style: { stroke: '#6366f1', strokeWidth: 3 }
      };
    });
    setEdges(flowEdges);
  } else {
    setEdges([]);
  }
}, [selectedProject?.connections, setEdges]);

  const handleNodeDelete = async (nodeId: string) => {
    try {
      await deleteNode(nodeId)
     setActiveNodeId(null)
      setActiveNodeId(null)
      setToast({ message: 'Node deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete node:', error)
      setToast({ message: 'Failed to delete node', type: 'error' })
    }
  }

  // Handle connecting nodes
  const handleConnectStart = (nodeId: string) => {
    setIsConnectingNodes(true)
    setSourceNodeId(nodeId)
  }

  // Handle connecting nodes
  const handleConnectNodes = (targetNodeId: string) => {
    if (isConnectingNodes && sourceNodeId && targetNodeId && sourceNodeId !== targetNodeId) {
      if (selectedProject) {
        createConnection(
          selectedProject.id,
          sourceNodeId,
          targetNodeId
        ).then(() => {
          setToast({ message: 'Nodes connected successfully', type: 'success' })
        }).catch(error => {
          console.error('Failed to connect nodes:', error)
          setToast({ message: 'Failed to connect nodes', type: 'error' })
        }).finally(() => {
          setIsConnectingNodes(false)
          setSourceNodeId(null)
        })
      }
    } else {
      setIsConnectingNodes(false)
      setSourceNodeId(null)
    }
  }

 // Handle node click - either connect nodes or select a node
 const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
  if (isConnectingNodes) {
    handleConnectNodes(node.id)
  } else {
    setActiveNodeId(node.id)
  
    // Find the corresponding flow node for the toolbar
    if (selectedProject?.nodes) {
      const flowNode = selectedProject.nodes.find(n => n.id === node.id);
      if (flowNode) {
        setSelectedNodeForToolbar(flowNode);
      }
    }
  }
 }, [isConnectingNodes, sourceNodeId, selectedProject, createConnection])
  
  // Handle background click to deselect node
  const onPaneClick = useCallback(() => {
    if (isConnectingNodes) {
      setIsConnectingNodes(false)
      setSourceNodeId(null)
      setToast({ message: 'Connection cancelled', type: 'error' })
    } else {
      setActiveNodeId(null)
      setSelectedNodeForToolbar(null)
    }
  }, [isConnectingNodes])

 // Handle edge click to delete connections
 const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
   if (window.confirm('Do you want to remove this connection?')) {
     deleteConnection(edge.id)
   }
 }, [deleteConnection])

 // Handle connection
 const onConnect = useCallback((connection: Connection) => {   
   if (selectedProject && connection.source && connection.target) {
     // Create the connection in the database
     createConnection(
       selectedProject.id,
       connection.source,
       connection.target
     ).then(() => {
       // Connection will be added via the useEffect that watches selectedProject.connections
     }).catch((error) => {
       console.error('Failed to create connection:', error)
       setToast({ message: 'Failed to create connection', type: 'error' })
     })
   }
 }, [selectedProject, createConnection])

 // Handle node drag to update position
 const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
   if (node.position) {
     moveNode(node.id, node.position)
   }
 }, [moveNode])

  const handleCreateProject = async () => {
    // Create a new project
    if (!newProjectName.trim()) return
    
    setIsCreatingProject(true)
    try {
      const project = await createProject(newProjectName.trim())
      await selectProject(project)
      setShowCreateProject(false)
      setNewProjectName('')
      setToast({ message: 'Project created successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to create project:', error)
      setToast({ message: 'Failed to create project', type: 'error' })
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleAddNode = async (type: FlowNode['type']) => {
    // Add a new node to the project
    if (!selectedProject || !canvasRef.current) return
    
    // Calculate top-center position of the canvas
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const position = {
      x: canvasRect.width / 2,
      y: 100 // Fixed Y position near the top
    }
    
    try {
      // Create a real node in the database first
      const newNode = await createNode(
        selectedProject.id,
        type,
        position
      )
      
      if (newNode) {
        // Set default title and open editor
        const nodeWithTitle = {
          ...newNode,
          title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          content: ''
        }
        
        setSelectedNode(nodeWithTitle)
        setShowNodeEditor(true)
      }
    } catch (error) {
      console.error('Failed to add node:', error)
      setToast({ message: 'Failed to add node', type: 'error' })
    }
  }

  const handleImportPrompt = () => {
    // Import a prompt from the gallery
    if (!selectedProject) return
    setShowImportModal(true)
  }

  const handlePromptSelected = async (prompt: any) => {
    if (!selectedProject || !canvasRef.current) return
    
    // Calculate top-center position of the canvas
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const position = {
      x: canvasRect.width / 2,
      y: 100 // Fixed Y position near the top
    }
    
    try {
      // Create a node with the imported prompt
      const node = await createNode(
        selectedProject.id,
        'prompt',
        position,
        prompt.id
      )
      
      if (node) {
        setToast({ message: 'Prompt imported successfully', type: 'success' })
      }
    } catch (error) {
      console.error('Failed to import prompt:', error)
      setToast({ message: 'Failed to import prompt', type: 'error' })
    }
  }

  const handleNodeSave = async (nodeId: string, updates: Partial<FlowNode>) => {
    try {
      await updateNode(nodeId, updates)
      setToast({ message: 'Node saved successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to save node:', error)
      setToast({ message: 'Failed to save node', type: 'error' })
    }
  }

  const handleInviteMember = async () => {
    // Invite a new member to the project
    if (!selectedProject || !inviteEmail.trim() || !inviteRole) {
      setToast({ message: 'Please enter an email and select a role', type: 'error' })
      return
    }
    
    setIsInviting(true)
    try {
      await inviteProjectMember(
        selectedProject.id,
        inviteEmail.trim(),
        inviteRole
      )
      setInviteEmail('')
      setShowInviteModal(false)
      setToast({ message: 'Invitation sent successfully', type: 'success' })
    } catch (error: any) {
      console.error('Failed to invite member:', error)
      setToast({ message: `Error inviting project member: ${error.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setIsInviting(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
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

  // Not authenticated
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

  // Main component render
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
            <div className="w-full h-full flex flex-col">
              {/* Project Header */}
              <div className="border-b border-zinc-800/50 backdrop-blur-xl">
                <div className="px-6 py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Project Selector */}
                      <div className="relative z-20">
                        <button
                          onClick={() => setShowCreateProject(!showCreateProject)}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-all duration-200"
                        >
                          {selectedProject ? (
                            <span className="font-medium">{selectedProject.name}</span>
                          ) : (
                            <span className="text-zinc-400">Select Project</span>
                          )}
                        </button>
                      </div>
                      
                      {/* Project Visibility */}
                      {selectedProject && selectedProject.visibility && (
                        <div className="flex items-center gap-2 text-sm">
                          {selectedProject.visibility === 'private' ? (
                            <>
                              <EyeOff size={14} className="text-amber-400" />
                              <span className="text-amber-400">Private</span>
                            </>
                          ) : selectedProject.visibility === 'team' ? (
                            <>
                              <Users size={14} className="text-blue-400" />
                              <span className="text-blue-400">Team</span>
                            </>
                          ) : (
                            <>
                              <Globe size={14} className="text-emerald-400" />
                              <span className="text-emerald-400">Public</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Team Members Display - only show if project exists */}
                      {selectedProject && (
                        <>
                          <TeamMembersDisplay 
                            onClick={() => setShowMembersModal(true)}
                            projectId={selectedProject.id}
                            currentUserRole={currentUserRole}
                          />
                          {/* Invite Member Button - only show for admins */}
                          {selectedProject && (currentUserRole === 'admin' || selectedProject.user_id === user.id) && (
                            <button
                              onClick={() => setShowInviteModal(true)}
                              className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-all duration-200 text-sm"
                            >
                              <UserPlus size={14} className="text-indigo-400" />
                              <span>Invite</span>
                            </button>
                          )}
                        </>
                      )}
                      {/* Logs Button - only show for admins */}
                          {selectedProject && (currentUserRole === 'admin' || selectedProject.user_id === user.id) && (
                            <button
                              onClick={() => setShowLogsModal(true)}
                              className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-all duration-200 text-sm"
                            >
                              <Info size={14} className="text-indigo-400" />
                              <span>Logs</span>
                            </button>
                          )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div 
               ref={canvasRef}
               className="flex-1 bg-zinc-900/30"
              >
                {selectedProject ? (
                 <ReactFlow
                   nodes={nodes}
                   edges={edges}
                   onNodesChange={onNodesChange}
                   onEdgesChange={onEdgesChange}
                   onConnect={onConnect}
                   onPaneClick={onPaneClick}
                   onNodeClick={onNodeClick}
                   onEdgeClick={onEdgeClick}
                   onNodeDragStop={onNodeDragStop}
                   nodeTypes={nodeTypes}
                   fitView 
                   connectionLineType={ConnectionLineType.Bezier}
                   connectionLineStyle={connectionLineStyle}
                   defaultEdgeOptions={defaultEdgeOptions}
                   elementsSelectable={true}
                   selectNodesOnDrag={false}
                   className="bg-zinc-900/30"
                 >
                   <Background color="#6366f1" gap={16} size={1} />
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
                   />
                   {selectedProject && (currentUserRole === 'admin' || currentUserRole === 'editor') && (
                   <Panel position="top-center" className="bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-2">
                     <div className="flex flex-wrap items-center gap-2">
                       <button
                         onClick={() => handleAddNode('input')}
                         className={`flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg transition-all duration-200 text-xs ${isConnectingNodes ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isConnectingNodes}
                       >
                         <Plus size={12} />
                         <span>Input</span>
                       </button>
                       <button
                         onClick={() => handleAddNode('prompt')}
                         className={`flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all duration-200 text-xs ${isConnectingNodes ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isConnectingNodes}
                       >
                         <Plus size={12} />
                         <span>Prompt</span>
                       </button>
                       <button
                         onClick={() => handleImportPrompt()}
                         className={`flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all duration-200 text-xs ${isConnectingNodes ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isConnectingNodes}
                       >
                         <Plus size={12} />
                         <span>Import</span>
                       </button>
                       <button
                         onClick={() => handleAddNode('condition')}
                         className={`flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-300 rounded-lg transition-all duration-200 text-xs ${isConnectingNodes ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isConnectingNodes}
                       >
                         <Plus size={12} />
                         <span>Condition</span>
                       </button>
                       <button
                         onClick={() => handleAddNode('output')}
                         className={`flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 rounded-lg transition-all duration-200 text-xs ${isConnectingNodes ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isConnectingNodes}
                       >
                         <Plus size={12} />
                         <span>Output</span>
                       </button>
                       
                       {isConnectingNodes && (
                         <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 rounded-lg text-xs animate-pulse">
                           <Link size={12} className="text-indigo-300" />
                           <span>Select target node...</span>
                         </div>
                       )}
                     </div>
                   </Panel>
                   )}
                 </ReactFlow>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Layers size={32} className="text-indigo-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-2">
                        No Project Selected
                      </h2>
                      <p className="text-zinc-400 mb-6">
                        Select an existing project or create a new one to get started.
                      </p>
                      <button
                        onClick={() => setShowCreateProject(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 mx-auto"
                      >
                        <Plus size={16} />
                        <span>Create Project</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        projectId={selectedProject?.id || ''}
        currentUserRole={currentUserRole}
      />
      
      <ProjectLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        projectId={selectedProject?.id || ''}
      />
      
      <AnimatePresence>
        {(selectedNodeForToolbar || selectedNode) && (currentUserRole === 'admin' || currentUserRole === 'editor') && (
          <NodeDetailsToolbar
            selectedNode={selectedNodeForToolbar || selectedNode}
            onEdit={(nodeId) => {
              const node = selectedProject?.nodes?.find(n => n.id === nodeId);
              if (node) {
                setSelectedNode(node);
                setShowNodeEditor(true);
              }
            }}
            onDelete={handleNodeDelete}
            onConnect={handleConnectStart}
            onViewDetails={(nodeId) => {
              const node = selectedProject?.nodes?.find(n => n.id === nodeId);
              if (node && !isConnectingNodes) {
                setSelectedNode(node);
                setShowNodeDetails(true);
              }
            }}
            onClose={() => {
              setSelectedNodeForToolbar(null);
              setActiveNodeId(null);
              setIsConnectingNodes(false);
              setSourceNodeId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Node Editor Modal */}
      <NodeEditorModal
        isOpen={showNodeEditor}
        onClose={() => {
          setShowNodeEditor(false)
          setSelectedNode(null)
        }}
        node={selectedNode}
        currentUserRole={currentUserRole}
        projectMembers={projectMembers}
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
        projectMembers={projectMembers}
        onEdit={(nodeId) => {
          const node = selectedProject?.nodes?.find(n => n.id === nodeId)
          if (node) {
            setSelectedNode(node)
            setShowNodeEditor(true)
          }
        }}
      />

      {/* Prompt Import Modal */}
      <PromptImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSelectPrompt={handlePromptSelected}
      />
    
      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            
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
                  <UserPlus className="text-indigo-400" size={20} />
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
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setInviteRole('viewer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'viewer' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Eye size={18} />
                      <span className="text-sm font-medium">Viewer</span>
                    </button>
                    
                    <button
                      onClick={() => setInviteRole('editor')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'editor' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Edit size={18} />
                      <span className="text-sm font-medium">Editor</span>
                    </button>
                    
                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'admin' 
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Settings size={18} />
                      <span className="text-sm font-medium">Admin</span>
                    </button>
                  </div>
                  
                  <div className="mt-3 text-xs text-zinc-500">
                    <p><strong>Viewer:</strong> Can view but not edit the project</p>
                    <p><strong>Editor:</strong> Can edit nodes and connections</p>
                    <p><strong>Admin:</strong> Full access including member management</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
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