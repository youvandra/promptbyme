import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface FlowStep {
  id: string
  flow_id: string
  prompt_id: string
  order_index: number
  step_title: string
  created_at?: string
  prompt_content?: string
  prompt_title?: string
  output?: string
  isExpanded?: boolean
  isRunning?: boolean
}

export interface PromptFlow {
  id: string
  user_id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
  steps: FlowStep[]
}

interface ApiSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'llama' | 'groq'
  model: string
  temperature: number
  maxTokens: number
}

interface FlowState {
  flows: PromptFlow[]
  selectedFlow: PromptFlow | null
  apiSettings: ApiSettings
  loading: boolean
  executing: boolean
  
  // Flow operations
  fetchFlows: () => Promise<void>
  createFlow: (name: string, description?: string) => Promise<PromptFlow>
  updateFlow: (id: string, updates: Partial<Omit<PromptFlow, 'id' | 'steps'>>) => Promise<void>
  deleteFlow: (id: string) => Promise<void>
  selectFlow: (id: string) => Promise<void>
  
  // Step operations
  addStep: (flowId: string, promptId: string, title: string, content: string) => Promise<void>
  updateStep: (stepId: string, updates: Partial<Omit<FlowStep, 'id' | 'flow_id'>>) => Promise<void>
  deleteStep: (stepId: string) => Promise<void>
  reorderStep: (stepId: string, newIndex: number) => Promise<void>
  
  // Execution
  executeFlow: (flowId: string, variables?: Record<string, string>) => Promise<void>
  executeStep: (stepId: string, variables?: Record<string, string>) => Promise<string>
  updateApiSettings: (settings: Partial<ApiSettings>) => Promise<void>
  clearOutputs: () => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  selectedFlow: null,
  apiSettings: {
    provider: localStorage.getItem('flow_api_provider') as ApiSettings['provider'] || 'groq',
    model: localStorage.getItem('flow_api_model') || 'llama3-8b-8192',
    temperature: parseFloat(localStorage.getItem('flow_api_temperature') || '0.7'),
    maxTokens: parseInt(localStorage.getItem('flow_api_max_tokens') || '1000')
  },
  loading: false,
  executing: false,
  
