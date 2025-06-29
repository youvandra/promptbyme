import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface Folder {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  user_id: string
  parent_id?: string
  position: number
  is_shared: boolean
  created_at: string
  updated_at: string
  prompt_count?: number
}

interface FolderState {
  folders: Folder[]
  loading: boolean
  error: string | null
  fetchFolders: () => Promise<void>
  createFolder: (folder: Partial<Folder>) => Promise<void>
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  moveFolder: (folderId: string, parentId: string | null, position: number) => Promise<void>
  getFolderPath: (folderId: string) => Promise<string>
  clearError: () => void
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFolders: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!user) {
        set({ folders: [], loading: false })
        return
      }

      // Fetch folders with prompt counts
      const { data: folders, error } = await supabase
        .from('folders')
        .select(`
          *,
          prompts:prompts(count)
        `)
        .eq('user_id', user.id)
        .order('position')

      if (error) {
        console.error('Supabase error fetching folders:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      // Process the data to include prompt counts
      const foldersWithCounts = (folders || []).map(folder => ({
        ...folder,
        prompt_count: folder.prompts?.[0]?.count || 0
      }))

      set({ folders: foldersWithCounts, loading: false })
    } catch (error) {
      console.error('Error fetching folders:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      set({ 
        error: `Failed to load folders: ${errorMessage}`,
        loading: false 
      })
    }
  },

  createFolder: async (folderData) => {
    try {
      set({ error: null })
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!user) throw new Error('User not authenticated')

      // Get the next position
      const { data: existingFolders, error: positionError } = await supabase
        .from('folders')
        .select('position')
        .eq('user_id', user.id)
        .eq('parent_id', folderData.parent_id || null)
        .order('position', { ascending: false })
        .limit(1)

      if (positionError) {
        throw new Error(`Error getting folder position: ${positionError.message}`)
      }

      const nextPosition = existingFolders?.[0]?.position ? existingFolders[0].position + 1 : 0

      const { data, error } = await supabase
        .from('folders')
        .insert([{
          ...folderData,
          user_id: user.id,
          position: nextPosition
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Error creating folder: ${error.message}`)
      }

      // Add to local state
      const { folders } = get()
      set({ folders: [...folders, { ...data, prompt_count: 0 }] })
    } catch (error) {
      console.error('Error creating folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      set({ error: `Failed to create folder: ${errorMessage}` })
      throw error
    }
  },

  updateFolder: async (id, updates) => {
    try {
      set({ error: null })
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Error updating folder: ${error.message}`)
      }

      // Update local state
      const { folders } = get()
      set({
        folders: folders.map(folder =>
          folder.id === id ? { ...folder, ...data } : folder
        )
      })
    } catch (error) {
      console.error('Error updating folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      set({ error: `Failed to update folder: ${errorMessage}` })
      throw error
    }
  },

  deleteFolder: async (id) => {
    try {
      set({ error: null })
      // Move all prompts in this folder to root level
      const { error: promptsError } = await supabase
        .from('prompts')
        .update({ folder_id: null })
        .eq('folder_id', id)

      if (promptsError) {
        throw new Error(`Error moving prompts: ${promptsError.message}`)
      }

      // Move all child folders to root level
      const { error: childFoldersError } = await supabase
        .from('folders')
        .update({ parent_id: null })
        .eq('parent_id', id)

      if (childFoldersError) {
        throw new Error(`Error moving child folders: ${childFoldersError.message}`)
      }

      // Delete the folder
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Error deleting folder: ${error.message}`)
      }

      // Update local state
      const { folders } = get()
      set({ folders: folders.filter(folder => folder.id !== id) })
    } catch (error) {
      console.error('Error deleting folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      set({ error: `Failed to delete folder: ${errorMessage}` })
      throw error
    }
  },

  moveFolder: async (folderId, parentId, position) => {
    try {
      set({ error: null })
      const { data, error } = await supabase.rpc('move_folder', {
        folder_uuid: folderId,
        new_parent_id: parentId,
        new_position: position
      })

      if (error) {
        throw new Error(`Error moving folder: ${error.message}`)
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unknown error moving folder')
      }

      // Refresh folders
      await get().fetchFolders()
    } catch (error) {
      console.error('Error moving folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      set({ error: `Failed to move folder: ${errorMessage}` })
      throw error
    }
  },

  getFolderPath: async (folderId) => {
    try {
      const { data, error } = await supabase.rpc('get_folder_path', {
        folder_uuid: folderId
      })

      if (error) {
        throw new Error(`Error getting folder path: ${error.message}`)
      }
      return data || ''
    } catch (error) {
      console.error('Error getting folder path:', error)
      return ''
    }
  }
}))