import React, { useState, useRef } from 'react'
import { X, Download, Upload, AlertCircle, CheckCircle, FileText, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptStore } from '../../store/promptStore'
import { useAuthStore } from '../../store/authStore'

interface ImportExportPromptsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export const ImportExportPromptsModal: React.FC<ImportExportPromptsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any[] | null>(null)
  const [importValidationError, setImportValidationError] = useState<string | null>(null)
  const [importStats, setImportStats] = useState<{ total: number; valid: number } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { user } = useAuthStore()
  const { exportUserPrompts, importPrompts } = usePromptStore()

  const handleExport = async () => {
    if (!user) return
    
    setIsExporting(true)
    try {
      const prompts = await exportUserPrompts(user.id)
      
      // Create a JSON file for download
      const dataStr = JSON.stringify(prompts, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      // Create a link and trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `promptby_me_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      onSuccess('Prompts exported successfully')
    } catch (error: any) {
      console.error('Export error:', error)
      onError(error.message || 'Failed to export prompts')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImportFile(file)
    setImportValidationError(null)
    setImportData(null)
    setImportStats(null)
    
    // Read and validate the file
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)
        
        // Validate the data structure
        if (!Array.isArray(data)) {
          setImportValidationError('Invalid file format: Expected an array of prompts')
          return
        }
        
        // Count valid prompts
        let validCount = 0
        for (const item of data) {
          if (typeof item === 'object' && item !== null && 'content' in item) {
            validCount++
          }
        }
        
        setImportData(data)
        setImportStats({ total: data.length, valid: validCount })
        
        if (validCount === 0) {
          setImportValidationError('No valid prompts found in the file')
        } else if (validCount < data.length) {
          setImportValidationError(`Warning: Only ${validCount} out of ${data.length} items are valid prompts`)
        }
      } catch (error) {
        console.error('File parsing error:', error)
        setImportValidationError('Invalid JSON file: Could not parse the file content')
      }
    }
    
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importData || !user) return
    
    setIsImporting(true)
    try {
      const result = await importPrompts(importData, user.id)
      
      onSuccess(`Successfully imported ${result.imported} prompts`)
      setImportFile(null)
      setImportData(null)
      setImportStats(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Import error:', error)
      onError(error.message || 'Failed to import prompts')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <h2 className="text-xl font-semibold text-white">
            Import/Export Prompts
          </h2>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/50">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export' 
                ? 'text-indigo-400 border-b-2 border-indigo-500' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Export Prompts
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import' 
                ? 'text-indigo-400 border-b-2 border-indigo-500' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Import Prompts
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
                <Info size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-indigo-300 font-medium mb-1">Export Information</h3>
                  <p className="text-zinc-300 text-sm">
                    This will export all your prompts as a JSON file. The export includes:
                  </p>
                  <ul className="text-zinc-400 text-sm mt-2 space-y-1 list-disc pl-5">
                    <li>Prompt content and titles</li>
                    <li>Public/private status</li>
                    <li>Tags and folder assignments</li>
                    <li>Notes and output samples</li>
                    <li>Media URLs (if any)</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      <span>Export All Prompts</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
                <Info size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-indigo-300 font-medium mb-1">Import Information</h3>
                  <p className="text-zinc-300 text-sm">
                    Upload a JSON file containing prompts to import. The file should contain an array of prompt objects.
                  </p>
                  <p className="text-zinc-400 text-sm mt-2">
                    Each prompt must have at least a <code className="bg-zinc-800 px-1 rounded text-xs">content</code> field.
                  </p>
                </div>
              </div>
              
              <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {!importFile ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                      <FileText size={24} className="text-indigo-400" />
                    </div>
                    <p className="text-zinc-300 mb-4">Select a JSON file to import</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all duration-200"
                    >
                      <Upload size={16} />
                      <span>Choose File</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{importFile.name}</p>
                          <p className="text-zinc-500 text-xs">{(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setImportFile(null)
                          setImportData(null)
                          setImportStats(null)
                          setImportValidationError(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    {importValidationError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{importValidationError}</p>
                      </div>
                    )}
                    
                    {importStats && (
                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-zinc-300 text-sm">Total items:</span>
                          <span className="text-white font-medium">{importStats.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-300 text-sm">Valid prompts:</span>
                          <span className={`font-medium ${
                            importStats.valid === importStats.total 
                              ? 'text-emerald-400' 
                              : importStats.valid > 0 
                                ? 'text-amber-400' 
                                : 'text-red-400'
                          }`}>
                            {importStats.valid}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <button
                        onClick={handleImport}
                        disabled={isImporting || !importData || importStats?.valid === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                      >
                        {isImporting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            <span>Import Prompts</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-300 font-medium mb-1">Important Note</h3>
                  <p className="text-zinc-300 text-sm">
                    Imported prompts will be added to your collection with new IDs. This will not overwrite your existing prompts.
                  </p>
                  <p className="text-zinc-400 text-sm mt-2">
                    All imported prompts will be set to private by default.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}