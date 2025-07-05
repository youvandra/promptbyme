import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home,
  DollarSign,
  User, 
  LogOut, 
  X,
  Menu,
  Play,
  Layers,
  Bell,
  Check,
  Users,
  Clock,
  Code,
  FolderOpen,
  Folder
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore } from '../../store/projectSpaceStore'
import { supabase } from '../../lib/supabase'

interface SideNavbarProps {
  isOpen: boolean
  onToggle: () => void
}

export const SideNavbar: React.FC<SideNavbarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { 
    userInvitations, 
    invitationsLoading, 
    fetchUserInvitations, 
    manageInvitation 
  } = useProjectSpaceStore()
  
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      onToggle()
      navigate("/")
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    }

    loadUserProfile()
  }, [user])

  // Fetch invitations when user is available
  useEffect(() => {
    if (user) {
      fetchUserInvitations()
    }
  }, [user, fetchUserInvitations])

  // Close notifications when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar')
        const target = event.target as Node
        if (sidebar && !sidebar.contains(target)) {
          setShowNotifications(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const handleInvitationAction = async (projectId: string, action: 'accept' | 'decline') => {
    if (actionLoading) return
    
    setActionLoading(projectId)
    try {
      await manageInvitation(projectId, action)
      
      // If accepted, navigate to the project space page
      if (action === 'accept') {
        setShowNotifications(false)
        navigate('/project-space')
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

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      description: 'Create and manage prompts'
    },
    {
      path: '/gallery',
      icon: FolderOpen,
      label: 'Gallery',
      description: 'Your prompt library'
    },
    {
      path: '/project-space',
      icon: Layers,
      label: 'Project Space',
      description: 'Visual prompt projects'
    },
    {
      path: '/prompt-flow',
      icon: Folder,
      label: 'Prompt Flow',
      description: 'Sequential prompt chains'
    },
    {
      path: '/api',
      icon: Code,
      label: 'API',
      description: 'Developer API access'
    }
  ]

  const isActive = (path: string) => location.pathname === path

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar')
        const target = event.target as Node
        if (sidebar && !sidebar.contains(target)) {
          // Check if the click is on the menu button or its children
          const menuButton = document.querySelector('[data-menu-button]')
          if (menuButton && !menuButton.contains(target)) {
            onToggle()
          }
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserDisplayName = () => {
    return userProfile?.display_name || 
           user?.user_metadata?.display_name || 
           user?.user_metadata?.full_name || 
           user?.email?.split('@')[0] || 
           'User'
  }

  const getUserRole = () => {
    return userProfile?.role || user?.user_metadata?.role || 'User'
  }

  const getProfileImage = () => {
    return userProfile?.avatar_url || user?.user_metadata?.avatar_url
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
    
      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full w-64 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/50 z-50
          transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/Logo Promptby.me(1).png" 
              alt="promptby.me logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-lg font-semibold text-white">
              promptby.me
            </h1>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-zinc-400 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile toggle button - fixed to the side when sidebar is closed */}
        <button
          onClick={onToggle}
          className={`md:hidden fixed top-20 left-0 bg-indigo-600 text-white p-2 rounded-r-lg shadow-lg z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Menu size={20} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onToggle}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                    ${active 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }
                  `}
                >
                  <Icon size={18} className={active ? 'text-white' : ''} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
        
        {/* Bottom Section - Sign Out, User Profile - Fixed at bottom */}
        {user && (
          <div className="mt-auto border-t border-zinc-800/50 flex-shrink-0">
            {/* Playground Link - Above Sign Out */}
            <div className="p-2 border-b border-zinc-800/30">
              <Link
                to="/playground"
                onClick={onToggle}
                className={`
                  group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 w-full
                  ${location.pathname === '/playground'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }
                `}
              >
                <Play size={18} className={location.pathname === '/playground' ? 'text-white' : ''} />
                <span className="font-medium text-sm">Playground</span>
              </Link>
            </div>
              
            {/* Sign Out Button */}
            <div className="p-2 border-b border-zinc-800/30">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 disabled:opacity-50 text-sm"
              >
                <LogOut size={16} />
                <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            </div>

            {/* User Profile Section with Notifications */}
            <div className="bg-zinc-900/30 border-t-2 border-zinc-700/50">
              {/* Profile Link */}
              <Link
                to="/profile"
                onClick={(e) => {
                  // Don't navigate if notifications are open
                  if (showNotifications) {
                    e.preventDefault()
                    return
                  }
                  onToggle()
                }}
                className={`
                  group flex items-center gap-3 p-4 transition-all duration-150 border-b border-zinc-800/20
                  ${location.pathname === '/profile'
                    ? 'bg-indigo-600 text-white' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }
                `}
              >
                <div className="w-8 h-8 flex-shrink-0">
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-zinc-600"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {getInitials(getUserDisplayName())}
                    </div>
                  )}
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs opacity-70 truncate">
                    {getUserRole()}
                  </p>
                </div>
                
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowNotifications(!showNotifications)
                    }}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-all duration-200 relative"
                    title="View notifications"
                  >
                    <Bell size={16} />
                    
                    {/* Notification badge */}
                    {userInvitations.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {userInvitations.length}
                      </div>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-full ml-2 mb-2 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl max-h-96 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
                          <div className="flex items-center gap-2">
                            <Users className="text-indigo-400" size={16} />
                            <h3 className="text-sm font-semibold text-white">
                              Notifications
                            </h3>
                            {userInvitations.length > 0 && (
                              <div className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                                {userInvitations.length}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                            title="Close notifications"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {invitationsLoading ? (
                            <div className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2 text-zinc-400">
                                <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                                <span className="text-sm">Loading...</span>
                              </div>
                            </div>
                          ) : userInvitations.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500">
                              <Bell className="mx-auto mb-2 opacity-50" size={24} />
                              <p className="text-sm">No pending Notifications</p>
                            </div>
                          ) : (
                            userInvitations.map((invitation) => (
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
                                      <Check size={12} />
                                    )}
                                    <span>Accept</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleInvitationAction(invitation.project_id, 'decline')}
                                    disabled={actionLoading === invitation.project_id}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                                  >
                                    <X size={12} />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        {userInvitations.length > 0 && (
                          <div className="p-3 bg-zinc-800/30 text-center border-t border-zinc-700/50">
                            <p className="text-xs text-zinc-500">
                              {userInvitations.length} pending invitation{userInvitations.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}