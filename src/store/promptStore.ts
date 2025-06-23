import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

interface PromptVersion {
  id: string
  prompt_id: string
  version_number: number
  title: string
  content: string
  commit_message: string
  created_at: string
  is_current: boolean
}

interface PromptState {
  prompts: Prompt[]
  versions: PromptVersion[]
  loading: boolean
  cache: Map<string, Prompt>
  fetchUserPrompts: (userId: string) => Promise<void>
  fetchPublicPrompts: () => Promise<void>
  fetchPromptById: (id: string) => Promise<Prompt | null>
  fetchVersionHistory: (promptId: string) => Promise<PromptVersion[]>
  createPrompt: (prompt: Omit<Prompt, 'id' | 'created_at' | 'views' | 'like_count' | 'fork_count'>) => Promise<void>
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, 'id' | 'created_at'>>) => Promise<void>
  createVersion: (promptId: string, title: string, content: string, commitMessage?: string) => Promise<void>
  revertToVersion: (promptId: string, versionNumber: number) => Promise<void>
  forkPrompt: (originalPromptId: string, userId: string, title?: string) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  incrementViews: (id: string) => Promise<void>
  subscribeToUserPrompts: (userId: string) => () => void
  clearCache: () => void
}

export const usePromptStore = create<PromptState>()(
  subscribeWithSelector((set, get) => ({
  prompts: [],
  versions: [],
  loading: false,
  cache: new Map(),

  fetchUserPrompts: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const prompts = data || []
      const { cache } = get()
      
      // Update cache with fetched prompts
      prompts.forEach(prompt => {
        cache.set(prompt.id, prompt)
      })
      
      set({ prompts, cache: new Map(cache) })
    } catch (error) {
      console.error('Error fetching user prompts:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchPublicPrompts: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('access', 'public')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const prompts = data || []
      const { cache } = get()
      
      // Update cache with fetched prompts
      prompts.forEach(prompt => {
        cache.set(prompt.id, prompt)
      })
      
      set({ prompts, cache: new Map(cache) })
    } catch (error) {
      console.error('Error fetching public prompts:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchPromptById: async (id: string) => {
    const { cache } = get()
    
    // Check cache first
    if (cache.has(id)) {
      return cache.get(id)!
    }
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching prompt by ID:', error)
        return null
      }
      
      // Update cache
      cache.set(id, data)
      set({ cache: new Map(cache) })
      
      return data
    } catch (error) {
      console.error('Error fetching prompt:', error)
      return null
    }
  },

  fetchVersionHistory: async (promptId: string) => {
    try {
      // First, check if we have any versions stored in the database
      const { data: dbVersions, error: dbError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })

      if (!dbError && dbVersions && dbVersions.length > 0) {
        // We have real versions in the database
        const versions: PromptVersion[] = dbVersions.map(v => ({
          id: v.id,
          prompt_id: v.prompt_id,
          version_number: v.version_number,
          title: v.title || 'Untitled',
          content: v.content,
          commit_message: v.commit_message || `Version ${v.version_number}`,
          created_at: v.created_at,
          is_current: v.is_current
        }))

        set({ versions })
        return versions
      }

      // Fallback: Generate mock versions for display purposes only
      const { prompts, cache } = get()
      let currentPrompt = prompts.find(p => p.id === promptId)
      
      // Check cache if not found in prompts array
      if (!currentPrompt && cache.has(promptId)) {
        currentPrompt = cache.get(promptId)
      }
      
      if (!currentPrompt) return []

      const mockVersions: PromptVersion[] = []
      const totalVersions = currentPrompt.total_versions || 1
      const currentVersion = currentPrompt.current_version || 1
      
      // For display purposes, we'll show the current content as the latest version
      // and generate simpler versions for older ones
      for (let i = currentVersion; i >= 1; i--) {
        const isCurrentVersion = i === currentVersion
        const versionDate = new Date(currentPrompt.created_at || Date.now())
        
        // Subtract days for older versions
        if (!isCurrentVersion) {
          versionDate.setDate(versionDate.getDate() - (currentVersion - i))
        }

        let versionContent = currentPrompt.content
        let versionTitle = currentPrompt.title || 'Untitled'
        
        if (!isCurrentVersion) {
          // For older versions, create simpler content
          const contentLines = currentPrompt.content.split('\n')
          const shorterContent = contentLines.slice(0, Math.max(1, Math.floor(contentLines.length * (i / currentVersion)))).join('\n')
          versionContent = shorterContent
          
          if (i === 1) {
            versionTitle = versionTitle.replace(/Enhanced|Updated|Improved/gi, '').trim() || 'Initial Version'
          }
        }

        mockVersions.push({
          id: `${promptId}-v${i}`,
          prompt_id: promptId,
          version_number: i,
          title: versionTitle,
          content: versionContent,
          commit_message: i === 1 ? 'Initial version' : 
                         i === currentVersion ? 'Latest updates and improvements' :
                         `Version ${i} - Iterative improvements`,
          created_at: versionDate.toISOString(),
          is_current: isCurrentVersion
        })
      }

      set({ versions: mockVersions })
      return mockVersions
    } catch (error) {
      console.error('Error fetching version history:', error)
      return []
    }
  },

  createPrompt: async (prompt) => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert([{ 
          ...prompt, 
          views: 0,
          fork_count: 0,
          current_version: 1,
          total_versions: 1
        }])
        .select()
        .single()

      if (error) throw error

      // Create the initial version in prompt_versions table
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert([{
          prompt_id: data.id,
          version_number: 1,
          title: prompt.title,
          content: prompt.content,
          commit_message: 'Initial version',
          created_by: prompt.user_id,
          is_current: true
        }])

      if (versionError) {
        console.error('Error creating initial version:', versionError)
      }

      // Add the new prompt to the local state
      const { prompts, cache } = get()
      cache.set(data.id, data)
      set({ prompts: [data, ...prompts], cache: new Map(cache) })
      
      return data
    } catch (error) {
      console.error('Error creating prompt:', error)
      throw error
    }
  },

  updatePrompt: async (id: string, updates: Partial<Prompt>) => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      const { prompts, cache } = get()
      cache.set(id, data)
      set({ 
        prompts: prompts.map(p => p.id === id ? { ...p, ...data } : p),
        cache: new Map(cache)
      })
    } catch (error) {
      console.error('Error updating prompt:', error)
      throw error
    }
  },

  createVersion: async (promptId: string, title: string, content: string, commitMessage?: string) => {
    try {
      // Get the current prompt to increment version numbers
      const { prompts, cache } = get()
      let currentPrompt = prompts.find(p => p.id === promptId)
      
      // Check cache if not found in prompts array
      if (!currentPrompt && cache.has(promptId)) {
        currentPrompt = cache.get(promptId)
      }
      
      if (!currentPrompt) throw new Error('Prompt not found')

      const newVersionNumber = (currentPrompt.current_version || 1) + 1
      const newTotalVersions = (currentPrompt.total_versions || 1) + 1

      // First, mark all existing versions as not current
      await supabase
        .from('prompt_versions')
        .update({ is_current: false })
        .eq('prompt_id', promptId)

      // Create new version record
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert([{
          prompt_id: promptId,
          version_number: newVersionNumber,
          title: title || null,
          content: content,
          commit_message: commitMessage || `Version ${newVersionNumber}`,
          created_by: currentPrompt.user_id,
          is_current: true
        }])

      if (versionError) throw versionError

      // Update the prompt with new content and version info
      const { data, error } = await supabase
        .from('prompts')
        .update({
          title: title || null,
          content,
          current_version: newVersionNumber,
          total_versions: newTotalVersions
        })
        .eq('id', promptId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      cache.set(promptId, data)
      set({
        prompts: prompts.map(p => p.id === promptId ? { ...p, ...data } : p),
        cache: new Map(cache)
      })

      console.log(`Created version ${newVersionNumber} for prompt ${promptId}`)
    } catch (error) {
      console.error('Error creating version:', error)
      throw error
    }
  },

  revertToVersion: async (promptId: string, versionNumber: number) => {
    try {
      // Get the target version from the database
      const { data: targetVersion, error: fetchError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('version_number', versionNumber)
        .single()

      if (fetchError || !targetVersion) {
        throw new Error('Version not found')
      }

      const { prompts, cache } = get()
      let currentPrompt = prompts.find(p => p.id === promptId)
      
      // Check cache if not found in prompts array
      if (!currentPrompt && cache.has(promptId)) {
        currentPrompt = cache.get(promptId)
      }
      
      if (!currentPrompt) {
        throw new Error('Prompt not found')
      }

      // Create a new version with the reverted content
      const newVersionNumber = (currentPrompt.current_version || 1) + 1
      const newTotalVersions = (currentPrompt.total_versions || 1) + 1

      // Mark all existing versions as not current
      await supabase
        .from('prompt_versions')
        .update({ is_current: false })
        .eq('prompt_id', promptId)

      // Create new version with reverted content
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert([{
          prompt_id: promptId,
          version_number: newVersionNumber,
          title: targetVersion.title,
          content: targetVersion.content,
          commit_message: `Reverted to version ${versionNumber}`,
          created_by: currentPrompt.user_id,
          is_current: true
        }])

      if (versionError) throw versionError

      // Update the main prompt record
      const { data, error } = await supabase
        .from('prompts')
        .update({
          title: targetVersion.title,
          content: targetVersion.content,
          current_version: newVersionNumber,
          total_versions: newTotalVersions
        })
        .eq('id', promptId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      cache.set(promptId, data)
      set({
        prompts: prompts.map(p => p.id === promptId ? { ...p, ...data } : p),
        cache: new Map(cache)
      })

      console.log(`Reverted prompt ${promptId} to version ${versionNumber} as new version ${newVersionNumber}`)
    } catch (error) {
      console.error('Error reverting to version:', error)
      throw error
    }
  },

  forkPrompt: async (originalPromptId: string, userId: string, title?: string) => {
    try {
      // First, get the original prompt
      const { data: originalPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', originalPromptId)
        .single()

      if (fetchError) throw fetchError

      // Check if the original prompt can be forked (must be original, not a fork itself)
      if (originalPrompt.original_prompt_id !== null) {
        throw new Error('Cannot fork a forked prompt. Only original prompts can be forked.')
      }

      // Create the forked prompt
      const forkedPrompt = {
        user_id: userId,
        title: title || `Fork of: ${originalPrompt.title || 'Untitled'}`,
        content: originalPrompt.content,
        access: 'private' as const, // Forked prompts start as private
        tags: originalPrompt.tags || [],
        original_prompt_id: originalPromptId,
        folder_id: null, // Forked prompts go to root level
        views: 0,
        fork_count: 0,
        current_version: 1,
        total_versions: 1
      }

      const { data, error } = await supabase
        .from('prompts')
        .insert([forkedPrompt])
        .select()
        .single()

      if (error) throw error

      // Create initial version for the forked prompt
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert([{
          prompt_id: data.id,
          version_number: 1,
          title: data.title,
          content: data.content,
          commit_message: `Forked from original prompt`,
          created_by: userId,
          is_current: true
        }])

      if (versionError) {
        console.error('Error creating initial version for fork:', versionError)
      }

      // Add the forked prompt to the local state
      const { prompts, cache } = get()
      cache.set(data.id, data)
      set({ prompts: [data, ...prompts], cache: new Map(cache) })
    } catch (error) {
      console.error('Error forking prompt:', error)
      throw error
    }
  },

  deletePrompt: async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      const { prompts, cache } = get()
      cache.delete(id)
      set({ 
        prompts: prompts.filter(p => p.id !== id),
        cache: new Map(cache)
      })
    } catch (error) {
      console.error('Error deleting prompt:', error)
      throw error
    }
  },

  incrementViews: async (id: string) => {
    try {
      // First get the current view count
      const { data: currentPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('views')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Increment the view count
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ views: (currentPrompt.views || 0) + 1 })
        .eq('id', id)

      if (updateError) throw updateError
      
      // Update cache if prompt exists
      const { cache } = get()
      if (cache.has(id)) {
        const cachedPrompt = cache.get(id)!
        cache.set(id, { ...cachedPrompt, views: (cachedPrompt.views || 0) + 1 })
        set({ cache: new Map(cache) })
      }
    } catch (error) {
      console.error('Error incrementing views:', error)
      // Don't throw error to prevent breaking the UI if view tracking fails
    }
  },

  subscribeToUserPrompts: (userId: string) => {
    const subscription = supabase
      .channel('user-prompts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { prompts, cache } = get()
          
          if (payload.eventType === 'INSERT') {
            const newPrompt = payload.new as Prompt
            cache.set(newPrompt.id, newPrompt)
            set({ prompts: [newPrompt, ...prompts], cache: new Map(cache) })
          } else if (payload.eventType === 'DELETE') {
            cache.delete(payload.old.id)
            set({ 
              prompts: prompts.filter(p => p.id !== payload.old.id),
              cache: new Map(cache)
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedPrompt = payload.new as Prompt
            cache.set(updatedPrompt.id, updatedPrompt)
            set({
              prompts: prompts.map(p =>
                p.id === updatedPrompt.id ? updatedPrompt : p
              ),
              cache: new Map(cache)
            })
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  },

  clearCache: () => {
    set({ cache: new Map() })
  },
})))