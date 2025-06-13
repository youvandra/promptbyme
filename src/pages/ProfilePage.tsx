import React, { useEffect, useState } from 'react'
import { User, Mail, Calendar, Settings, Shield, Trash2, Save, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { Toast } from '../components/Toast'
import { BoltBadge } from '../components/BoltBadge'
import { SideNavbar } from '../components/SideNavbar'
import { useAuthStore } from '../store/authStore'
import { usePromptStore } from '../store/promptStore'

export const ProfilePage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    bio: ''
  })
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { prompts, fetchUserPrompts } = usePromptStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      setFormData({
        email: user.email || '',
        displayName: user.user_metadata?.display_name || '',
        bio: user.user_metadata?.bio || ''
      })
    }
  }, [user, fetchUserPrompts])

  const handleSaveProfile = async () => {
    try {
      // In a real app, you would update the user profile here
      setToast({ message: '> Profile updated successfully', type: 'success' })
      setIsEditing(false)
    } catch (error) {
      setToast({ message: 'Failed to update profile', type: 'error' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate user stats
  const stats = {
    totalPrompts: prompts.length,
    publicPrompts: prompts.filter(p => p.access === 'public').length,
    privatePrompts: prompts.filter(p => p.access === 'private').length,
    totalViews: prompts.reduce((sum, p) => sum + (p.views || 0), 0),
    totalLikes: prompts.reduce((sum, p) => sum + (p.like_count || 0), 0),
    totalForks: prompts.reduce((sum, p) => sum + (p.fork_count || 0), 0),
    forkedPrompts: prompts.filter(p => p.original_prompt_id !== null).length
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-cyan-100 relative overflow-hidden">
        <AnimatedBackground />
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="mx-auto text-cyan-400 mb-4" size={64} />
            <h1 className="text-4xl font-bold font-mono text-cyan-100 mb-4">
              Access Required
            </h1>
            <p className="text-xl text-cyan-300/80 font-mono mb-8">
              Please sign in to access your profile
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
            >
              <span>Go to Terminal</span>
            </Link>
          </div>
        </div>
        
        <BoltBadge />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-cyan-100 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Layout Container */}
      <div className="flex min-h-screen">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen ml-10 lg:ml-10">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-cyan-500/30 backdrop-blur-md">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Menu size={24} />
                </button>
                
                <h1 className="text-lg font-bold font-mono text-cyan-300">
                  Profile
                </h1>
                
                <div className="w-6" /> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          {/* Profile Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-7xl pr-8 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold font-mono text-cyan-300">
                    User Profile
                  </h1>
                  <p className="text-cyan-500/70 font-mono text-sm">
                    Manage your account settings and preferences
                  </p>
                </div>
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105 self-start lg:self-auto"
                >
                  <Settings size={16} />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="space-y-8">
                {/* Profile Card */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center lg:items-start">
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mb-3">
                        <User size={32} className="text-black" />
                      </div>
                      <div className="text-center lg:text-left">
                        <h2 className="text-lg font-bold text-cyan-100 font-mono mb-1">
                          {formData.displayName || 'Anonymous User'}
                        </h2>
                        <p className="text-cyan-500/70 font-mono text-sm">
                          Terminal Operator
                        </p>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-mono text-cyan-300 mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={formData.displayName}
                              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                              placeholder="Enter display name"
                              className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-mono text-cyan-300 mb-2">
                              Bio
                            </label>
                            <textarea
                              value={formData.bio}
                              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                              placeholder="Tell us about yourself..."
                              rows={3}
                              className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono resize-none"
                            />
                          </div>
                          <button
                            onClick={handleSaveProfile}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 rounded-lg transition-all duration-300 font-mono"
                          >
                            <Save size={16} />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="text-cyan-400" size={16} />
                            <span className="font-mono text-cyan-100 text-sm">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="text-cyan-400" size={16} />
                            <span className="font-mono text-cyan-100 text-sm">
                              Joined {formatDate(user.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shield className="text-cyan-400" size={16} />
                            <span className="font-mono text-cyan-100 text-sm">
                              Email {user.email_confirmed_at ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          {formData.bio && (
                            <div className="mt-3">
                              <p className="text-cyan-300/80 font-mono text-sm leading-relaxed">
                                {formData.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-cyan-100 font-mono">{stats.totalPrompts}</p>
                    <p className="text-xs text-cyan-500/70 font-mono">Total</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-green-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-100 font-mono">{stats.publicPrompts}</p>
                    <p className="text-xs text-green-500/70 font-mono">Public</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-100 font-mono">{stats.privatePrompts}</p>
                    <p className="text-xs text-red-500/70 font-mono">Private</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-purple-100 font-mono">{stats.totalViews}</p>
                    <p className="text-xs text-purple-500/70 font-mono">Views</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-pink-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-pink-100 font-mono">{stats.totalLikes}</p>
                    <p className="text-xs text-pink-500/70 font-mono">Likes</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-orange-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-100 font-mono">{stats.totalForks}</p>
                    <p className="text-xs text-orange-500/70 font-mono">Forks</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-yellow-100 font-mono">{stats.forkedPrompts}</p>
                    <p className="text-xs text-yellow-500/70 font-mono">Forked</p>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-cyan-100 font-mono mb-4">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-cyan-500/20">
                      <div>
                        <h4 className="font-mono font-bold text-cyan-100 text-sm">Email Notifications</h4>
                        <p className="text-xs text-cyan-500/70 font-mono">Receive updates about your prompts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-cyan-500/20">
                      <div>
                        <h4 className="font-mono font-bold text-cyan-100 text-sm">Public Profile</h4>
                        <p className="text-xs text-cyan-500/70 font-mono">Allow others to see your public prompts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    <div className="border-t border-cyan-500/20 pt-4">
                      <button className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-300 font-mono text-sm">
                        <Trash2 size={14} />
                        <span>Delete Account</span>
                      </button>
                      <p className="text-xs text-cyan-500/50 font-mono mt-2">
                        This action cannot be undone. All your prompts will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Bolt Badge */}
      <BoltBadge />
    </div>
  )
}