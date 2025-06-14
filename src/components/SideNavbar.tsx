import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home,
  User, 
  FolderOpen, 
  LogOut, 
  X,
  Menu,
  Zap
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

interface SideNavbarProps {
  isOpen: boolean
  onToggle: () => void
}

export const SideNavbar: React.FC<SideNavbarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      onToggle() // Close sidebar after sign out
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
      description: 'Your prompt collection'
    }
  ]

  const isActive = (path: string) => location.pathname === path

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar')
        if (sidebar && !sidebar.contains(event.target as Node)) {
          onToggle()
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
    return userProfile?.role || user?.user_metadata?.role || 'Member'
  }

  const getProfileImage = () => {
    return userProfile?.avatar_url || user?.user_metadata?.avatar_url
  }

  return (
    <>
      {/* Mobile Overlay */}
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
          fixed top-0 left-0 h-screen w-64 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/50 z-50
          transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
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

        {/* Bottom Section - User Info and Exit */}
        {user && (
          <div className="mt-auto border-t border-zinc-800/50 flex-shrink-0">
            {/* User Profile Link */}
            <Link
              to="/profile"
              onClick={onToggle}
              className={`
                group flex items-center gap-3 p-4 transition-all duration-150 border-b border-zinc-800/30
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
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs opacity-70 truncate">
                  {getUserRole()}
                </p>
              </div>
            </Link>

            {/* Sign Out Button */}
            <div className="p-4">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 disabled:opacity-50 text-sm"
              >
                <LogOut size={16} />
                <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}