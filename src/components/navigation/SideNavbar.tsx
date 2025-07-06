import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  FolderOpen, 
  Play, 
  Layers, 
  User, 
  Zap,
  Code,
  LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

interface SideNavbarProps {
  isOpen: boolean
  onToggle: () => void
}

export const SideNavbar: React.FC<SideNavbarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/gallery', label: 'Gallery', icon: <FolderOpen size={20} /> },
    { path: '/playground', label: 'Playground', icon: <Play size={20} /> },
    { path: '/prompt-flow', label: 'Prompt Flow', icon: <Zap size={20} /> },
    { path: '/project-space', label: 'Project Space', icon: <Layers size={20} /> },
    { path: '/api', label: 'API', icon: <Code size={20} /> },
    // 🚫 Removed Profile from navItems
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobileView && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || !isMobileView) && (
          <motion.aside
            initial={isMobileView ? { x: -280 } : false}
            animate={{ x: 0 }}
            exit={isMobileView ? { x: -280 } : undefined}
            transition={{ duration: 0.2 }}
            className={`fixed top-0 left-0 bottom-0 w-64 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/50 z-50 flex flex-col`}
          >
            {/* Logo */}
            <div className="p-6 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-white">
                  promptby.me
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="py-6 px-3 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-indigo-600/20 text-indigo-300'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Profile Section - moved to bottom */}
            <div className="mt-auto px-3 py-4 border-t border-zinc-800/50">
              {user && (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/profile')
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200 w-full text-left"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
