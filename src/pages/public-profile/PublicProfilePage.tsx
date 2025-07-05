import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Eye, GitFork, MapPin, Link as LinkIcon, Mail } from 'lucide-react'
import { PromptCard } from '../../components/prompts/PromptCard'
import { PromptModal } from '../../components/prompts/PromptModal'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']
type User = Database['public']['Tables']['users']['Row']

export const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!username) {
        setError('Invalid username')
        setLoading(false)
        return
      }

      try {
        // Get user by display name (username)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, is_public_profile')
          .eq('display_name', username)
          .single()

        if (userError || !userData) {
          setError('User not found')
          setLoading(false)
          return
        }

        // Check if user has public profile enabled
        if (userData.is_public_profile === false) {
          setError('This user has disabled their public profile')
          setLoading(false)
          return
        }

        setUser(userData)

        // Get user's public prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('user_id', userData.id)
          .eq('access', 'public')
          .order('created_at', { ascending: false })

        if (promptsError) {
          console.error('Error fetching prompts:', promptsError)
        } else {
          setPrompts(promptsData || [])
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [username])

  const handleViewPrompt = (id: string) => {
    const prompt = prompts.find(p => p.id === id)
    if (prompt) {
      setSelectedPrompt(prompt)
      setShowModal(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`
    return `${(num / 1000000).toFixed(1)}M`
  }

  // Calculate stats
  const stats = {
    totalPrompts: prompts.length,
    totalViews: prompts.reduce((sum, p) => sum + (p.views || 0), 0),
    totalForks: prompts.reduce((sum, p) => sum + (p.fork_count || 0), 0)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="mb-8">
              <User className="mx-auto text-red-400 mb-4" size={64} />
              <h1 className="text-4xl font-bold text-red-400 mb-4">
                Profile Not Found
              </h1>
              <p className="text-xl text-red-300 mb-8">
                {error === 'This user has disabled their public profile' 
                  ? 'This user has chosen to keep their profile private.'
                  : error
                }
              </p>
            </div>
            
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
            >
              <ArrowLeft size={16} />
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
      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white animate-pulse" />
              </div>
              <h1 className="text-lg font-semibold">
                promptby.me
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative mb-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`${user.display_name}'s avatar`}
                      className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                      {getInitials(user.display_name || 'User')}
                    </div>
                  )}
                </div>
                
                <div className="text-center lg:text-left">
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {user.display_name || 'Anonymous User'}
                  </h1>
                  <p className="text-zinc-400 mb-2">@{username}</p>
                  {user.role && (
                    <p className="text-sm text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full inline-block">
                      {user.role}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats and Info */}
              <div className="flex-1">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white">{stats.totalPrompts}</div>
                    <div className="text-sm text-zinc-400">Prompts</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white">{formatNumber(stats.totalViews)}</div>
                    <div className="text-sm text-zinc-400">Views</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white">{formatNumber(stats.totalForks)}</div>
                    <div className="text-sm text-zinc-400">Clone</div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompts Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Public Prompts ({stats.totalPrompts})
              </h2>
            </div>

            {prompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    title={prompt.title}
                    content={prompt.content}
                    access={prompt.access}
                    createdAt={prompt.created_at}
                    views={prompt.views}
                    forkCount={prompt.fork_count}
                    originalPromptId={prompt.original_prompt_id}
                    currentVersion={prompt.current_version}
                    totalVersions={prompt.total_versions}
                    onView={handleViewPrompt}
                    showActions={false} // Don't show edit/delete actions on public profile
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                  <Eye className="mx-auto text-zinc-500 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Public Prompts
                  </h3>
                  <p className="text-zinc-400">
                    {user?.display_name} hasn't shared any public prompts yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Call to action for visitors */}
          <div className="text-center">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                Create Your Own Prompts
              </h3>
              <p className="text-zinc-400 mb-6">
                Join the community and start sharing your AI prompts with the world.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover"
              >
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Prompt Modal */}
      <PromptModal
        prompt={selectedPrompt}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedPrompt(null)
        }}
        showActions={false}
        isOwner={false}
      />

      {/* Bolt Badge */}
      <BoltBadge />
    </div>
  )
}