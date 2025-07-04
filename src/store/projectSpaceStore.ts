import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '../lib/supabase'


export interface FlowNode {
  id: string
  project_id: string
  type: 'input' | 'prompt' | 'condition' | 'output'
  title: string
  content: string
  position: { x: number; y: number } // For React Flow
  imported_prompt_id?: string | null
  metadata?: {
    tags?: string[]
    variables?: string[]
    estimatedTokens?: number
  }
  created_at: string
  updated_at: string
}

export interface FlowConnection {
  id: string
  project_id: string
  source_node_id: string
  target_node_id: string
  created_at: string
}

export interface FlowProject {
  id: string
  user_id: string
  name: string
  description?: string
  visibility: 'private' | 'team' | 'public'
  created_at: string
  updated_at: string
  nodes?: FlowNode[]
  connections?: FlowConnection[]
}

export interface ProjectMember {
  id: string
  user_id: string
  email: string
  display_name: string
  avatar_url?: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'declined'
  invited_by: string
  joined_at: string
  updated_at: string
  last_active?: string
  is_current_user: boolean
}

export interface UserInvitation {
  id: string
  project_id: string
  project_name: string
  project_description?: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'declined'
  invited_by: string
  invited_at: string
}

interface ProjectSpaceState {
  projects: FlowProject[]
  selectedProject: FlowProject | null
  projectMembers: ProjectMember[]
  userInvitations: UserInvitation[]
  currentUserRole: string | null
  loading: boolean
  membersLoading: boolean
  invitationsLoading: boolean
  
