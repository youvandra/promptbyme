import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Terminal, 
  User, 
  FolderOpen, 
  LogOut, 
  Menu, 
  X,
  Home,
  Settings,
  Heart,
  GitFork,
  Eye
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
      description: 'Your prompt collection',
      requiresAuth: true
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      description: 'Account settings',
      requiresAuth: true
    }
  ]

  const isActive = (path: string) => location.pathname === path

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
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-md border-r border-cyan-500/30 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
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

        {/* User Info */}
        {user && (
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-cyan-100 font-mono font-medium truncate">
                  {user.email}
                </p>
                <p className="text-cyan-500/70 text-sm font-mono">
                  Active Terminal
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <FolderOpen size={16} className="text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-cyan-500/70 font-mono">Prompts</p>
                <p className="text-sm text-cyan-100 font-mono font-bold">--</p>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <Heart size={16} className="text-red-400 mx-auto mb-1" />
                <p className="text-xs text-cyan-500/70 font-mono">Likes</p>
                <p className="text-sm text-cyan-100 font-mono font-bold">--</p>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <GitFork size={16} className="text-green-400 mx-auto mb-1" />
                <p className="text-xs text-cyan-500/70 font-mono">Forks</p>
                <p className="text-sm text-cyan-100 font-mono font-bold">--</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null
              
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

        {/* Footer */}
        {user && (
          <div className="p-6 border-t border-cyan-500/20">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300 font-mono disabled:opacity-50"
            >
              <LogOut size={20} />
              <span>{isSigningOut ? 'Terminating...' : 'Exit Terminal'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <Menu size={20} />
      </button>
    </>
  )
}