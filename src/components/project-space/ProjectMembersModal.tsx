import React, { useState, useEffect } from 'react'
import { X, Users, Crown, Edit3, Eye, UserMinus, Shield, Search, UserPlus, Mail, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectSpaceStore, ProjectMember } from '../../store/projectSpaceStore'

interface ProjectMembersModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  currentUserRole: string | null
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  currentUserRole
}) => {
  const { 
    projectMembers, 
    membersLoading, 
    fetchProjectMembers,
    updateMemberRole,
    removeProjectMember,
    inviteProjectMember
  } = useProjectSpaceStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectMember['role']>('viewer')
  const [isInviting, setIsInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectMembers(projectId)
    }
  }, [isOpen, projectId, fetchProjectMembers])

  const handleRoleUpdate = async (memberUserId: string, newRole: ProjectMember['role']) => {
    if (actionLoading) return
    
    setActionLoading(memberUserId)
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
      await updateMemberRole(projectId, memberUserId, newRole)
      setSuccessMessage(`Member role updated to ${newRole}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Failed to update member role:', error)
      setErrorMessage(error.message || 'Failed to update member role')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberUserId: string, displayName: string) => {
    if (actionLoading) return
    
    if (!confirm(`Are you sure you want to remove ${displayName} from the project?`)) {
      return
    }
    
    setActionLoading(memberUserId)
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
      await removeProjectMember(projectId, memberUserId)
      setSuccessMessage('Member removed successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Failed to remove member:', error)
      setErrorMessage(error.message || 'Failed to remove member')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || isInviting) return
    
    setIsInviting(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
      await inviteProjectMember(projectId, inviteEmail.trim(), inviteRole)
      setSuccessMessage('Invitation sent successfully')
      setInviteEmail('')
      setShowInviteForm(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Failed to invite member:', error)
      setErrorMessage(error.message || 'Failed to send invitation')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setIsInviting(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={14} className="text-yellow-400" />
      case 'editor':
        return <Edit3 size={14} className="text-blue-400" />
      case 'viewer':
        return <Eye size={14} className="text-green-400" />
      default:
        return <Users size={14} className="text-zinc-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'editor':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'viewer':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never'
    
    const now = new Date()
    const active = new Date(lastActive)
    const diffMs = now.getTime() - active.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return active.toLocaleDateString()
  }

  // Filter members based on search query
  const filteredMembers = projectMembers.filter(member => {
    return member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           member.role.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Separate accepted and pending members
  const acceptedMembers = filteredMembers.filter(member => member.status === 'accepted')
  const pendingMembers = filteredMembers.filter(member => member.status === 'pending')

  if (!isOpen) return null

  const isAdmin = currentUserRole === 'admin'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Project Members
              </h2>
              <p className="text-sm text-zinc-400">
                Manage team access and permissions
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Invite */}
        <div className="p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                <UserPlus size={18} />
                <span>{showInviteForm ? 'Cancel' : 'Invite Member'}</span>
              </button>
            )}
          </div>

          {/* Invite Form */}
          <AnimatePresence>
            {showInviteForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
                  <h3 className="text-sm font-medium text-white mb-4">Invite New Member</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      />
                    </div>
                    
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as ProjectMember['role'])}
                      className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-zinc-500">
                      <p><strong>Viewer:</strong> Can only view the project</p>
                      <p><strong>Editor:</strong> Can edit nodes and connections</p>
                      <p><strong>Admin:</strong> Full access including member management</p>
                    </div>
                    
                    <button
                      onClick={handleInviteMember}
                      disabled={!inviteEmail.trim() || isInviting}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isInviting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Send Invitation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                {errorMessage}
              </motion.div>
            )}
            
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-6">
          {membersLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-zinc-400">Loading members...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Accepted Members */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-indigo-400" />
                  Active Members ({acceptedMembers.length})
                </h3>
                
                <div className="space-y-3">
                  {acceptedMembers.length > 0 ? (
                    acceptedMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.display_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                {getInitials(member.display_name)}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">
                                  {member.display_name}
                                  {member.is_current_user && (
                                    <span className="text-xs text-indigo-400 ml-1">(You)</span>
                                  )}
                                </p>
                              </div>
                              <p className="text-xs text-zinc-500 truncate">{member.email}</p>
                              <p className="text-xs text-zinc-400 mt-1">
                                Last active: {formatLastActive(member.last_active)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              <span>{member.role}</span>
                            </div>
                            
                            {isAdmin && !member.is_current_user && (
                              <div className="flex items-center gap-2">
                                {/* Role change dropdown */}
                                <select
                                  value={member.role}
                                  onChange={(e) => handleRoleUpdate(member.user_id, e.target.value as ProjectMember['role'])}
                                  disabled={actionLoading === member.user_id}
                                  className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="editor">Editor</option>
                                  <option value="admin">Admin</option>
                                </select>
                                
                                {/* Remove member */}
                                <button
                                  onClick={() => handleRemoveMember(member.user_id, member.display_name)}
                                  disabled={actionLoading === member.user_id}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                  title="Remove member"
                                >
                                  {actionLoading === member.user_id ? (
                                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                  ) : (
                                    <UserMinus size={16} />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-zinc-800/20 border border-zinc-800/40 rounded-xl">
                      <p className="text-zinc-500">No active members found</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pending Invitations */}
              {pendingMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <Mail size={16} className="text-orange-400" />
                    Pending Invitations ({pendingMembers.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {pendingMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm font-semibold">
                              {getInitials(member.display_name)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {member.display_name}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">{member.email}</p>
                              <p className="text-xs text-orange-400 mt-1">
                                Invited by {member.invited_by || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              <span>{member.role}</span>
                            </div>
                            
                            {isAdmin && (
                              <button
                                onClick={() => handleRemoveMember(member.user_id, member.display_name)}
                                disabled={actionLoading === member.user_id}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                title="Cancel invitation"
                              >
                                {actionLoading === member.user_id ? (
                                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                  <UserMinus size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-xs text-zinc-500">
              {projectMembers.length} total member{projectMembers.length !== 1 ? 's' : ''}
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