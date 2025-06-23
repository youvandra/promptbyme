import React, { useEffect, useState } from 'react'
import { X, Check, Users, Clock, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectSpaceStore } from '../../store/projectSpaceStore'
import { useAuthStore } from '../../store/authStore'
 import { useNavigate } from 'react-router-dom'

export const InvitationNotification: React.FC = () => {
  const { user, authLoading } = useAuthStore()
  const { 
    userInvitations, 
    invitationsLoading, 
    fetchUserInvitations, 
    manageInvitation 
  } = useProjectSpaceStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
 const navigate = useNavigate()

  useEffect(() => {
    // Only fetch invitations if user is authenticated and auth is not loading
    if (user && !authLoading) {
      fetchUserInvitations()
    }
  }, [fetchUserInvitations, user, authLoading])

  const handleInvitationAction = async (projectId: string, action: 'accept' | 'decline') => {
    if (actionLoading) return
    
    setActionLoading(projectId)
    try {
      await manageInvitation(projectId, action)
     
     // If accepted, navigate to the project space page
     if (action === 'accept') {
       setIsExpanded(false)
        navigate(`/project/${projectId}`)
     }
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error)
    } finally {
      setActionLoading(null)
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

  // Don't show anything if user is not authenticated, auth is loading, invitations are loading, or there are no invitations
  if (!user || authLoading || invitationsLoading || userInvitations.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {!isExpanded ? (
          // Collapsed notification bell
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className="relative p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
          >
            <Bell size={20} />
            
            {/* Notification badge */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {userInvitations.length}
            </div>
            
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20" />
          </motion.button>
        ) : (
          // Expanded notification panel
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl w-96 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-400" size={20} />
                <h3 className="text-lg font-semibold text-white">
                  Project Invitations
                </h3>
                <div className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                  {userInvitations.length}
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invitations list */}
            <div className="max-h-80 overflow-y-auto">
              {userInvitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 border-b border-zinc-800/50 last:border-b-0"
                >
                  <div className="mb-3">
                    <h4 className="text-white font-medium text-sm mb-1">
                      {invitation.project_name}
                    </h4>
                    {invitation.project_description && (
                      <p className="text-zinc-400 text-xs mb-2 line-clamp-2">
                        {invitation.project_description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatDate(invitation.invited_at)}</span>
                      </div>
                      <span>•</span>
                      <span>by {invitation.invited_by}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">
                        {invitation.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInvitationAction(invitation.project_id, 'accept')}
                      disabled={actionLoading === invitation.project_id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {actionLoading === invitation.project_id ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>Accept</span>
                    </button>
                    
                    <button
                      onClick={() => handleInvitationAction(invitation.project_id, 'decline')}
                      disabled={actionLoading === invitation.project_id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-800/30 text-center">
              <p className="text-xs text-zinc-500">
                You have {userInvitations.length} pending invitation{userInvitations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}