  // Project operations
  fetchProjects: () => Promise<void>
  createProject: (name: string, description?: string, visibility?: FlowProject['visibility']) => Promise<FlowProject>
  updateProject: (id: string, updates: Partial<FlowProject>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  selectProject: (project: FlowProject) => Promise<void>
  
  // Node operations
  createNode: (projectId: string, type: FlowNode['type'], position: { x: number; y: number }, promptId?: string) => Promise<FlowNode>
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  moveNode: (nodeId: string, position: { x: number; y: number }) => Promise<void>
  duplicateNode: (nodeId: string, offset?: { x: number, y: number }) => Promise<FlowNode>
  
  // Connection operations
  createConnection: (projectId: string, sourceNodeId: string, targetNodeId: string) => Promise<FlowConnection>
  deleteConnection: (connectionId: string) => Promise<void>
  
  // Team management operations
  fetchProjectMembers: (projectId: string) => Promise<void>
  inviteProjectMember: (projectId: string, email: string, role: ProjectMember['role']) => Promise<void>
  updateMemberRole: (projectId: string, memberUserId: string, newRole: ProjectMember['role']) => Promise<void>
  removeProjectMember: (projectId: string, memberUserId: string) => Promise<void>
  fetchUserInvitations: () => Promise<void>
  manageInvitation: (projectId: string, action: 'accept' | 'decline') => Promise<void>
  
  // Logging
  logProjectAction: (projectId: string, action: string, details?: Record<string, any>) => Promise<void>
  
  // Real-time subscriptions
  subscribeToProject: (projectId: string) => () => void
}

export const useProjectSpaceStore = create<ProjectSpaceState>()(
  subscribeWithSelector((set, get) => ({
    projects: [],
    selectedProject: null,
    projectMembers: [],
    userInvitations: [],
    currentUserRole: null,
    loading: false,
    membersLoading: false,
    invitationsLoading: false,

    fetchProjects: async () => {
      set({ loading: true })
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Get projects where user is owner OR a member
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('flow_projects')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (ownedError) throw ownedError

        // First, get project IDs where user is a member
        const { data: memberProjectIds, error: memberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')

        if (memberError) throw memberError

        // Then fetch the actual project data for those IDs
        let memberProjects = []
        if (memberProjectIds && memberProjectIds.length > 0) {
          const projectIds = memberProjectIds.map(mp => mp.project_id)
          const { data: projects, error: projectsError } = await supabase
            .from('flow_projects')
            .select('*')
            .in('id', projectIds)

          if (projectsError) throw projectsError
          memberProjects = projects || []
        }

        // Combine and deduplicate projects
        const allProjects = [...(ownedProjects || [])]
        
        if (memberProjects.length > 0) {
          memberProjects.forEach(project => {
            if (!allProjects.find(p => p.id === project.id)) {
              allProjects.push(project)
            }
          })
        }

        // Sort by updated_at
        allProjects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

        set({ projects: allProjects })
      } catch (error) {
        console.error('Error fetching projects:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    createProject: async (name: string, description?: string, visibility: FlowProject['visibility'] = 'private') => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data: project, error } = await supabase
          .from('flow_projects')
          .insert([{
            user_id: user.id,
            name,
            description: description || null,
            visibility
          }])
          .select()
          .single()

        if (error) throw error

        const { projects } = get()
        set({ projects: [project, ...projects] })
        
        return project
      } catch (error) {
        console.error('Error creating project:', error)
        throw error
      }
    },

    updateProject: async (id: string, updates: Partial<FlowProject>) => {
      try {
        const { data: project, error } = await supabase
          .from('flow_projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        const { projects, selectedProject } = get()
        const updatedProjects = projects.map(p => p.id === id ? { ...p, ...project } : p)
        
        set({ 
          projects: updatedProjects,
          selectedProject: selectedProject?.id === id ? {
            ...selectedProject,
            ...project,
            nodes: selectedProject.nodes,
            connections: selectedProject.connections
          } : selectedProject
        })
      } catch (error) {
        console.error('Error updating project:', error)
        throw error
      }
    },

    deleteProject: async (id: string) => {
      try {
        const { error } = await supabase
          .from('flow_projects')
          .delete()
          .eq('id', id)

        if (error) throw error

        const { projects, selectedProject } = get()
        const updatedProjects = projects.filter(p => p.id !== id)
        
        set({ 
          projects: updatedProjects,
          selectedProject: selectedProject?.id === id ? null : selectedProject
        })
      } catch (error) {
        console.error('Error deleting project:', error)
        throw error
      }
    },

    selectProject: async (project: FlowProject) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Fetch nodes and connections for the selected project
        const [nodesResult, connectionsResult] = await Promise.all([
          supabase
            .from('flow_nodes')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at'),
          supabase
            .from('flow_connections')
            .select('*')
            .eq('project_id', project.id)
        ])

        if (nodesResult.error) throw nodesResult.error
        if (connectionsResult.error) throw connectionsResult.error

        // Transform nodes to include position object
        const nodes: FlowNode[] = (nodesResult.data || []).map(node => ({
          ...node,
          position: { x: node.position_x, y: node.position_y }
        }))

        // Get user's role in this project - use maybeSingle() to handle no results
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', project.id)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .maybeSingle() // Use maybeSingle() instead of single() to handle no results

        let userRole = null
        if (!memberError && memberData) {
          userRole = memberData.role
        } else if (project.user_id === user.id) {
          userRole = 'admin' // Project owner is always admin
        }

        const projectWithData = {
          ...project,
          nodes,
          connections: connectionsResult.data || []
        }

        set({ 
          selectedProject: projectWithData,
          currentUserRole: userRole
        })
      } catch (error) {
        console.error('Error selecting project:', error)
        throw error
      }
    },

    createNode: async (projectId: string, type: FlowNode['type'], position: { x: number; y: number }, promptId?: string) => {
      try {
        let nodeTitle = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`
        let defaultContent = ''
        
        // If importing a prompt for a prompt node, get the prompt data
        if (promptId && type === 'prompt') {
          const { data: prompt, error: promptError } = await supabase
            .from('prompts')
            .select('title, content')
            .eq('id', promptId)
            .single()
          
          if (!promptError && prompt) {
            nodeTitle = prompt.title || nodeTitle
            defaultContent = prompt.content
          }
        }
        
        // Set default content for different node types if no prompt is imported
        if (!defaultContent) {
          switch (type) {
            case 'input':
              defaultContent = 'Define your input parameters here...'
              break
            case 'prompt':
              defaultContent = 'Write your prompt here...\n\nYou can use {{variables}} for dynamic content.'
              break
            case 'condition':
              defaultContent = 'Define your condition logic here...'
              break
            case 'output':
              defaultContent = 'Specify your output format here...'
              break
          }
        }
        
        const { data: node, error } = await supabase
          .from('flow_nodes')
          .insert({
            project_id: projectId,
            type,
            title: nodeTitle,
            content: defaultContent,
            position_x: position.x,
            position_y: position.y,
            imported_prompt_id: promptId || null,
            metadata: {
              tags: [],
              variables: [],
              estimatedTokens: 0
            }
          })
          .select()
          .single()

        if (error) throw error

        // Transform node to include position object
        const transformedNode: FlowNode = {
          ...node,
          position: { x: node.position_x, y: node.position_y }
        }

        // Update selected project if it matches
        const { selectedProject, logProjectAction } = get()
        if (selectedProject?.id === projectId) {
          set({
            selectedProject: {
              ...selectedProject,
              nodes: [...(selectedProject.nodes || []), transformedNode]
            }
          })
        }

        // Log the action
        await logProjectAction(projectId, 'Node Created', {
          nodeId: node.id,
          nodeType: type,
          nodeTitle
        })

        return transformedNode
      } catch (error) {
        console.error('Error creating node:', error)
        throw error
      }
    },

    updateNode: async (nodeId: string, updates: Partial<FlowNode>) => {
      try {
        // Prepare database updates
        const dbUpdates: any = { ...updates }
        if (updates.position) {
          dbUpdates.position_x = updates.position.x
          dbUpdates.position_y = updates.position.y
          delete dbUpdates.position
        }

        const { data: node, error } = await supabase
          .from('flow_nodes')
          .update(dbUpdates)
          .eq('id', nodeId)
          .select()
          .maybeSingle()

        if (error) {
          throw error
        }

        // If no node was found (node is null), handle gracefully
        if (!node) {
          // Node doesn't exist, but we can still update local state with the changes
          const { selectedProject } = get()
          if (selectedProject?.nodes) {
            const existingNode = selectedProject.nodes.find(n => n.id === nodeId)
            if (existingNode) {
              const transformedNode = {
                ...existingNode,
                ...updates
              }
              
              const updatedNodes = selectedProject.nodes.map(n => 
                n.id === nodeId ? transformedNode : n
              )
              
              set({
                selectedProject: {
                  ...selectedProject,
                  nodes: updatedNodes
                }
              })
            }
          }
          return
        }

        // Update selected project if it contains this node
        const { selectedProject, logProjectAction } = get()
        if (selectedProject?.nodes) {
          // Transform node to include position object
          const transformedNode: FlowNode = {
            ...node,
            position: { x: node.position_x, y: node.position_y }
          }
          
          const updatedNodes = selectedProject.nodes.map(n => 
            n.id === nodeId ? transformedNode : n
          )
          
          set({
            selectedProject: {
              ...selectedProject,
              nodes: updatedNodes
            }
          })
          
          // Log the action
          await logProjectAction(selectedProject.id, 'Node Updated', {
            nodeId,
            nodeTitle: updates.title || node?.title,
            nodeType: node?.type
          })
        }
      } catch (error) {
        console.error('Error updating node:', error)
        throw error
      }
    },

    deleteNode: async (nodeId: string) => {
      try {
        const { error } = await supabase
          .from('flow_nodes')
          .delete()
          .eq('id', nodeId)

        if (error) throw error

        // Update selected project if it contains this node
        const { selectedProject, logProjectAction } = get()
        if (selectedProject?.nodes) {
          // Find the node before deleting it to log details
          const nodeToDelete = selectedProject.nodes.find(n => n.id === nodeId)
          
          const updatedNodes = selectedProject.nodes.filter(n => n.id !== nodeId)
          const updatedConnections = selectedProject.connections?.filter(c => 
            c.source_node_id !== nodeId && c.target_node_id !== nodeId
          ) || []
          
          set({
            selectedProject: {
              ...selectedProject,
              nodes: updatedNodes,
              connections: updatedConnections
            }
          })
          
          // Log the action
          if (nodeToDelete) {
            await logProjectAction(selectedProject.id, 'Node Deleted', {
              nodeId,
              nodeTitle: nodeToDelete.title,
              nodeType: nodeToDelete.type
            })
          }
        }
      } catch (error) {
        console.error('Error deleting node:', error)
        throw error
      }
    },

    moveNode: async (nodeId: string, position: { x: number; y: number }) => {
      try {
        const { error } = await supabase
          .from('flow_nodes')
          .update({
            position_x: position.x,
            position_y: position.y
          })
          .eq('id', nodeId)

        if (error) throw error

        // Update local state immediately for smooth UX
        const { selectedProject } = get()
        if (selectedProject?.nodes) {
          const updatedNodes = selectedProject.nodes.map(n => 
            n.id === nodeId ? { ...n, position } : n
          )
          
          set({
            selectedProject: {
              ...selectedProject,
              nodes: updatedNodes
            }
          })
        }
      } catch (error) {
        console.error('Error moving node:', error)
        throw error
      }
    },

    duplicateNode: async (nodeId: string, offset: { x: number, y: number } = { x: 50, y: 50 }) => {
      try {
        // Get the original node
        const { data: originalNode, error: fetchError } = await supabase
          .from('flow_nodes')
          .select('*')
          .eq('id', nodeId)
          .maybeSingle()

        if (fetchError) {
          throw fetchError
        }
        
        if (!originalNode) {
          throw new Error('Node not found')
        }
        
        // Create a new node with the same properties but at an offset position
        const { data: newNode, error: createError } = await supabase
          .from('flow_nodes')
          .insert([{
            project_id: originalNode.project_id,
            type: originalNode.type,
            title: `Copy of ${originalNode.title}`,
            content: originalNode.content,
            position_x: originalNode.position_x + offset.x,
            position_y: originalNode.position_y + offset.y,
            imported_prompt_id: originalNode.imported_prompt_id,
            metadata: originalNode.metadata
          }])
          .select()
          .single()

        if (createError) {
          throw createError
        }

        // Transform node to include position object
        const transformedNode: FlowNode = {
          ...newNode,
          position: { x: newNode.position_x, y: newNode.position_y }
        }

        // Update selected project if it contains this node
        const { selectedProject } = get()
        if (selectedProject?.id === originalNode.project_id) {
          set({
            selectedProject: {
              ...selectedProject,
              nodes: [...(selectedProject.nodes || []), transformedNode]
            }
          })
        }

        return transformedNode
      } catch (error) {
        console.error('Error duplicating node:', error)
        throw error
      }
    },

    createConnection: async (projectId: string, sourceNodeId: string, targetNodeId: string) => {
      try {
        const { data: connection, error } = await supabase
          .from('flow_connections')
          .insert([{
            project_id: projectId,
            source_node_id: sourceNodeId,
            target_node_id: targetNodeId
          }])
          .select()
          .single()

        if (error) throw error

        // Update selected project if it matches
        const { selectedProject, logProjectAction } = get()
        if (selectedProject?.id === projectId) {
          set({
            selectedProject: {
              ...selectedProject,
              connections: [...(selectedProject.connections || []), connection]
            }
          })
        }

        // Log the action
        await logProjectAction(projectId, 'Connection Created', {
          connectionId: connection.id,
          sourceNodeId,
          targetNodeId
        })
        
        return connection
      } catch (error) {
        console.error('Error creating connection:', error)
        throw error
      }
    },

    deleteConnection: async (connectionId: string) => {
      try {
        const { error } = await supabase
          .from('flow_connections')
          .delete()
          .eq('id', connectionId)

        if (error) throw error

        // Update selected project
        const { selectedProject, logProjectAction } = get()
        if (selectedProject?.connections) {
          // Find the connection before deleting it to log details
          const connectionToDelete = selectedProject.connections.find(c => c.id === connectionId)
          
          const updatedConnections = selectedProject.connections.filter(c => c.id !== connectionId)
          
          set({
            selectedProject: {
              ...selectedProject,
              connections: updatedConnections
            }
          })
          
          // Log the action
          if (connectionToDelete) {
            await logProjectAction(selectedProject.id, 'Connection Deleted', {
              connectionId,
              sourceNodeId: connectionToDelete.source_node_id,
              targetNodeId: connectionToDelete.target_node_id
            })
          }
        }
      } catch (error) {
        console.error('Error deleting connection:', error)
        throw error
      }
    },
    
    fetchProjectMembers: async (projectId: string) => {
      set({ membersLoading: true })
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Call the edge function to get project members
        const { data, error } = await supabase.functions.invoke('get-project-members', {
          body: { project_id: projectId }
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch project members')
        }

        set({ 
          projectMembers: data.members || [],
          currentUserRole: data.user_role || null
        })
      } catch (error) {
        console.error('Error fetching project members:', error)
        throw error
      } finally {
        set({ membersLoading: false })
      }
    },
    
    inviteProjectMember: async (projectId: string, email: string, role: ProjectMember['role']) => {
      try {
        const { data, error } = await supabase.functions.invoke('invite-project-member', {
          body: {
            project_id: projectId,
            invited_user_email: email,
            role
          }
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.error || 'Failed to send invitation')
        }
        
        // Log the action
        const { logProjectAction } = get()
        await logProjectAction(projectId, 'Member Invited', {
          email,
          role
        })

        // Refresh project members
        await get().fetchProjectMembers(projectId)
      } catch (error) {
        console.error('Error inviting project member:', error)
        throw error
      }
    },
    
    updateMemberRole: async (projectId: string, memberUserId: string, newRole: ProjectMember['role']) => {
      try {
        const { data, error } = await supabase.functions.invoke('update-member-role', {
          body: {
            project_id: projectId,
            member_user_id: memberUserId,
            new_role: newRole
          }
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.error || 'Failed to update member role')
        }
        
        // Log the action
        const { logProjectAction } = get()
        await logProjectAction(projectId, 'Member Role Updated', {
          memberUserId,
          newRole
        })

        // Refresh project members
        await get().fetchProjectMembers(projectId)
      } catch (error) {
        console.error('Error updating member role:', error)
        throw error
      }
    },
    
    removeProjectMember: async (projectId: string, memberUserId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('remove-project-member', {
          body: {
            project_id: projectId,
            member_user_id: memberUserId
          }
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.error || 'Failed to remove project member')
        }
        
        // Log the action
        const { logProjectAction } = get()
        await logProjectAction(projectId, 'Member Removed', {
          memberUserId
        })

        // Refresh project members
        await get().fetchProjectMembers(projectId)
      } catch (error) {
        console.error('Error removing project member:', error)
        throw error
      }
    },
    
    fetchUserInvitations: async () => {
      set({ invitationsLoading: true })
      try {
        const { data, error } = await supabase.functions.invoke('get-user-invitations')

        if (error) throw error

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch invitations')
        }

        set({ userInvitations: data.invitations || [] })
      } catch (error) {
        console.error('Error fetching user invitations:', error)
        throw error
      } finally {
        set({ invitationsLoading: false })
      }
    },
    
    manageInvitation: async (projectId: string, action: 'accept' | 'decline') => {
      try {
        const { data, error } = await supabase.functions.invoke('manage-project-invitation', {
          body: {
            project_id: projectId,
            action
          }
        })

        if (error) throw error

        if (!data.success) {
          throw new Error(data.error || `Failed to ${action} invitation`)
        }

        // Refresh invitations
        await get().fetchUserInvitations()
        
        // If accepted, refresh projects list
        if (action === 'accept') {
         // Fetch the projects to ensure the newly accepted project is included
          await get().fetchProjects()
          
          // Find the newly accepted project
          const { projects } = get()
          const acceptedProject = projects.find(p => p.id === projectId)
          
          // If found, select it to make it the active project
          if (acceptedProject) {
            await get().selectProject(acceptedProject)
          }
        }
      } catch (error) {
        console.error(`Error ${action}ing invitation:`, error)
        throw error
      }
    },
    
    logProjectAction: async (projectId: string, action: string, details: Record<string, any> = {}) => {
      try {
        await supabase.rpc('log_project_action', {
          project_uuid: projectId,
          action_text: action,
          details_json: details
        })
      } catch (error) {
        console.error('Error logging project action:', error)
        // Don't throw error to prevent disrupting the main operation
      }
    },
    
    subscribeToProject: (projectId: string) => {
      const nodesSubscription = supabase
        .channel(`project-nodes-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'flow_nodes',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const { selectedProject } = get()
            if (selectedProject?.id !== projectId) return

            if (payload.eventType === 'INSERT') {
              const newNode: FlowNode = {
                ...payload.new as any,
                position: { x: payload.new.position_x, y: payload.new.position_y }
              }
              set({
                selectedProject: {
                  ...selectedProject,
                  nodes: [...(selectedProject.nodes || []), newNode]
                }
              })
            } else if (payload.eventType === 'DELETE') {
              const updatedNodes = selectedProject.nodes?.filter(n => n.id !== payload.old.id) || []
              set({
                selectedProject: {
                  ...selectedProject,
                  nodes: updatedNodes
                }
              })
            } else if (payload.eventType === 'UPDATE') {
              const updatedNode: FlowNode = {
                ...payload.new as any,
                position: { x: payload.new.position_x, y: payload.new.position_y }
              }
              const updatedNodes = selectedProject.nodes?.map(n => 
                n.id === updatedNode.id ? updatedNode : n
              ) || []
              set({
                selectedProject: {
                  ...selectedProject,
                  nodes: updatedNodes
                }
              })
            }
          }
        )
        .subscribe()

      const connectionsSubscription = supabase
        .channel(`project-connections-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'flow_connections',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const { selectedProject } = get()
            if (selectedProject?.id !== projectId) return

            if (payload.eventType === 'INSERT') {
              const newConnection = payload.new as FlowConnection
              set({
                selectedProject: {
                  ...selectedProject,
                  connections: [...(selectedProject.connections || []), newConnection]
                }
              })
            } else if (payload.eventType === 'DELETE') {
              const updatedConnections = selectedProject.connections?.filter(c => c.id !== payload.old.id) || []
              set({
                selectedProject: {
                  ...selectedProject,
                  connections: updatedConnections
                }
              })
            }
          }
        )
        .subscribe()

      return () => {
        nodesSubscription.unsubscribe()
        connectionsSubscription.unsubscribe()
      }
    }
  }))
)