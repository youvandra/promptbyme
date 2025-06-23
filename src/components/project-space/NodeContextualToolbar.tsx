import React from 'react'
import { motion } from 'framer-motion'
import { 
  Trash2, 
  Maximize2,
  Edit3, 
  Copy, 
  Link
} from 'lucide-react'
import { FlowNode } from '../../store/projectSpaceStore'
import { Node, useReactFlow } from 'reactflow'

export interface NodeContextualToolbarProps {
  node: Node
  nodeData: FlowNode
  onEdit: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (nodeId: string) => void 
}

export const NodeContextualToolbar: React.FC<NodeContextualToolbarProps> = ({
  node,
  nodeData,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const { getEdges, setEdges } = useReactFlow()

  // Remove the stopPropagation to allow the toolbar to be clicked
  const handleClick = (e: React.MouseEvent, callback: () => void) => {
    callback();
  }
  
  // Function to handle node deletion with confirmation
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`HI you sure you want to delete this ${nodeData.type} node?`)) {
      onDelete(node.id)
    }
  }
  
  // Function to handle node editing
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(node.id)
  }
  
  // Function to handle viewing node details
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewDetails(node.id)
  }
  
  // Function to start connection mode (to be implemented)
  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    // This would be implemented in the parent component
    console.log('Connect from node:', node.id)
  }

  return (
  )
}