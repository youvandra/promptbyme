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
  fetchFolders: () => Promise<void>
  createFolder: (folder: Partial<Folder>) => Promise<void>
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  moveFolder: (folderId: string, parentId: string | null, position: number) => Promise<void>
  getFolderPath: (folderId: string) => Promise<string>
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  loading: false,

  fetchFolders: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch folders with prompt counts
      const { data: folders, error } = await supabase
        .from('folders')
        .select(`
          *,
          prompts:prompts(count)
        `)
        .eq('user_id', user.id)
        .order('position')

      if (error) throw error

      // Process the data to include prompt counts
      const foldersWithCounts = folders?.map(folder => ({
        ...folder,
        prompt_count: folder.prompts?.[0]?.count || 0
      })) || []

      set({ folders: foldersWithCounts })
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      set({ loading: false })
    }
  },

  createFolder: async (folderData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get the next position
      const { data: existingFolders } = await supabase
        .from('folders')
        .select('position')
        .eq('user_id', user.id)
        .eq('parent_id', folderData.parent_id || null)
        .order('position', { ascending: false })
        .limit(1)

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

      if (error) throw error

      // Add to local state
      const { folders } = get()
      set({ folders: [...folders, { ...data, prompt_count: 0 }] })
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  },

  updateFolder: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      const { folders } = get()
      set({
        folders: folders.map(folder =>
          folder.id === id ? { ...folder, ...data } : folder
        )
      })
    } catch (error) {
      console.error('Error updating folder:', error)
      throw error
    }
  },

  deleteFolder: async (id) => {
    try {
      // Move all prompts in this folder to root level
      await supabase
        .from('prompts')
        .update({ folder_id: null })
        .eq('folder_id', id)

      // Move all child folders to root level
      await supabase
        .from('folders')
        .update({ parent_id: null })
        .eq('parent_id', id)

      // Delete the folder
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      const { folders } = get()
      set({ folders: folders.filter(folder => folder.id !== id) })
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  },

  moveFolder: async (folderId, parentId, position) => {
    try {
      const { data, error } = await supabase.rpc('move_folder', {
        folder_uuid: folderId,
        new_parent_id: parentId,
        new_position: position
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error)
      }

      // Refresh folders
      await get().fetchFolders()
    } catch (error) {
      console.error('Error moving folder:', error)
      throw error
    }
  },

  getFolderPath: async (folderId) => {
    try {
      const { data, error } = await supabase.rpc('get_folder_path', {
        folder_uuid: folderId
      })

      if (error) throw error
      return data || ''
    } catch (error) {
      console.error('Error getting folder path:', error)
      return ''
    }
  }
}))