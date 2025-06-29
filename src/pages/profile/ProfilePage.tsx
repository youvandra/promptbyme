import React, { useEffect, useState, useRef } from 'react'
import { User, Mail, Calendar, Settings, Shield, Trash2, Save, Menu, Camera, Upload, X, Link as LinkIcon, Copy, CheckCircle, Globe, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Toast } from '../../components/ui/Toast'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { ImportExportPromptsModal } from '../../components/prompts/ImportExportPromptsModal'
import { useAuthStore } from '../../store/authStore'
import { usePromptStore } from '../../store/promptStore'
import { useClipboard } from '../../hooks/useClipboard'
import { supabase } from '../../lib/supabase'

const ROLE_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI Engineer',
  'Product Manager',
  'UI/UX Designer',
  'Mobile Developer',
  'Other'
]

export const ProfilePage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showImportExportModal, setShowImportExportModal] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { copied, copyToClipboard } = useClipboard()
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: '',
    isPublicProfile: true
  })
  
  const { user, loading: authLoading, initialize } = useAuthStore()
  const { prompts, fetchUserPrompts } = usePromptStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchUserPrompts(user.id)
      loadUserProfile()
    }
  }, [user, fetchUserPrompts])

  const loadUserProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Use maybeSingle() instead of single() to handle cases where no profile exists
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading user profile:', error)
        setToast({ message: 'Failed to load profile', type: 'error' })
      } else if (!data) {
        // No profile exists, create one
        await createUserProfile()
      } else {
        // Profile exists, use it
        setUserProfile(data)
        setFormData({
          email: data.email || '',
          displayName: data.display_name || '',
          role: data.role || '',
          isPublicProfile: data.is_public_profile !== false
        })
        setProfileImage(data.avatar_url || null)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setToast({ message: 'Failed to load profile', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async () => {
    if (!user) return

    try {
      // Check if profile already exists before creating
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfile) {
        // Profile already exists, just reload
        await loadUserProfile()
        return
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          role: user.user_metadata?.role || '',
          avatar_url: user.user_metadata?.avatar_url || null
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        setToast({ message: 'Failed to create profile', type: 'error' })
        return
      }

      setUserProfile(data)
      setFormData({
        email: data.email || '',
        displayName: data.display_name || '',
        role: data.role || '',
        isPublicProfile: data.is_public_profile !== false
      })
      setProfileImage(data.avatar_url || null)
    } catch (error) {
      console.error('Error creating user profile:', error)
      setToast({ message: 'Failed to create profile', type: 'error' })
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please select a valid image file', type: 'error' })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 5MB', type: 'error' })
        return
      }

      setImageFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProfileImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}` // Remove nested avatars folder

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true // Allow overwriting existing files
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Provide more specific error message
        if (uploadError.message.includes('row-level security policy')) {
          throw new Error('Storage permissions not configured. Please contact support.')
        }
        throw new Error('Failed to upload image')
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return

    setSaving(true)
    try {
      let avatarUrl = userProfile.avatar_url

      // Upload new image if one was selected
      if (imageFile) {
        try {
          avatarUrl = await uploadImageToStorage(imageFile)
        } catch (uploadError: any) {
          // If image upload fails, still try to update other profile data
          console.error('Image upload failed:', uploadError)
          setToast({ 
            message: uploadError.message || 'Failed to upload image, but profile will be updated without new photo', 
            type: 'error' 
          })
          // Don't return here, continue with profile update
        }
      }

      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .update({
          display_name: formData.displayName,
          role: formData.role,
          avatar_url: avatarUrl,
          is_public_profile: formData.isPublicProfile
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        throw new Error('Failed to update profile')
      }

      // Reload profile data
      await loadUserProfile()

      setToast({ message: 'Profile updated successfully', type: 'success' })
      setIsEditing(false)
      setImageFile(null)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setToast({ message: error.message || 'Failed to update profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleCopyProfileLink = () => {
    if (!userProfile?.display_name) return
    const profileUrl = `${window.location.origin}/${userProfile.display_name}/`
    copyToClipboard(profileUrl)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (authLoading || loading) {
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
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  data-menu-button
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
            <div className="w-full max-w-6xl px-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Profile
                  </h1>
                  <p className="text-zinc-400">
                    Manage your account and preferences
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start lg:self-auto">
                  <button
                    onClick={() => setShowImportExportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover shadow-md hover:shadow-lg hover:shadow-zinc-500/10"
                  >
                    <FileText size={16} className="text-indigo-400" />
                    <span>Import/Export</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={saving}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 ${
                      isEditing ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    } disabled:bg-zinc-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover disabled:transform-none shadow-md hover:shadow-lg ${
                      isEditing ? 'hover:shadow-red-500/20' : 'hover:shadow-indigo-500/20'
                    }`}
                  >
                    {isEditing ? <X size={16} /> : <Settings size={16} />}
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {/* Profile Card */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center lg:items-start">
                      <div className="relative group">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {formData.displayName ? getInitials(formData.displayName) : <User size={32} />}
                          </div>
                        )}
                        
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
                              title="Change photo"
                            >
                              <Camera size={16} />
                            </button>
                          </div>
                        )}
                        
                        {isEditing && profileImage && (
                          <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            title="Remove photo"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="mt-3 text-center">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <Upload size={14} />
                            <span>Upload Photo</span>
                          </button>
                          <p className="text-xs text-zinc-500 mt-1">
                            Max 5MB, JPG/PNG
                          </p>
                        </div>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {!isEditing && (
                        <div className="text-center lg:text-left mt-3">
                          <h2 className="text-lg font-semibold text-white mb-1">
                            {userProfile?.display_name || 'Anonymous User'}
                          </h2>
                          <p className="text-zinc-400 text-sm">
                            {userProfile?.role || 'User'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-zinc-300 mb-2">
                                Display Name *
                              </label>
                              <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="Enter your name"
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-zinc-300 mb-2">
                                Role
                              </label>
                              <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                              >
                                <option value="">Select your role</option>
                                {ROLE_OPTIONS.map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          {/* Public Profile Toggle */}
                          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-white text-sm mb-1 flex items-center gap-2">
                                  Public Profile
                                </h4>
                                <p className="text-xs text-zinc-400">Allow others to see your public prompts and profile</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={formData.isPublicProfile}
                                  onChange={(e) => setFormData({ ...formData, isPublicProfile: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={handleSaveProfile}
                              disabled={saving || !formData.displayName.trim()}
                              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-xl transition-all duration-200 btn-hover disabled:transform-none"
                            >
                              {saving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={16} />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => setIsEditing(false)}
                              disabled={saving}
                              className="px-4 py-2.5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Mail className="text-indigo-400" size={16} />
                                <div>
                                  <p className="text-xs text-zinc-500">Email</p>
                                  <p className="text-white text-sm">{user.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Calendar className="text-indigo-400" size={16} />
                                <div>
                                  <p className="text-xs text-zinc-500">Joined</p>
                                  <p className="text-white text-sm">{formatDate(user.created_at)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Shield className="text-indigo-400" size={16} />
                                <div>
                                    <p className="text-xs text-zinc-500">Status</p>
                                    <p className="text-white text-sm">
                                      {user.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                                    </p>
                                </div>
                              </div>
                              
                            </div>
                            {userProfile?.is_public_profile !== false && userProfile?.display_name && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded-lg">
                                  <Globe size={12} className="text-indigo-400" />
                                  <span className="text-xs text-zinc-300">promptby.me/{userProfile.display_name}/</span>
                                </div>
                                <button
                                  onClick={handleCopyProfileLink}
                                  className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors flex items-center gap-1"
                                  title="Copy profile link"
                                >
                                  {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                                  <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Privacy & Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Public Profile Setting (Read-only when not editing) */}
                    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                      {/* KIRI */}
                      <div>
                        <h4 className="font-medium text-white text-sm">Public Profile</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-zinc-400">
                            {userProfile?.is_public_profile !== false 
                              ? 'Others can view your public prompts and profile' 
                              : 'Your profile and prompts are hidden from others'
                            }
                          </p>
                        </div>
                      </div>
                  
                      {/* KANAN */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          userProfile?.is_public_profile !== false ? 'bg-emerald-400' : 'bg-red-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          userProfile?.is_public_profile !== false ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {userProfile?.is_public_profile !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Bolt Badge */}
      <BoltBadge />
      
      {/* Import/Export Modal */}
      {showImportExportModal && (
        <ImportExportPromptsModal
          isOpen={showImportExportModal}
          onClose={() => setShowImportExportModal(false)}
          onSuccess={(message) => setToast({ message, type: 'success' })}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      )}
    </div>
  )
}