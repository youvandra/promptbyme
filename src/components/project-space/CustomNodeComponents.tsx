import React from 'react'
import { NodeProps, Position } from 'reactflow'
import { Edit3, GitBranch, Target, Upload } from 'lucide-react'

// Input Node Component
export const InputNode: React.FC<NodeProps> = ({ data, selected }) => (
  <div 
    className="px-4 py-3 shadow-md rounded-lg bg-purple-600/30 border border-purple-500/30 w-[250px] h-[150px] hover:bg-purple-600/40 hover:border-purple-500/40 transition-all duration-200 flex flex-col"
    style={{
      borderColor: selected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(168, 85, 247, 0.3)',
      boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none'
    }}
  >
    <div className="font-bold text-sm text-white mb-3 flex items-center gap-2">
      <Upload size={16} className="text-purple-400" />
      {data.label}
    </div>
    {data.content && (
      <div className="text-xs text-white bg-purple-800/20 p-3 rounded border border-purple-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)

// Prompt Node Component
export const PromptNode: React.FC<NodeProps> = ({ data, selected }) => (
  <div 
    className="px-4 py-3 shadow-md rounded-lg bg-blue-600/30 border border-blue-500/30 w-[250px] h-[150px] hover:bg-blue-600/40 hover:border-blue-500/40 transition-all duration-200 flex flex-col"
    style={{
      borderColor: selected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(59, 130, 246, 0.3)',
      boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none'
    }}
  >
    <div className="font-bold text-sm text-white mb-3 flex items-center gap-2">
      <Edit3 size={16} className="text-blue-400" />
      {data.label}
    </div>
    {data.content && (
      <div className="text-xs text-white bg-blue-800/20 p-3 rounded border border-blue-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)

// Condition Node Component
export const ConditionNode: React.FC<NodeProps> = ({ data, selected }) => (
  <div 
    className="px-4 py-3 shadow-md rounded-lg bg-yellow-600/30 border border-yellow-500/30 w-[250px] h-[150px] hover:bg-yellow-600/40 hover:border-yellow-500/40 transition-all duration-200 flex flex-col"
    style={{
      borderColor: selected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(234, 179, 8, 0.3)',
      boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none'
    }}
  >
    <div className="font-bold text-sm text-white mb-3 flex items-center gap-2">
      <GitBranch size={16} className="text-yellow-400" />
      {data.label}
    </div>
    {data.content && (
      <div className="text-xs text-white bg-yellow-800/20 p-3 rounded border border-yellow-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)

// Output Node Component
export const OutputNode: React.FC<NodeProps> = ({ data, selected }) => (
  <div 
    className="px-4 py-3 shadow-md rounded-lg bg-green-600/30 border border-green-500/30 w-[250px] h-[150px] hover:bg-green-600/40 hover:border-green-500/40 transition-all duration-200 flex flex-col"
    style={{
      borderColor: selected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(34, 197, 94, 0.3)',
      boxShadow: selected ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none'
    }}
  >
    <div className="font-bold text-sm text-white mb-3 flex items-center gap-2">
      <Target size={16} className="text-green-400" />
      {data.label}
    </div>
    {data.content && (
      <div className="text-xs text-white bg-green-800/20 p-3 rounded border border-green-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)