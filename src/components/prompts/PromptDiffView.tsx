import React, { useMemo } from 'react'
import { X, ArrowLeft, ArrowRight, Copy, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

interface PromptVersion {
  id: string
  prompt_id: string
  version_number: number
  title: string
  content: string
  commit_message: string
  created_at: string
  is_current: boolean
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
}

interface PromptDiffViewProps {
  isOpen: boolean
  onClose: () => void
  leftVersion: PromptVersion | null
  rightVersion: PromptVersion | null
  onRevert?: (versionNumber: number) => Promise<void>
  isOwner?: boolean
}

export const PromptDiffView: React.FC<PromptDiffViewProps> = ({
  isOpen,
  onClose,
  leftVersion,
  rightVersion,
  onRevert,
  isOwner = false
}) => {
  const [reverting, setReverting] = React.useState(false)

  // Generate diff between two versions
  const diff = useMemo(() => {
    if (!leftVersion || !rightVersion) return []

    const leftLines = leftVersion.content.split('\n')
    const rightLines = rightVersion.content.split('\n')
    
    const diffLines: DiffLine[] = []
    const maxLines = Math.max(leftLines.length, rightLines.length)

    for (let i = 0; i < maxLines; i++) {
      const leftLine = leftLines[i] || ''
      const rightLine = rightLines[i] || ''

      if (leftLine === rightLine) {
        diffLines.push({
          type: 'unchanged',
          content: leftLine,
          lineNumber: i + 1
        })
      } else {
        if (leftLine && leftLine !== rightLine) {
          diffLines.push({
            type: 'removed',
            content: leftLine,
            lineNumber: i + 1
          })
        }
        if (rightLine && rightLine !== leftLine) {
          diffLines.push({
            type: 'added',
            content: rightLine,
            lineNumber: i + 1
          })
        }
      }
    }

    return diffLines
  }, [leftVersion, rightVersion])

  const handleRevert = async () => {
    if (!leftVersion || !onRevert) return
    
    setReverting(true)
    try {
      await onRevert(leftVersion.version_number)
      onClose()
    } catch (error) {
      console.error('Failed to revert:', error)
    } finally {
      setReverting(false)
    }
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLineTypeClass = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-100'
      case 'removed':
        return 'bg-red-500/10 border-l-4 border-red-500 text-red-100'
      default:
        return 'bg-zinc-800/30 border-l-4 border-transparent text-zinc-300'
    }
  }

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'added':
        return '+ '
      case 'removed':
        return '- '
      default:
        return '  '
    }
  }

  if (!isOpen || !leftVersion || !rightVersion) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Version Comparison</h2>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                v{leftVersion.version_number}
              </span>
              <ArrowRight size={16} />
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                v{rightVersion.version_number}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="grid grid-cols-2 gap-px bg-zinc-800/50 flex-shrink-0">
          {/* Left Version Info */}
          <div className="bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white">
                Version {leftVersion.version_number}
                {leftVersion.is_current && (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    Current
                  </span>
                )}
              </h3>
              <button
                onClick={() => copyToClipboard(leftVersion.content)}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
                title="Copy content"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-1">{leftVersion.title}</p>
            <p className="text-xs text-zinc-500">{formatDate(leftVersion.created_at)}</p>
            {leftVersion.commit_message && (
              <p className="text-xs text-zinc-400 mt-2 italic">"{leftVersion.commit_message}"</p>
            )}
          </div>

          {/* Right Version Info */}
          <div className="bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white">
                Version {rightVersion.version_number}
                {rightVersion.is_current && (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    Current
                  </span>
                )}
              </h3>
              <button
                onClick={() => copyToClipboard(rightVersion.content)}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
                title="Copy content"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-1">{rightVersion.title}</p>
            <p className="text-xs text-zinc-500">{formatDate(rightVersion.created_at)}</p>
            {rightVersion.commit_message && (
              <p className="text-xs text-zinc-400 mt-2 italic">"{rightVersion.commit_message}"</p>
            )}
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-zinc-950/50">
            {diff.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <p>No differences found between these versions.</p>
              </div>
            ) : (
              <div className="font-mono text-sm">
                {diff.map((line, index) => (
                  <div
                    key={index}
                    className={`flex items-start px-4 py-1 ${getLineTypeClass(line.type)}`}
                  >
                    <span className="text-zinc-500 text-xs w-8 flex-shrink-0 text-right mr-4">
                      {line.lineNumber}
                    </span>
                    <span className="text-zinc-400 w-4 flex-shrink-0">
                      {getLinePrefix(line.type)}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-words">
                      {line.content || ' '}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500/30 border border-emerald-500 rounded"></div>
                <span>Added lines</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/30 border border-red-500 rounded"></div>
                <span>Removed lines</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-600 rounded"></div>
                <span>Unchanged lines</span>
              </div>
            </div>
            <div>
              {diff.filter(l => l.type === 'added').length} additions, {' '}
              {diff.filter(l => l.type === 'removed').length} deletions
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}