  fetchFlows: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch flows
      const { data: flows, error } = await supabase
        .from('prompt_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // For each flow, fetch its steps
      const flowsWithSteps = await Promise.all((flows || []).map(async (flow) => {
        const { data: steps, error: stepsError } = await supabase
          .from('flow_steps')
          .select(`
            id,
            flow_id,
            prompt_id,
            order_index,
            step_title,
            created_at,
            prompts (
              id,
              title,
              content
            )
          `)
          .eq('flow_id', flow.id)
          .order('order_index')

        if (stepsError) {
          console.error(`Error fetching steps for flow ${flow.id}:`, stepsError)
          return { ...flow, steps: [] }
        }

        // Transform steps to include prompt content
        const transformedSteps = (steps || []).map(step => ({
          id: step.id,
          flow_id: step.flow_id,
          prompt_id: step.prompt_id,
          order_index: step.order_index,
          step_title: step.step_title,
          created_at: step.created_at,
          prompt_content: step.prompts?.content || '',
          prompt_title: step.prompts?.title || '',
          isExpanded: false
        }))

        return { ...flow, steps: transformedSteps }
      }))

      set({ flows: flowsWithSteps, loading: false })
    } catch (error) {
      console.error('Error fetching flows:', error)
      set({ loading: false })
    }
  },
  
  createFlow: async (name, description) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('prompt_flows')
        .insert([{
          user_id: user.id,
          name,
          description
        }])
        .select()
        .single()

      if (error) throw error

      const newFlow = { ...data, steps: [] }
      set(state => ({ 
        flows: [newFlow, ...state.flows],
        selectedFlow: newFlow
      }))
      return newFlow
    } catch (error) {
      console.error('Error creating flow:', error)
      throw error
    }
  },
  
  updateFlow: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('prompt_flows')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        flows: state.flows.map(flow => 
          flow.id === id ? { ...flow, ...data } : flow
        ),
        selectedFlow: state.selectedFlow?.id === id 
          ? { ...state.selectedFlow, ...data } 
          : state.selectedFlow
      }))
    } catch (error) {
      console.error('Error updating flow:', error)
      throw error
    }
  },
  
  deleteFlow: async (id) => {
    try {
      const { error } = await supabase
        .from('prompt_flows')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        flows: state.flows.filter(flow => flow.id !== id),
        selectedFlow: state.selectedFlow?.id === id ? null : state.selectedFlow
      }))
    } catch (error) {
      console.error('Error deleting flow:', error)
      throw error
    }
  },
  
  selectFlow: async (id) => {
    try {
      const flow = get().flows.find(f => f.id === id)
      if (!flow) throw new Error('Flow not found')
      
      set({ selectedFlow: flow })
    } catch (error) {
      console.error('Error selecting flow:', error)
      throw error
    }
  },
  
  addStep: async (flowId, promptId, title, content) => {
    try {
      // Get the current highest order index
      const { selectedFlow } = get()
      const steps = selectedFlow?.steps || []
      const nextOrderIndex = steps.length > 0 
        ? Math.max(...steps.map(s => s.order_index)) + 1 
        : 0

      const { data, error } = await supabase
        .from('flow_steps')
        .insert([{
          flow_id: flowId,
          prompt_id: promptId,
          order_index: nextOrderIndex,
          step_title: title
        }])
        .select()
        .single()

      if (error) throw error

      const newStep: FlowStep = {
        ...data,
        prompt_content: content,
        prompt_title: title,
        isExpanded: false
      }

      set(state => {
        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          if (flow.id === flowId) {
            return { ...flow, steps: [...flow.steps, newStep] }
          }
          return flow
        })
        
        const updatedSelectedFlow = state.selectedFlow?.id === flowId
          ? { ...state.selectedFlow, steps: [...state.selectedFlow.steps, newStep] }
          : state.selectedFlow

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error adding step:', error)
      throw error
    }
  },
  
  updateStep: async (stepId, updates) => {
    try {
      const { data, error } = await supabase
        .from('flow_steps')
        .update(updates)
        .eq('id', stepId)
        .select()
        .single()

      if (error) throw error

      set(state => {
        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          const stepIndex = flow.steps.findIndex(s => s.id === stepId)
          if (stepIndex >= 0) {
            const updatedSteps = [...flow.steps]
            updatedSteps[stepIndex] = { 
              ...updatedSteps[stepIndex], 
              ...updates,
              ...data
            }
            return { ...flow, steps: updatedSteps }
          }
          return flow
        })
        
        let updatedSelectedFlow = state.selectedFlow
        if (state.selectedFlow) {
          const stepIndex = state.selectedFlow.steps.findIndex(s => s.id === stepId)
          if (stepIndex >= 0) {
            const updatedSteps = [...state.selectedFlow.steps]
            updatedSteps[stepIndex] = { 
              ...updatedSteps[stepIndex], 
              ...updates,
              ...data
            }
            updatedSelectedFlow = { ...state.selectedFlow, steps: updatedSteps }
          }
        }

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error updating step:', error)
      throw error
    }
  },
  
  deleteStep: async (stepId) => {
    try {
      const { error } = await supabase
        .from('flow_steps')
        .delete()
        .eq('id', stepId)

      if (error) throw error

      set(state => {
        // Find which flow contains this step
        let flowId: string | null = null
        for (const flow of state.flows) {
          if (flow.steps.some(s => s.id === stepId)) {
            flowId = flow.id
            break
          }
        }

        if (!flowId) return state // Step not found

        // Update the order_index of remaining steps
        const updateOrderIndices = async (flowId: string, steps: FlowStep[]) => {
          // Sort steps by order_index
          const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index)
          
          // Update order_index for each step
          for (let i = 0; i < sortedSteps.length; i++) {
            if (sortedSteps[i].order_index !== i) {
              await supabase
                .from('flow_steps')
                .update({ order_index: i })
                .eq('id', sortedSteps[i].id)
              
              sortedSteps[i].order_index = i
            }
          }
          
          return sortedSteps
        }

        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          if (flow.id === flowId) {
            const updatedSteps = flow.steps.filter(s => s.id !== stepId)
            // Schedule reordering (don't wait for it)
            updateOrderIndices(flow.id, updatedSteps)
            return { ...flow, steps: updatedSteps }
          }
          return flow
        })
        
        let updatedSelectedFlow = state.selectedFlow
        if (state.selectedFlow?.id === flowId) {
          const updatedSteps = state.selectedFlow.steps.filter(s => s.id !== stepId)
          updatedSelectedFlow = { ...state.selectedFlow, steps: updatedSteps }
        }

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error deleting step:', error)
      throw error
    }
  },
  
  reorderStep: async (stepId, newIndex) => {
    try {
      const { selectedFlow } = get()
      if (!selectedFlow) throw new Error('No flow selected')

      const stepIndex = selectedFlow.steps.findIndex(s => s.id === stepId)
      if (stepIndex === -1) throw new Error('Step not found')

      const step = selectedFlow.steps[stepIndex]
      const currentIndex = step.order_index
      
      if (currentIndex === newIndex) return // No change needed

      // Update the step's order_index
      const { error } = await supabase
        .from('flow_steps')
        .update({ order_index: newIndex })
        .eq('id', stepId)

      if (error) throw error

      // Reorder other steps as needed
      const stepsToUpdate = selectedFlow.steps.filter(s => {
        if (currentIndex < newIndex) {
          // Moving down: update steps between current and new position
          return s.order_index > currentIndex && s.order_index <= newIndex
        } else {
          // Moving up: update steps between new and current position
          return s.order_index >= newIndex && s.order_index < currentIndex
        }
      })

      // Update order_index for affected steps
      for (const stepToUpdate of stepsToUpdate) {
        const newOrderIndex = currentIndex < newIndex
          ? stepToUpdate.order_index - 1 // Moving down: decrement steps in between
          : stepToUpdate.order_index + 1 // Moving up: increment steps in between
        
        await supabase
          .from('flow_steps')
          .update({ order_index: newOrderIndex })
          .eq('id', stepToUpdate.id)
      }

      // Update local state
      set(state => {
        const updatedSteps = [...selectedFlow.steps]
        
        // Update the moved step
        updatedSteps[stepIndex] = { ...step, order_index: newIndex }
        
        // Update other affected steps
        for (let i = 0; i < updatedSteps.length; i++) {
          if (i !== stepIndex) {
            const s = updatedSteps[i]
            if (currentIndex < newIndex && s.order_index > currentIndex && s.order_index <= newIndex) {
              updatedSteps[i] = { ...s, order_index: s.order_index - 1 }
            } else if (currentIndex > newIndex && s.order_index >= newIndex && s.order_index < currentIndex) {
              updatedSteps[i] = { ...s, order_index: s.order_index + 1 }
            }
          }
        }
        
        // Sort steps by order_index
        updatedSteps.sort((a, b) => a.order_index - b.order_index)
        
        // Update both selectedFlow and flows
        const updatedSelectedFlow = { ...selectedFlow, steps: updatedSteps }
        const updatedFlows = state.flows.map(flow => 
          flow.id === selectedFlow.id ? updatedSelectedFlow : flow
        )
        
        return {
          selectedFlow: updatedSelectedFlow,
          flows: updatedFlows
        }
      })
    } catch (error) {
      console.error('Error reordering step:', error)
      throw error
    }
  },
  
  executeFlow: async (flowId, variables = {}) => {
    try {
      set({ executing: true })
      
      const { selectedFlow, apiSettings } = get()
      if (!selectedFlow || selectedFlow.id !== flowId) {
        throw new Error('Selected flow does not match the flow to execute')
      }
      
      // Clear previous outputs
      set(state => ({
        selectedFlow: state.selectedFlow ? {
          ...state.selectedFlow,
          steps: state.selectedFlow.steps.map(step => ({
            ...step,
            output: undefined,
            isRunning: false,
            isExpanded: false
          }))
        } : null
      }))
      
      // Sort steps by order_index
      const steps = [...selectedFlow.steps].sort((a, b) => a.order_index - b.order_index)
      
      // Execute steps in sequence
      let context = { ...variables }
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        
        // Mark step as running
        set(state => ({
          selectedFlow: state.selectedFlow ? {
            ...state.selectedFlow,
            steps: state.selectedFlow.steps.map(s => 
              s.id === step.id ? { ...s, isRunning: true } : s
            )
          } : null
        }))
        
        try {
          // Execute the step
          const output = await get().executeStep(step.id, context)
          
          // Add output to context for next steps
          context[`step_${i+1}_output`] = output
          
          // Update step with output
          set(state => ({
            selectedFlow: state.selectedFlow ? {
              ...state.selectedFlow,
              steps: state.selectedFlow.steps.map(s => 
                s.id === step.id ? { ...s, output, isRunning: false } : s
              )
            } : null
          }))
        } catch (error) {
          console.error(`Error executing step ${step.id}:`, error)
          
          // Mark step as failed
          set(state => ({
            selectedFlow: state.selectedFlow ? {
              ...state.selectedFlow,
              steps: state.selectedFlow.steps.map(s => 
                s.id === step.id ? { ...s, output: `Error: ${error.message}`, isRunning: false } : s
              )
            } : null
          }))
          
          // Stop execution
          break
        }
      }
    } catch (error) {
      console.error('Error executing flow:', error)
      throw error
    } finally {
      set({ executing: false })
    }
  },
  
  executeStep: async (stepId, variables = {}) => {
    try {
      const { selectedFlow, apiSettings } = get()
      if (!selectedFlow) throw new Error('No flow selected')
      
      const step = selectedFlow.steps.find(s => s.id === stepId)
      if (!step) throw new Error('Step not found')      
      
      // Replace variables in prompt content
      let content = step.prompt_content || ''
      
      // Replace {{variable}} placeholders with values from context
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        content = content.replace(regex, value)
      }
      
      // Call the appropriate API based on provider
      let response
      
      // For demo purposes, we'll use the Supabase Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('run-prompt-flow', {
          body: { 
            provider: get().apiSettings.provider,
            model: get().apiSettings.model,
            prompt: content,
            temperature: get().apiSettings.temperature,
            maxTokens: get().apiSettings.maxTokens
          }
        })
        
        if (error) throw new Error(error.message)
        if (!data.success) throw new Error(data.error || 'Unknown error')
        
        response = data.response
      } catch (error) {
        console.error('API call failed:', error)
        throw new Error(`API call failed: ${error.message}`)
      }
      
      return response
    } catch (error) {
      console.error('Error executing step:', error)
      throw error
    }
  },
  
  updateApiSettings: async (settings) => {
    set(state => ({
      apiSettings: { 
        ...state.apiSettings,
        ...settings
      }
    }))
    
    // Save API settings to localStorage
    if (settings.provider) localStorage.setItem('flow_api_provider', settings.provider)
    if (settings.model) localStorage.setItem('flow_api_model', settings.model)
    if (settings.temperature) localStorage.setItem('flow_api_temperature', settings.temperature.toString())
    if (settings.maxTokens) localStorage.setItem('flow_api_max_tokens', settings.maxTokens.toString())
  },
  
  clearOutputs: () => {
    set(state => ({
      selectedFlow: state.selectedFlow ? {
        ...state.selectedFlow,
        steps: state.selectedFlow.steps.map(step => ({
          ...step,
          output: undefined,
          isRunning: false
        }))
      } : null
    }))
  }
}))