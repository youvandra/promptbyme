import React from 'react'
import { NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import { NodeContextualToolbar } from './NodeContextualToolbar'

// Input Node Component
export const InputNode: React.FC<NodeProps> = ({ data }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-purple-600/30 border border-purple-500/30 w-[250px] h-[150px] hover:bg-purple-600/40 hover:border-purple-500/40 transition-all duration-200 flex flex-col">
    <div className="font-bold text-sm text-white mb-3">{data.label}</div>
    <NodeContextualToolbar
      node={data.nodeData}
      nodeData={data.nodeData}
      onEdit={(nodeId) => {
        if (data.onEdit) data.onEdit(nodeId);
      }}
      onDelete={(nodeId) => {
        if (data.onDelete) data.onDelete(nodeId);
      }}
      onViewDetails={(nodeId) => {
        if (data.onViewDetails) data.onViewDetails(nodeId);
      }}
    />
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
    <NodeContextualToolbar
      node={data.nodeData}
      nodeData={data.nodeData}
      onEdit={(nodeId) => {
        if (data.onEdit) data.onEdit(nodeId);
      }}
      onDelete={(nodeId) => {
        if (data.onDelete) data.onDelete(nodeId);
      }}
      onViewDetails={(nodeId) => {
        if (data.onViewDetails) data.onViewDetails(nodeId);
      }}
    />
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
    <NodeContextualToolbar
      node={data.nodeData}
      nodeData={data.nodeData}
      onEdit={(nodeId) => {
        if (data.onEdit) data.onEdit(nodeId);
      }}
      onDelete={(nodeId) => {
        if (data.onDelete) data.onDelete(nodeId);
      }}
      onViewDetails={(nodeId) => {
        if (data.onViewDetails) data.onViewDetails(nodeId);
      }}
    />
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
    <NodeContextualToolbar
      node={data.nodeData}
      nodeData={data.nodeData}
      onEdit={(nodeId) => {
        if (data.onEdit) data.onEdit(nodeId);
      }}
      onDelete={(nodeId) => {
        if (data.onDelete) data.onDelete(nodeId);
      }}
      onViewDetails={(nodeId) => {
        if (data.onViewDetails) data.onViewDetails(nodeId);
      }}
    />
    {data.content && (
      <div className="text-xs text-white bg-green-800/20 p-3 rounded border border-green-500/20 overflow-y-auto flex-1 min-h-0">
        {data.content}
      </div>
    )}
  </div>
)