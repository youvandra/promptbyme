import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  Controls,
  Background,
  Panel,
  MarkerType,
  NodeTypes,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom editable node component
const EditableNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`px-4 py-2 shadow-md rounded-md border-2 ${
        selected ? 'border-indigo-500' : 'border-gray-300'
      } bg-white min-w-[150px] min-h-[50px] flex items-center justify-center`}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="w-full text-center bg-transparent outline-none"
          value={data.label}
          onChange={(e) => data.onChange(id, e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className="text-center">{data.label}</div>
      )}
    </div>
  );
};

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'editable',
    data: { label: 'Node 1' },
    position: { x: 250, y: 100 },
  },
  {
    id: '2',
    type: 'editable',
    data: { label: 'Node 2' },
    position: { x: 250, y: 300 },
  },
];

const initialEdges: Edge[] = [];

// Main component
const DynamicFlowEditor: React.FC = () => {
  // Define node types
  const nodeTypes: NodeTypes = {
    editable: EditableNode,
  };

  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node label changes
  const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Update node data to include onChange handler
  const nodesWithCallbacks = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onChange: handleNodeLabelChange,
    },
  }));

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Create a new edge with smooth step type and arrow marker
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Add a new node to the flow
  const addNode = useCallback(() => {
    const newId = (nodes.length + 1).toString();
    const newNode: Node = {
      id: newId,
      type: 'editable',
      data: { label: `Node ${newId}` },
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  return (
    <div className="w-full h-[600px] border border-gray-300 rounded-lg">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
      >
        {/* Add controls and background */}
        <Controls />
        <Background color="#aaa" gap={16} />
        
        {/* Panel for adding new nodes */}
        <Panel position="top-right" className="bg-white p-2 rounded shadow-md">
          <button
            onClick={addNode}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Add Node
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default DynamicFlowEditor;