import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface LikeState {
  userLikes: Set<string>
  loading: boolean
  fetchUserLikes: (userId: string) => Promise<void>
  toggleLike: (promptId: string, userId: string) => Promise<boolean>
  isLiked: (promptId: string) => boolean
}

export const useLikeStore = create<LikeState>((set, get) => ({
  userLikes: new Set(),
  loading: false,

  fetchUserLikes: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('prompt_id')
        .eq('user_id', userId)

      if (error) throw error
      
      const likedPromptIds = new Set(data?.map(like => like.prompt_id) || [])
      set({ userLikes: likedPromptIds })
    } catch (error) {
      console.error('Error fetching user likes:', error)
    } finally {
      set({ loading: false })
    }
  },

  toggleLike: async (promptId: string, userId: string) => {
    const { userLikes } = get()
    const isCurrentlyLiked = userLikes.has(promptId)

    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('prompt_id', promptId)

        if (error) throw error

        // Update local state
        const newLikes = new Set(userLikes)
        newLikes.delete(promptId)
        set({ userLikes: newLikes })
        
        return false // Now unliked
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ user_id: userId, prompt_id: promptId }])

        if (error) throw error

        // Update local state
        const newLikes = new Set(userLikes)
        newLikes.add(promptId)
        set({ userLikes: newLikes })
        
        return true // Now liked
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  },

  isLiked: (promptId: string) => {
    const { userLikes } = get()
    return userLikes.has(promptId)
  },
}))