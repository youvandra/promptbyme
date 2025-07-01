import React, { useState, useEffect } from 'react'
import { X, Search, Calendar, Clock, User, Info, Filter, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

// Function to determine color based on action type
const getActionColorClass = (action: string) => {
  if (action.includes('Created') || action.includes('Added')) {
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  } else if (action.includes('Updated') || action.includes('Role')) {
    return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  } else if (action.includes('Deleted') || action.includes('Removed')) {
    return 'bg-red-500/10 border-red-500/30 text-red-400';
  } else if (action.includes('Invited')) {
    return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
  } else if (action.includes('Connection')) {
    return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  } else {
    return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
  }
};

interface ProjectLog {
  id: string
  project_id: string
  user_id: string
  action: string
  details: any
  created_at: string
  user_name?: string
}

interface ProjectLogsModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export const ProjectLogsModal: React.FC<ProjectLogsModalProps> = ({
  isOpen,
  onClose,
  projectId
}) => {
  const [logs, setLogs] = useState<ProjectLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && projectId) {
      fetchLogs()
    }
  }, [isOpen, projectId, actionFilter, dateFilter])

  const fetchLogs = async () => {
    if (!projectId) return
    
    setLoading(true)
    try {
      // Build query with filters
      let query = supabase
        .from('team_audit_log')
        .select(`
          *,
          users (
            display_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date()
        let cutoffDate = new Date()
        
        if (dateFilter === 'today') {
          cutoffDate.setHours(0, 0, 0, 0)
        } else if (dateFilter === 'week') {
          cutoffDate.setDate(now.getDate() - 7)
        } else if (dateFilter === 'month') {
          cutoffDate.setMonth(now.getMonth() - 1)
        }
        
        query = query.gte('created_at', cutoffDate.toISOString())
      }
      
      // Apply action filter
      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Process logs to include user names
      const processedLogs = (data || []).map(log => ({
        ...log,
        user_name: log.users?.display_name || log.users?.email || 'Unknown User'
      }))
      
      setLogs(processedLogs)
    } catch (error) {
      console.error('Error fetching project logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Get unique action types for filtering
  const actionTypes = Array.from(new Set(logs.map(log => log.action)))

  // Filter logs based on search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.user_name?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    )
  })

  const downloadLogs = () => {
    // Create CSV content
    const headers = ['Date', 'Time', 'User', 'Action', 'Details']
    const rows = filteredLogs.map(log => [
      formatDate(log.created_at),
      formatTime(log.created_at),
      log.user_name,
      log.action,
      JSON.stringify(log.details)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Info className="text-indigo-400" size={20} />
            <h2 className="text-xl font-semibold text-white">
              Project Activity Logs
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-zinc-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-zinc-500" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                >
                  <option value="all">All Actions</option>
                  {actionTypes.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              {/* Download Button */}
              <button
                onClick={downloadLogs}
                disabled={filteredLogs.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:bg-zinc-800/30 disabled:text-zinc-500 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all duration-200"
              >
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-zinc-400">Loading logs...</span>
              </div>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id}
                  className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 border rounded-lg text-sm ${getActionColorClass(log.action)}`}>
                        {log.action}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <User size={14} />
                        <span>{log.user_name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 mt-2">
                      <h4 className="text-xs font-medium text-zinc-400 mb-2">Details</h4>
                      <div className="space-y-1">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="text-zinc-500 font-medium">{key}:</span>
                            <span className="text-zinc-300">{
                              typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)
                            }</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-8">
                <Info className="mx-auto text-zinc-500 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery || actionFilter !== 'all' || dateFilter !== 'all' 
                    ? 'No matching logs found' 
                    : 'No activity logs yet'}
                </h3>
                <p className="text-zinc-400 mb-6">
                  {searchQuery || actionFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Activity logs will appear here as team members make changes'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-xs text-zinc-500">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'log entry' : 'log entries'}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}