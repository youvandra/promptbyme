import React, { useState, useEffect } from 'react'
import { X, Search, Calendar, Clock, ArrowDown, ArrowUp, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface ApiLog {
  id: string
  timestamp: string
  endpoint: string
  status: number
  method: string
  request_body: any
  response_body: any
  duration_ms: number
  user_id: string
  ip_address?: string
  user_agent?: string
}

interface ApiLogsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ApiLogsModal: React.FC<ApiLogsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all')
  
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && user) {
      fetchLogs()
    }
  }, [isOpen, user, dateRange, sortOrder, statusFilter])

  const fetchLogs = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Build query with filters
      let query = supabase
        .from('api_call_logs')
        .select('*')
        .eq('user_id', user.id)
      
      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date()
        let cutoffDate = new Date()
        
        if (dateRange === 'today') {
          cutoffDate.setHours(0, 0, 0, 0)
        } else if (dateRange === 'week') {
          cutoffDate.setDate(now.getDate() - 7)
        } else if (dateRange === 'month') {
          cutoffDate.setMonth(now.getMonth() - 1)
        }
        
        query = query.gte('timestamp', cutoffDate.toISOString())
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'success') {
          query = query.gte('status', 200).lt('status', 300)
        } else if (statusFilter === 'error') {
          query = query.gte('status', 400)
        }
      }
      
      // Apply sort order
      if (sortOrder === 'newest') {
        query = query.order('timestamp', { ascending: false })
      } else {
        query = query.order('timestamp', { ascending: true })
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching API logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    if (status >= 500) return 'text-red-400 bg-red-500/10 border-red-500/30'
    return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30'
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      log.endpoint.toLowerCase().includes(searchLower) ||
      log.status.toString().includes(searchLower) ||
      log.method.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.request_body).toLowerCase().includes(searchLower) ||
      JSON.stringify(log.response_body).toLowerCase().includes(searchLower)
    )
  })

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
              API Request Logs
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

            <div className="flex flex-wrap gap-3">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-zinc-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white hover:bg-zinc-800 transition-all duration-200"
              >
                <Clock size={18} className="text-zinc-500" />
                <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                {sortOrder === 'newest' ? (
                  <ArrowDown size={14} className="text-zinc-500" />
                ) : (
                  <ArrowUp size={14} className="text-zinc-500" />
                )}
              </button>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="success">Success (2xx)</option>
                <option value="error">Error (4xx/5xx)</option>
              </select>
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
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id)
                const statusColor = getStatusColor(log.status)
                
                return (
                  <div 
                    key={log.id}
                    className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl overflow-hidden"
                  >
                    {/* Log Header - Always visible */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs border ${statusColor}`}>
                            {log.status}
                          </div>
                          <span className="text-zinc-300 font-medium">{log.method}</span>
                          <span className="text-zinc-400 text-sm truncate">{log.endpoint}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatTime(log.timestamp)}</span>
                          </div>
                          <div>
                            <span>{log.duration_ms}ms</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-zinc-500">
                          {log.status >= 200 && log.status < 300 ? (
                            <span className="text-emerald-400">Success</span>
                          ) : (
                            <span className="text-red-400">Error: {log.response_body?.error || 'Unknown error'}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
                          {isExpanded ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Log Details - Visible when expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-zinc-700/30 overflow-hidden"
                        >
                          <div className="p-4 space-y-4">
                            {/* Request */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-zinc-300">Request</h4>
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(log.request_body, null, 2), `req-${log.id}`)}
                                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                                  title="Copy request"
                                >
                                  {copied === `req-${log.id}` ? (
                                    <CheckCircle size={14} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 overflow-x-auto">
                                <pre className="text-xs text-indigo-300 font-mono">
                                  {JSON.stringify(log.request_body, null, 2)}
                                </pre>
                              </div>
                            </div>
                            
                            {/* Response */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-zinc-300">Response</h4>
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(log.response_body, null, 2), `res-${log.id}`)}
                                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                                  title="Copy response"
                                >
                                  {copied === `res-${log.id}` ? (
                                    <CheckCircle size={14} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                              <div className={`bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 overflow-x-auto ${
                                log.status >= 400 ? 'border-red-500/30' : ''
                              }`}>
                                <pre className="text-xs text-indigo-300 font-mono">
                                  {JSON.stringify(log.response_body, null, 2)}
                                </pre>
                              </div>
                            </div>
                            
                            {/* Additional Info */}
                            {(log.ip_address || log.user_agent) && (
                              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-zinc-300 mb-2">Additional Info</h4>
                                {log.ip_address && (
                                  <div className="flex items-start gap-2 text-xs mb-1">
                                    <span className="text-zinc-500 font-medium w-20">IP Address:</span>
                                    <span className="text-zinc-300">{log.ip_address}</span>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div className="flex items-start gap-2 text-xs">
                                    <span className="text-zinc-500 font-medium w-20">User Agent:</span>
                                    <span className="text-zinc-300 break-words">{log.user_agent}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-8">
                <AlertCircle className="mx-auto text-zinc-500 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No matching logs found' : 'No API logs yet'}
                </h3>
                <p className="text-zinc-400 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Your API request logs will appear here once you start using the API'
                  }
                </p>
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 max-w-lg mx-auto">
                  <p className="text-sm text-zinc-300 mb-2">Try making an API request:</p>
                  <pre className="text-xs text-indigo-300 font-mono overflow-x-auto p-2">
                    {`curl -X POST "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-prompt-api" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt_id": "YOUR_PROMPT_ID", "variables": {}}'`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <div className="text-xs text-zinc-500">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'} found
          </div>
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