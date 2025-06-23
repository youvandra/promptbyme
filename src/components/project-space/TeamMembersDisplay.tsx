import React, { useEffect } from 'react'
import { Users, Crown, Edit3, Eye, MoreVertical, UserMinus, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectSpaceStore, ProjectMember } from '../../store/projectSpaceStore'

interface TeamMembersDisplayProps {
  onClick: () => void
  projectId: string
  currentUserRole: string | null
}

export const TeamMembersDisplay: React.FC<TeamMembersDisplayProps> = ({
  onClick,
  projectId,
  currentUserRole
}) => {
  const { 
    projectMembers, 
    membersLoading, 
    fetchProjectMembers,
    updateMemberRole,
    removeProjectMember
  } = useProjectSpaceStore()

  const [expandedMember, setExpandedMember] = React.useState<string | null>(null)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchProjectMembers(projectId)
    }
  }, [projectId, fetchProjectMembers])

  const handleRoleUpdate = async (memberUserId: string, newRole: ProjectMember['role']) => {
    if (actionLoading) return
    
    setActionLoading(memberUserId)
    try {
      await updateMemberRole(projectId, memberUserId, newRole)
      setExpandedMember(null)
    } catch (error) {
      console.error('Failed to update member role:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberUserId: string) => {
    if (actionLoading) return
    
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return
    }
    
    setActionLoading(memberUserId)
    try {
      await removeProjectMember(projectId, memberUserId)
      setExpandedMember(null)
    } catch (error) {
      console.error('Failed to remove member:', error)
    } finally {
      setActionLoading(null)
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

  if (membersLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400">
        <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm">Loading members...</span>
      </div>
    )
  }

  if (projectMembers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-zinc-500">
        <Users size={16} />
        <span className="text-sm">No members</span>
      </div>
    )
  }

  const acceptedMembers = projectMembers.filter(member => member.status === 'accepted')
  const pendingMembers = projectMembers.filter(member => member.status === 'pending')

  return (
    <div className="flex items-center gap-2">
      {/* Member Avatars */}
      <div className="flex -space-x-2">
        {acceptedMembers.slice(0, 3).map((member) => (
          <motion.div
            key={member.id}
            className="relative group"
            whileHover={{ scale: 1.1, zIndex: 10 }}
            transition={{ duration: 0.2 }}
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.display_name}
                className="w-8 h-8 rounded-full border-2 border-zinc-800 bg-zinc-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-zinc-800 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(member.display_name)}
              </div>
            )}
            
            {/* Role indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
              {getRoleIcon(member.role)}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none">
              {member.display_name} ({member.role})
            </div>
          </motion.div>
        ))}
        
        {acceptedMembers.length > 3 && (
          <div className="w-8 h-8 rounded-full border-2 border-zinc-800 bg-zinc-700 flex items-center justify-center text-white text-xs font-semibold">
            +{acceptedMembers.length - 3}
          </div>
        )}
      </div>

      {/* Member count and dropdown */}
      <div className="relative">
        <button
          onClick={onClick}
          className="flex items-center gap-1 px-2 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        >
          <Users size={14} />
          <span>{acceptedMembers.length}</span>
          {pendingMembers.length > 0 && (
            <span className="text-orange-400">+{pendingMembers.length}</span>
          )}
          <MoreVertical size={12} />
        </button>

      </div>
    </div>
  )
}