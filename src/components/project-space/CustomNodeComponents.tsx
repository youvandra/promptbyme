import React from 'react'
import { NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import { Trash2, Maximize2, Edit3 } from 'lucide-react'

// Input Node Component
export const InputNode: React.FC<NodeProps> = ({ data }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-purple-600/30 border border-purple-500/30 w-[250px] h-[150px] hover:bg-purple-600/40 hover:border-purple-500/40 transition-all duration-200 flex flex-col">
    <div className="font-bold text-sm text-white mb-3">{data.label}</div>
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl z-50 flex items-center">
      <button
        onClick={() => data.onViewDetails && data.onViewDetails(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="View details"
      >
        <Maximize2 size={16} />
      </button>
      
      <button
        onClick={() => data.onEdit && data.onEdit(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="Edit node"
      >
        <Edit3 size={16} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete this ${data.nodeData.type} node?`)) {
            data.onDelete && data.onDelete(data.nodeData.id);
          }
        }}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        title="Delete node"
      >
        <Trash2 size={16} />
      </button>
    </div>
    {data.content && (
      <div className="text-xs text-white bg-purple-800/20 p-3 rounded border border-purple-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)

// Prompt Node Component
export const PromptNode: React.FC<NodeProps> = ({ data }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-blue-600/30 border border-blue-500/30 w-[250px] h-[150px] hover:bg-blue-600/40 hover:border-blue-500/40 transition-all duration-200 flex flex-col">
    <div className="font-bold text-sm text-white mb-3">{data.label}</div>
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl z-50 flex items-center">
      <button
        onClick={() => data.onViewDetails && data.onViewDetails(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="View details"
      >
        <Maximize2 size={16} />
      </button>
      
      <button
        onClick={() => data.onEdit && data.onEdit(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="Edit node"
      >
        <Edit3 size={16} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete this ${data.nodeData.type} node?`)) {
            data.onDelete && data.onDelete(data.nodeData.id);
          }
        }}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        title="Delete node"
      >
        <Trash2 size={16} />
      </button>
    </div>
    {data.content && (
      <div className="text-xs text-white bg-blue-800/20 p-3 rounded border border-blue-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)

// Condition Node Component
export const ConditionNode: React.FC<NodeProps> = ({ data }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-yellow-600/30 border border-yellow-500/30 w-[250px] h-[150px] hover:bg-yellow-600/40 hover:border-yellow-500/40 transition-all duration-200 flex flex-col">
    <div className="font-bold text-sm text-yellow mb-3">{data.label}</div>
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl z-50 flex items-center">
      <button
        onClick={() => data.onViewDetails && data.onViewDetails(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="View details"
      >
        <Maximize2 size={16} />
      </button>
      
      <button
        onClick={() => data.onEdit && data.onEdit(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="Edit node"
      >
        <Edit3 size={16} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete this ${data.nodeData.type} node?`)) {
            data.onDelete && data.onDelete(data.nodeData.id);
          }
        }}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        title="Delete node"
      >
        <Trash2 size={16} />
      </button>
    </div>
    {data.content && (
      <div className="text-xs text-white bg-yellow-800/20 p-3 rounded border border-yellow-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)

// Output Node Component
export const OutputNode: React.FC<NodeProps> = ({ data }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-green-600/30 border border-green-500/30 w-[250px] h-[150px] hover:bg-green-600/40 hover:border-green-500/40 transition-all duration-200 flex flex-col">
    <div className="font-bold text-sm text-white mb-3">{data.label}</div>
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl z-50 flex items-center">
      <button
        onClick={() => data.onViewDetails && data.onViewDetails(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="View details"
      >
        <Maximize2 size={16} />
      </button>
      
      <button
        onClick={() => data.onEdit && data.onEdit(data.nodeData.id)}
        className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        title="Edit node"
      >
        <Edit3 size={16} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete this ${data.nodeData.type} node?`)) {
            data.onDelete && data.onDelete(data.nodeData.id);
          }
        }}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        title="Delete node"
      >
        <Trash2 size={16} />
      </button>
    </div>
    {data.content && (
      <div className="text-xs text-white bg-green-800/20 p-3 rounded border border-green-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)