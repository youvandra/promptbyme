import React, { useState, useEffect } from 'react'
import { 
  GitBranch, 
  Clock, 
  RotateCcw, 
  Eye, 
  X,
  ChevronDown,
  ChevronRight,
  GitCommit,
  GitCompare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { marked } from 'marked'
import { usePromptStore } from '../../store/promptStore'
import { PromptDiffView } from './PromptDiffView'

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

interface PromptVersionHistoryProps {
  promptId: string
  isOpen: boolean
  onClose: () => void
  onRevert?: (versionNumber: number) => Promise<void>
  onCreateVersion?: (title: string, content: string, commitMessage: string) => Promise<void>
  isOwner?: boolean
}

export const PromptVersionHistory: React.FC<PromptVersionHistoryProps> = ({
  promptId,
  isOpen,
  onClose,
  onRevert,
  onCreateVersion,
  isOwner = false
}) => {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())
  const [reverting, setReverting] = useState(false)
  const [showDiffView, setShowDiffView] = useState(false)
  const [diffVersions, setDiffVersions] = useState<{left: PromptVersion | null, right: PromptVersion | null}>({
    left: null,
    right: null
  })
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set())

  const { fetchVersionHistory, revertToVersion } = usePromptStore()

  useEffect(() => {
    if (isOpen && promptId) {
      loadVersionHistory()
    }
  }, [isOpen, promptId])

  const loadVersionHistory = async () => {
    setLoading(true)
    try {
      const versionData = await fetchVersionHistory(promptId)
      setVersions(versionData)
      
      // Auto-select the current version (first in list since sorted newest first)
      const currentVersion = versionData.find(v => v.is_current)
      if (currentVersion) {
        setSelectedVersion(currentVersion)
      }
    } catch (error) {
      console.error('Failed to load version history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async (versionNumber: number) => {
    if (!isOwner || reverting) return
    
    setReverting(true)
    try {
      await revertToVersion(promptId, versionNumber)
      await loadVersionHistory() // Reload to show the new version
      
      if (onRevert) {
        await onRevert(versionNumber)
      }
    } catch (error) {
      console.error('Failed to revert version:', error)
    } finally {
      setReverting(false)
    }
  }

  const toggleVersionExpansion = (versionId: string) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId)
    } else {
      newExpanded.add(versionId)
    }
    setExpandedVersions(newExpanded)
  }

  const handleVersionSelection = (version: PromptVersion) => {
    const newSelected = new Set(selectedForComparison)
    
    if (newSelected.has(version.id)) {
      newSelected.delete(version.id)
    } else if (newSelected.size < 2) {
      newSelected.add(version.id)
    } else {
      // Replace the oldest selection
      newSelected.clear()
      newSelected.add(version.id)
    }
    
    setSelectedForComparison(newSelected)
  }

  const handleCompareVersions = () => {
    const selectedVersionIds = Array.from(selectedForComparison)
    if (selectedVersionIds.length === 2) {
      const version1 = versions.find(v => v.id === selectedVersionIds[0])
      const version2 = versions.find(v => v.id === selectedVersionIds[1])
      
      if (version1 && version2) {
        // Order by version number (older first, newer second)
        const [leftVersion, rightVersion] = version1.version_number < version2.version_number 
          ? [version1, version2] 
          : [version2, version1]
        
        setDiffVersions({ left: leftVersion, right: rightVersion })
        setShowDiffView(true)
      }
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

  // Function to highlight variables in content
  const highlightVariables = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">{{$1}}</span>')
  }

  const renderContent = (content: string) => {
    try {
      const html = marked(content, { breaks: true })
      const highlightedHtml = highlightVariables(html)
      return { __html: highlightedHtml }
    } catch {
      const plainTextWithBreaks = content.replace(/\n/g, '<br>')
      const highlightedText = highlightVariables(plainTextWithBreaks)
      return { __html: highlightedText }
    }
  }

  if (!isOpen) return null

  const selectedCount = selectedForComparison.size

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <GitBranch className="text-indigo-400" size={20} />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Version History</h2>
                <p className="text-xs sm:text-sm text-zinc-400">Track changes and manage versions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Compare button */}
              {selectedCount === 2 && (
                <button
                  onClick={handleCompareVersions}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                >
                  <GitCompare size={14} />
                  <span className="hidden sm:inline">Compare</span>
                </button>
              )}
              
              {/* Revert button */}
              {isOwner && selectedVersion && !selectedVersion.is_current && (
                <button
                  onClick={() => handleRevert(selectedVersion.version_number)}
                  disabled={reverting}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">{reverting ? 'Reverting...' : 'Revert'}</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Selection Info */}
          {selectedCount > 0 && (
            <div className="px-4 sm:px-6 py-2 bg-indigo-500/10 border-b border-zinc-800/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-indigo-300">
                  {selectedCount === 1 
                    ? '1 version selected for comparison' 
                    : selectedCount === 2 
                      ? '2 versions selected - ready to compare'
                      : 'Select up to 2 versions to compare'
                  }
                </p>
                {selectedCount > 0 && (
                  <button
                    onClick={() => setSelectedForComparison(new Set())}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Version List */}
            <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-zinc-800/50 overflow-y-auto max-h-[40vh] lg:max-h-none">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-6 h-6 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-zinc-400">Loading versions...</p>
                </div>
              ) : (
                <div className="p-3 sm:p-4 space-y-2">
                  {versions.map((version, index) => {
                    const isSelected = selectedForComparison.has(version.id)
                    const isSelectedForView = selectedVersion?.id === version.id
                    
                    return (
                      <div
                        key={version.id}
                        className={`border rounded-lg transition-all duration-200 cursor-pointer ${
                          isSelectedForView
                            ? 'border-indigo-500/50 bg-indigo-500/10'
                            : isSelected
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-zinc-800/50 hover:border-zinc-700/50'
                        }`}
                      >
                        <div
                          className="p-3 sm:p-4"
                          onClick={() => setSelectedVersion(version)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GitCommit size={14} className="text-zinc-400 mt-0.5" />
                              <span className="font-medium text-white text-sm">
                                v{version.version_number}
                              </span>
                              {version.is_current && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Comparison checkbox */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleVersionSelection(version)
                                }}
                                className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-zinc-600 hover:border-zinc-500'
                                }`}
                                title="Select for comparison"
                              >
                                {isSelected && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  </div>
                                )}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleVersionExpansion(version.id)
                                }}
                                className="p-1 text-zinc-400 hover:text-white transition-colors"
                              >
                                {expandedVersions.has(version.id) ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-white text-sm mb-1 line-clamp-1">
                            {version.title}
                          </h4>
                          
                          <p className="text-xs text-zinc-400 mb-2 line-clamp-1">
                            {version.commit_message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatDate(version.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedVersions.has(version.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-zinc-800/50 overflow-hidden"
                            >
                              <div className="p-3 sm:p-4">
                                <div className="text-xs text-zinc-300 max-h-24 overflow-y-auto">
                                  <div dangerouslySetInnerHTML={renderContent(version.content.substring(0, 150) + '...')} />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Version Details */}
            <div className="w-full lg:w-1/2 overflow-y-auto">
              {selectedVersion ? (
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Version {selectedVersion.version_number}
                      </h3>
                      {selectedVersion.is_current && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full self-start">
                          Current Version
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-2 break-words">
                      {selectedVersion.title}
                    </h4>
                    
                    <p className="text-zinc-400 mb-4">
                      {selectedVersion.commit_message}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{formatDate(selectedVersion.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} />
                        <span>main</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h5 className="text-sm font-medium text-zinc-300 mb-3">Content</h5>
                    <div 
                      className="prose prose-invert prose-sm max-w-none text-zinc-200 break-words"
                      dangerouslySetInnerHTML={renderContent(selectedVersion.content)}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-400">
                  <Eye size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a version to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diff View Modal */}
      <PromptDiffView
        isOpen={showDiffView}
        onClose={() => setShowDiffView(false)}
        leftVersion={diffVersions.left}
        rightVersion={diffVersions.right}
        onRevert={onRevert}
        isOwner={isOwner}
      />
    </>
  )
}