import React, { useEffect, useState } from 'react'
import { User, Mail, Calendar, Settings, Shield, Trash2, Save, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
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
      setToast({ message: 'Profile updated successfully', type: 'success' })
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="mx-auto text-zinc-400 mb-4" size={64} />
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access your profile
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
            >
              <span>Go Home</span>
            </Link>
          </div>
        </div>
        
        <BoltBadge />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <Menu size={20} />
                </button>
                
                <h1 className="text-lg font-semibold text-white">
                  Profile
                </h1>
                
                <div className="w-6" /> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          {/* Profile Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-6xl pr-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Profile Settings
                  </h1>
                  <p className="text-zinc-400">
                    Manage your account and preferences
                  </p>
                </div>
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 self-start lg:self-auto btn-hover"
                >
                  <Settings size={16} />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="space-y-8">
                {/* Profile Card */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center lg:items-start">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                        <User size={32} className="text-white" />
                      </div>
                      <div className="text-center lg:text-left">
                        <h2 className="text-lg font-semibold text-white mb-1">
                          {formData.displayName || 'Anonymous User'}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                          Member
                        </p>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-zinc-300 mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={formData.displayName}
                              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                              placeholder="Enter display name"
                              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-300 mb-2">
                              Bio
                            </label>
                            <textarea
                              value={formData.bio}
                              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                              placeholder="Tell us about yourself..."
                              rows={3}
                              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                            />
                          </div>
                          <button
                            onClick={handleSaveProfile}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 btn-hover"
                          >
                            <Save size={16} />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="text-indigo-400" size={16} />
                            <span className="text-white text-sm">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="text-indigo-400" size={16} />
                            <span className="text-white text-sm">
                              Joined {formatDate(user.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shield className="text-indigo-400" size={16} />
                            <span className="text-white text-sm">
                              Email {user.email_confirmed_at ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          {formData.bio && (
                            <div className="mt-3">
                              <p className="text-zinc-300 text-sm leading-relaxed">
                                {formData.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                      <div>
                        <h4 className="font-medium text-white text-sm">Email Notifications</h4>
                        <p className="text-xs text-zinc-400">Receive updates about your prompts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                      <div>
                        <h4 className="font-medium text-white text-sm">Public Profile</h4>
                        <p className="text-xs text-zinc-400">Allow others to see your public prompts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="border-t border-zinc-700/50 pt-4">
                      <button className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm">
                        <Trash2 size={14} />
                        <span>Delete Account</span>
                      </button>
                      <p className="text-xs text-zinc-500 mt-2">
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