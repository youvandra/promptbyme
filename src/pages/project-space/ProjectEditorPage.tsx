import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Panel,
  useReactFlow,
  NodeDragHandler,
  OnConnectStartParams,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Save, 
  ArrowLeft, 
  Settings, 
  Users, 
  Share2, 
  Trash2, 
  Undo, 
  Redo,
  Zap,
  Type,
  GitBranch,
  Target,
  Upload,
  Download,
  Menu,
  X,
  Eye,
  EyeOff,
  Globe,
  Lock,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectSpaceStore, FlowProject, FlowNode as StoreFlowNode } from '../../store/projectSpaceStore';
import { NodeEditorModal } from '../../components/project-space/NodeEditorModal';
import { NodeDetailsModal } from '../../components/project-space/NodeDetailsModal';
import { PromptImportModal } from '../../components/project-space/PromptImportModal';
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay';
import { SideNavbar } from '../../components/navigation/SideNavbar';
import { BoltBadge } from '../../components/ui/BoltBadge';
import { Toast } from '../../components/ui/Toast';

// Custom node components
import InputNode from './nodes/InputNode';
import PromptNode from './nodes/PromptNode';
import ConditionNode from './nodes/ConditionNode';
import OutputNode from './nodes/OutputNode';

// Define node types for ReactFlow
const nodeTypes: NodeTypes = {
  input: InputNode,
  prompt: PromptNode,
  condition: ConditionNode,
  output: OutputNode,
};

// Define the node data interface
interface NodeData {
  label: string;
  content: string;
  type: 'input' | 'prompt' | 'condition' | 'output';
  imported_prompt_id?: string;
}

