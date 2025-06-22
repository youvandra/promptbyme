import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Upload, Maximize2, Trash2 } from 'lucide-react';

interface InputNodeData {
  label: string;
  content: string;
}

const InputNode: React.FC<NodeProps<InputNodeData>> = ({ data, id, selected }) => {
  return (
    <div className={`relative p-4 rounded-xl border shadow-lg transition-all duration-200 max-w-[280px] ${
      selected 
        ? 'bg-purple-500/20 border-purple-500/50 shadow-purple-500/10' 
        : 'bg-zinc-800/80 border-zinc-700/50 hover:border-purple-500/30'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-500/30 rounded-lg">
          <Upload size={14} className="text-purple-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{data.label}</h3>
          <p className="text-xs text-purple-300">Input Node</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center">
          <button
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
            title="View details"
            onClick={(e) => {
              e.stopPropagation();
              // Handle view details
            }}
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2 mb-2">
        <p className="text-xs text-zinc-300 line-clamp-3">
          {data.content || 'Define your input parameters here...'}
        </p>
      </div>
      
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-zinc-800"
      />
    </div>
  );
};

export default memo(InputNode);