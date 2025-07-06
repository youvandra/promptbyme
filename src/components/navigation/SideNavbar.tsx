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
            className={`fixed top-0 left-0 bottom-0 w-64 bg-black border-r-2 border-black z-50 flex flex-col`}
          >
            {/* Logo */}
            <div className="p-6 border-b-2 border-black">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-highlight rounded-lg flex items-center justify-center border-2 border-black shadow-neo-brutalism-sm">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-lg font-semibold text-white font-heading">
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
                          ? 'bg-highlight text-black border-2 border-black shadow-neo-brutalism-sm'
                          : 'text-white hover:text-white hover:bg-gray-900'
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
            <div className="mt-auto px-3 py-4 border-t-2 border-black">
              {user && (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/profile')
                        ? 'bg-highlight text-black border-2 border-black shadow-neo-brutalism-sm'
                        : 'text-white hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <div className="w-8 h-8 bg-highlight rounded-lg flex items-center justify-center border-2 border-black shadow-neo-brutalism-sm">
                      <User className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:text-white hover:bg-gray-900 transition-all duration-200 w-full text-left"
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