export const ProjectEditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeId = useRef<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<StoreFlowNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');

  const { 
    selectedProject,
    currentUserRole,
    fetchProjects,
    selectProject,
    createNode,
    updateNode,
    deleteNode,
    createConnection,
    deleteConnection,
    updateProject,
    inviteProjectMember
  } = useProjectSpaceStore();

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        navigate('/project-space');
        return;
      }

      setIsLoading(true);
      try {
        // Fetch all projects first to ensure we have the latest data
        await fetchProjects();
        
        // Find the project in the store
        const project = await selectProject({ id: projectId } as FlowProject);
        
        if (!selectedProject) {
          setToast({ message: 'Project not found', type: 'error' });
          navigate('/project-space');
          return;
        }

        // Convert store nodes to ReactFlow nodes
        const flowNodes = selectedProject?.nodes?.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.title,
            content: node.content,
            type: node.type,
            imported_prompt_id: node.imported_prompt_id
          }
        })) || [];

        // Convert store connections to ReactFlow edges
        const flowEdges = selectedProject?.connections?.map(conn => ({
          id: conn.id,
          source: conn.source_node_id,
          target: conn.target_node_id,
          type: 'smoothstep',
          animated: true
        })) || [];

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('Error loading project:', error);
        setToast({ message: `Error loading project: ${error.message}`, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, navigate, fetchProjects, selectProject, selectedProject]);

  // Save project changes
  const saveProject = async () => {
    if (!selectedProject) return;
    
    setIsSaving(true);
    try {
      // Save all nodes positions
      for (const node of nodes) {
        await updateNode(node.id, {
          position: node.position
        });
      }
      
      setToast({ message: 'Project saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving project:', error);
      setToast({ message: 'Failed to save project', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle node drag
  const onNodeDragStop: NodeDragHandler = useCallback(
    (event, node) => {
      // Update node position in the store
      updateNode(node.id, {
        position: node.position
      }).catch(error => {
        console.error('Error updating node position:', error);
        setToast({ message: 'Failed to update node position', type: 'error' });
      });
    },
    [updateNode]
  );

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      if (!selectedProject || !params.source || !params.target) return;
      
      createConnection(selectedProject.id, params.source, params.target)
        .then(connection => {
          // Add the new edge to the local state
          setEdges(eds => addEdge({
            id: connection.id,
            source: connection.source_node_id,
            target: connection.target_node_id,
            type: 'smoothstep',
            animated: true
          }, eds));
        })
        .catch(error => {
          console.error('Error creating connection:', error);
          setToast({ message: 'Failed to create connection', type: 'error' });
        });
    },
    [selectedProject, createConnection, setEdges]
  );

  // Handle edge removal
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach(edge => {
        deleteConnection(edge.id).catch(error => {
          console.error('Error deleting connection:', error);
          setToast({ message: 'Failed to delete connection', type: 'error' });
        });
      });
    },
    [deleteConnection]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (!selectedProject) return;
    
    // Find the node in the store
    const storeNode = selectedProject.nodes?.find(n => n.id === node.id);
    if (storeNode) {
      setSelectedNode(storeNode);
      setShowNodeDetails(true);
    }
  }, [selectedProject]);

  // Add new node
  const onAddNode = useCallback(
    (type: 'input' | 'prompt' | 'condition' | 'output', position?: { x: number; y: number }) => {
      if (!selectedProject || !reactFlowInstance) return;
      
      // Get viewport center if position not provided
      if (!position) {
        const viewport = reactFlowInstance.getViewport();
        const center = reactFlowInstance.project({
          x: reactFlowWrapper.current ? reactFlowWrapper.current.clientWidth / 2 : 500,
          y: reactFlowWrapper.current ? reactFlowWrapper.current.clientHeight / 2 : 300
        });
        
        position = {
          x: center.x,
          y: center.y
        };
      }
      
      // Create a temporary node ID for immediate UI feedback
      const tempId = `temp-${uuidv4()}`;
      
      // Add node to local state first for immediate feedback
      const newNode = {
        id: tempId,
        type,
        position,
        data: {
          label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          content: '',
          type
        }
      };
      
      setNodes(nds => [...nds, newNode]);
      
      // Create node in the database
      createNode(selectedProject.id, type, position)
        .then(node => {
          // Replace the temporary node with the real one
          setNodes(nds => 
            nds.map(n => 
              n.id === tempId ? {
                id: node.id,
                type: node.type,
                position: node.position,
                data: {
                  label: node.title,
                  content: node.content,
                  type: node.type,
                  imported_prompt_id: node.imported_prompt_id
                }
              } : n
            )
          );
          
          // Open the node editor for the new node
          setSelectedNode(node);
          setShowNodeEditor(true);
        })
        .catch(error => {
          console.error('Error creating node:', error);
          setToast({ message: 'Failed to create node', type: 'error' });
          
          // Remove the temporary node if creation failed
          setNodes(nds => nds.filter(n => n.id !== tempId));
        });
    },
    [selectedProject, reactFlowInstance, createNode, setNodes]
  );

  // Delete node
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      if (!selectedProject) return;
      
      deleteNode(nodeId)
        .then(() => {
          // Node will be automatically removed from the UI due to real-time subscription
          setToast({ message: 'Node deleted successfully', type: 'success' });
        })
        .catch(error => {
          console.error('Error deleting node:', error);
          setToast({ message: 'Failed to delete node', type: 'error' });
        });
    },
    [selectedProject, deleteNode]
  );

  // Edit node
  const onEditNode = useCallback(
    (nodeId: string) => {
      if (!selectedProject) return;
      
      const node = selectedProject.nodes?.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setShowNodeEditor(true);
      }
    },
    [selectedProject]
  );

  // Import prompt
  const onImportPrompt = useCallback(() => {
    setShowImportModal(true);
  }, []);

  // Handle prompt import selection
  const handlePromptSelected = useCallback(
    (prompt: any) => {
      if (!selectedProject || !reactFlowInstance) return;
      
      // Get viewport center
      const viewport = reactFlowInstance.getViewport();
      const center = reactFlowInstance.project({
        x: reactFlowWrapper.current ? reactFlowWrapper.current.clientWidth / 2 : 500,
        y: reactFlowWrapper.current ? reactFlowWrapper.current.clientHeight / 2 : 300
      });
      
      // Create a node with the imported prompt
      createNode(
        selectedProject.id,
        'prompt',
        { x: center.x, y: center.y },
        prompt.id
      )
        .then(node => {
          // Add the new node to the local state
          setNodes(nds => [...nds, {
            id: node.id,
            type: 'prompt',
            position: node.position,
            data: {
              label: node.title,
              content: node.content,
              type: 'prompt',
              imported_prompt_id: node.imported_prompt_id
            }
          }]);
          
          setToast({ message: 'Prompt imported successfully', type: 'success' });
        })
        .catch(error => {
          console.error('Error importing prompt:', error);
          setToast({ message: 'Failed to import prompt', type: 'error' });
        });
    },
    [selectedProject, reactFlowInstance, createNode, setNodes]
  );

  // Handle project settings update
  const handleUpdateProject = async (name: string, description: string, visibility: 'private' | 'team' | 'public') => {
    if (!selectedProject) return;
    
    try {
      await updateProject(selectedProject.id, {
        name,
        description,
        visibility
      });
      
      setToast({ message: 'Project updated successfully', type: 'success' });
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setToast({ message: 'Failed to update project', type: 'error' });
    }
  };

  // Handle member invitation
  const handleInviteMember = async () => {
    if (!selectedProject || !inviteEmail.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setToast({ message: 'Please enter a valid email address', type: 'error' });
      return;
    }
    
    try {
      await inviteProjectMember(selectedProject.id, inviteEmail.trim(), inviteRole);
      
      setToast({ message: 'Invitation sent successfully', type: 'success' });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      setToast({ 
        message: error.message || 'Failed to invite member', 
        type: 'error' 
      });
    }
  };

  // Handle node connection start
  const onConnectStart = useCallback((event: React.MouseEvent, params: OnConnectStartParams) => {
    connectingNodeId.current = params.nodeId;
  }, []);

  // Handle node connection end
  const onConnectEnd = useCallback(
    (event: React.MouseEvent) => {
      if (!connectingNodeId.current || !reactFlowInstance) return;

      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
      if (targetIsPane) {
        // We're connecting to an empty space, create a new node
        const { top, left } = reactFlowWrapper.current!.getBoundingClientRect();
        const position = reactFlowInstance.project({
          x: event.clientX - left,
          y: event.clientY - top,
        });

        // Show a menu to select node type
        // For simplicity, we'll just create a prompt node
        onAddNode('prompt', position);
      }
      
      connectingNodeId.current = null;
    },
    [reactFlowInstance, onAddNode]
  );

  // Check if user can edit the project
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'editor' || 
                 (selectedProject && selectedProject.user_id === useProjectSpaceStore.getState().user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-400 mb-4">Project not found</div>
          <button
            onClick={() => navigate('/project-space')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
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
                    title="Back to Projects"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      {selectedProject.name}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <div className="flex items-center gap-1">
                        {selectedProject.visibility === 'private' ? (
                          <Lock size={14} className="text-amber-400" />
                        ) : selectedProject.visibility === 'team' ? (
                          <Users size={14} className="text-blue-400" />
                        ) : (
                          <Globe size={14} className="text-emerald-400" />
                        )}
                        <span className={
                          selectedProject.visibility === 'private' ? 'text-amber-400' :
                          selectedProject.visibility === 'team' ? 'text-blue-400' :
                          'text-emerald-400'
                        }>
                          {selectedProject.visibility.charAt(0).toUpperCase() + selectedProject.visibility.slice(1)}
                        </span>
                      </div>
                      
                      {selectedProject.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{selectedProject.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Team Members Display */}
                  <TeamMembersDisplay 
                    projectId={selectedProject.id}
                    currentUserRole={currentUserRole}
                  />
                  
                  {/* Project Actions */}
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button
                        onClick={saveProject}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white text-sm rounded-lg transition-all duration-200"
                        title="Save Project"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                        title="Project Settings"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Editor */}
          <div className="flex-1 relative z-10">
            <ReactFlowProvider>
              <div ref={reactFlowWrapper} className="w-full h-full absolute">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onEdgesDelete={onEdgesDelete}
                  onNodeClick={onNodeClick}
                  onNodeDragStop={onNodeDragStop}
                  onConnectStart={onConnectStart}
                  onConnectEnd={onConnectEnd}
                  nodeTypes={nodeTypes}
                  onInit={setReactFlowInstance}
                  fitView
                  snapToGrid
                  snapGrid={[15, 15]}
                  defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                  }}
                  connectionLineType={ConnectionLineType.SmoothStep}
                  connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#3f3f46" gap={16} size={1} />
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
                    style={{ background: 'rgba(24, 24, 27, 0.8)' }}
                  />
                  
                  {/* Node Toolbar */}
                  {canEdit && (
                    <Panel position="top-center" className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl backdrop-blur-xl p-2 mt-2 shadow-xl">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAddNode('input')}
                          className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 text-purple-400 hover:text-purple-300"
                          title="Add Input Node"
                        >
                          <Upload size={20} />
                          <span className="text-xs">Input</span>
                        </button>
                        
                        <button
                          onClick={() => onAddNode('prompt')}
                          className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 text-blue-400 hover:text-blue-300"
                          title="Add Prompt Node"
                        >
                          <Type size={20} />
                          <span className="text-xs">Prompt</span>
                        </button>
                        
                        <button
                          onClick={() => onAddNode('condition')}
                          className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 text-yellow-400 hover:text-yellow-300"
                          title="Add Condition Node"
                        >
                          <GitBranch size={20} />
                          <span className="text-xs">Condition</span>
                        </button>
                        
                        <button
                          onClick={() => onAddNode('output')}
                          className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 text-green-400 hover:text-green-300"
                          title="Add Output Node"
                        >
                          <Target size={20} />
                          <span className="text-xs">Output</span>
                        </button>
                        
                        <div className="h-8 w-px bg-zinc-700 mx-1"></div>
                        
                        <button
                          onClick={onImportPrompt}
                          className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 text-indigo-400 hover:text-indigo-300"
                          title="Import Prompt"
                        >
                          <Download size={20} />
                          <span className="text-xs">Import</span>
                        </button>
                      </div>
                    </Panel>
                  )}
                  
                  {/* Bottom Info Panel */}
                  <Panel position="bottom-center" className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl backdrop-blur-xl p-2 mb-2 shadow-xl">
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span>Input</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span>Prompt</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span>Condition</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span>Output</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap size={12} className="text-indigo-400" />
                        <span>Drag to connect nodes</span>
                      </div>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          </div>
        </div>
      </div>

      {/* Node Editor Modal */}
      {showNodeEditor && selectedNode && (
        <NodeEditorModal
          isOpen={showNodeEditor}
          onClose={() => setShowNodeEditor(false)}
          node={selectedNode}
          onSave={async (nodeId, updates) => {
            try {
              await updateNode(nodeId, updates);
              
              // Update local state
              setNodes(nds => 
                nds.map(n => 
                  n.id === nodeId ? {
                    ...n,
                    data: {
                      ...n.data,
                      label: updates.title || n.data.label,
                      content: updates.content || n.data.content
                    }
                  } : n
                )
              );
              
              setToast({ message: 'Node updated successfully', type: 'success' });
            } catch (error) {
              console.error('Error updating node:', error);
              setToast({ message: 'Failed to update node', type: 'error' });
            }
          }}
        />
      )}

      {/* Node Details Modal */}
      {showNodeDetails && selectedNode && (
        <NodeDetailsModal
          isOpen={showNodeDetails}
          onClose={() => setShowNodeDetails(false)}
          node={selectedNode}
          onEdit={canEdit ? onEditNode : undefined}
        />
      )}

      {/* Prompt Import Modal */}
      <PromptImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSelectPrompt={handlePromptSelected}
      />

      {/* Project Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
            
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
                  Project Settings
                </h2>
                
                <button
                  onClick={() => setShowSettingsModal(false)}
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
                    id="project-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedProject.description || ''}
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                    id="project-description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        const visibilityInput = document.getElementById('project-visibility') as HTMLInputElement;
                        if (visibilityInput) visibilityInput.value = 'private';
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        selectedProject.visibility === 'private' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Lock size={20} />
                      <span className="text-xs font-medium">Private</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const visibilityInput = document.getElementById('project-visibility') as HTMLInputElement;
                        if (visibilityInput) visibilityInput.value = 'team';
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        selectedProject.visibility === 'team' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-xs font-medium">Team</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const visibilityInput = document.getElementById('project-visibility') as HTMLInputElement;
                        if (visibilityInput) visibilityInput.value = 'public';
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        selectedProject.visibility === 'public' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-xs font-medium">Public</span>
                    </button>
                  </div>
                  
                  <input type="hidden" id="project-visibility" defaultValue={selectedProject.visibility} />
                  
                  <p className="mt-2 text-xs text-zinc-500">
                    {selectedProject.visibility === 'private' 
                      ? 'Only you can access this project' 
                      : selectedProject.visibility === 'team' 
                        ? 'You and team members can access this project'
                        : 'Anyone can view this project'
                    }
                  </p>
                </div>

                {/* Team Members Display */}
                <div className="pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-300">Team Members</h3>
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowInviteModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs rounded-lg transition-all duration-200"
                    >
                      <UserPlus size={12} />
                      <span>Invite</span>
                    </button>
                  </div>
                  
                  <TeamMembersDisplay 
                    projectId={selectedProject.id}
                    currentUserRole={currentUserRole}
                  />
                </div>

                {/* Danger Zone */}
                <div className="pt-4 mt-4 border-t border-zinc-800/50">
                  <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
                  
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 w-full justify-center"
                  >
                    <Trash2 size={16} />
                    <span>Delete Project</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const nameInput = document.getElementById('project-name') as HTMLInputElement;
                    const descriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
                    const visibilityInput = document.getElementById('project-visibility') as HTMLInputElement;
                    
                    if (nameInput && visibilityInput) {
                      handleUpdateProject(
                        nameInput.value,
                        descriptionInput?.value || '',
                        visibilityInput.value as 'private' | 'team' | 'public'
                      );
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
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
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
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
                      <Type size={20} />
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
                  disabled={!inviteEmail.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  <UserPlus size={16} />
                  <span>Send Invitation</span>
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
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-zinc-800/50">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Trash2 size={20} className="text-red-400" />
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
                    id="delete-confirmation"
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
                  onClick={() => {
                    const confirmInput = document.getElementById('delete-confirmation') as HTMLInputElement;
                    if (confirmInput?.value === 'delete') {
                      // Delete project
                      navigate('/project-space');
                    } else {
                      setToast({ message: 'Please type "delete" to confirm', type: 'error' });
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200"
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
  );
};

export default ProjectEditorPage;