import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitBranch } from 'lucide-react'

const ConditionNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 shadow-lg min-w-[200px] max-w-[300px]">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 bg-yellow-500/20 rounded-md text-yellow-400">
          <GitBranch size={16} />
        </div>
        <div className="text-white font-medium text-sm truncate flex-1">
          {data.label}
        </div>
      </div>
      
      {data.content && (
        <div className="text-xs text-zinc-400 line-clamp-3 mb-2 bg-zinc-800/50 p-2 rounded-lg">
          {data.content}
        </div>
      )}
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-500 border-2 border-zinc-900"
      />
      
      {/* Output handles - left, right, bottom */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-yellow-500 border-2 border-zinc-900"
        style={{ left: -8, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-yellow-500 border-2 border-zinc-900"
        style={{ right: -8, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-yellow-500 border-2 border-zinc-900"
      />
    </div>
  )
}

export default memo(ConditionNode)