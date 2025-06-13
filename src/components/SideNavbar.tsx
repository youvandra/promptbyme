import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Terminal, 
  User, 
  FolderOpen, 
  LogOut, 
  X,
  Home
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { GlitchText } from './GlitchText'

interface SideNavbarProps {
  isOpen: boolean
  onToggle: () => void
}

export const SideNavbar: React.FC<SideNavbarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const [isSigningOut, setIsSigningOut] = useState(false)

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

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Command Center',
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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-md border-r border-cyan-500/30 z-50
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Terminal className="text-cyan-400" size={24} />
            <h1 className="text-lg font-bold font-mono">
              <GlitchText text="promptby.me" />
            </h1>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onToggle}
                  className={`
                    group flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                    ${active 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-cyan-100' 
                      : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                    }
                  `}
                >
                  <Icon size={20} className={active ? 'text-cyan-300' : ''} />
                  <div className="flex-1">
                    <p className="font-mono font-medium">{item.label}</p>
                    <p className="text-xs text-cyan-500/70 font-mono">{item.description}</p>
                  </div>
                  {active && (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section - User Info and Exit */}
        {user && (
          <div className="border-t border-cyan-500/20">
            {/* User Profile Link */}
            <Link
              to="/profile"
              onClick={onToggle}
              className={`
                group flex items-center gap-3 p-4 transition-all duration-300 border-b border-cyan-500/10
                ${location.pathname === '/profile'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/50 text-cyan-100' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              `}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium truncate">
                  {user.email}
                </p>
                <p className="text-xs text-cyan-500/70 font-mono">
                  View Profile
                </p>
              </div>
              {location.pathname === '/profile' && (
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              )}
            </Link>

            {/* Sign Out Button */}
            <div className="p-4">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300 font-mono disabled:opacity-50"
              >
                <LogOut size={20} />
                <span>{isSigningOut ? 'Terminating...' : 'Exit Terminal'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}